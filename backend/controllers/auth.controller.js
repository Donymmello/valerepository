const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
const { User, Mutuario, Empresa, ConvitePortal, PasswordResetToken, EmailVerificationToken, RefreshToken, Notificacao, sequelize } = require("../models"); // Importou a instância do sequelize para transações
const registrarLogAuditoria = require("../utils/logAuditoria");
const { generateCodigoMutuario } = require("../utils/generateCode");
const { generateOTP, getExpirationTime } = require("../utils/otpGenerator");
const { sendVerificationEmail, sendPasswordResetEmail } = require("../utils/emailService");
const { avaliarAcessoEmpresa, MENSAGENS } = require("../utils/empresaAccess");
const { obterEmpresaCacheada, invalidarCacheEmpresa } = require("../utils/empresaCache");
const { obterLimitesPlano } = require("../config/planos");

// Roles que contam para o limite de "utilizadores" de cada plano (ver
// config/planos.js). MUTUARIO fica de fora de propósito: são os clientes
// da financeira, não a equipa dela.
const ROLES_INTERNOS = ["ADMIN", "GESTOR", "ANALISTA", "DIRETOR"];

// =========================================================================
// HELPERS / UTILS (Padrão de Resposta Interno)
// =========================================================================

/**
 * Gera um slug simples e único (com sufixo numérico se necessário) a partir do nome da empresa.
 */
const gerarSlugEmpresa = async (nomeEmpresa) => {
  const base = nomeEmpresa
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "") // remove acentos
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "empresa";

  let slug = base;
  let sufixo = 1;
  while (await Empresa.findOne({ where: { slug }, attributes: ["id"] })) {
    sufixo += 1;
    slug = `${base}-${sufixo}`;
  }
  return slug;
};

/**
 * Valida um token de convite de portal: precisa existir, não estar usado e não ter expirado.
 * Devolve o registo do convite (ainda não consumido) ou null.
 */
const obterConvitePortalValido = async (token, options = {}) => {
  if (!token) return null;
  const convite = await ConvitePortal.findOne({ where: { token, usado: false }, ...options });
  if (!convite) return null;
  if (new Date() > convite.expiresAt) return null;
  return convite;
};

// Curto de propósito: o access token já não precisa de durar o dia
// inteiro, quem precisar de continuar autenticado usa o refresh token
// (ver emitirRefreshToken) para renovar em silêncio, sem pedir password
// outra vez. Ver POST /auth/refresh.
const ACCESS_TOKEN_EXPIRES_IN = "15m";
const REFRESH_TOKEN_DURACAO_MS = 30 * 24 * 60 * 60 * 1000; // 30 dias

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, nome: user.nome, email: user.email, role: user.role, empresaId: user.empresaId, },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
  );
};

/**
 * Emite e persiste um refresh token para o utilizador (30 dias). Chamado
 * em todo o sítio que já emite um access token no login/registo (ver
 * bootstrapAdmin, registerMutuario, login, verifyOTPAndRegister), para o
 * frontend poder trocar por um novo access token via POST /auth/refresh
 * sem pedir password de novo quando o token de 15 min expirar.
 *
 * ponytail: sem rotação (o mesmo refreshToken serve até expirar ou ser
 * revogado em /auth/logout ou num reset de password), ver comentário em
 * models/refreshToken.js.
 */
const emitirRefreshToken = async (user, options = {}) => {
  const token = crypto.randomBytes(40).toString("hex");
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_DURACAO_MS);
  await RefreshToken.create({ userId: user.id, token, expiresAt }, options);
  return token;
};

/**
 * Valida a força mínima de uma password. Devolve uma mensagem de erro
 * (string) se inválida, ou null se estiver ok.
 */
const validarForcaPassword = (password) => {
  if (typeof password !== "string" || password.length < 8) {
    return "A password deve ter pelo menos 8 caracteres.";
  }
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return "A password deve conter pelo menos uma letra e um número.";
  }
  return null;
};

const mapUserResponse = (user) => ({
  id: user.id,
  nome: user.nome,
  email: user.email,
  role: user.role,
  empresaId: user.empresaId,
  ativo: user.ativo,
});

// =========================================================================
// CONTROLLERS
// =========================================================================

/**
 * BOOTSTRAP DA EMPRESA + PRIMEIRO ADMIN (SaaS multi-tenant)
 * Cria uma nova Empresa (tenant) e o respetivo utilizador ADMIN inicial.
 */
