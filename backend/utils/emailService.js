/**
 * Serviço de email modular
 * Suporta desenvolvimento (console) e produção (Resend)
 *
 * Estes dois emails (OTP de verificação e reset de password) são fluxos
 * de segurança/autenticação, não notificações de negócio, por isso saem
 * em nome da plataforma (PLATFORM_NAME), não da empresa/financeira.
 * Password reset, por exemplo, também é usado por staff interno (ADMIN,
 * GESTOR...), que não tem uma "marca" própria para aparecer aqui. As
 * notificações que já saem em nome de cada empresa (aprovação, alertas
 * de prazo, etc.) passam por services/notificacaoExterna.service.js.
 */

const isDevelopment = process.env.NODE_ENV !== 'production' || process.env.SKIP_EMAIL_VERIFICATION === 'true';

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

const REMETENTE_PLATAFORMA = `${process.env.PLATFORM_NAME || "Tshemba"} <${process.env.RESEND_FROM_EMAIL || "notificacoes@exemplo.com"}>`;

/**
 * Envia email de verificação de OTP
 * Em desenvolvimento, mostra no console
 * Em produção, envia via Resend
 */
async function sendVerificationEmail(email, otp, nomeCompleto) {
  if (isDevelopment) {
    // Mode desenvolvimento - loga no console
    console.log('\n' + '='.repeat(60));
    console.log('📧 EMAIL DE VERIFICAÇÃO (DEV MODE)');
    console.log('='.repeat(60));
    console.log(`Para: ${email}`);
    console.log(`Nome: ${nomeCompleto}`);
    console.log(`\n🔐 CÓDIGO OTP: ${otp}`);
    console.log(`⏰ Válido por 10 minutos`);
    console.log('='.repeat(60) + '\n');
    return { success: true, mode: 'development' };
  }

  const client = getResendClient();
  if (!client) {
    console.error('[EmailService] RESEND_API_KEY não configurada, email de verificação não enviado.');
    return { success: false, error: 'RESEND_API_KEY em falta' };
  }

  try {
    await client.emails.send({
      from: REMETENTE_PLATAFORMA,
      to: email,
      subject: 'O seu código de verificação',
      text: `Olá ${nomeCompleto},\n\nO seu código de verificação é: ${otp}\n\nVálido por 10 minutos.`,
    });
    return { success: true, mode: 'production' };
  } catch (error) {
    console.error('[Resend Error - Verificação]:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Envia email de reset de password
 */
async function sendPasswordResetEmail(email, resetLink, nomeUtilizador) {
  if (isDevelopment) {
    console.log('\n' + '='.repeat(60));
    console.log('📧 EMAIL DE RESET DE PASSWORD (DEV MODE)');
    console.log('='.repeat(60));
    console.log(`Para: ${email}`);
    console.log(`Utilizador: ${nomeUtilizador}`);
    console.log(`\n🔗 Link: ${resetLink}`);
    console.log(`⏰ Válido por 15 minutos`);
    console.log('='.repeat(60) + '\n');
    return { success: true, mode: 'development' };
  }

  const client = getResendClient();
  if (!client) {
    console.error('[EmailService] RESEND_API_KEY não configurada, email de reset não enviado.');
    return { success: false, error: 'RESEND_API_KEY em falta' };
  }

  try {
    await client.emails.send({
      from: REMETENTE_PLATAFORMA,
      to: email,
      subject: 'Repor a sua password',
      text: `Olá ${nomeUtilizador},\n\nUse este link para repor a sua password: ${resetLink}\n\nVálido por 15 minutos. Se não pediu isto, ignore este email.`,
    });
    return { success: true, mode: 'production' };
  } catch (error) {
    console.error('[Resend Error - Reset Password]:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Formata um valor em MT (sem casas decimais, separador de milhar pt-PT),
 * igual ao formatarMT do frontend (Precos.jsx), para os valores baterem
 * certo entre o que o cliente viu na landing page e o que recebe aqui.
 */
function formatarMT(valor) {
  return Math.round(Number(valor)).toLocaleString("pt-PT");
}

/**
 * Email de instruções de pagamento, enviado ao cliente depois de escolher
 * um plano pago na landing page (pagamento manual, ver
 * controllers/solicitacaoAcesso.controller.js). Não é um PDF, é só um
 * email com o valor, a referência do pedido e os dados bancários da
 * plataforma (PAGAMENTO_*, ver .env.example), para o cliente transferir
 * e responder com o comprovativo.
 */
async function sendInstrucoesPagamentoEmail(email, { nomeContacto, nomePlano, cicloFaturacao, valor, referencia }) {
  const cicloTexto = cicloFaturacao === "ANUAL" ? "anual" : "mensal";
  const dadosBancarios = [
    process.env.PAGAMENTO_BANCO_NOME && `Banco: ${process.env.PAGAMENTO_BANCO_NOME}`,
    process.env.PAGAMENTO_BANCO_NIB && `NIB: ${process.env.PAGAMENTO_BANCO_NIB}`,
    process.env.PAGAMENTO_BANCO_TITULAR && `Titular: ${process.env.PAGAMENTO_BANCO_TITULAR}`,
    process.env.PAGAMENTO_MPESA_NUMERO && `M-Pesa: ${process.env.PAGAMENTO_MPESA_NUMERO}`,
  ].filter(Boolean).join("\n");

  const corpo = `Olá ${nomeContacto},\n\n`
    + `Recebemos o teu pedido do plano ${nomePlano} (faturação ${cicloTexto}).\n\n`
    + `Valor a pagar: ${formatarMT(valor)} MT\n`
    + `Referência do pedido: ${referencia}\n\n`
    + (dadosBancarios ? `Dados para pagamento:\n${dadosBancarios}\n\n` : "")
    + `Depois de efetuares o pagamento, responde a este email com o comprovativo `
    + `(indicando a referência ${referencia}) para ativarmos a tua conta.\n\n`
    + `Qualquer dúvida, é só responder a este email.`;

  if (isDevelopment) {
    console.log('\n' + '='.repeat(60));
    console.log('📧 EMAIL DE INSTRUÇÕES DE PAGAMENTO (DEV MODE)');
    console.log('='.repeat(60));
    console.log(`Para: ${email}`);
    console.log(corpo);
    console.log('='.repeat(60) + '\n');
    return { success: true, mode: 'development' };
  }

  const client = getResendClient();
  if (!client) {
    console.error('[EmailService] RESEND_API_KEY não configurada, email de pagamento não enviado.');
    return { success: false, error: 'RESEND_API_KEY em falta' };
  }

  try {
    await client.emails.send({
      from: REMETENTE_PLATAFORMA,
      to: email,
      subject: `Instruções de pagamento — Plano ${nomePlano}`,
      text: corpo,
    });
    return { success: true, mode: 'production' };
  } catch (error) {
    console.error('[Resend Error - Instruções de Pagamento]:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Notifica o dono da plataforma (PLATFORM_OWNER_EMAIL) de um novo pedido
 * de plano pago, para acompanhar o pagamento manualmente. Sem
 * PLATFORM_OWNER_EMAIL configurado, não faz nada (não é um fluxo crítico
 * para o cliente, só uma conveniência interna).
 */
async function sendNotificacaoPedidoPlanoDono({ nomeEmpresa, nomeContacto, email, telefone, nomePlano, cicloFaturacao, valor, referencia }) {
  const destinatario = process.env.PLATFORM_OWNER_EMAIL;
  if (!destinatario) {
    console.warn('[EmailService] PLATFORM_OWNER_EMAIL não configurado, notificação de pedido de plano não enviada.');
    return { success: false, error: 'PLATFORM_OWNER_EMAIL em falta' };
  }

  const cicloTexto = cicloFaturacao === "ANUAL" ? "anual" : "mensal";
  const corpo = `Novo pedido de plano pago:\n\n`
    + `Empresa: ${nomeEmpresa}\n`
    + `Contacto: ${nomeContacto} (${email}${telefone ? `, ${telefone}` : ""})\n`
    + `Plano: ${nomePlano} (faturação ${cicloTexto})\n`
    + `Valor: ${formatarMT(valor)} MT\n`
    + `Referência: ${referencia}\n\n`
    + `Revê em /superadmin/solicitacoes-acesso quando o pagamento for confirmado.`;

  if (isDevelopment) {
    console.log('\n' + '='.repeat(60));
    console.log('📧 NOTIFICAÇÃO DE PEDIDO DE PLANO (DEV MODE)');
    console.log('='.repeat(60));
    console.log(`Para: ${destinatario}`);
    console.log(corpo);
    console.log('='.repeat(60) + '\n');
    return { success: true, mode: 'development' };
  }

  const client = getResendClient();
  if (!client) {
    console.error('[EmailService] RESEND_API_KEY não configurada, notificação de pedido de plano não enviada.');
    return { success: false, error: 'RESEND_API_KEY em falta' };
  }

  try {
    await client.emails.send({
      from: REMETENTE_PLATAFORMA,
      to: destinatario,
      subject: `Novo pedido de plano: ${nomeEmpresa} (${nomePlano})`,
      text: corpo,
    });
    return { success: true, mode: 'production' };
  } catch (error) {
    console.error('[Resend Error - Notificação de Pedido de Plano]:', error.message);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendInstrucoesPagamentoEmail,
  sendNotificacaoPedidoPlanoDono,
};
