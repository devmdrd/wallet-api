const sequelize = require("../../config/database");
const Wallet = require("../models/Wallet");
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const checkDailyLimit = require("../utils/checkDailyLimit");
const checkFraud = require("../utils/checkFraud");
const convertCurrency = require("../utils/currencyConverter");

const getBalance = async (req, res) => {
    try {
        const wallet = await Wallet.findOne({
            where: {
                userId: req.user.id,
            },
        });

        if (!wallet) {
            return res.status(404).json({
                success: false,
                message: "Wallet not found.",
            });
        }

        res.status(200).json({
            success: true,
            data: wallet,
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const addFunds = async (req, res) => {
    try {
        const { amount } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: "Enter a valid amount.",
            });
        }

        const wallet = await Wallet.findOne({
            where: {
                userId: req.user.id,
            },
        });

        if (!wallet) {
            return res.status(404).json({
                success: false,
                message: "Wallet not found.",
            });
        }

        wallet.balance = Number(wallet.balance) + Number(amount);

        await wallet.save();

        const isSuspicious = await checkFraud(
            wallet.id,
            amount
        );

        await Transaction.create({
            walletId: wallet.id,
            type: "CREDIT",
            amount,
            currency: wallet.currency,
            status: "SUCCESS",
            isSuspicious,
        });

        res.status(200).json({
            success: true,
            message: "Funds added successfully.",
            data: wallet,
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const withdrawFunds = async (req, res) => {
    try {
        const { amount } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: "Enter a valid amount.",
            });
        }

        const wallet = await Wallet.findOne({
            where: {
                userId: req.user.id,
            },
        });

        if (!wallet) {
            return res.status(404).json({
                success: false,
                message: "Wallet not found.",
            });
        }

        if (Number(wallet.balance) < Number(amount)) {
            return res.status(400).json({
                success: false,
                message: "Insufficient balance.",
            });
        }

        const isAllowed = await checkDailyLimit(wallet.id, amount);

        if (!isAllowed) {
            return res.status(400).json({
                success: false,
                message: "Daily transaction limit exceeded.",
            });
        }

        wallet.balance = Number(wallet.balance) - Number(amount);

        await wallet.save();

        const isSuspicious = await checkFraud(wallet.id, amount);

        await Transaction.create({
            walletId: wallet.id,
            type: "DEBIT",
            amount,
            currency: wallet.currency,
            status: "SUCCESS",
            isSuspicious,
        });

        res.status(200).json({
            success: true,
            message: "Amount withdrawn successfully.",
            data: wallet,
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const transferFunds = async (req, res) => {
    const dbTransaction = await sequelize.transaction();

    try {
        const { receiverEmail, amount } = req.body;

        if (!receiverEmail || !amount || Number(amount) <= 0) {
            await dbTransaction.rollback();

            return res.status(400).json({
                success: false,
                message: "Receiver email and valid amount are required.",
            });
        }

        const senderWallet = await Wallet.findOne({
            where: {
                userId: req.user.id,
            },
            transaction: dbTransaction,
        });

        if (!senderWallet) {
            await dbTransaction.rollback();

            return res.status(404).json({
                success: false,
                message: "Sender wallet not found.",
            });
        }

        if (Number(senderWallet.balance) < Number(amount)) {
            await dbTransaction.rollback();

            return res.status(400).json({
                success: false,
                message: "Insufficient balance.",
            });
        }

        const isAllowed = await checkDailyLimit(
            senderWallet.id,
            amount
        );

        if (!isAllowed) {
            await dbTransaction.rollback();

            return res.status(400).json({
                success: false,
                message: "Daily transaction limit exceeded.",
            });
        }

        const receiver = await User.findOne({
            where: {
                email: receiverEmail,
            },
        });

        if (!receiver) {
            await dbTransaction.rollback();

            return res.status(404).json({
                success: false,
                message: "Receiver not found.",
            });
        }

        if (receiver.id === req.user.id) {
            await dbTransaction.rollback();

            return res.status(400).json({
                success: false,
                message: "You cannot transfer funds to your own wallet.",
            });
        }

        const receiverWallet = await Wallet.findOne({
            where: {
                userId: receiver.id,
            },
            transaction: dbTransaction,
        });

        if (!receiverWallet) {
            await dbTransaction.rollback();

            return res.status(404).json({
                success: false,
                message: "Receiver wallet not found.",
            });
        }

        const isSuspicious = await checkFraud(
            senderWallet.id,
            amount
        );

        senderWallet.balance =
            Number(senderWallet.balance) - Number(amount);

        const convertedAmount = convertCurrency(
            Number(amount),
            senderWallet.currency,
            receiverWallet.currency
        );

        receiverWallet.balance =
            Number(receiverWallet.balance) + convertedAmount;

        await senderWallet.save({
            transaction: dbTransaction,
        });

        await receiverWallet.save({
            transaction: dbTransaction,
        });

        await Transaction.create(
            {
                walletId: senderWallet.id,
                receiverWalletId: receiverWallet.id,
                type: "TRANSFER",
                amount,
                currency: senderWallet.currency,
                status: "SUCCESS",
                isSuspicious,
            },
            {
                transaction: dbTransaction,
            }
        );

        await Transaction.create(
            {
                walletId: receiverWallet.id,
                receiverWalletId: senderWallet.id,
                type: "CREDIT",
                amount: convertedAmount,
                currency: receiverWallet.currency,
                status: "SUCCESS",
                isSuspicious: false,
            },
            {
                transaction: dbTransaction,
            }
        );

        await dbTransaction.commit();

        res.status(200).json({
            success: true,
            message: "Funds transferred successfully.",
        });

    } catch (error) {

        await dbTransaction.rollback();

        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

module.exports = {
    getBalance,
    addFunds,
    withdrawFunds,
    transferFunds,
};