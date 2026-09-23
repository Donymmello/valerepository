"""
JWT — o que um atacante consegue fazer a um token sem ter a chave.

Nada aqui precisa do JWT_SECRET. É essa a graça: se algum destes testes
passar a devolver 200, é porque a verificação de assinatura deixou de ser
feita, e aí qualquer pessoa se promove a ADMIN com um editor de texto.

O caso "token expirado mas validamente assinado" NÃO está aqui: fabricá-lo
exige a chave. Vive em backend/__tests__/jwtExpiracao.test.js, onde o
segredo existe.

Nota sobre o que não se consegue distinguir: a API responde com a mesma
mensagem para assinatura errada e para token expirado. É deliberado —
dizer ao atacante qual das duas falhou dá-lhe informação de graça. Por
isso estes testes afirmam o código 401, nunca o texto.
"""

import base64
import json

import pytest


def _partes(token: str):
    cabecalho, payload, assinatura = token.split(".")
    return cabecalho, payload, assinatura


def _descodificar_payload(payload_b64: str) -> dict:
    # JWT usa base64url sem padding; é preciso repô-lo para descodificar.
    padding = "=" * (-len(payload_b64) % 4)
    return json.loads(base64.urlsafe_b64decode(payload_b64 + padding))


def _codificar_payload(dados: dict) -> str:
    bruto = json.dumps(dados, separators=(",", ":")).encode()
    return base64.urlsafe_b64encode(bruto).decode().rstrip("=")


@pytest.fixture
def token_valido(mutuario_a):
    """Um token verdadeiro, obtido por login. O ponto de partida do ataque."""
    if not mutuario_a.token:
        pytest.skip("sem token de mutuário")
    return mutuario_a.token


def test_token_de_origem_funciona(mutuario_a):
    """
    Contra-prova, primeiro. Se o token bom não funcionasse, todos os
    testes abaixo passariam sem provar nada.
    """
    assert mutuario_a.get("/portal/meus-pedidos").status_code == 200


def test_assinatura_alterada_e_recusada(base_url, token_valido):
    """
    Trocar um carácter na assinatura. O ataque mais ingénuo que existe, e
    o teste que apanha uma verificação desligada.
    """
    from conftest import ApiSoLeitura

    cabecalho, payload, assinatura = _partes(token_valido)
    # Trocar o último carácter por outro diferente.
    adulterada = assinatura[:-1] + ("A" if assinatura[-1] != "A" else "B")

    atacante = ApiSoLeitura(base_url, f"{cabecalho}.{payload}.{adulterada}")

    assert atacante.get("/portal/meus-pedidos").status_code == 401


def test_role_alterado_no_payload_e_recusado(base_url, token_valido):
    """
    O ataque que interessa: pegar no token de um mutuário, mudar
    "role":"USER" para "role":"ADMIN", e voltar a enviá-lo.

    O payload de um JWT não é cifrado — é base64, legível por qualquer
    pessoa. O que impede a promoção não é o segredo do conteúdo, é a
    assinatura deixar de bater certo assim que um byte muda.

    Quem nunca viu isto de perto costuma assumir que o token está
    "encriptado". Não está. Corre este teste e olha para o payload
    descodificado abaixo.
    """
    from conftest import ApiSoLeitura

    cabecalho, payload, assinatura = _partes(token_valido)

    dados = _descodificar_payload(payload)
    assert dados.get("role") in ("USER", "MUTUARIO"), (
        f"esperava um token de mutuário, veio role={dados.get('role')}"
    )

    dados["role"] = "ADMIN"
    payload_forjado = _codificar_payload(dados)

    atacante = ApiSoLeitura(base_url, f"{cabecalho}.{payload_forjado}.{assinatura}")

    # 401 e não 403: a API nem chega a olhar para o role, porque o token
    # nem sequer passa a verificação de assinatura.
    assert atacante.get("/mutuarios").status_code == 401


def test_empresa_alterada_no_payload_e_recusada(base_url, token_valido):
    """
    Variante multi-tenant do anterior, e mais grave: trocar o empresaId
    para saltar de financeira. Se a assinatura não fosse verificada, isto
    dava acesso à carteira de outra empresa.
    """
    from conftest import ApiSoLeitura

    cabecalho, payload, assinatura = _partes(token_valido)

    dados = _descodificar_payload(payload)
    dados["empresaId"] = (dados.get("empresaId") or 0) + 1
    payload_forjado = _codificar_payload(dados)

    atacante = ApiSoLeitura(base_url, f"{cabecalho}.{payload_forjado}.{assinatura}")

    assert atacante.get("/portal/meus-pedidos").status_code == 401


def test_algoritmo_none_e_recusado(base_url, token_valido):
    """
    O ataque clássico "alg: none": declarar no cabeçalho que o token não
    tem assinatura nenhuma e enviá-lo sem ela. Bibliotecas antigas
    aceitavam.

    A jsonwebtoken moderna recusa, mas o teste fica: é barato, e é a
    primeira coisa que volta a partir num dia de atualização de
    dependências mal feita.
    """
    from conftest import ApiSoLeitura

    _, payload, _ = _partes(token_valido)

    cabecalho_none = base64.urlsafe_b64encode(
        json.dumps({"alg": "none", "typ": "JWT"}, separators=(",", ":")).encode()
    ).decode().rstrip("=")

    atacante = ApiSoLeitura(base_url, f"{cabecalho_none}.{payload}.")

    assert atacante.get("/portal/meus-pedidos").status_code == 401


@pytest.mark.parametrize(
    "token_lixo",
    [
        "",
        "abc",
        "a.b.c",
        "Bearer",
        "null",
        "..",
    ],
)
def test_tokens_malformados_nao_rebentam_o_servidor(base_url, token_lixo):
    """
    Nada disto é um JWT. O que se testa é que a API responde 401 com
    calma, em vez de 500 — um erro 500 aqui significa exceção não
    apanhada, e exceções não apanhadas em código de autenticação são o
    sítio errado para ter surpresas.
    """
    from conftest import ApiSoLeitura

    atacante = ApiSoLeitura(base_url, token_lixo)

    assert atacante.get("/portal/meus-pedidos").status_code == 401
