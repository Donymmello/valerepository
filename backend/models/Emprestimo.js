const mongoose = require('mongoose');

const emprestimoSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // 🔥 Garante que seja "user"
    valor: Number,
    motivo: String,
    aprovado: { type: Boolean, default: false },
    rejeitado: { type: Boolean, default: false }
});

module.exports = mongoose.model('Emprestimo', emprestimoSchema);
