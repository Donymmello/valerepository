const Emprestimo = require('../models/Emprestimo');
const User = require('../models/User');

exports.getDashboardStats = async (req, res) => {
    try {
        if (req.user.role !== 'ADMIN' && req.user.role !== 'GESTOR') {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        const totalUsuarios = await User.countDocuments();
        const totalEmprestimos = await Emprestimo.countDocuments();
        const emprestimosAprovados = await Emprestimo.countDocuments({ aprovado: true });
        const emprestimosRejeitados = await Emprestimo.countDocuments({ aprovado: false });
        const emprestimosPendentes = totalEmprestimos - emprestimosAprovados;

        res.json({ totalUsuarios, totalEmprestimos, emprestimosAprovados, emprestimosPendentes, emprestimosRejeitados });
    } catch (error) {
        console.error("Erro ao buscar estatísticas do dashboard:", error);
        res.status(500).json({ error: 'Erro ao buscar estatísticas' });
    }
};
