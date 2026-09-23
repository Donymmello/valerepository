"""
Caso 3 — o mutuário A não chega aos dados do mutuário B.

Este é o mais difícil dos três e o que mais vezes falha em produção, em
qualquer sistema. Autenticação e perfis resolvem-se com middleware, uma
vez, à porta. Isolamento resolve-se em cada consulta à base de dados, e
basta uma esquecer-se do filtro.

O nome técnico é IDOR: Insecure Direct Object Reference. O ataque é só
trocar um número no URL.

NOTA IMPORTANTE SOBRE O CÓDIGO ESPERADO: aqui o correto é **404**, não
403. Um 403 diria ao atacante "existe, mas não é teu", o que já é
informação — dava para enumerar ids e descobrir quantos créditos a
financeira tem. O 404 não distingue entre não existir e não ser teu.
Quando escreveres testes destes noutro sistema, decide primeiro qual das
duas respostas queres, e testa essa.
"""

import pytest


@pytest.fixture(scope="module")
def pedidos_de_b(mutuario_b):
    """
    Ids reais de pedidos do mutuário B, obtidos como o próprio B.

    É assim que se monta um teste de isolamento honesto: os ids têm de
    existir mesmo. Se inventarmos um id ao acaso, a API devolve 404 por
    não existir e o teste passa sem ter provado nada — o pior tipo de
    teste, o que dá falsa confiança.
    """
    resposta = mutuario_b.get("/portal/meus-pedidos")

    if resposta.status_code != 200:
        pytest.skip(f"não consegui listar os pedidos de B: {resposta.status_code}")

    pedidos = resposta.json()
    pedidos = pedidos if isinstance(pedidos, list) else pedidos.get("pedidos", [])

    if not pedidos:
        pytest.skip("o mutuário B não tem pedidos — cria-lhe um para este teste ter matéria")

    return [p["id"] for p in pedidos]


def test_a_nao_ve_pedido_de_b(mutuario_a, pedidos_de_b):
    """O ataque em si: A pede, pelo id, um pedido que é de B."""
    id_de_b = pedidos_de_b[0]

    resposta = mutuario_a.get(f"/portal/meus-pedidos/{id_de_b}")

    assert resposta.status_code == 404, (
        f"O mutuário A recebeu {resposta.status_code} ao pedir o pedido {id_de_b}, "
        "que pertence a B. Devia ser 404."
    )


def test_a_nao_ve_extrato_de_b(mutuario_a, pedidos_de_b):
    """
    O mesmo objeto por outra porta. Uma rota pode estar protegida e a sua
    vizinha não — foi exatamente o que aconteceu no extrato interno, que
    filtrava por empresa mas não por mutuário.
    """
    id_de_b = pedidos_de_b[0]

    resposta = mutuario_a.get(f"/portal/meus-pedidos/{id_de_b}/extrato")

    assert resposta.status_code == 404


def test_b_ve_o_proprio_pedido(mutuario_b, pedidos_de_b):
    """
    Contra-prova, outra vez. Uma API que devolvesse 404 a toda a gente
    passaria nos dois testes acima e estaria completamente partida.

    Sempre que escreveres um teste de negação, escreve o par positivo.
    """
    id_de_b = pedidos_de_b[0]

    assert mutuario_b.get(f"/portal/meus-pedidos/{id_de_b}").status_code == 200


def test_a_so_ve_a_propria_lista(mutuario_a, pedidos_de_b):
    """
    Ataque sem adivinhar ids: será que a listagem do portal já traz coisas
    de outros? É o mesmo buraco, mas encontrado pela porta da frente.
    """
    resposta = mutuario_a.get("/portal/meus-pedidos")
    assert resposta.status_code == 200

    pedidos = resposta.json()
    pedidos = pedidos if isinstance(pedidos, list) else pedidos.get("pedidos", [])
    ids_de_a = {p["id"] for p in pedidos}

    assert ids_de_a.isdisjoint(set(pedidos_de_b)), (
        f"A lista do mutuário A contém pedidos de B: {ids_de_a & set(pedidos_de_b)}"
    )


@pytest.mark.parametrize("id_inventado", [1, 2, 99999])
def test_ids_inventados_nao_revelam_existencia(mutuario_a, id_inventado):
    """
    Enumeração: o atacante passa ids à sorte e vê a resposta. Se um id que
    existe responder diferente de um que não existe, o atacante aprende
    quais existem mesmo sem os conseguir ler.

    Todos têm de dar 404, indistinguíveis entre si.
    """
    resposta = mutuario_a.get(f"/portal/meus-pedidos/{id_inventado}")

    assert resposta.status_code in (200, 404), (
        f"id {id_inventado} devolveu {resposta.status_code}; "
        "só 200 (é mesmo dele) ou 404 são aceitáveis"
    )
