const { Desembolso } = require("../models");

async function generateReferencia() {

    let referencia;
    let existe = true;

    while (existe) {
        const now = new Date();

        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");

        const random = Math.floor(100000 + Math.random() * 900000);

        referencia = `REF-${year}${month}${day}-${random}`;

        const desembolsoExistente = await Desembolso.findOne({
            where: { referencia: referencia },
        });

        if (!desembolsoExistente) {
            existe = false;
        }
    }

    return referencia;
}
module.exports = generateReferencia;