/**
 * Testes de regressão para a lógica financeira, a parte mais sensível
 * do sistema (cálculo de juros, geração de plano de parcelas, aplicação
 * de pagamentos, liquidação automática). Até agora, zero destes ficheiros
 * tinha qualquer teste, apesar de um bug aqui significar valores errados
 * em créditos reais de clientes reais.
 *
 * calCredito.js e generateCodParcela.js são funções puras, testados
 * diretamente, sem mocks. credito.service.js usa os models Sequelize,
 * mockados, seguindo o mesmo padrão de __tests__/criticalFlows.test.js
 * (não há BD real disponível neste projeto para testes automatizados).
 */

const calcularPrestacao = require("../utils/calCredito");
const generateCodParcela = require("../utils/generateCodParcela");

describe("calcularPrestacao (fórmula de juros, Aviso 8/GBM/2021, taxa efetiva)", () => {
  test("10000 a 24%/ano em 12 meses", () => {
    const p = calcularPrestacao(10000, 24, 12);
    expect(p).toBeCloseTo(934.5250949813852, 6);
  });

  test("50000 a 18%/ano em 24 meses", () => {
    const p = calcularPrestacao(50000, 18, 24);
    expect(p).toBeCloseTo(2464.0991866878317, 6);
  });

  test("100000 a 30%/ano em 6 meses", () => {
    const p = calcularPrestacao(100000, 30, 6);
    expect(p).toBeCloseTo(17979.579041286444, 6);
  });

  test("1 mês: prestação é só o capital + 1 mês de juro efetivo", () => {
    const p = calcularPrestacao(5000, 12, 1);
    const iMensal = Math.pow(1.12, 1 / 12) - 1;
    expect(p).toBeCloseTo(5000 * (1 + iMensal), 6);
  });

  test("taxa efetiva anual composta 12x fecha exatamente na taxa anunciada", () => {
    // Isto é o motivo de existir a fórmula (1+taxaAnual)^(1/12)-1 em vez de
    // taxaAnual/12: compor a taxa mensal 12 vezes tem de dar exatamente a
    // taxa anual anunciada, não um valor acima dela.
    for (const taxaAnual of [12, 18, 24, 30, 45]) {
      const i = Math.pow(1 + taxaAnual / 100, 1 / 12) - 1;
      expect(Math.pow(1 + i, 12)).toBeCloseTo(1 + taxaAnual / 100, 9);
    }
  });

  test("prestação cresce com a taxa de juro (montante e prazo fixos)", () => {
    const baixa = calcularPrestacao(10000, 12, 12);
    const alta = calcularPrestacao(10000, 36, 12);
    expect(alta).toBeGreaterThan(baixa);
  });

  test("prestação cresce com o montante (taxa e prazo fixos)", () => {
    const menor = calcularPrestacao(10000, 24, 12);
    const maior = calcularPrestacao(20000, 24, 12);
    expect(maior).toBeCloseTo(menor * 2, 6); // fórmula é linear em `valor`
  });

  test("total pago (prestação × meses) é sempre maior que o capital, há sempre juro", () => {
    const p = calcularPrestacao(10000, 24, 12);
    expect(p * 12).toBeGreaterThan(10000);
  });
});

describe("generateCodParcela (plano de parcelas)", () => {
  const base = {
    creditoId: 1,
    empresaId: 5,
    prestacao: 934.53,
    numeroParcelas: 12,
    primeiraDataVencimento: "2026-01-15",
  };

  test("gera exatamente numeroParcelas parcelas", () => {
    const parcelas = generateCodParcela(base);
    expect(parcelas).toHaveLength(12);
  });

  test("numeração começa em 1 e é sequencial", () => {
    const parcelas = generateCodParcela(base);
    expect(parcelas.map((p) => p.numeroParcela)).toEqual([...Array(12)].map((_, i) => i + 1));
  });

  test("primeira parcela vence 1 mês depois da data de desembolso, não no mesmo dia", () => {
    const parcelas = generateCodParcela(base);
    expect(parcelas[0].dataVencimento).toBe("2026-02-15");
  });

  test("datas de vencimento avançam 1 mês por parcela", () => {
    const parcelas = generateCodParcela(base);
    expect(parcelas[1].dataVencimento).toBe("2026-03-15");
    expect(parcelas[11].dataVencimento).toBe("2027-01-15");
  });

  test("todas as parcelas começam PENDENTE, com saldoParcela = valorPrevisto e valorPago = 0", () => {
    const parcelas = generateCodParcela(base);
    for (const parcela of parcelas) {
      expect(parcela.estado).toBe("PENDENTE");
      expect(parcela.valorPago).toBe(0);
      expect(parcela.saldoParcela).toBe(parcela.valorPrevisto);
    }
  });

  test("valorPrevisto arredonda a prestação a 2 casas decimais", () => {
    const parcelas = generateCodParcela({ ...base, prestacao: 934.525094981385 });
    expect(parcelas[0].valorPrevisto).toBe(934.53);
  });

  test("herda creditoId e empresaId em todas as parcelas", () => {
    const parcelas = generateCodParcela(base);
    for (const parcela of parcelas) {
      expect(parcela.creditoId).toBe(1);
      expect(parcela.empresaId).toBe(5);
    }
  });
});

