/**
 * Integração para executarVerificacaoPagamento (controllers/alertaPagamento.controller.js),
 * a rotina que o agendador diário chama para avisar mutuários de parcelas
 * a vencer ou vencidas.
 *
 * Porquê integração e não unit com mocks: o bug que motivou este teste era
 * um `include` inválido (`as: "pedido"` diretamente em ParcelaPagamento,
 * associação que não existe, a real é parcela -> credito -> pedido). Um
 * mock dos models nunca apanharia isso, o Sequelize real apanha, atira
 * "PedidoCredito is not associated to ParcelaPagamento!" ainda antes de
 * chegar à BD. Em produção isto rebentava a verificação inteira todos os
 * dias às 05:00 UTC e nenhum alerta de pagamento era criado.
 *
 * Corre contra o sqlite em memória (ver config/db.js, NODE_ENV=test).
 */

jest.mock("../services/notificacaoExterna.service", () => ({
  despacharNotificacaoExterna: jest.fn().mockResolvedValue(undefined),
}));

const {
  sequelize,
  Empresa,
  User,
  Mutuario,
  PedidoCredito,
  Desembolso,
  Credito,
  ParcelaPagamento,
  Notificacao,
} = require("../models");
const { executarVerificacaoPagamento } = require("../controllers/alertaPagamento.controller");

jest.setTimeout(30000);

function idUnico() {
  return `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
}

// Monta a cadeia toda que o include percorre: empresa -> mutuario (com
// User, porque o alerta é endereçado ao userId) -> pedido -> desembolso
// -> credito -> parcela.
async function criarParcela({ diasAteVencimento }) {
  const sufixo = idUnico();

  const empresa = await Empresa.create({
    nome: `Empresa ${sufixo}`,
    slug: `empresa-${sufixo}`,
  });

  const staff = await User.create({
    empresaId: empresa.id,
    nome: "Admin Teste",
    email: `admin-${sufixo}@teste.com`,
    passwordHash: "hash-fake",
    role: "ADMIN",
  });

  const userMutuario = await User.create({
    empresaId: empresa.id,
    nome: "Mutuario Teste",
    email: `mutuario-${sufixo}@teste.com`,
    passwordHash: "hash-fake",
    role: "USER",
  });

  const mutuario = await Mutuario.create({
    userId: userMutuario.id,
    empresaId: empresa.id,
    codigoMutuario: `MUT-${sufixo}`,
    nomeCompleto: "Mutuario Teste",
  });

  const pedido = await PedidoCredito.create({
    numeroPedido: `PED-${sufixo}`,
    mutuarioId: mutuario.id,
    empresaId: empresa.id,
    valorSolicitado: 100000,
    finalidade: "Teste",
    etapaAtual: 1,
    prazo: 12,
    taxa: 2.5,
    prestacao: 10000,
    jurosTotal: 20000,
    montanteTotal: 120000,
    createdBy: staff.id,
  });

  const desembolso = await Desembolso.create({
    pedidoId: pedido.id,
    empresaId: empresa.id,
    valorDesembolsado: 100000,
    dataDesembolso: new Date(),
    meioPagamento: "TRANSFERENCIA",
    createdBy: staff.id,
  });

  const credito = await Credito.create({
    numeroContrato: `CTR-${sufixo}`,
    pedidoId: pedido.id,
    desembolsoId: desembolso.id,
    mutuarioId: mutuario.id,
    empresaId: empresa.id,
    valorOriginal: 100000,
    saldoAtual: 100000,
    prazo: 12,
    taxa: 2.5,
    prestacao: 10000,
    jurosTotal: 20000,
    montanteTotal: 120000,
    dataInicio: new Date(),
    dataFimPrevista: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    createdBy: staff.id,
  });

  const vencimento = new Date();
  vencimento.setDate(vencimento.getDate() + diasAteVencimento);

  const parcela = await ParcelaPagamento.create({
    creditoId: credito.id,
    empresaId: empresa.id,
    numeroParcela: 1,
    valorPrevisto: 10000,
    saldoParcela: 10000,
    dataVencimento: vencimento.toISOString().slice(0, 10),
    estado: "PENDENTE",
  });

  return { empresa, userMutuario, pedido, parcela };
}

beforeAll(async () => {
  // Mesma trava do authIntegration.test.js: sync({force:true}) apaga e
  // recria todas as tabelas, só pode tocar no sqlite em memória.
  if (sequelize.getDialect() !== "sqlite") {
    throw new Error(
      `Recusado: alertaPagamento.test.js só pode correr contra sqlite em memória, não contra '${sequelize.getDialect()}'. ` +
      `Confirma que NODE_ENV=test está definido (o script "test" do package.json força isto).`
    );
  }
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

describe("executarVerificacaoPagamento (integração, BD real)", () => {
  test("não rebenta a percorrer a associação parcela -> credito -> pedido/mutuario", async () => {
    // Sem dados nenhuns: o include inválido atirava mesmo assim, porque o
    // Sequelize resolve as associações ao construir a query. É este o caso
    // que falha se alguém voltar a pôr `as: "pedido"` na parcela.
    await expect(executarVerificacaoPagamento(999999)).resolves.toEqual([]);
  });

  test("parcela vencida gera notificação para o mutuário e marca a parcela ATRASADO", async () => {
    const { empresa, userMutuario, pedido, parcela } = await criarParcela({ diasAteVencimento: -5 });

    const alertas = await executarVerificacaoPagamento(empresa.id);

    expect(alertas).toHaveLength(1);
    expect(alertas[0]).toMatchObject({ pedidoId: pedido.id, numeroPedido: pedido.numeroPedido, vencido: true });

    const notificacao = await Notificacao.findOne({ where: { userId: userMutuario.id } });
    expect(notificacao).not.toBeNull();
    expect(notificacao.tipo).toBe("ALERTA_PAGAMENTO");
    expect(notificacao.titulo).toBe("Pagamento em Atraso");
    expect(notificacao.mensagem).toContain(pedido.numeroPedido);

    await parcela.reload();
    expect(parcela.estado).toBe("ATRASADO");
  });

  test("não duplica alerta para o mesmo pedido enquanto o anterior não for lido", async () => {
    const { empresa } = await criarParcela({ diasAteVencimento: -5 });

    await executarVerificacaoPagamento(empresa.id);
    const segundaCorrida = await executarVerificacaoPagamento(empresa.id);

    expect(segundaCorrida).toHaveLength(0);
  });
});
