const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");
const Wallet = require("./Wallet");

const Transaction = sequelize.define(
    "Transaction",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        type: {
            type: DataTypes.ENUM("CREDIT", "DEBIT", "TRANSFER"),
            allowNull: false,
        },
        amount: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false,
        },
        currency: {
            type: DataTypes.ENUM("USD", "EUR", "INR"),
            defaultValue: "INR",
        },
        status: {
            type: DataTypes.ENUM("SUCCESS", "FAILED"),
            defaultValue: "SUCCESS",
        },
        isSuspicious: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        receiverWalletId: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
    },
    {
        timestamps: true,
    }
);

Wallet.hasMany(Transaction, {
    foreignKey: "walletId",
    onDelete: "CASCADE",
});

Transaction.belongsTo(Wallet, {
    foreignKey: "walletId",
});

module.exports = Transaction;