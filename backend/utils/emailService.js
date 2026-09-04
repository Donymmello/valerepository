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

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
};
