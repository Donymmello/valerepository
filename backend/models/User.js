const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    nome: String,
    email: { type: String, unique: true },
    password: String,
    role: { type: String, enum: ['USER', 'GESTOR', 'ADMIN'], default: 'USER' }
});

module.exports = mongoose.model('User', userSchema);