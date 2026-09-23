"""
Testes de caixa preta à API do Tshemba.

Caixa preta = não importamos nada do backend, não tocamos na base de dados,
não sabemos como está implementado. Falamos HTTP com a API a correr e
olhamos só para o que ela responde. É a perspetiva de um atacante, que é
exatamente a perspetiva certa para testar controlo de acesso.

REGRA DE SEGURANÇA DESTA SUITE: só leitura.

Estes testes correm contra uma instância real, possivelmente produção. O
helper `api` abaixo só expõe GET, e o único POST permitido é o login. Não
há aqui forma de criar, alterar ou apagar seja o que for — nem por engano,
nem por um teste futuro escrito à pressa.
"""

import os
from pathlib import Path

import pytest
import requests

RAIZ = Path(__file__).resolve().parent


def _carregar_env() -> None:
    """
    Lê tests-api/.env sem depender do python-dotenv.

    Formato: LINHAS=assim, cardinal comenta. Não substitui variáveis que já
    existam no ambiente — assim a CI pode injetá-las por cima do ficheiro.
    """
    ficheiro = RAIZ / ".env"
    if not ficheiro.exists():
        return

    for linha in ficheiro.read_text(encoding="utf-8").splitlines():
        linha = linha.strip()
        if not linha or linha.startswith("#") or "=" not in linha:
            continue
        chave, _, valor = linha.partition("=")
        os.environ.setdefault(chave.strip(), valor.strip())


_carregar_env()


class ApiSoLeitura:
    """
    Cliente HTTP deliberadamente amputado: GET e mais nada.

    Guarda o token e mete-o no cabeçalho por ti. Se lhe pedires um método
    que muta, levanta erro em vez de o fazer.
    """

    def __init__(self, base_url: str, token: str | None = None):
        self.base_url = base_url.rstrip("/")
        self.token = token
        self.sessao = requests.Session()

    def _cabecalhos(self) -> dict:
        return {"Authorization": f"Bearer {self.token}"} if self.token else {}

    def get(self, caminho: str, **kwargs) -> requests.Response:
        return self.sessao.get(
            f"{self.base_url}{caminho}",
            headers=self._cabecalhos(),
            timeout=20,
            **kwargs,
        )

    def __getattr__(self, nome):
        if nome in {"post", "put", "patch", "delete"}:
            raise RuntimeError(
                f"Esta suite é só de leitura: {nome.upper()} não é permitido. "
                "Corre contra uma instância real."
            )
        raise AttributeError(nome)


@pytest.fixture(scope="session")
def base_url() -> str:
    """
    Onde está a API. Default aponta para produção porque é a única
    instância que existe a correr; muda com TSHEMBA_API_URL.
    """
    return os.environ.get("TSHEMBA_API_URL", "https://tshemba.vektramz.com/api")


@pytest.fixture(scope="session")
def anonimo(base_url) -> ApiSoLeitura:
    """Cliente sem token nenhum."""
    return ApiSoLeitura(base_url)


def _iniciar_sessao(base_url: str, prefixo: str) -> str:
    """
    Faz login e devolve o token. As credenciais vêm do ambiente e nunca
    entram no código nem no repositório — ver .env.example.

    Falta a credencial? O teste é SALTADO, não falhado. Um teste que falha
    por falta de configuração ensina-te nada e treina-te a ignorar vermelhos.
    """
    email = os.environ.get(f"{prefixo}_EMAIL")
    password = os.environ.get(f"{prefixo}_PASSWORD")

    if not email or not password:
        pytest.skip(f"{prefixo}_EMAIL / {prefixo}_PASSWORD não configurados em tests-api/.env")

    resposta = requests.post(
        f"{base_url.rstrip('/')}/auth/login",
        json={"email": email, "password": password},
        timeout=20,
    )

    if resposta.status_code != 200:
        pytest.skip(
            f"login de {prefixo} devolveu {resposta.status_code} — credencial errada ou conta inativa"
        )

    token = resposta.json().get("token")
    if not token:
        pytest.skip(f"login de {prefixo} não devolveu token")

    return token


@pytest.fixture(scope="session")
def admin(base_url) -> ApiSoLeitura:
    """Conta com perfil ADMIN."""
    return ApiSoLeitura(base_url, _iniciar_sessao(base_url, "ADMIN"))


@pytest.fixture(scope="session")
def analista(base_url) -> ApiSoLeitura:
    """Conta com perfil ANALISTA — vê pedidos, não manda em utilizadores."""
    return ApiSoLeitura(base_url, _iniciar_sessao(base_url, "ANALISTA"))


@pytest.fixture(scope="session")
def mutuario_a(base_url) -> ApiSoLeitura:
    """Mutuário do portal, perfil USER."""
    return ApiSoLeitura(base_url, _iniciar_sessao(base_url, "MUTUARIO_A"))


@pytest.fixture(scope="session")
def mutuario_b(base_url) -> ApiSoLeitura:
    """Outro mutuário, para provar que A não chega aos dados de B."""
    return ApiSoLeitura(base_url, _iniciar_sessao(base_url, "MUTUARIO_B"))
