const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
const { User, Mutuario, PasswordResetToken, EmailVerificationToken } = require("../models");
const registrarLogAuditoria = require("../utils/logAuditoria");
const { generateCodigoMutuario } = require("../utils/generateCode");
const { generateOTP, getExpirationTime } = require("../utils/otpGenerator");
const { sendVerificationEmail } = require("../utils/emailService");

/*
  ==========================================================
  BOOTSTRAP DO PRIMEIRO ADMIN
  ==========================================================
  Regras:
  - só funciona se ainda não existir nenhum ADMIN
  - cria o primeiro administrador do sistema
*/
const bootstrapAdmin = async (req, res) => {
  try {
    const { nome, email, password } = req.body;

    if (!nome || !email || !password) {
      return res.status(400).json({
        message: "nome, email e password são obrigatórios.",
      });
    }

    const adminExistente = await User.findOne({
      where: { role: "ADMIN" },
    });

    if (adminExistente) {
      return res.status(403).json({
        message: "Já existe pelo menos um ADMIN no sistema. Bootstrap não permitido.",
      });
    }

    const existingUser = await User.findOne({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Já existe um utilizador com este email.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      nome,
      email,
      passwordHash,
      role: "ADMIN",
      ativo: true,
    });

    await registrarLogAuditoria({
      userId: user.id,
      acao: "BOOTSTRAP_ADMIN",
      entidade: "User",
      entidadeId: user.id,
      descricao: `Primeiro administrador do sistema criado com email ${user.email}.`,
    });

    return res.status(201).json({
      message: "Administrador inicial criado com sucesso.",
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        role: user.role,
        ativo: user.ativo,
      },
    });
  } catch (error) {
    console.error("Erro ao criar administrador inicial:", error);

    return res.status(500).json({
      message: "Erro interno ao criar administrador inicial.",
      error: error.message,
    });
  }
};

/*
  ==========================================================
  GERAR TOKEN JWT
  ==========================================================
*/
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      nome: user.nome,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "1d",
    }
  );
};

/*
  ==========================================================
  REGISTO INTERNO DE UTILIZADORES
  ==========================================================
  Regras:
  - só ADMIN pode criar
  - só cria perfis internos
  - não cria Mutuario
*/
const registerInterno = async (req, res) => {
  try {
    const {
      nome,
      email,
      password,
      role,

      nomeCompleto,
      documentoTipo,
      documentoNumero,
      dataNascimento,
      provincia,
      distrito,
      localResidencia,
      telefone,
    } = req.body;

    if (!req.user || req.user.role !== "ADMIN") {
      return res.status(403).json({
        message: "Apenas ADMIN pode registar utilizadores internos.",
      });
    }

    if (!nome || !email || !password || !role) {
      return res.status(400).json({
        message: "Nome, email, password e role são obrigatórios.",
      });
    }

    const rolesPermitidos = ["ADMIN", "GESTOR", "ANALISTA", "DIRETOR"];

    if (!rolesPermitidos.includes(role)) {
      return res.status(400).json({
        message: "Role inválido para registo interno.",
        rolesPermitidos,
      });
    }

    const existingUser = await User.findOne({
      where: { email }
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Já existe um utilizador com este email.",
      });
    }

    if (role === "MUTUARIO") {
      const existingMutuarioByEmail = await Mutuario.findOne({
        where: { email},
      });

      if (existingMutuarioByEmail) {
        return res.status(409).json({
          message: "mutuario com este email ja existe.",
        });
      }

      if (documentoNumero) {
        const existingMutuarioPordocumentoNumero =
         await Mutuario.findOne({
          where: {
             documentoNumero,
          },
        });

      if (existingMutuarioPordocumentoNumero) {
        return res.status(409).json({
          message: "mutuario com este documento ja existe.",
        });
      }
    }
  }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      nome,
      email,
      passwordHash,
      role,
      ativo: true,
    });

    let mutuario = null;

    if (role === "MUTUARIO") {
      const codigoMutuario = await generateCodigoMutuario();

      mutuario = await Mutuario.create({
      codigoMutuario,
      nomeCompleto,
      documentoTipo: documentoTipo || null,
      documentoNumero: documentoNumero || null,
      dataNascimento: dataNascimento || null,
      provincia: provincia || null,
      distrito: distrito || null,
      localResidencia: localResidencia || null,
      telefone: telefone || null,
      email: email || null,
      userId: user.id,
      });
    }

    await registrarLogAuditoria({
      userId: req.user.id,
      acao: "CRIAR_UTILIZADOR",
      entidade: "User",
      entidadeId: user.id,
      descricao: `Utilizador  ${user.email} criado com perfil ${user.role}.`,
    });

    return res.status(201).json({
      message: "Utilizador interno criado com sucesso.",
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        role: user.role,
        ativo: user.ativo,
      },
      mutuario,
    });
  } catch (error) {
    console.error("Erro ao registar utilizador interno:", error);

    return res.status(500).json({
      message: "Erro interno ao registar utilizador interno.",
      error: error.message,
    });
  }
};

