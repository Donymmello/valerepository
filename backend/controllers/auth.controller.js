const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

exports.register = async (req, res) => {
    try {
        const { nome, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ nome, email, password: hashedPassword });
        await user.save();
        res.status(201).json({ message: 'Usuário criado com sucesso' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao registrar usuário' });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({ error: "Usuário não encontrado" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: "Credenciais inválidas" });
        }

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token, user });
    } catch (error) {
        res.status(500).json({ error: "Erro ao fazer login" });
    }
};

// Solicitar recuperação de senha
exports.recuperarSenha = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

        const token = crypto.randomBytes(20).toString('hex');
        user.resetToken = token;
        user.resetTokenExp = Date.now() + 3600000; // 1 hora de validade
        await user.save();

        const resetLink = `http://localhost:3000/resetar-senha/${token}`;
        await transporter.sendMail({
            to: user.email,
            subject: 'Recuperação de Senha',
            html: `<p>Clique no link para redefinir sua senha: <a href="${resetLink}">${resetLink}</a></p>`
        });

        res.json({ message: 'Email de recuperação enviado' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao enviar email' });
    }
};

// Redefinir senha
exports.resetarSenha = async (req, res) => {
    try {
        const { token, novaSenha } = req.body;
        const user = await User.findOne({ resetToken: token, resetTokenExp: { $gt: Date.now() } });
        if (!user) return res.status(400).json({ error: 'Token inválido ou expirado' });

        user.password = await bcrypt.hash(novaSenha, 10);
        user.resetToken = undefined;
        user.resetTokenExp = undefined;
        await user.save();

        res.json({ message: 'Senha redefinida com sucesso' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao redefinir senha' });
    }
};
