const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authMiddleware = async (req, res, next) => {
    try {
        const token = req.header("Authorization")?.split(" ")[1];

        if (!token) {
            return res.status(401).json({ error: "Acesso negado. Nenhum token fornecido." });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select("-password");
        console.log("Usuário autenticado pelo middleware:", decoded);


        if (!req.user) {
            return res.status(401).json({ error: "Usuário não encontrado" });
        }

        if (!req.user.role) {
            return res.status(403).json({ error: "Acesso negado, sem permissão" });
        }

        next();
    } catch (error) {
        res.status(401).json({ error: "Token inválido" });
    }
};

// 🔥 Corrigindo a exportação
module.exports = authMiddleware;
