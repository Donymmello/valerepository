const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const EmailVerificationToken = sequelize.define(
    "EmailVerificationToken",
    {
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },

      otp: {
        type: DataTypes.STRING(6),
        allowNull: false,
      },

      expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },

      verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },

      // Dados temporários do usuário durante registro
      temporaryData: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "Armazena dados do formulário de registro até verificação",
      },
    },
    {
      tableName: "email_verification_tokens",
    }
  );

  EmailVerificationToken.associate = (models) => {
    EmailVerificationToken.belongsTo(models.User, {
      foreignKey: "userId",
      as: "user",
      allowNull: true,
    });
  };

  return EmailVerificationToken;
};