const bootstrapAdmin = async (req, res) => {
  try {
    const { nomeEmpresa, nome, email, password } = req.body;

    if (!nomeEmpresa || !nome || !email || !password) {
      return res.status(400).json({ message: "nomeEmpresa, nome, email e password são obrigatórios." });
    }

    const erroPassword = validarForcaPassword(password);
    if (erroPassword) return res.status(400).json({ message: erroPassword });

    const [empresaExistente, existingUser] = await Promise.all([
      Empresa.findOne({ where: { nome: nomeEmpresa }, attributes: ['id'] }),
      User.findOne({ where: { email }, attributes: ['id'] })
    ]);

    if (empresaExistente) {
      return res.status(409).json({ message: "Já existe uma empresa registada com este nome." });
    }

    if (existingUser) {
      return res.status(409).json({ message: "Já existe um utilizador com este email." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const slug = await gerarSlugEmpresa(nomeEmpresa);

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 7);

    const result = await sequelize.transaction(async (t) => {
      const empresa = await Empresa.create({
        nome: nomeEmpresa,
        slug,
        estado: "TESTE",
        trialEndsAt,
      }, { transaction: t });

      const user = await User.create({
        nome,
        email,
        passwordHash,
        role: "ADMIN",
        ativo: true,
        empresaId: empresa.id,
      }, { transaction: t });

      await registrarLogAuditoria({
        userId: user.id,
        acao: "BOOTSTRAP_ADMIN",
        entidade: "User",
        entidadeId: user.id,
        descricao: `Empresa "${empresa.nome}" criada com administrador inicial ${user.email}.`,
      }, { transaction: t });

      const refreshToken = await emitirRefreshToken(user, { transaction: t });

      return { empresa, user, refreshToken };
    });

    return res.status(201).json({
      message: "Empresa e administrador inicial criados com sucesso.",
      token: generateToken(result.user),
      refreshToken: result.refreshToken,
      empresa: {
        id: result.empresa.id,
        nome: result.empresa.nome,
        slug: result.empresa.slug,
        estado: result.empresa.estado,
        trialEndsAt: result.empresa.trialEndsAt,
      },
      user: mapUserResponse(result.user),
    });
  } catch (error) {
    console.error("[BootstrapAdmin Error]:", error);
    return res.status(500).json({ message: "Erro interno ao criar empresa e administrador inicial." });
  }
};

/**
 * REGISTO INTERNO DE UTILIZADORES
 */
const registerInterno = async (req, res) => {
  try {
    const {
      nome, email, password, role, nomeCompleto,
      documentoTipo, documentoNumero, dataNascimento,
      provincia, distrito, localResidencia, telefone,
    } = req.body;

    if (!req.user || req.user.role !== "ADMIN") {
      return res.status(403).json({ message: "Apenas ADMIN pode registar utilizadores internos." });
    }

    if (!nome || !email || !password || !role) {
      return res.status(400).json({ message: "Nome, email, password e role são obrigatórios." });
    }

    const erroPassword = validarForcaPassword(password);
    if (erroPassword) return res.status(400).json({ message: erroPassword });

    if (!ROLES_INTERNOS.includes(role)) {
      return res.status(400).json({ message: "Role inválido para registo interno.", rolesPermitidos: ROLES_INTERNOS });
    }

    // Limite de utilizadores internos do plano atual da empresa (ver
    // config/planos.js). null = sem limite (plano Empresarial).
    const empresa = await obterEmpresaCacheada(req.user.empresaId);
    const { maxUtilizadoresInternos } = obterLimitesPlano(empresa?.plano);

    if (maxUtilizadoresInternos !== null) {
      const totalUtilizadoresInternos = await User.count({
        where: { empresaId: req.user.empresaId, role: { [Op.in]: ROLES_INTERNOS }, ativo: true },
      });

      if (totalUtilizadoresInternos >= maxUtilizadoresInternos) {
        return res.status(403).json({
          message: `O teu plano atual permite até ${maxUtilizadoresInternos} utilizadores internos. Contacta o suporte para mudar de plano.`,
          motivo: "LIMITE_UTILIZADORES_PLANO",
        });
      }
    }

    // Validação concorrente de Email e Documentos
    const [existingUser, existingMutuario] = await Promise.all([
      User.findOne({ where: { email }, attributes: ['id'] }),
      role === "MUTUARIO" ? Mutuario.findOne({
        where: {
          [Op.or]: [
            { email },
            ...(documentoNumero ? [{ documentoNumero }] : [])
          ]
        },
        attributes: ['id', 'email', 'documentoNumero']
      }) : null
    ]);

    if (existingUser) {
      return res.status(409).json({ message: "Já existe um utilizador com este email." });
    }

    if (existingMutuario) {
      if (existingMutuario.email === email) {
        return res.status(409).json({ message: "Já existe um mutuário com este email." });
      }
      return res.status(409).json({ message: "Já existe um mutuário com este documento." });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Bloco Atómico com Transação Relacional
    const result = await sequelize.transaction(async (t) => {
      const user = await User.create({
        nome, email, passwordHash, role, ativo: true, empresaId: req.user.empresaId,
      }, { transaction: t });

      let mutuario = null;

      if (role === "MUTUARIO") {
        const codigoMutuario = await generateCodigoMutuario();
        mutuario = await Mutuario.create({
          codigoMutuario, empresaId: req.user.empresaId, nomeCompleto, documentoTipo, documentoNumero,
          dataNascimento, provincia, distrito, localResidencia, telefone,
          email, userId: user.id,
        }, { transaction: t });
      }

      await registrarLogAuditoria({
        userId: req.user.id,
        acao: "CRIAR_UTILIZADOR",
        entidade: "User",
        entidadeId: user.id,
        descricao: `Utilizador ${user.email} criado com perfil ${user.role}.`,
      }, { transaction: t });

      return { user, mutuario };
    });

    return res.status(201).json({
      message: "Utilizador interno criado com sucesso.",
      user: mapUserResponse(result.user),
      mutuario: result.mutuario,
    });
  } catch (error) {
    console.error("[RegisterInterno Error]:", error);
    return res.status(500).json({ message: "Erro interno ao registar utilizador interno." });
  }
};

/**
 * CRIAR CONVITE DE REGISTO DE PORTAL (controlo de KYC)
 * Gerado por ADMIN/GESTOR da empresa. Sem este token, o registo público
 * de mutuário não é permitido.
 */
const criarConvitePortal = async (req, res) => {
  try {
    if (!req.user || !["ADMIN", "GESTOR"].includes(req.user.role)) {
      return res.status(403).json({ message: "Apenas ADMIN ou GESTOR podem gerar convites de registo." });
    }

    const { validadeDias } = req.body;
    const dias = Number(validadeDias) > 0 ? Number(validadeDias) : 7;

    const token = crypto.randomBytes(24).toString("hex");
    const expiresAt = new Date(Date.now() + dias * 24 * 60 * 60 * 1000);

    const convite = await ConvitePortal.create({
      token,
      empresaId: req.user.empresaId,
      criadoPor: req.user.id,
      expiresAt,
    });

    await registrarLogAuditoria({
      userId: req.user.id,
      acao: "CRIAR_CONVITE_PORTAL",
      entidade: "ConvitePortal",
      entidadeId: convite.id,
      descricao: `Convite de registo de portal criado, válido até ${expiresAt.toISOString()}.`,
    });

    const link = `${process.env.FRONTEND_URL}/register-mutuario?convite=${token}`;

    return res.status(201).json({
      message: "Convite criado com sucesso.",
      token,
      link,
      expiresAt,
    });
  } catch (error) {
    console.error("[CriarConvitePortal Error]:", error);
    return res.status(500).json({ message: "Erro interno ao criar convite de registo." });
  }
};

/**
 * REGISTO AUTÓNOMO DE MUTUÁRIO
 */
const registerMutuario = async (req, res) => {
  try {
    const {
      token, nome, email, password, nomeCompleto, documentoTipo,
      documentoNumero, nuit, dataNascimento, provincia,
      distrito, localResidencia, telefone,
    } = req.body;

    if (!token || !nome || !email || !password || !nomeCompleto || !documentoTipo || !documentoNumero || !nuit) {
      return res.status(400).json({ message: "Preencher campos obrigatórios (incluindo o convite)." });
    }

    const erroPasswordConvite = validarForcaPassword(password);
    if (erroPasswordConvite) return res.status(400).json({ message: erroPasswordConvite });

    const convite = await obterConvitePortalValido(token);
    if (!convite) {
      return res.status(400).json({ message: "Convite inválido, expirado ou já utilizado." });
    }

    // Procura por conflitos numa única viagem à Base de Dados.
    // Mutuario isolado por empresa, mesmo motivo do
    // registerMutuarioRequestOTP logo abaixo neste ficheiro.
    const [existingUser, existingMutuario] = await Promise.all([
      User.findOne({ where: { email }, attributes: ['id'] }),
      Mutuario.findOne({
        where: { empresaId: convite.empresaId, [Op.or]: [{ nuit }, { documentoNumero }] },
        attributes: ['id', 'nuit', 'documentoNumero']
      })
    ]);

    if (existingUser) return res.status(409).json({ message: "Já existe um utilizador com este email." });
    if (existingMutuario) {
      const msg = existingMutuario.nuit === nuit
        ? "Já existe um mutuário com este NUIT."
        : "Já existe um mutuário com este número de documento.";
      return res.status(409).json({ message: msg });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await sequelize.transaction(async (t) => {
      const user = await User.create({
        nome, email, passwordHash, role: "USER", ativo: true, empresaId: convite.empresaId,
      }, { transaction: t });

      const codigoMutuario = await generateCodigoMutuario();

      const mutuario = await Mutuario.create({
        codigoMutuario, empresaId: convite.empresaId, nomeCompleto, documentoTipo, documentoNumero, nuit,
        dataNascimento: dataNascimento || null,
        provincia: provincia || null,
        distrito: distrito || null,
        localResidencia: localResidencia || null,
        telefone: telefone || null,
        email, userId: user.id,
      }, { transaction: t });

      convite.usado = true;
      convite.usadoPor = user.id;
      await convite.save({ transaction: t });

      await registrarLogAuditoria({
        userId: user.id,
        acao: "REGISTAR_MUTUARIO_AUTONOMO",
        entidade: "Mutuario",
        entidadeId: mutuario.id,
        descricao: `Mutuário autónomo registado com user ID ${user.id} e mutuário ID ${mutuario.id}, via convite ${convite.id}.`,
      }, { transaction: t });

      const refreshToken = await emitirRefreshToken(user, { transaction: t });

      return { user, mutuario, refreshToken };
    });

    return res.status(201).json({
      message: "Mutuário registado com sucesso.",
      token: generateToken(result.user),
      refreshToken: result.refreshToken,
      user: mapUserResponse(result.user),
      mutuario: {
        id: result.mutuario.id,
        codigoMutuario: result.mutuario.codigoMutuario,
        nomeCompleto: result.mutuario.nomeCompleto,
        userId: result.mutuario.userId,
      },
    });
  } catch (error) {
    console.error("[RegisterMutuario Error]:", error);
    return res.status(500).json({ message: "Erro interno ao registar mutuário autónomo." });
  }
};

/**
 * LOGIN
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email e password são obrigatórios." });
    }

    const user = await User.findOne({
      where: { email },
      include: [{
        model: Empresa,
        as: "empresa",
        attributes: [
          "id",
          "nome",
          "slug",
          "plano",
          "estado",
          "trialEndsAt"
        ]
      }]
    });
    
    if (!user) {
      return res.status(404).json({ message: "Utilizador não encontrado." });
    }

    if (!user.ativo) {
      return res.status(403).json({ message: "Utilizador inativo. Contacte o administrador." });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Password inválida." });
    }

    // SUPERADMIN não pertence a nenhuma empresa, não há estado de subscrição a validar.
    if (user.role !== "SUPERADMIN") {
      const acesso = avaliarAcessoEmpresa(user.empresa);

      if (!acesso.permitido) {
        if (acesso.trialExpirouAgora) {
          await Empresa.update({ estado: "SUSPENSA" }, { where: { id: user.empresa.id } });
          // Mesma cache partilhada de utils/empresaCache.js, invalida
          // para o próximo pedido já ver o estado atualizado, em vez de
          // esperar a TTL de 60s.
          invalidarCacheEmpresa(user.empresa.id);
        }
        return res.status(403).json({ message: MENSAGENS[acesso.motivo], motivo: acesso.motivo });
      }
    }

    const token = generateToken(user);
    const refreshToken = await emitirRefreshToken(user);

    await registrarLogAuditoria({
      userId: user.id,
      acao: "LOGIN",
      entidade: "User",
      entidadeId: user.id,
      descricao: `Login realizado com sucesso pelo utilizador ${user.email}.`,
    });

    return res.status(200).json({
      message: "Login realizado com sucesso.",
      token,
      refreshToken,
      user: mapUserResponse(user),
    });
  } catch (error) {
    console.error("[Login Error]:", error);
    return res.status(500).json({ message: "Erro interno ao fazer login." });
  }
};

/**
 * PERFIL AUTENTICADO
 */
const getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ["id", "nome", "email", "role", "ativo", "created_at", "updated_at"],
    });

    if (!user) return res.status(404).json({ message: "Utilizador não encontrado." });
    return res.status(200).json(user);
  } catch (error) {
    console.error("[GetMe Error]:", error);
    return res.status(500).json({ message: "Erro interno ao buscar perfil." });
  }
};

