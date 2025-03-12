const express = require('express');
const { listarLogs } = require('../controllers/log.controller');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/', authMiddleware, listarLogs);

module.exports = router;