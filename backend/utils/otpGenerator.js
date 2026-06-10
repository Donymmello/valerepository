/**
 * Gera um código OTP de 6 dígitos
 */
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Gera uma data de expiração (padrão: 10 minutos)
 */
function getExpirationTime(minutes = 10) {
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + minutes);
  return expiresAt;
}

module.exports = {
  generateOTP,
  getExpirationTime,
};