/*
  ==========================================================
  REGISTO AUTÓNOMO DE MUTUÁRIO
  ==========================================================
  Regras:
  - cria sempre User com role USER
  - cria automaticamente o Mutuario associado
*/
const registerMutuario = async (req, res) => {
  try {
    const {
      nome,
      email,
      password,
      nomeCompleto,
      documentoTipo,
      documentoNumero,
      nuit,
      dataNascimento,
      provincia,
      distrito,
      localResidencia,
      telefone,
    } = req.body;

    if (!nome || !email || !password || !nomeCompleto || !documentoTipo || !documentoNumero || !nuit) {
      return res.status(400).json({
        message: "preencher campos obrigatórios.",
      });
    }

    const existingUser = await User.findOne({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Já existe um utilizador com este email.",
      });
    }

    if (nuit) {
      const mutuarioExistentePorNuit = await Mutuario.findOne({
        where: { nuit },
      });

      if (mutuarioExistentePorNuit) {
        return res.status(409).json({
          message: "Já existe um mutuário com este nuit.",
        });
      }

    if (documentoNumero) {
      const mutuarioExistentePorDocumento = await Mutuario.findOne({
        where: { documentoNumero },
      });

      if (mutuarioExistentePorDocumento) {
        return res.status(409).json({
          message: "Já existe um mutuário com este número de documento.",
        });
      }
    }
  }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      nome,
      email,
      passwordHash,
      role: "USER",
      ativo: true,
    });

    const codigoMutuario = await generateCodigoMutuario();

    const mutuario = await Mutuario.create({
      codigoMutuario,
      nomeCompleto,
      documentoTipo: documentoTipo || null,
      documentoNumero: documentoNumero || null,
      nuit: nuit || null,
      dataNascimento: dataNascimento || null,
      provincia: provincia || null,
      distrito: distrito || null,
      localResidencia: localResidencia || null,
      telefone: telefone || null,
      email: email || null,
      userId: user.id,
    });

    const token = generateToken(user);

    await registrarLogAuditoria({
      userId: user.id,
      acao: "REGISTAR_MUTUARIO_AUTONOMO",
      entidade: "Mutuario",
      entidadeId: mutuario.id,
      descricao: `Mutuário autónomo registado com user ID ${user.id} e mutuário ID ${mutuario.id}.`,
    });

    return res.status(201).json({
      message: "Mutuário registado com sucesso.",
      token,
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        role: user.role,
        ativo: user.ativo,
      },
      mutuario: {
        id: mutuario.id,
        codigoMutuario: mutuario.codigoMutuario,
        nomeCompleto: mutuario.nomeCompleto,
        userId: mutuario.userId,
      },
    });
  } catch (error) {
    console.error("Erro ao registar mutuário autónomo:", error);

    return res.status(500).json({
      message: "Erro interno ao registar mutuário autónomo.",
      error: error.message,
    });
  }
};

