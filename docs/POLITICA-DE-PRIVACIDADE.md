# Política de Privacidade — Tshemba

> **RASCUNHO. NÃO PUBLICAR SEM REVISÃO JURÍDICA.**
>
> Este texto foi escrito a partir do levantamento real do que o sistema
> recolhe e para onde o envia, verificado no código em 2026-10-01. A parte
> factual é sólida. A parte jurídica não é: não sou advogado, e um
> documento destes vincula-te perante clientes e perante o regulador que
> vier a existir.
>
> **Antes de publicar, um advogado tem de rever**, e tu tens de preencher
> o que está marcado com `[PREENCHER]` — são decisões de negócio e dados
> da empresa que eu não posso inventar.

---

## Nota sobre o enquadramento legal

Moçambique **ainda não tem lei de proteção de dados pessoais em vigor**. A
proposta foi aprovada pelo Conselho de Ministros a 4 de março de 2026 e
está na Assembleia da República a aguardar votação final.

Isto tem duas consequências práticas:

1. Não existe hoje uma obrigação legal específica que esta política
   cumpra. Ela existe por boa prática, por transparência com os teus
   clientes, e porque as financeiras que te contratam vão perguntar por
   ela em processos de aquisição muito antes de a lei entrar em vigor.
2. O texto foi escrito para **antecipar** a lei que vem — alinhada com a
   Convenção da União Africana sobre Cibersegurança e Proteção de Dados
   Pessoais — para não ser preciso reescrevê-lo de raiz quando entrar em
   vigor.

Se alguma vez tratares dados de residentes na União Europeia, o RGPD
aplica-se independentemente de onde estejas sediado.

---

## 1. Quem trata os teus dados

A plataforma Tshemba é operada pela **Vektar Technologies MZ**.

- Morada: `[PREENCHER]`
- NUIT: `[PREENCHER]`
- Contacto para assuntos de privacidade: `[PREENCHER — sugestão: privacidade@vektramz.com]`

**Há aqui uma distinção que a política tem de deixar clara**, porque
determina a quem o titular se dirige:

| Papel | Quem | O quê |
|---|---|---|
| Responsável pelo tratamento | A **financeira** que te contrata | Decide recolher os dados do mutuário, para que fim, e durante quanto tempo |
| Subcontratante | **Vektar Technologies MZ** | Fornece a plataforma e trata os dados por instrução da financeira |

Ou seja: quando um mutuário quer exercer direitos sobre os seus dados,
dirige-se **à financeira com quem tem o crédito**, não à Tshemba. A
Tshemba responde perante a financeira.

Esta separação devia constar também do contrato que assinas com cada
financeira — um acordo de subcontratação. `[PREENCHER: existe?]`

---

## 2. Que dados são tratados

Levantamento feito sobre os modelos de dados reais do sistema.

### 2.1 Do mutuário (o cliente final da financeira)

| Categoria | Campos |
|---|---|
| Identificação | nome completo, tipo e número de documento, NUIT, data de nascimento |
| Contacto | telefone, email |
| Localização | província, distrito, local de residência |
| Financeiros | pedidos de crédito e respetivos valores e finalidade, créditos ativos, parcelas, pagamentos, atrasos, situação de incumprimento |
| Documentos | ficheiros carregados como requisitos de crédito (tipicamente documento de identificação, comprovativo de rendimento, comprovativo de morada) e comprovativos de pagamento |

Esta combinação — identificação completa mais historial financeiro mais
documentos de identificação digitalizados — é das mais sensíveis que um
sistema pode guardar sobre uma pessoa.

### 2.2 Dos utilizadores da financeira

Nome, email, palavra-passe (guardada apenas como *hash* bcrypt, nunca em
texto) e perfil de acesso.

### 2.3 De quem pede um teste na página pública

Nome da empresa, nome do contacto, email, telefone e a mensagem escrita.

### 2.4 Registo de atividade

O sistema regista quem executou cada ação sensível, sobre que registo e
quando. Serve para auditoria e para apurar responsabilidade — é uma
exigência prática de qualquer sistema financeiro.

### 2.5 Dados técnicos

O servidor web regista endereços IP, data e hora, caminho pedido e
identificação do navegador, como qualquer servidor. A aplicação guarda o
*token* de sessão no `localStorage` do navegador — não são *cookies*, mas
cumprem função equivalente.

---

## 3. Para que são usados

- Gerir o ciclo de crédito: pedido, aprovação, desembolso, cobrança.
- Comunicar com o mutuário sobre o seu crédito: avisos de vencimento,
  confirmação de pagamento, decisões sobre pedidos.
- Cumprir obrigações de registo e auditoria da financeira.
- Garantir a segurança da plataforma e investigar uso indevido.

