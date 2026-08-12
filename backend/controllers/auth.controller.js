const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
const { User, Mutuario, Empresa, ConvitePortal, PasswordResetToken, EmailVerificationToken, sequelize } = require("../models"); // Importou a instância do sequelize para transações
const registrarLogAuditoria = require("../utils/logAuditoria");
const { generateCodigoMutuario } = require("../utils/generateCode");
const { generateOTP, getExpirationTime } = require("../utils/otpGenerator");
const { sendVerificationEmail, sendPasswordResetEmail } = require("../utils/emailService");
const { avaliarAcessoEmpresa, MENSAGENS } = require("../utils/empresaAccess");

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

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, nome: user.nome, email: user.email, role: user.role, empresaId: user.empresaId, },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
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

      return { empresa, user };
    });

    return res.status(201).json({
      message: "Empresa e administrador inicial criados com sucesso.",
      token: generateToken(result.user),
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

    const rolesPermitidos = ["ADMIN", "GESTOR", "ANALISTA", "DIRETOR"];
    if (!rolesPermitidos.includes(role)) {
      return res.status(400).json({ message: "Role inválido para registo interno.", rolesPermitidos });
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

    const convite = await obterConvitePortalValido(token);
    if (!convite) {
      return res.status(400).json({ message: "Convite inválido, expirado ou já utilizado." });
    }

    // Procura por conflitos numa única viagem à Base de Dados
    const [existingUser, existingMutuario] = await Promise.all([
      User.findOne({ where: { email }, attributes: ['id'] }),
      Mutuario.findOne({
        where: { [Op.or]: [{ nuit }, { documentoNumero }] },
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

      return { user, mutuario };
    });

    return res.status(201).json({
      message: "Mutuário registado com sucesso.",
      token: generateToken(result.user),
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
        }
        return res.status(403).json({ message: MENSAGENS[acesso.motivo], motivo: acesso.motivo });
      }
    }

    const token = generateToken(user);

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

    const resetToken = await PasswordResetToken.findOne({ where: { token, used: false } });

    if (!resetToken || new Date() > resetToken.expiresAt) {
      return res.status(400).json({ message: "Token inválido ou expirado." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await sequelize.transaction(async (t) => {
      await User.update({ passwordHash: hashedPassword }, { where: { id: resetToken.userId }, transaction: t });
      resetToken.used = true;
      await resetToken.save({ transaction: t });
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
      token, nome, email, password, nomeCompleto, documentoTipo,
      documentoNumero, nuit, dataNascimento, provincia,
      distrito, localResidencia, telefone,
    } = req.body;

    if (!token || !nome || !email || !password || !nomeCompleto || !documentoTipo || !documentoNumero || !nuit) {
      return res.status(400).json({ message: "Preencher campos obrigatórios (incluindo o convite)." });
    }

    const convite = await obterConvitePortalValido(token);
    if (!convite) {
      return res.status(400).json({ message: "Convite inválido, expirado ou já utilizado." });
    }

    // Pesquisa simultânea de duplicações para travar antes do OTP
    const [existingUser, existingMutuario] = await Promise.all([
      User.findOne({ where: { email }, attributes: ['id'] }),
      Mutuario.findOne({
        where: { [Op.or]: [{ nuit }, { documentoNumero }] },
        attributes: ['id', 'nuit', 'documentoNumero']
      })
    ]);

    if (existingUser) return res.status(409).json({ message: "Já existe um utilizador com este email." });
    if (existingMutuario) {
      const msg = existingMutuario.nuit === nuit
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

      return { user, mutuario };
    });

    return res.status(201).json({
      message: "Registo completado com sucesso.",
      token: generateToken(result.user),
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
};