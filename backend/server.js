const express = require('express');
const logger = require('./middleware/logger');
const logRoutes = require('./routes/log.routes');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const dashboardRoutes = require('./routes/dashboard.routes');
const userRoutes = require('./routes/user.routes');



dotenv.config();
const app = express();

app.use(express.json());
app.use(cors());

connectDB();

// Rotas
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/emprestimos', require('./routes/emprestimo.routes'));
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/usuarios', userRoutes);
app.use('/api/logs', logRoutes);
app.use(logger);



const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));