Os dados **não são usados** para publicidade, não são vendidos, e não são
partilhados com terceiros fora dos subcontratantes listados abaixo.

---

## 4. Com quem são partilhados

| Entidade | O que recebe | Porquê | Onde |
|---|---|---|---|
| **Hetzner Online GmbH** | Todos os dados alojados | Servidor da plataforma | Helsínquia, Finlândia |
| **Resend** | Endereço de email e conteúdo da mensagem | Envio de emails de notificação, verificação e reposição de palavra-passe | `[PREENCHER: confirmar jurisdição]` |
| **Africa's Talking** | Número de telefone e conteúdo da mensagem | Envio de SMS de aviso | Quénia |
| **Google Fonts** | Endereço IP do visitante | A página carrega o tipo de letra Inter dos servidores do Google | Estados Unidos |

### Dois pontos a corrigir, não apenas a declarar

**O alojamento é na União Europeia.** Dados de cidadãos moçambicanos são
tratados em Helsínquia. É uma transferência internacional e tem de estar
declarada. Não é ilegal, mas é material.

**O Google Fonts expõe o IP de cada visitante antes de qualquer
consentimento.** Esta foi a base de processos na Europa. A correção é
congelar o ficheiro da fonte no projeto em vez de o carregar do Google —
uma alteração pequena que elimina o terceiro em vez de o declarar.

**O SMS está configurado mas inativo** à data deste levantamento (sem
chave de API). Quando for ativado, passa a aplicar-se.

---

## 5. Durante quanto tempo

`[PREENCHER — e esta é a secção mais importante por preencher]`

O sistema **não tem hoje política de retenção implementada**. Os dados
ficam enquanto a conta existir. Há apagamento manual de mutuários, mas
não há prazo automático nem anonimização.

Decisões a tomar, cada uma com implicações técnicas:

- Quanto tempo guardar o processo de um crédito depois de liquidado? Há
  normalmente obrigações contabilísticas e de supervisão financeira que
  impõem mínimos — confirmar com o Banco de Moçambique.
- Quanto tempo guardar documentos de identificação carregados?
- O que acontece aos dados quando uma financeira cancela a subscrição?
- Os backups guardam cópias; apagar um registo não o apaga dos backups
  anteriores. Qual é o prazo de rotação?

---

## 6. Direitos do titular

Qualquer pessoa sobre quem existam dados pode pedir:

- Confirmação de que existem dados seus, e acesso a eles.
- Correção de dados errados ou incompletos.
- Eliminação, quando não exista obrigação legal de os conservar.
- Oposição a tratamentos específicos.
- Uma cópia em formato legível.

**O pedido faz-se à financeira com quem o mutuário tem relação**, não à
Tshemba. A financeira tem a plataforma para responder: o portal do
mutuário permite consultar os próprios dados e créditos, e o backoffice
permite corrigir e exportar.

Prazo de resposta: `[PREENCHER — sugestão: 30 dias]`

---

## 7. Segurança

Medidas efetivamente implementadas, não aspirações:

- Comunicação cifrada em trânsito (HTTPS obrigatório, HSTS).
- Palavras-passe guardadas apenas como *hash* bcrypt.
- Sessões por *token* de curta duração, renováveis.
- Isolamento entre financeiras: cada uma só acede aos seus próprios
  dados, imposto no servidor e não na interface.
- Controlo de acesso por perfil dentro de cada financeira.
- Validação do conteúdo dos ficheiros carregados, para além da extensão.
- Registo de auditoria de ações sensíveis.
- Cabeçalhos de segurança no navegador, incluindo política de conteúdo.
- Testes automáticos que verificam estas barreiras a cada alteração.

Nenhum sistema é inviolável. Em caso de violação de dados: `[PREENCHER —
procedimento e prazo de notificação à financeira afetada]`

---

## 8. Alterações a esta política

`[PREENCHER: como são comunicadas]`

Última atualização: `[PREENCHER: data de publicação]`

---

## Lista do que falta decidir

Resumo do que não pode ser escrito sem ti:

1. Morada e NUIT da Vektar Technologies MZ.
2. Endereço de contacto para assuntos de privacidade.
3. Existe acordo de subcontratação com as financeiras? Em que termos?
4. **Prazos de retenção** — a decisão mais pesada, com impacto técnico.
5. Procedimento e prazo de notificação em caso de violação de dados.
6. Jurisdição do Resend, a confirmar nos termos deles.
7. Decidir se o Google Fonts se corrige ou se declara.
8. Data de publicação e forma de comunicar alterações.

E, antes de qualquer publicação: **revisão por advogado com prática em
Moçambique**. Este rascunho poupa-te o trabalho de levantamento e dá ao
advogado uma base factual verdadeira para trabalhar — que costuma ser a
parte cara. Não substitui a revisão.
