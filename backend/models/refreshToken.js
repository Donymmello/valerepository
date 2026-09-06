const { DataTypes } = require("sequelize");

/*
  Refresh token do fluxo de sessão (ver auth.controller.js: login,
  bootstrapAdmin, registerMutuario, verifyOTPAndRegister emitem um par
  token/refreshToken; POST /auth/refresh troca um refreshToken válido por
  um novo access token, sem pedir password outra vez).

  userId é criado pela associação em models/index.js (User.hasMany /
  RefreshToken.belongsTo), não é declarado aqui à mão. Ao contrário de
  PasswordResetToken/EmailVerificationToken (cujo .associate nunca é
  chamado por ninguém, ver models/index.js — essas duas tabelas não têm
  mesmo user_id na BD), a associação deste modelo é registada
  diretamente em index.js, o único sítio que realmente funciona neste
  projeto.

  ponytail: sem rotação a cada refresh (o mesmo refreshToken serve até
  expirar ou ser revogado), mais simples e menos superfície de corrida
  entre pedidos concorrentes. Se um dia precisares de detetar reutilização
  de um token roubado, rotação com revogação em cascata é o próximo passo.
*/
module.exports = (sequelize) => {
  const RefreshToken = sequelize.define(
    "RefreshToken",
    {
      token: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },

      expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },

      revoked: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: "refresh_tokens",
      underscored: true,
    }
  );

  return RefreshToken;
};
