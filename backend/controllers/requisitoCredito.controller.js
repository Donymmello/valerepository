const {RequisitoCredito} = require('../models');
const registrarLogAuditoria = require('../utils/logAuditoria');

/*
  ==========================================================
  CRIAR REQUISITO
  ==========================================================
*/
async function createRequisito(req, res) {
    try {
        const { nome, descricao, obrigatorio, ativo } = req.body;

        if (!nome) {
            return res.status(400).json({
                 message: 'O campo "nome" é obrigatório.',
                 });    
        }

        const requisito = await RequisitoCredito.create({
            empresaId: req.user.empresaId,
            nome,
            descricao: descricao || null,
            obrigatorio: obrigatorio !== undefined ? obrigatorio : true,
            ativo: ativo !== undefined ? ativo : true,
        });

        await registrarLogAuditoria({
            userId: req.user.id,
            acao: 'Criar Requisito de Crédito',
            entidade: 'RequisitoCredito',
            entidadeId: requisito.id,
            descricao: `Requisito ${requisito.nome} criado.`,
        });

        return res.status(201).json({
            message: 'Requisito de crédito criado com sucesso.',
            requisito,
        });
    } catch (error) {
        console.error('Erro ao criar requisito de crédito:', error);

        return res.status(500).json({
            message: 'Ocorreu um erro ao criar o requisito de crédito.',
            error: error.message,
        });
    }
}

/*
  ==========================================================
  LISTAR REQUISITOS
  ==========================================================
*/
async function getAllRequisitos(req, res) {
    try {
        const requisitos = await RequisitoCredito.findAll({
                where: { empresaId: req.user.empresaId },
                order: [['id', 'DESC']]
        });

        return res.status(200).json(requisitos);
    } catch (error) {
        console.error('Erro ao listar requisitos de crédito:', error);

        return res.status(500).json({
            message: 'Ocorreu um erro ao listar os requisitos de crédito.',
            error: error.message,
        });
    }
}

/*
  ==========================================================
  ATUALIZAR REQUISITO
  ==========================================================
*/
async function updateRequisito(req, res) {
    try {
        const { id } = req.params;
        const { nome, descricao, obrigatorio, ativo } = req.body;

        const requisito = await RequisitoCredito.findOne({ where: { id, empresaId: req.user.empresaId } });

        if (!requisito) {
            return res.status(404).json({
                message: 'Requisito de crédito não encontrado.',
            });
        }

        await requisito.update({
            nome: nome !== undefined ? nome : requisito.nome,
            descricao: descricao !== undefined ? descricao : requisito.descricao,
            obrigatorio: obrigatorio !== undefined ? obrigatorio : requisito.obrigatorio,
            ativo: ativo !== undefined ? ativo : requisito.ativo,
        });

        await registrarLogAuditoria({
            userId: req.user.id,
            acao: 'Atualizar Requisito de Crédito',
            entidade: 'RequisitoCredito',
            entidadeId: requisito.id,
            descricao: `Requisito ${requisito.nome} atualizado.`,
        });

        return res.status(200).json({
            message: 'Requisito de crédito atualizado com sucesso.',
            requisito,
        });
    } catch (error) {
        console.error('Erro ao atualizar requisito de crédito:', error);

        return res.status(500).json({
            message: 'Ocorreu um erro ao atualizar o requisito de crédito.',
            error: error.message,
        });
    }   
}

module.exports = {
    createRequisito,
    getAllRequisitos,
    updateRequisito,
};