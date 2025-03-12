const Log = require('../models/Log');
const fs = require("fs");
const path = require("path");

const logPath = path.join(__dirname, "../logs/audit.log");

// Verifica se a pasta logs existe, se não, cria
const logDir = path.dirname(logPath);
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

// Função para registrar log
exports.registrarLog = (usuarioId, acao, descricao) => {
    const logMessage = `${new Date().toISOString()} | Usuário: ${usuarioId} | Ação: ${acao} | ${descricao}\n`;

    fs.appendFile(logPath, logMessage, (err) => {
        if (err) {
            console.error("Erro ao gravar log:", err);
        }
    });
};


exports.listarLogs = async (req, res) => {
    try {
      if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Acesso negado' });
      }
      const logs = await Log.find().populate('usuario', 'nome email');
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar logs' });
    }
  };
