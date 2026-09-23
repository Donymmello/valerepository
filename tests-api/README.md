# tests-api — testes de segurança de caixa preta

Testes HTTP contra a API a correr, escritos em Python com pytest e
requests. Não importam nada do backend nem tocam na base de dados: falam
com a API como qualquer cliente e olham só para o que ela responde.

Cobrem três perguntas, por ordem de dificuldade:

| Ficheiro | Pergunta | Resposta correta |
|---|---|---|
| `test_autenticacao.py` | O que está aberto sem token? | 401 |
| `test_perfis.py` | Ter conta chega para entrar aqui? | 403 |
| `test_isolamento.py` | O mutuário A chega aos dados de B? | 404 |

## Só leitura

Estes testes correm contra uma instância real, provavelmente produção. O
cliente em `conftest.py` **só expõe GET**; pedir-lhe `post`, `put`,
`patch` ou `delete` levanta erro. O único POST em toda a suite é o login.

Isto é estrutural, não uma convenção: um teste futuro escrito à pressa não
consegue escrever na tua base de dados nem por acidente.

## Correr

```bash
python -m pip install -r requirements.txt
```

Os testes de autenticação não precisam de credencial nenhuma — qualquer
pessoa no mundo pode fazer exatamente isto ao teu servidor, mais vale
seres tu primeiro:

```bash
python -m pytest test_autenticacao.py
```

Para o resto, copia `.env.example` para `.env` e preenche. O `.env` está
no `.gitignore` e nunca é commitado.

```bash
python -m pytest
```

Cada credencial que faltar faz os testes dependentes serem **saltados**,
não falhados. Dá para começar só com o ADMIN e ir acrescentando.

Precisas de:

- uma conta **ADMIN** e uma **ANALISTA** da mesma financeira;
- **dois mutuários** da mesma financeira, A e B, para o isolamento;
- pelo menos um pedido de crédito pertencente a B, senão não há o que
  tentar roubar e o teste é saltado.

## Porquê 404 e não 403 no isolamento

Quando A pede um recurso de B, a API responde **404**, não 403. É
deliberado: um 403 diria "existe, mas não é teu", o que já é informação —
dava para enumerar ids e descobrir quantos créditos a financeira tem. O
404 não distingue entre não existir e não ser teu.

Nas rotas de backoffice é ao contrário: 403 é o correto, porque a rota é
pública e conhecida, o que falta é permissão. Esconder a existência de
`/mutuarios` não protege nada.

## O que estes testes já apanharam

`test_perfis.py` cobre correções do commit `8cf9d74` (2026-09-20). Até aí,
um mutuário do portal com perfil `USER` lia a carteira inteira da
financeira por `GET /mutuarios` e descarregava-a em Excel por
`GET /export/mutuarios`. `test_monitorizacao_exige_superadmin` cobre o
dashboard de monitorização, que estava aberto à internet sem autenticação
nenhuma.

Essas correções foram verificadas por testes unitários do lado do Node.
Estes, sendo de fora e contra a instância real, provam outra coisa: que o
que está **implantado** se comporta como o código diz.

## Duas regras que estes testes respeitam

**Todo o teste de negação precisa do par positivo.** Uma API partida que
devolvesse 403 a tudo passaria em todos os testes de proibição. Por isso
existem `test_admin_ve_o_que_e_dele` e `test_b_ve_o_proprio_pedido`.

**Ids de isolamento têm de ser reais.** A fixture `pedidos_de_b` vai
buscar ids verdadeiros fazendo login como B. Se inventássemos um id, a API
devolvia 404 por não existir e o teste passava sem ter provado nada — o
pior tipo de teste, o que dá falsa confiança.

## Levar isto a CI

Quando quiseres, entra no `.github/workflows/ci.yml` como um job próprio,
com as credenciais em *secrets* e a apontar para um ambiente de staging em
vez de produção. Enquanto não houver staging, corre à mão antes de cada
deploy — os de autenticação não custam nada e não precisam de segredo
nenhum.
