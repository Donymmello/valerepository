const fs = require('fs');
const path = require('path');

const logFilePath = path.join(__dirname, '../logs/audit.log');

const logger = (req, res, next) => {
    const logEntry = `${new Date().toISOString()} - ${req.method} ${req.originalUrl} - User: ${req.user ? req.user.id : 'Guest'}\n`;
    fs.appendFile(logFilePath, logEntry, (err) => {
        if (err) {
            console.error('Erro ao gravar log:', err);
        }
    });
    next();
};

module.exports = logger;