const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware/authMiddleware");
const Notificacao = require("../models/Notificacao");

// Listar notificações do usuário logado
router.get("/", authMiddleware, async (req, res) => {
  try {
    const notificacoes = await Notificacao.find({ usuario: req.user.id }).sort({ criadaEm: -1 });
    res.json(notificacoes);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar notificações" });
  }
});

// Marcar notificação como lida
router.put("/:id/lida", authMiddleware, async (req, res) => {
  try {
    await Notificacao.findByIdAndUpdate(req.params.id, { lida: true });
    res.json({ message: "Notificação marcada como lida" });
  } catch (error) {
    res.status(500).json({ error: "Erro ao atualizar notificação" });
  }
});

module.exports = router;
