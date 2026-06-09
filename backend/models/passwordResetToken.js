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

    PasswordResetToken.associate = (models) => {
        PasswordResetToken.belongsTo(models.User, {
            foreingkey: "userId",
            as: "user",
        });
    };

    return PasswordResetToken;
};