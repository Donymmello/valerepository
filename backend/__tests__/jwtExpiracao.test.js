/**
 * Expiração de token — o caso que não se consegue testar de fora.
 *
 * Os ataques de adulteração (assinatura trocada, role promovido no
 * payload) testam-se sem segredo nenhum, e estão em tests-api/test_jwt.py.
 * Este não: para fabricar um token VALIDAMENTE ASSINADO mas velho é
 * preciso a chave. Daí viver aqui.
 *
 * A alternativa seria esperar 15 minutos numa suite, o que ninguém faz —
 * e uma suite que ninguém corre não protege nada.
 */

const jwt = require("jsonwebtoken");

process.env.JWT_SECRET = process.env.JWT_SECRET || "segredo-de-teste-nao-usar-em-producao";

const authMiddleware = require("../middleware/auth.middleware");

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

function req(token) {
  return { headers: { authorization: `Bearer ${token}` } };
}

const UTILIZADOR = {
  id: 1,
  nome: "Teste",
  email: "teste@exemplo.com",
  role: "ADMIN",
  empresaId: 1,
};

/*
  O middleware não se fica pelo JWT: para qualquer perfil que não seja
  SUPERADMIN e tenha empresaId, vai à base de dados confirmar o estado da
  subscrição, em TODOS os pedidos (ver auth.middleware.js:37 — uma empresa
  pode ser suspensa a meio de uma sessão já autenticada).

  Este ficheiro testa só o caminho do token, sem base de dados. Por isso o
  caso positivo usa um SUPERADMIN, que é o único que salta essa consulta.
  Os casos negativos não precisam: falham na verificação da assinatura,
  antes de lá chegar.
*/
const SUPERADMIN = {
  id: 99,
  nome: "Superadmin",
  email: "super@exemplo.com",
  role: "SUPERADMIN",
  empresaId: null,
};

describe("expiração do access token", () => {
  test("token expirado é recusado com 401", async () => {
    // expiresIn negativo: nasce já expirado, sem esperar por nada.
    const expirado = jwt.sign(UTILIZADOR, process.env.JWT_SECRET, { expiresIn: "-1s" });
    const res = mockRes();
    const next = jest.fn();

    await authMiddleware(req(expirado), res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test("token válido passa", async () => {
    // Contra-prova. Sem ela, um middleware que recusasse tudo passaria
    // no teste acima.
    const valido = jwt.sign(SUPERADMIN, process.env.JWT_SECRET, { expiresIn: "15m" });
    const pedido = req(valido);
    const res = mockRes();
    const next = jest.fn();

    await authMiddleware(pedido, res, next);

    expect(res.status).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
    expect(pedido.user.role).toBe("SUPERADMIN");
  });

  test("token assinado com outra chave é recusado", async () => {
    // O que acontece se alguém souber a estrutura mas não o segredo — ou
    // se um ambiente for promovido com a chave errada.
    const chaveErrada = jwt.sign(UTILIZADOR, "chave-de-outra-pessoa", { expiresIn: "15m" });
    const res = mockRes();
    const next = jest.fn();

    await authMiddleware(req(chaveErrada), res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  test("a mensagem não distingue expirado de inválido", async () => {
    /*
      Isto testa uma decisão de segurança, não um comportamento acidental.

      Dizer ao cliente "o teu token expirou" contra "a assinatura está
      errada" ajuda o utilizador legítimo mas também ajuda o atacante a
      saber se está perto. O middleware devolve a mesma frase para os dois
      casos de propósito, e este teste existe para que alguém bem
      intencionado não "melhore" as mensagens um dia.
    */
    const expirado = jwt.sign(UTILIZADOR, process.env.JWT_SECRET, { expiresIn: "-1s" });
    const adulterado = jwt.sign(UTILIZADOR, "outra-chave", { expiresIn: "15m" });

    const resExpirado = mockRes();
    const resAdulterado = mockRes();

    await authMiddleware(req(expirado), resExpirado, jest.fn());
    await authMiddleware(req(adulterado), resAdulterado, jest.fn());

    const mensagemExpirado = resExpirado.json.mock.calls[0][0].message;
    const mensagemAdulterado = resAdulterado.json.mock.calls[0][0].message;

    expect(mensagemExpirado).toBe(mensagemAdulterado);
  });

  test("token sem role não ganha permissões por omissão", async () => {
    /*
      Um payload mínimo, sem role. O middleware deixa passar (a assinatura
      é válida), mas req.user.role fica indefinido — e o authorizeRoles a
      seguir tem de recusar, porque undefined não está em lista nenhuma.

      Este é o teste que apanha um "se não tem role, assume ADMIN" que
      alguém escreva por conveniência.
    */
    // Sem empresaId de propósito: assim o middleware não vai à base de
    // dados e o teste fica determinístico.
    const semRole = jwt.sign({ id: 1 }, process.env.JWT_SECRET, { expiresIn: "15m" });
    const pedido = req(semRole);
    const next = jest.fn();

    await authMiddleware(pedido, mockRes(), next);

    expect(next).toHaveBeenCalled();
    expect(pedido.user.role).toBeUndefined();

    // E o authorizeRoles a seguir tem de recusar: undefined não está em
    // lista nenhuma.
    const authorizeRoles = require("../middleware/role.middleware");
    const res = mockRes();
    authorizeRoles("ADMIN")(pedido, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(403);
  });
});
