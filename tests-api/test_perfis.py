"""
Caso 2 — ter conta não é ter permissão.

Aqui já há token válido. O que se testa é se o perfil da conta chega para
a rota. É a diferença entre autenticação (quem és) e autorização (o que
podes) — e é onde a maioria dos buracos de segurança vive, porque a
primeira costuma estar bem feita e a segunda esquece-se numa rota.

Estes testes cobrem correções feitas em 2026-09-20 (commit 8cf9d74): até
aí, um mutuário do portal com perfil USER lia a carteira inteira da
financeira por GET /mutuarios e descarregava-a em Excel por
GET /export/mutuarios.
"""

import pytest

# Rotas que só o backoffice pode ver. Um USER do portal tem de levar 403.
ROTAS_DE_BACKOFFICE = [
    "/mutuarios",
    "/export/mutuarios",
    "/export/pedidos",
    "/export/relatorio-financeiro",
    "/desembolsos",
    "/pedido-requisitos/pedido/1",
]


@pytest.mark.parametrize("caminho", ROTAS_DE_BACKOFFICE)
def test_mutuario_nao_entra_no_backoffice(mutuario_a, caminho):
    """
    O caso que estava em aberto: conta legítima, perfil baixo, rota alta.

    403 é o correto aqui, e não 404: a rota existe e é conhecida, o que
    falta é permissão. Esconder a existência só faz sentido quando o
    recurso é de outra pessoa — ver test_isolamento.py.
    """
    resposta = mutuario_a.get(caminho)

    assert resposta.status_code == 403, (
        f"{caminho} respondeu {resposta.status_code} a um perfil USER. Devia ser 403."
    )


def test_analista_nao_gere_empresa(analista):
    """
    O analista trabalha pedidos; não mexe na configuração da empresa nem
    nos utilizadores internos.
    """
    assert analista.get("/empresas/users").status_code == 403


def test_analista_nao_e_superadmin(analista):
    """
    O SUPERADMIN gere as empresas da plataforma toda. Nenhum perfil de
    dentro de uma financeira lá chega.
    """
    assert analista.get("/superadmin/empresas").status_code == 403


def test_admin_nao_e_superadmin(admin):
    """
    Nem o ADMIN da financeira. É uma fronteira diferente das outras: aqui
    não é "mais permissões" numa escada, é outro plano — o dono da
    plataforma contra o dono de um cliente.
    """
    assert admin.get("/superadmin/empresas").status_code == 403


def test_monitorizacao_exige_superadmin(admin):
    """
    O dashboard de monitorização expunha o inventário de endpoints
    exercitados, com ids reais de todas as empresas, sem autenticação
    nenhuma. Agora exige SUPERADMIN — e portanto nem o ADMIN entra.
    """
    assert admin.get("/monitoring/dashboard").status_code == 403


def test_admin_ve_o_que_e_dele(admin):
    """
    Contra-prova. Sem este teste, uma suite que só verifica proibições
    ficaria toda verde com a API completamente partida — 403 em tudo
    também passaria.

    Toda a suite de autorização precisa de pelo menos um caso positivo.
    """
    resposta = admin.get("/mutuarios")

    assert resposta.status_code == 200
    assert isinstance(resposta.json(), list)