/*
  ==========================================================
  LOGIN
  ==========================================================
*/
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email e password são obrigatórios.",
      });
    }

    const user = await User.findOne({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({
        message: "Utilizador não encontrado.",
      });
    }

    if (!user.ativo) {
      return res.status(403).json({
        message: "Utilizador inativo. Contacte o administrador.",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Password inválida.",
      });
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
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        role: user.role,
        ativo: user.ativo,
      },
    });
  } catch (error) {
    console.error("Erro no login:", error);

    return res.status(500).json({
      message: "Erro interno ao fazer login.",
      error: error.message,
    });
  }
};

/*
  ==========================================================
  PERFIL DO UTILIZADOR AUTENTICADO
  ==========================================================
*/
const getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ["id", "nome", "email", "role", "ativo", "created_at", "updated_at"],
    });

    if (!user) {
      return res.status(404).json({
        message: "Utilizador não encontrado.",
      });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error("Erro ao buscar perfil:", error);

    return res.status(500).json({
      message: "Erro interno ao buscar perfil.",
      error: error.message,
    });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email é obrigatório.",
      });
    }

    const user = await User.findOne({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({
        message: "Se o email existir receberá instruções para redefinição de password.",
      });
    }

    const token = crypto.randomBytes(20).toString("hex");

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    await PasswordResetToken.create({
      userId: user.id,
      token,
      expiresAt,
    });

    const resetLink =
      `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    console.log("RESET PASSWORD LINK");
    console.log(resetLink);

    return res.status(200).json({
      message:
        "Se o email existir receberá instruções para redefinição.",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Erro interno.",
    });
  }
}

const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        message: "Token e password sao obrigatorios",
      });
    }

    const resetToken =
      await PasswordResetToken.findOne({
        where: {
          token,
          used: false,
        },
      });

    if (!resetToken) {
      return res.status(400).json({
        message: "Token invalido.",
      });
    }

    if (new Date() > resetToken.expiresAt) {
      return res.status(400).json({
        message: "Token expirado.",
      });
    }

    const user = await User.findByPk(
      resetToken.userId
    );

    const hashedPassword =
      await bcrypt.hash(password, 10);

    user.passwordHash = hashedPassword;

    await user.save();

    resetToken.used = true;

    await resetToken.save();

    return res.status(200).json({
      message: "Password redifinida com sucesso.",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Erro interno.",
    });
  }
}

/*
  ==========================================================
  REGISTO COM OTP (NOVO)
  ==========================================================
  Etapa 1: Utilizador preenche formulário e recebe OTP por email
*/
const registerMutuarioRequestOTP = async (req, res) => {
  try {
    const {
      nome,
      email,
      password,
      nomeCompleto,
      documentoTipo,
      documentoNumero,
      nuit,
      dataNascimento,
      provincia,
      distrito,
      localResidencia,
      telefone,
    } = req.body;

    if (!nome || !email || !password || !nomeCompleto || !documentoTipo || !documentoNumero || !nuit) {
      return res.status(400).json({
        message: "preencher campos obrigatórios.",
      });
    }

    // Validar email
    const existingUser = await User.findOne({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Já existe um utilizador com este email.",
      });
    }

    if (nuit) {
      const mutuarioExistentePorNuit = await Mutuario.findOne({
        where: { nuit },
      });

      if (mutuarioExistentePorNuit) {
        return res.status(409).json({
          message: "Já existe um mutuário com este nuit.",
        });
      }

    // Validar documento
    if (documentoNumero) {
      const mutuarioExistentePorDocumento = await Mutuario.findOne({
        where: { documentoNumero },
      });

      if (mutuarioExistentePorDocumento) {
        return res.status(409).json({
          message: "Já existe um mutuário com este número de documento.",
        });
      }
    }
  }

    // Limpar OTPs expirados deste email
    await EmailVerificationToken.destroy({
      where: {
        email,
        expiresAt: { [Op.lt]: new Date() },
      },
    });

    // Gerar OTP
    const otp = generateOTP();
    const expiresAt = getExpirationTime(10);

    // Hash da password para armazenar temporariamente
    const passwordHash = await bcrypt.hash(password, 10);

    // Armazenar dados temporários
    await EmailVerificationToken.create({
      email,
      otp,
      expiresAt,
      temporaryData: {
        nome,
        passwordHash,
        nomeCompleto,
        documentoTipo,
        nuit,
        documentoNumero,
        dataNascimento,
        provincia,
        distrito,
        localResidencia,
        telefone,
      },
    });

    // Enviar OTP por email (em dev mostra no console)
    await sendVerificationEmail(email, otp, nomeCompleto);

    return res.status(200).json({
      message: "OTP enviado para o seu email. Válido por 10 minutos.",
      email,
    });
  } catch (error) {
    console.error("Erro ao solicitar OTP:", error);

    return res.status(500).json({
      message: "Erro interno ao solicitar OTP.",
      error: error.message,
    });
  }
};

/*
  ==========================================================
  VERIFICAR OTP E COMPLETAR REGISTO
  ==========================================================
  Etapa 2: Utilizador verifica OTP e a conta é criada
*/
const verifyOTPAndRegister = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        message: "Email e OTP são obrigatórios.",
      });
    }

    // Procurar token de verificação
    const verificationToken = await EmailVerificationToken.findOne({
      where: {
        email,
        otp,
        verified: false,
      },
    });

    if (!verificationToken) {
      return res.status(400).json({
        message: "OTP inválido.",
      });
    }

    // Verificar expiração
    if (new Date() > verificationToken.expiresAt) {
      return res.status(400).json({
        message: "OTP expirado. Solicite um novo.",
      });
    }

    // Extrair dados temporários
    const {
      nome,
      passwordHash,
      nomeCompleto,
      documentoTipo,
      documentoNumero,
      nuit,
      dataNascimento,
      provincia,
      distrito,
      localResidencia,
      telefone,
    } = verificationToken.temporaryData;

    // Criar utilizador
    const user = await User.create({
      nome,
      email,
      passwordHash,
      role: "USER",
      ativo: true,
    });

    // Criar mutuário
    const codigoMutuario = await generateCodigoMutuario();

    const mutuario = await Mutuario.create({
      codigoMutuario,
      nomeCompleto,
      documentoTipo: documentoTipo || null,
      documentoNumero: documentoNumero || null,
      dataNascimento: dataNascimento || null,
      nuit: nuit || null,
      provincia: provincia || null,
      distrito: distrito || null,
      localResidencia: localResidencia || null,
      telefone: telefone || null,
      email: email || null,
      userId: user.id,
    });

    // Marcar OTP como verificado
    verificationToken.verified = true;
    await verificationToken.save();

    // Gerar JWT
    const token = generateToken(user);

    // Log de auditoria
    await registrarLogAuditoria({
      userId: user.id,
      acao: "REGISTAR_MUTUARIO_COM_OTP",
      entidade: "Mutuario",
      entidadeId: mutuario.id,
      descricao: `Mutuário registado com verificação de email. User ID ${user.id}, Mutuário ID ${mutuario.id}.`,
    });

    return res.status(201).json({
      message: "Registo completado com sucesso.",
      token,
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        role: user.role,
        ativo: user.ativo,
      },
      mutuario: {
        id: mutuario.id,
        codigoMutuario: mutuario.codigoMutuario,
        nomeCompleto: mutuario.nomeCompleto,
      },
    });
  } catch (error) {
    console.error("Erro ao verificar OTP:", error);

    return res.status(500).json({
      message: "Erro interno ao verificar OTP.",
      error: error.message,
    });
  }
};


module.exports = {
  bootstrapAdmin,
  registerInterno,
  registerMutuario,
  registerMutuarioRequestOTP,
  verifyOTPAndRegister,
  login,
  getMe,
  forgotPassword,
  resetPassword,
};