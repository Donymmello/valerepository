const express = require('express');
const { register, login , recuperarSenha, resetarSenha} = require('../controllers/auth.controller');
const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/recuperar-senha', recuperarSenha);
router.post('/resetar-senha', resetarSenha);

module.exports = router;