/**
 * FORGOT PASSWORD
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email é obrigatório." });

    const user = await User.findOne({ where: { email }, attributes: ['id', 'nome'] });

    // Mitigação de Enumeração de Contas: Mantém mensagem genérica mesmo se o user não existir
    if (!user) {
      return res.status(200).json({ message: "Se o email existir, receberá instruções para redefinição." });
    }

    const token = crypto.randomBytes(20).toString("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 Minutos limpo

    await PasswordResetToken.create({ userId: user.id, token, expiresAt });

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    await sendPasswordResetEmail(email, resetLink, user.nome);

    return res.status(200).json({ message: "Se o email existir, receberá instruções para redefinição." });
  } catch (error) {
    console.error("[ForgotPassword Error]:", error);
    return res.status(500).json({ message: "Erro interno." });
  }
};

/**
 * RESET PASSWORD
 */
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ message: "Token e password são obrigatórios" });

    const erroPasswordReset = validarForcaPassword(password);
    if (erroPasswordReset) return res.status(400).json({ message: erroPasswordReset });

    const resetToken = await PasswordResetToken.findOne({ where: { token, used: false } });

    // resetToken.userId pode ser null para um token pedido antes da
    // migration 20260906121000 adicionar a coluna (ver models/index.js
    // para o histórico do bug), trata-se como inválido em vez de deixar
    // rebentar mais à frente.
    if (!resetToken || !resetToken.userId || new Date() > resetToken.expiresAt) {
      return res.status(400).json({ message: "Token inválido ou expirado." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await sequelize.transaction(async (t) => {
      // Carrega a instância real (não User.update() em bloco): a
      // validação `empresaObrigatoriaExcetoSuperadmin` do modelo corre
      // sobre os valores passados a um update em bloco, não sobre a
      // linha existente, por isso um update parcial que só mexe em
      // passwordHash falhava sempre essa validação (role/empresaId
      // "vistos" como undefined). Carregar e gravar a instância valida
      // contra a linha completa, como esperado.
      const user = await User.findByPk(resetToken.userId, { transaction: t });
      if (!user) {
        throw new Error("Utilizador do token de reset não encontrado.");
      }
      user.passwordHash = hashedPassword;
      await user.save({ transaction: t });

      resetToken.used = true;
      await resetToken.save({ transaction: t });

      // Password comprometida (motivo mais comum de um reset) não deve
      // deixar sessões antigas vivas: revoga todos os refresh tokens
      // ainda válidos deste utilizador, força novo login em todos os
      // dispositivos.
      await RefreshToken.update(
        { revoked: true },
        { where: { userId: resetToken.userId, revoked: false }, transaction: t }
      );
    });

    return res.status(200).json({ message: "Password redefinida com sucesso." });
  } catch (error) {
    console.error("[ResetPassword Error]:", error);
    return res.status(500).json({ message: "Erro interno." });
  }
};

/**
 * SOLICITAR OTP (ETAPA 1)
 */
const registerMutuarioRequestOTP = async (req, res) => {
  try {
    const {
      token, nome, email, password, nomeCompleto, telefone,
      // Documento/NUIT/data de nascimento/morada já não são exigidos no
      // registo, o mutuário completa isto depois em "Completar Perfil"
      // (ver portalMutuario.controller.js, updateMeuMutuario). Se vierem
      // preenchidos mesmo assim (ex: chamada direta à API), aceitam-se.
      documentoTipo, documentoNumero, nuit, dataNascimento, provincia,
      distrito, localResidencia,
    } = req.body;

    if (!token || !nome || !email || !password || !nomeCompleto || !telefone) {
      return res.status(400).json({ message: "Preencher campos obrigatórios (incluindo o convite)." });
    }

    const erroPasswordOTP = validarForcaPassword(password);
    if (erroPasswordOTP) return res.status(400).json({ message: erroPasswordOTP });

    const convite = await obterConvitePortalValido(token);
    if (!convite) {
      return res.status(400).json({ message: "Convite inválido, expirado ou já utilizado." });
    }

    // Pesquisa simultânea de duplicações para travar antes do OTP.
    // nuit/documentoNumero são opcionais agora, por isso só entram na
    // verificação de duplicado quando realmente preenchidos.
    // Email fica global de propósito (User.email é unique: true na BD,
    // o login é só por email, sem escolher empresa primeiro). Já
    // nuit/documentoNumero têm de ser isolados por empresa: a mesma
    // pessoa pode legitimamente ser cliente de duas financeiras
    // diferentes (mesmo padrão já corrigido no importador Excel, ver
    // RECUPERACAO_BD.md secção 26).
    const condicoesDuplicado = [];
    if (nuit) condicoesDuplicado.push({ nuit });
    if (documentoNumero) condicoesDuplicado.push({ documentoNumero });

    const [existingUser, existingMutuario] = await Promise.all([
      User.findOne({ where: { email }, attributes: ['id'] }),
      condicoesDuplicado.length
        ? Mutuario.findOne({
            where: { [Op.and]: [{ empresaId: convite.empresaId }, { [Op.or]: condicoesDuplicado }] },
            attributes: ['id', 'nuit', 'documentoNumero']
          })
        : null,
    ]);

    if (existingUser) return res.status(409).json({ message: "Já existe um utilizador com este email." });
    if (existingMutuario) {
      const msg = nuit && existingMutuario.nuit === nuit
        ? "Já existe um mutuário com este nuit."
        : "Já existe um mutuário com este número de documento.";
      return res.status(409).json({ message: msg });
    }

    // Limpar OTPs expirados em background
    EmailVerificationToken.destroy({
      where: { email, expiresAt: { [Op.lt]: new Date() } },
    }).catch(err => console.error("Erro ao limpar tokens expirados:", err));

    const otp = generateOTP();
    const expiresAt = getExpirationTime(10);
    const passwordHash = await bcrypt.hash(password, 10);

    await EmailVerificationToken.create({
      email, otp, expiresAt,
      temporaryData: {
        conviteToken: token,
        nome, passwordHash, nomeCompleto, documentoTipo,
        nuit, documentoNumero, dataNascimento, provincia,
        distrito, localResidencia, telefone,
      },
    });

    await sendVerificationEmail(email, otp, nomeCompleto);

    return res.status(200).json({
      message: "OTP enviado para o seu email. Válido por 10 minutos.",
      email,
    });
  } catch (error) {
    console.error("[RequestOTP Error]:", error);
    return res.status(500).json({ message: "Erro interno ao solicitar OTP." });
  }
};

/**
 * VERIFICAR OTP E EFETUAR REGISTO (ETAPA 2)
 */
const verifyOTPAndRegister = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: "Email e OTP são obrigatórios." });

    const verificationToken = await EmailVerificationToken.findOne({
      where: { email, otp, verified: false },
    });

    if (!verificationToken || new Date() > verificationToken.expiresAt) {
      return res.status(400).json({ message: "OTP inválido ou expirado." });
    }

    const data = verificationToken.temporaryData;

    // O convite pode ter sido usado ou expirado entre o pedido de OTP e a confirmação
    const convite = await obterConvitePortalValido(data.conviteToken);
    if (!convite) {
      return res.status(400).json({ message: "Convite inválido, expirado ou já utilizado." });
    }

    // Transação ACID ao materializar dados temporários na BD
    const result = await sequelize.transaction(async (t) => {
      const user = await User.create({
        nome: data.nome, email, passwordHash: data.passwordHash, role: "USER", ativo: true, empresaId: convite.empresaId,
      }, { transaction: t });

      const codigoMutuario = await generateCodigoMutuario();

      const mutuario = await Mutuario.create({
        codigoMutuario, empresaId: convite.empresaId, nomeCompleto: data.nomeCompleto, documentoTipo: data.documentoTipo,
        documentoNumero: data.documentoNumero, nuit: data.nuit, dataNascimento: data.dataNascimento,
        provincia: data.provincia, distrito: data.distrito, localResidencia: data.localResidencia,
        telefone: data.telefone, email, userId: user.id,
      }, { transaction: t });

      convite.usado = true;
      convite.usadoPor = user.id;
      await convite.save({ transaction: t });

      verificationToken.verified = true;
      await verificationToken.save({ transaction: t });

      await registrarLogAuditoria({
        userId: user.id,
        acao: "REGISTAR_MUTUARIO_COM_OTP",
        entidade: "Mutuario",
        entidadeId: mutuario.id,
        descricao: `Mutuário registado com verificação de email. User ID ${user.id}, Mutuário ID ${mutuario.id}.`,
      }, { transaction: t });

      // O registo pede só o essencial, avisa aqui, uma vez, para
      // completar o perfil (documento/NUIT/data de nascimento) antes de
      // pedir crédito. Substitui banners espalhados pelo portal; a
      // página "Meu Perfil" continua a mostrar o aviso enquanto faltar.
      const perfilCompleto = mutuario.documentoTipo && mutuario.documentoNumero && mutuario.nuit && mutuario.dataNascimento;
      if (!perfilCompleto) {
        await Notificacao.create({
          userId: user.id,
          titulo: "Complete o seu perfil",
          mensagem: "Falta o documento, NUIT e data de nascimento. Complete o seu perfil para poder submeter um pedido de crédito.",
          tipo: "SISTEMA",
        }, { transaction: t });
      }

      const refreshToken = await emitirRefreshToken(user, { transaction: t });

      return { user, mutuario, refreshToken };
    });

    return res.status(201).json({
      message: "Registo completado com sucesso.",
      token: generateToken(result.user),
      refreshToken: result.refreshToken,
      user: mapUserResponse(result.user),
      mutuario: {
        id: result.mutuario.id,
        codigoMutuario: result.mutuario.codigoMutuario,
        nomeCompleto: result.mutuario.nomeCompleto,
      },
    });
  } catch (error) {
    console.error("[VerifyOTP Error]:", error);
    return res.status(500).json({ message: "Erro interno ao verificar OTP." });
  }
};

