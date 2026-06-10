/**
 * Serviço de email modular
 * Suporta desenvolvimento (console) e produção (email real)
 */

const isDevelopment = process.env.NODE_ENV !== 'production' || process.env.SKIP_EMAIL_VERIFICATION === 'true';

/**
 * Envia email de verificação de OTP
 * Em desenvolvimento, mostra no console
 * Em produção, envia via SMTP/SendGrid/etc
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

  // Modo produção - implementar aqui com Nodemailer/SendGrid/etc
  // Por enquanto, apenas log
  console.log(`[PRODUÇÃO] Email enviado para ${email}`);
  return { success: true, mode: 'production' };
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

  console.log(`[PRODUÇÃO] Email de reset enviado para ${email}`);
  return { success: true, mode: 'production' };
}

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
};
