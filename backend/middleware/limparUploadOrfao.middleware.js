const fs = require("fs");

const logger = require("../utils/logger");

/*
  ==========================================================
  LIMPEZA DE UPLOADS ÓRFÃOS
  ==========================================================
  O multer com diskStorage grava o ficheiro ANTES de o controller correr,
  por isso qualquer rejeição a seguir deixava o ficheiro para trás em
  upload/, sem nenhuma linha na BD a apontar-lhe. Caminhos onde isso
  acontece hoje: 403 de perfil, 404 de requisito que não pertence ao
  mutuário (anexo.controller.js e portalMutuario.controller.js) e os
  400/404/409 do envio de comprovativo (parcela inexistente, já paga, ou
  com comprovativo pendente).

  Em vez de apagar à mão em cada early-return espalhado pelos
  controllers, apaga-se uma vez aqui: se a resposta saiu com erro e o
  multer gravou alguma coisa, o ficheiro vai fora. Vale também para as
  rotas de upload que venham a existir, sem ninguém se lembrar disto.

  Uploads em memória (importação de Excel, ver routes/excell.routes.js)
  não têm .path e são ignorados.
*/
function limparUploadOrfaoMiddleware(req, res, next) {
  res.on("finish", () => {
    if (res.statusCode < 400) return;

    const ficheiros = [req.file, ...(Array.isArray(req.files) ? req.files : [])];

    for (const ficheiro of ficheiros) {
      if (!ficheiro?.path) continue;

      fs.unlink(ficheiro.path, (erro) => {
        // ENOENT = já não existe, que é exatamente o estado pretendido.
        if (erro && erro.code !== "ENOENT") {
          logger.warn("Não foi possível apagar upload órfão", {
            path: ficheiro.path,
            error: erro.message,
          });
        }
      });
    }
  });

  next();
}

module.exports = { limparUploadOrfaoMiddleware };
