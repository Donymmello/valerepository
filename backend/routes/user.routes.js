const express = require('express');
const { listarUsuarios, atualizarUsuario, excluirUsuario } = require('../controllers/user.controller');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

// Rota protegida: Apenas usuários autenticados podem acessar
router.get('/', authMiddleware, listarUsuarios);
router.put('/:id', authMiddleware, atualizarUsuario);
router.delete('/:id', authMiddleware, excluirUsuario);

module.exports = router;