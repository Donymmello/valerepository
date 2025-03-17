const Emprestimo = require('../models/Emprestimo');
const { registrarLog } = require('../controllers/log.controller'); // Verifique se este caminho está correto
const nodemailer = require("nodemailer");


exports.criarEmprestimo = async (req, res) => {
    try {
        if (!req.user || !req.user._id) {
            return res.status(401).json({ error: "Usuário não autenticado" });
        }

        const novoEmprestimo = new Emprestimo({
            user: req.user._id,
            valor: req.body.valor,
            motivo: req.body.motivo,
            aprovado: false,
            rejeitado: false
        });

        await novoEmprestimo.save();
        console.log("Registrando log para:", req.user._id); // Debug
        await registrarLog(req.user._id, 'Criação de Empréstimo', `Empréstimo ${novoEmprestimo._id} criado.`);

        res.status(201).json(novoEmprestimo);
    } catch (error) {
        console.error("Erro ao criar empréstimo:", error);
        res.status(500).json({ error: "Erro ao criar empréstimo" });
    }
};

exports.listarEmprestimos = async (req, res) => {
    try {
        console.log("Usuário autenticado:", req.user); // Debug
        
        let emprestimos;

        if (req.user.role === "ADMIN" || req.user.role === "GESTOR") {
            // Admin e Gestor veem todos os empréstimos
            emprestimos = await Emprestimo.find().populate("user", "nome email");
        } else {
            // Usuário comum vê apenas seus empréstimos
            emprestimos = await Emprestimo.find({ user: req.user._id }).populate("user", "nome email");
        }

        console.log("Empréstimos encontrados:", emprestimos.length); // Debug

        res.json(emprestimos);
    } catch (error) {
        console.error("Erro ao listar empréstimos:", error);
        res.status(500).json({ error: "Erro ao listar empréstimos" });
    }
};

const enviarNotificacao = async (email, status) => {
    let transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    const mensagem = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Atualização de Empréstimo",
        text: `Seu empréstimo foi ${status}. Acesse o sistema para mais detalhes.`
    };

    await transporter.sendMail(mensagem);
};

exports.aprovarEmprestimo = async (req, res) => {
    try {
        const userRole = req.user.role;

        if (userRole !== "ADMIN" && userRole !== "GESTOR") {
            return res.status(403).json({ error: "Acesso negado" });
        }

        console.log("Usuário autenticado:", req.user); // Debug

        const emprestimo = await Emprestimo.findById(req.params.id);
        if (!emprestimo) return res.status(404).json({ error: "Empréstimo não encontrado" });

        emprestimo.aprovado = true;
        emprestimo.rejeitado = false;
        await emprestimo.save();

        await registrarLog(req.user._id, "Aprovação de Empréstimo", `Empréstimo ${emprestimo._id} aprovado.`);
        await enviarNotificacao(emprestimo.usuario.email, "APROVADO");

        res.json(emprestimo);
    } catch (error) {
        console.error("Erro ao rejeitar empréstimo:", error);
        res.status(500).json({ error: "Erro ao aprovar empréstimo" });
    }
};


exports.rejeitarEmprestimo = async (req, res) => {
    try {
        const userRole = req.user.role;

        if (userRole !== "ADMIN" && userRole !== "GESTOR") {
            return res.status(403).json({ error: "Acesso negado" });
        }

        const emprestimo = await Emprestimo.findById(req.params.id);
        if (!emprestimo) return res.status(404).json({ error: 'Empréstimo não encontrado' });

        emprestimo.aprovado = false;
        emprestimo.rejeitado = true;
        await emprestimo.save();

        await registrarLog(req.user._id, 'Rejeição de Empréstimo', `Empréstimo ${emprestimo._id} rejeitado.`);
        await enviarNotificacao(emprestimo.usuario.email, "REJEITADO");

        res.json(emprestimo);
    } catch (error) {
        console.error("Erro ao rejeitar empréstimo:", error);
        res.status(500).json({ error: "Erro ao rejeitar empréstimo" });
    }
};