/**
 * TROCAR REFRESH TOKEN POR NOVO ACCESS TOKEN
 * Sem password: só um refresh token válido, ainda não revogado e dentro
 * da validade de 30 dias (ver emitirRefreshToken). Reavalia o estado da
 * empresa da mesma forma que o login, uma empresa suspensa depois do
 * refresh token emitido não deve continuar a renovar acesso.
 */
const refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: "refreshToken é obrigatório." });
    }

    const registo = await RefreshToken.findOne({ where: { token: refreshToken, revoked: false } });
    if (!registo || new Date() > registo.expiresAt) {
      return res.status(401).json({ message: "Sessão expirada. Inicia sessão novamente." });
    }

    const user = await User.findByPk(registo.userId, {
      include: [{ model: Empresa, as: "empresa", attributes: ["id", "estado", "trialEndsAt"] }],
    });

    if (!user || !user.ativo) {
      return res.status(401).json({ message: "Sessão expirada. Inicia sessão novamente." });
    }

    if (user.role !== "SUPERADMIN") {
      const acesso = avaliarAcessoEmpresa(user.empresa);
      if (!acesso.permitido) {
        return res.status(403).json({ message: MENSAGENS[acesso.motivo], motivo: acesso.motivo });
      }
    }

    return res.status(200).json({ token: generateToken(user) });
  } catch (error) {
    console.error("[RefreshAccessToken Error]:", error);
    return res.status(500).json({ message: "Erro interno ao renovar sessão." });
  }
};

/**
 * LOGOUT
 * Revoga o refresh token indicado, para uma cópia roubada (ou um
 * dispositivo partilhado) não continuar a servir depois de terminar
 * sessão. De propósito sem authMiddleware: o access token pode já estar
 * expirado no momento em que o utilizador faz logout.
 */
const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await RefreshToken.update({ revoked: true }, { where: { token: refreshToken } });
    }
    return res.status(200).json({ message: "Sessão terminada." });
  } catch (error) {
    console.error("[Logout Error]:", error);
    return res.status(500).json({ message: "Erro interno ao terminar sessão." });
  }
};

module.exports = {
  bootstrapAdmin,
  registerInterno,
  criarConvitePortal,
  registerMutuario,
  registerMutuarioRequestOTP,
  verifyOTPAndRegister,
  login,
  getMe,
  forgotPassword,
  resetPassword,
  refreshAccessToken,
  logout,
};