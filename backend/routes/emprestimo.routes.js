const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const emprestimoController = require('../controllers/emprestimo.controller');

// Criar um novo empréstimo
router.post('/', authMiddleware, emprestimoController.criarEmprestimo);

// Listar todos os empréstimos
router.get('/', authMiddleware, emprestimoController.listarEmprestimos);

// Aprovar um empréstimo
router.put('/:id/aprovar', authMiddleware, emprestimoController.aprovarEmprestimo);

// Rejeitar um empréstimo
router.put('/:id/rejeitar', authMiddleware, emprestimoController.rejeitarEmprestimo);

module.exports = router;
