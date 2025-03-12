const User = require('../models/User');

// Listar todos os usuários (somente admins)
exports.listarUsuarios = async (req, res) => {
    try {
        if (!req.user || req.user.role !== "ADMIN") {
            return res.status(403).json({ error: "Acesso negado" });
        }

        const usuarios = await User.find().select("-password"); // Exclui a senha
        res.json(usuarios);
    } catch (error) {
        console.error("Erro ao buscar usuários:", error);
        res.status(500).json({ error: "Erro ao buscar usuários" });
    }
};

// Atualizar usuário
exports.atualizarUsuario = async (req, res) => {
    try {
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Acesso negado' });
        }
        const { nome, email, role } = req.body;
        const usuario = await User.findByIdAndUpdate(req.params.id, { nome, email, role }, { new: true });
        res.json(usuario);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar usuário' });
    }
};

// Excluir usuário
exports.excluirUsuario = async (req, res) => {
    try {
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Acesso negado' });
        }
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: 'Usuário excluído com sucesso' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao excluir usuário' });
    }
};