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

  Rotação: cada troca em POST /auth/refresh revoga o token usado e emite
  um novo. Todos os tokens que descendem do mesmo login partilham o
  familiaId, o que permite a deteção de reutilização: se um token já
  gasto reaparecer, foi copiado, e a família inteira cai de uma vez.
  Ver refreshAccessToken em controllers/auth.controller.js.
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

      // Todos os tokens nascidos do mesmo login (o do login e os que a
      // rotação emite a seguir) partilham este valor. É o que se revoga
      // em bloco quando se deteta reutilização.
      familiaId: {
        type: DataTypes.STRING(64),
        allowNull: false,
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
      indexes: [{ fields: ["familia_id"] }],
    }
  );

  return RefreshToken;
};
