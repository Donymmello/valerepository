const path = require("path");

const {
    Anexo,
    PedidoRequisito,
} = require("../models");

async function anexar (req, res) {
    try {
        const anexo = await Anexo.create({
            pedidoRequisitoId: req.params.id,
            nome: req.file.originalname,
            arquivo: req.file.filename,
            mimeType: req.file.mimetype,
            tamanho: req.file.size,
            userId: req.user.id,
        });

        return res.status(201).json(anexo);
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Erro ao enviar documento",
        });
    }
}

async function listar (req, res) {
    try {
        const anexos = await Anexo.findAll({
            where: {
                pedidoRequisitoId: req.params.id,
            },
            order: [["created_at", "DESC"]],
        });

        return res.json(anexos);
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Erro ao listar anexos"
        });
    }
}

async function download (req, res) {
    try {
        const anexo = await Anexo.findByPk(
            req.params.id
        );

        if (!anexo) {
            return res.status(404).json({
                message: "Documento nao encontrado",
            });
        }

        return res.download(
            path.resolve(
                "upload/anexos",
                anexo.arquivo
            ),
            anexo.nome
        );
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Erro ao baixar documento",
        });
    }
}

module.exports = {
    anexar,
    listar,
    download,
};
