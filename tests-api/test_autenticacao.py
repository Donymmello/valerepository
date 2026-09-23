"""
Caso 1 — sem token, ninguém entra.

A pergunta que estes testes respondem: quais das minhas rotas estão
abertas à internet? Não é preciso conta nenhuma para os correr, o que
significa que qualquer pessoa no mundo pode fazer exatamente isto ao teu
servidor. Mais vale seres tu a fazê-lo primeiro.
"""

import pytest

# Uma amostra do que deve estar fechado. Cada tuplo é (caminho, o que é).
# parametrize transforma isto em N testes independentes: se um falhar, os
# outros continuam e o nome diz-te logo qual.
ROTAS_PRIVADAS = [
    ("/mutuarios", "lista de mutuários"),
    ("/pedidos-credito", "lista de pedidos"),
    ("/desembolsos", "lista de desembolsos"),
    ("/export/mutuarios", "exportação de mutuários em Excel"),
    ("/relatorios/dashboard", "dashboard de relatórios"),
    ("/relatorios/financeiro-pedidos", "relatório financeiro de pedidos"),
    ("/monitoring/dashboard", "dashboard de monitorização"),
    ("/logs-auditoria", "registos de auditoria"),
]


@pytest.mark.parametrize("caminho,descricao", ROTAS_PRIVADAS)
def test_sem_token_devolve_401(anonimo, caminho, descricao):
    resposta = anonimo.get(caminho)

    assert resposta.status_code == 401, (
        f"{caminho} ({descricao}) respondeu {resposta.status_code} sem token nenhum. "
        "Devia ser 401."
    )


@pytest.mark.parametrize("caminho,descricao", ROTAS_PRIVADAS)
def test_sem_token_nao_vaza_dados(anonimo, caminho, descricao):
    """
    O código de estado não chega. Uma rota pode devolver 401 e ainda assim
    ter deixado escapar qualquer coisa no corpo — ou, pior, devolver 200
    com dados e o 401 só no cabeçalho de outra coisa.

    Aqui confirmamos que o corpo é uma mensagem de erro e nada mais: nada
    de listas, nada de objetos com dados.
    """
    resposta = anonimo.get(caminho)
    corpo = resposta.json()

    assert isinstance(corpo, dict), f"{caminho} devolveu uma coleção sem autenticação"
    assert set(corpo.keys()) <= {"message", "error", "requestId"}, (
        f"{caminho} devolveu campos a mais sem autenticação: {list(corpo.keys())}"
    )


def test_token_invalido_e_rejeitado(base_url):
    """
    Um token inventado tem de ser recusado. Parece óbvio, mas é o teste
    que apanha uma verificação de assinatura desligada por engano — o tipo
    de erro que passa despercebido porque tudo o resto continua a funcionar.
    """
    from conftest import ApiSoLeitura

    falso = ApiSoLeitura(base_url, token="isto.nao.e.um.jwt")

    assert falso.get("/mutuarios").status_code == 401


def test_rotas_publicas_continuam_publicas(anonimo):
    """
    O contrário também importa: apertar a segurança não pode ter fechado o
    que é suposto estar aberto. Sem este teste, o dia em que alguém puser
    authMiddleware a mais só se descobre quando a landing page deixar de
    funcionar.
    """
    assert anonimo.get("/health/ping").status_code == 200
