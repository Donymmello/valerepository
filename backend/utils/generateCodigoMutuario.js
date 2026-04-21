const { Mutuario } = require("../models");

/*
  ==========================================================
  GERAR CÓDIGO DE MUTUÁRIO AUTOMATICAMENTE
  ==========================================================
  Exemplo:
  MUT-20260421-123456

  Regra:
  - gera código com data + número aleatório
  - verifica unicidade na base antes de devolver
*/
async function generateCodigoMutuario() {
  let codigo;
  let existe = true;

  while (existe) {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    const random = Math.floor(100000 + Math.random() * 900000);

    codigo = `MUT-${year}${month}${day}-${random}`;

    const mutuarioExistente = await Mutuario.findOne({
      where: { codigoMutuario: codigo },
    });

    if (!mutuarioExistente) {
      existe = false;
    }
  }

  return codigo;
}

module.exports = generateCodigoMutuario;