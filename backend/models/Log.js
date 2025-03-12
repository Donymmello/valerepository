const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  acao: { type: String, required: true },
  detalhes: { type: String },
  data: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Log', logSchema);