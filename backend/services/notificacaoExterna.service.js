/*
  ==========================================================
  DESPACHO EXTERNO DE NOTIFICAÇÕES (email + SMS)
  ==========================================================
  Ponto único que transforma uma Notificacao (in-app) em email/SMS reais.
  É chamado pelo hook afterCreate/afterBulkCreate do modelo Notificacao
  (ver models/index.js) — não pelos controllers diretamente. Isto garante
  que qualquer sítio do código que crie uma Notificacao (hoje já são uns
  6 controllers diferentes) passa automaticamente por aqui, sem termos de
  lembrar de ligar cada um manualmente.

  Fornecedores: Resend (email) e Africa's Talking (SMS), escolhidos por
  decisão do utilizador. Em desenvolvimento (ou sem as chaves de API
  configuradas), tudo cai para log em consola — mesmo padrão já usado em
  utils/emailService.js.

  Nota sobre a marca: as notificações saem em nome da empresa (o nome da
  financeira aparece no "From" do email e no início da mensagem SMS), mas
  usam a infraestrutura partilhada da plataforma (um domínio de email, um
  Sender ID de SMS) — decisão explícita para não exigir que cada empresa
  configure o próprio domínio/Sender ID. Ver RECUPERACAO_BD.md.
*/

const isDevelopment = process.env.NODE_ENV !== "production" || process.env.SKIP_EMAIL_VERIFICATION === "true";

let resendClient;
function getResendClient() {
  if (resendClient === undefined) {
    resendClient = null;
    if (process.env.RESEND_API_KEY) {
      const { Resend } = require("resend");
      resendClient = new Resend(process.env.RESEND_API_KEY);
    }
  }
  return resendClient;
}

let smsClient;
function getSmsClient() {
  if (smsClient === undefined) {
    smsClient = null;
    if (process.env.AFRICASTALKING_API_KEY && process.env.AFRICASTALKING_USERNAME) {
      const AfricasTalking = require("africastalking");
      smsClient = AfricasTalking({
        apiKey: process.env.AFRICASTALKING_API_KEY,
        username: process.env.AFRICASTALKING_USERNAME,
      }).SMS;
    }
  }
  return smsClient;
}

/*
  Normaliza um número moçambicano para o formato internacional E.164
  (+258...), que a Africa's Talking exige. Aceita os formatos mais comuns
  que um mutuário pode ter escrito no perfil: "84 123 4567", "0841234567",
  "+258841234567", "258841234567".
*/
function normalizarTelefoneMz(telefone) {
  if (!telefone) return null;

  const digits = telefone.replace(/\D/g, "");
  if (!digits) return null;

  if (digits.startsWith("258")) return `+${digits}`;
  if (digits.startsWith("0")) return `+258${digits.slice(1)}`;
  if (digits.length === 9) return `+258${digits}`;

  return `+${digits}`;
}

async function enviarEmail({ to, empresaNome, assunto, mensagem }) {
  const remetenteEmail = process.env.RESEND_FROM_EMAIL || "notificacoes@valedozambeze.com";
  const remetente = `${empresaNome} <${remetenteEmail}>`;
  const client = getResendClient();

  if (isDevelopment || !client) {
    console.log("\n" + "=".repeat(60));
    console.log("📧 NOTIFICAÇÃO POR EMAIL (DEV MODE / sem RESEND_API_KEY)");
    console.log("=".repeat(60));
    console.log(`De: ${remetente}`);
    console.log(`Para: ${to}`);
    console.log(`Assunto: ${assunto}`);
    console.log(mensagem);
    console.log("=".repeat(60) + "\n");
    return { success: true, mode: "development" };
  }

  try {
    await client.emails.send({
      from: remetente,
      to,
      subject: assunto,
      text: mensagem,
    });
    return { success: true, mode: "production" };
  } catch (error) {
    console.error("[Resend Error]:", error.message);
    return { success: false, error: error.message };
  }
}

async function enviarSms({ to, empresaNome, mensagem }) {
  // Sem Sender ID por empresa (ver nota no topo do ficheiro), por isso o
  // nome da empresa vai no corpo da mensagem em vez do remetente.
  const texto = `${empresaNome}: ${mensagem}`;
  const client = getSmsClient();

  if (isDevelopment || !client) {
    console.log("\n" + "=".repeat(60));
    console.log("📱 NOTIFICAÇÃO POR SMS (DEV MODE / sem AFRICASTALKING_API_KEY)");
    console.log("=".repeat(60));
    console.log(`Para: ${to}`);
    console.log(texto);
    console.log("=".repeat(60) + "\n");
    return { success: true, mode: "development" };
  }

  try {
    await client.send({
      to: [to],
      message: texto,
      from: process.env.AFRICASTALKING_SENDER_ID || undefined,
    });
    return { success: true, mode: "production" };
  } catch (error) {
    console.error("[AfricasTalking Error]:", error.message);
    return { success: false, error: error.message };
  }
}

/*
  Ponto de entrada chamado pelo hook do modelo Notificacao. Recebe a
  instância recém-criada, resolve o destinatário e despacha email/SMS.
  Nunca lança erro — uma falha aqui não pode derrubar o fluxo que criou
  a notificação (ex: aprovar um pedido não pode falhar por causa de um
  problema no envio de SMS).

  Requires de "../models" feitos aqui dentro (não no topo do ficheiro) de
  propósito: este serviço é usado pelo próprio models/index.js para
  registar o hook, e um require de "../models" no topo do ficheiro criaria
  uma dependência circular (index.js -> este serviço -> index.js, ainda a
  meio de ser montado). Feito lazy, dentro da função, o require só corre
  quando uma notificação real é criada — a essa altura os models já estão
  todos carregados.
*/
async function despacharNotificacaoExterna(notificacao) {
  try {
    const { User, Mutuario, Empresa } = require("../models");

    const user = await User.findByPk(notificacao.userId, {
      attributes: ["id", "email", "role", "empresaId"],
    });
    if (!user) return;

    // Só mutuários recebem email/SMS externo. Staff interno (ADMIN,
    // GESTOR, ANALISTA, DIRETOR) já vive dentro do backoffice e usa as
    // notificações in-app — evita gerar custo de SMS em alertas internos
    // que por vezes são criados em massa (ex: "novo pedido" para vários
    // membros da equipa de uma vez).
    if (!["USER", "MUTUARIO"].includes(user.role)) return;

    const [empresa, mutuario] = await Promise.all([
      user.empresaId ? Empresa.findByPk(user.empresaId, { attributes: ["nome"] }) : null,
      Mutuario.findOne({ where: { userId: user.id }, attributes: ["telefone", "email"] }),
    ]);

    const empresaNome = empresa?.nome || "A sua instituição";
    const emailDestino = user.email || mutuario?.email;
    const telefoneDestino = normalizarTelefoneMz(mutuario?.telefone);

    const tarefas = [];
    if (emailDestino) {
      tarefas.push(enviarEmail({
        to: emailDestino,
        empresaNome,
        assunto: notificacao.titulo,
        mensagem: notificacao.mensagem,
      }));
    }
    if (telefoneDestino) {
      tarefas.push(enviarSms({
        to: telefoneDestino,
        empresaNome,
        mensagem: notificacao.mensagem,
      }));
    }

    await Promise.allSettled(tarefas);
  } catch (error) {
    console.error("[DespacharNotificacaoExterna Error]:", error.message);
  }
}

module.exports = {
  despacharNotificacaoExterna,
  enviarEmail,
  enviarSms,
  normalizarTelefoneMz,
};
