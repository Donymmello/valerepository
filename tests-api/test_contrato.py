"""
Testes gerados a partir do contrato — schemathesis sobre openapi.yaml.

A diferença para todo o resto desta suite: aqui ninguém escreveu os casos.
O schemathesis lê o OAS3, e para cada endpoint fabrica pedidos que
respeitam o esquema e pedidos que o violam, verificando que a API nunca
sai do contrato que declarou. É property-based testing: em vez de afirmar
"este pedido dá 200", afirma "nenhum pedido possível dá 500".

O que isto apanha e os testes escritos à mão não apanham: o campo que
rebenta com string vazia, o inteiro que estoira com um número enorme, o
caracter unicode que passa pela validação e mata o serializador. Coisas em
que ninguém pensou, que é precisamente o ponto.

O que isto NÃO apanha, e nunca vai apanhar: que o pedido 7 pertence a
outro mutuário. Um gerador não tem noção de quem é dono de quê. Por isso
test_isolamento.py continua a ser escrito à mão — as duas abordagens são
complementares, não alternativas.

ATENÇÃO — ESTE FICHEIRO ESCREVE. É a única exceção à regra de só leitura
da suite, e por isso está marcado e DESLIGADO por omissão:

    pytest                          # não corre isto
    pytest -m contrato --contrato   # corre, e só contra o alvo que indicares

Nunca o apontes a produção: o schemathesis submete POSTs a sério e ia
encher a tua base de dados de mutuários e pedidos de lixo.
"""

import os

import pytest

CAMINHO_SPEC = os.path.join(os.path.dirname(__file__), "openapi.yaml")


schemathesis = pytest.importorskip("schemathesis")


@pytest.mark.contrato
def test_contrato_e_carregavel():
    """
    O único teste deste ficheiro que corre sempre: o contrato existe, é
    válido, e os endpoints que declara são os que esperamos.

    Barato, e apanha o caso em que alguém edita o YAML e o parte.
    """
    schema = schemathesis.openapi.from_path(CAMINHO_SPEC)

    caminhos = set(schema.raw_schema["paths"])

    assert "/auth/login" in caminhos
    assert "/mutuarios" in caminhos
    assert "/pedidos-credito" in caminhos
    assert "/aprovacoes/pedido/{pedidoId}/decidir" in caminhos


# A suite gerada propriamente dita. Só é construída quando há alvo.
if os.environ.get("SCHEMATHESIS_URL"):
    esquema = schemathesis.openapi.from_path(
        CAMINHO_SPEC,
        base_url=os.environ["SCHEMATHESIS_URL"],
    )

    @pytest.mark.contrato
    @esquema.parametrize()
    def test_api_respeita_o_contrato(case):
        """
        Um teste por operação declarada, cada um com muitos exemplos
        gerados. As verificações por omissão incluem: o código de resposta
        está declarado no contrato, o content-type bate certo, o corpo
        valida contra o esquema, e não há 500.
        """
        case.call_and_validate()