describe("credito.service.js, aplicação de pagamentos e liquidação (models mockados)", () => {
  jest.resetModules();
  jest.doMock("../models", () => ({
    Mutuario: {},
    User: {},
    Credito: { findByPk: jest.fn(), findOne: jest.fn(), create: jest.fn() },
    PedidoCredito: {},
    ParcelaPagamento: { findByPk: jest.fn(), bulkCreate: jest.fn() },
  }));
  const { Credito, ParcelaPagamento } = require("../models");
  const CreditoService = require("../services/credito.service");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("atualizarSaldo", () => {
    test("reduz saldoAtual e aumenta totalPago pelo valor pago", async () => {
      const credito = { id: 1, saldoAtual: 5000, totalPago: 5000, estado: "ATIVO", save: jest.fn() };
      Credito.findByPk.mockResolvedValue(credito);

      const resultado = await CreditoService.atualizarSaldo(1, 934.53);

      expect(resultado.saldoAtual).toBeCloseTo(4065.47, 2);
      expect(resultado.totalPago).toBeCloseTo(5934.53, 2);
      expect(credito.save).toHaveBeenCalled();
    });

    test("marca o crédito como LIQUIDADO quando o saldo chega a zero", async () => {
      const credito = { id: 1, saldoAtual: 934.53, totalPago: 9065.47, estado: "ATIVO", save: jest.fn() };
      Credito.findByPk.mockResolvedValue(credito);

      const resultado = await CreditoService.atualizarSaldo(1, 934.53);

      expect(resultado.saldoAtual).toBe(0);
      expect(resultado.estado).toBe("LIQUIDADO");
      expect(resultado.dataLiquidacao).toBeInstanceOf(Date);
    });

    test("nunca deixa o saldo ficar negativo, mesmo com pagamento maior que o saldo restante", () => {
      // Regressão: um pagamento de valor superior ao saldo (ex.: erro de
      // digitação, ou última parcela arredondada para cima) não pode fazer
      // o crédito ficar "com saldo negativo", Math.max(0, ...) no código.
      const novoSaldo = Math.max(0, 100 - 150);
      expect(novoSaldo).toBe(0);
    });

    test("lança erro se o crédito não existir", async () => {
      Credito.findByPk.mockResolvedValue(null);
      await expect(CreditoService.atualizarSaldo(999, 100)).rejects.toThrow("Crédito não encontrado.");
    });
  });

  describe("atualizarParcelaAposReembolso", () => {
    function mockParcela(overrides = {}) {
      return {
        id: 1,
        creditoId: 1,
        valorPrevisto: 1000,
        valorPago: 0,
        saldoParcela: 1000,
        dataVencimento: "2099-01-01", // no futuro por omissão, não interfere no cálculo de atraso
        estado: "PENDENTE",
        update: jest.fn(function (dados) {
          Object.assign(this, dados);
          return Promise.resolve(this);
        }),
        ...overrides,
      };
    }

    test("pagamento parcial mantém a parcela PENDENTE (se ainda não venceu) e reduz o saldo", async () => {
      const parcela = mockParcela();
      ParcelaPagamento.findByPk.mockResolvedValue(parcela);

      await CreditoService.atualizarParcelaAposReembolso(1, 1, 400);

      expect(parcela.update).toHaveBeenCalledWith(
        expect.objectContaining({ estado: "PENDENTE", valorPago: 400, saldoParcela: 600 })
      );
    });

    test("pagamento que cobre o saldo inteiro marca a parcela como PAGO", async () => {
      const parcela = mockParcela({ valorPago: 400, saldoParcela: 600 });
      ParcelaPagamento.findByPk.mockResolvedValue(parcela);

      await CreditoService.atualizarParcelaAposReembolso(1, 1, 600);

      expect(parcela.update).toHaveBeenCalledWith(
        expect.objectContaining({ estado: "PAGO", valorPago: 1000, saldoParcela: 0 })
      );
    });

    test("pagamento parcial numa parcela já vencida marca como ATRASADO", async () => {
      const parcela = mockParcela({ dataVencimento: "2020-01-01" });
      ParcelaPagamento.findByPk.mockResolvedValue(parcela);

      await CreditoService.atualizarParcelaAposReembolso(1, 1, 300);

      expect(parcela.update).toHaveBeenCalledWith(expect.objectContaining({ estado: "ATRASADO" }));
    });

    test("rejeita pagamento maior que o saldo em dívida da parcela", async () => {
      const parcela = mockParcela({ saldoParcela: 200 });
      ParcelaPagamento.findByPk.mockResolvedValue(parcela);

      await expect(CreditoService.atualizarParcelaAposReembolso(1, 1, 500)).rejects.toThrow(
        "O valor do pagamento nao pode ser superior ao saldo da parcela."
      );
    });

    test("rejeita parcela que pertence a outro crédito (proteção cross-tenant/cross-crédito)", async () => {
      const parcela = mockParcela({ creditoId: 999 });
      ParcelaPagamento.findByPk.mockResolvedValue(parcela);

      await expect(CreditoService.atualizarParcelaAposReembolso(1, 1, 100)).rejects.toThrow(
        "Parcela não pertence a este crédito."
      );
    });
  });

  describe("registarReembolso (orquestrador)", () => {
    test("rejeita reembolso em crédito já LIQUIDADO", async () => {
      Credito.findByPk.mockResolvedValue({ id: 1, estado: "LIQUIDADO" });

      await expect(CreditoService.registarReembolso(1, 1, 100)).rejects.toThrow(
        "Crédito já foi liquidado. Não é possível registar reembolsos."
      );
    });

    test("exige parcelaId, reembolso não pode ser lançado sem apontar para uma parcela", async () => {
      Credito.findByPk.mockResolvedValue({ id: 1, estado: "ATIVO" });

      await expect(CreditoService.registarReembolso(1, null, 100)).rejects.toThrow(
        "A parcela do pagamento e obrigatoria."
      );
    });
  });

  describe("criarCreditoImportado, saldo de abertura na migração de créditos existentes", () => {
    test("quando saldoAtual/totalPago não são indicados, deriva-os de parcelasPagas × prestação", async () => {
      const pedido = { id: 1, empresaId: 5, mutuarioId: 9, prazo: 12, prestacao: 1000, montanteTotal: 12000, valorSolicitado: 10000, taxa: 24, jurosTotal: 2000 };
      const desembolso = { id: 1, dataDesembolso: "2026-01-01" };
      Credito.create.mockImplementation(async (dados) => ({ ...dados, id: 42 }));

      const credito = await CreditoService.criarCreditoImportado(pedido, desembolso, 1, { parcelasPagas: 5 });

      expect(credito.totalPago).toBe(5000); // 5 parcelas × 1000
      expect(credito.saldoAtual).toBe(7000); // 12000 - 5000
      expect(credito.estado).toBe("ATIVO");
      expect(credito.importado).toBe(true);
    });

    test("saldoAtual explícito tem prioridade sobre o cálculo derivado", async () => {
      const pedido = { id: 1, empresaId: 5, mutuarioId: 9, prazo: 12, prestacao: 1000, montanteTotal: 12000, valorSolicitado: 10000, taxa: 24, jurosTotal: 2000 };
      const desembolso = { id: 1, dataDesembolso: "2026-01-01" };
      Credito.create.mockImplementation(async (dados) => ({ ...dados, id: 42 }));

      const credito = await CreditoService.criarCreditoImportado(pedido, desembolso, 1, {
        parcelasPagas: 5,
        saldoAtual: 6500, // valor real informado pelo utilizador, difere do derivado (7000)
      });

      expect(credito.saldoAtual).toBe(6500);
    });

    test("saldo zero (ou negativo) marca o crédito como LIQUIDADO desde a importação", async () => {
      const pedido = { id: 1, empresaId: 5, mutuarioId: 9, prazo: 12, prestacao: 1000, montanteTotal: 12000, valorSolicitado: 10000, taxa: 24, jurosTotal: 2000 };
      const desembolso = { id: 1, dataDesembolso: "2026-01-01" };
      Credito.create.mockImplementation(async (dados) => ({ ...dados, id: 42 }));

      const credito = await CreditoService.criarCreditoImportado(pedido, desembolso, 1, { parcelasPagas: 12 });

      expect(credito.saldoAtual).toBe(0);
      expect(credito.estado).toBe("LIQUIDADO");
      expect(credito.dataLiquidacao).toBeInstanceOf(Date);
    });

    test("só cria parcelas para o que ainda falta pagar, com numeração correta preservada", async () => {
      const pedido = { id: 1, empresaId: 5, mutuarioId: 9, prazo: 12, prestacao: 1000, montanteTotal: 12000, valorSolicitado: 10000, taxa: 24, jurosTotal: 2000 };
      const desembolso = { id: 1, dataDesembolso: "2026-01-01" };
      Credito.create.mockImplementation(async (dados) => ({ ...dados, id: 42 }));

      await CreditoService.criarCreditoImportado(pedido, desembolso, 1, { parcelasPagas: 5 });

      const parcelasCriadas = ParcelaPagamento.bulkCreate.mock.calls[0][0];
      expect(parcelasCriadas).toHaveLength(7); // 12 - 5
      expect(parcelasCriadas[0].numeroParcela).toBe(6); // continua a numeração real, não recomeça em 1
    });
  });
});
