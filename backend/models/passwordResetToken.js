const { DataTypes} = require("sequelize");

module.exports = (sequelize) => {
    const PasswordResetToken = sequelize.define(
        "PasswordResetToken",
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

            used: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
            },
        },
        {
            tableName: "password_reset_tokens",
        }
    );

    // A associação real fica em models/index.js (o único sítio deste
    // projeto que a invoca de verdade). Este .associate() aqui nunca era
    // chamado por ninguém, ficava a fingir que existia relação com User
    // enquanto a coluna user_id nem existia na tabela — ver o comentário
    // em models/index.js junto da associação real.

    return PasswordResetToken;
};