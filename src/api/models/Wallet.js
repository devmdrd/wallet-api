const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");
const User = require("./User");

const Wallet = sequelize.define(
    "Wallet",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        balance: {
            type: DataTypes.DECIMAL(15, 2),
            defaultValue: 0.0,
        },
        currency: {
            type: DataTypes.ENUM("USD", "EUR", "INR"),
            defaultValue: "INR",
        },
    },
    {
        timestamps: true,
    }
);

User.hasOne(Wallet, {
    foreignKey: "userId",
    onDelete: "CASCADE",
});

Wallet.belongsTo(User, {
    foreignKey: "userId",
});

module.exports = Wallet;