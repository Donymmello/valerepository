const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User } = require("../models");
const registrarLogAuditoria = require("../utils/logAuditoria");

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
  REGISTAR UTILIZADOR
  ==========================================================
*/
const register = async (req, res) => {
  try {
    const { nome, email, password, role } = req.body;

    if (!nome || !email || !password) {
      return res.status(400).json({
        message: "Nome, email e password são obrigatórios.",
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
      role: role || "USER",
    });

    // Log de auditoria do registo
    await registrarLogAuditoria({
      userId: user.id,
      acao: "CRIAR_UTILIZADOR",
      entidade: "User",
      entidadeId: user.id,
      descricao: `Utilizador ${user.email} criado com perfil ${user.role}.`,
    });

    return res.status(201).json({
      message: "Utilizador criado com sucesso.",
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        role: user.role,
        ativo: user.ativo,
      },
    });
  } catch (error) {
    console.error("Erro ao registar utilizador:", error);

    return res.status(500).json({
      message: "Erro interno ao registar utilizador.",
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

    // Log de auditoria do login
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

module.exports = {
  register,
  login,
  getMe,
};