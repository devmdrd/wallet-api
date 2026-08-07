const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");

const getTransactionHistory = async (req, res) => {
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

        const transactions = await Transaction.findAll({
            where: {
                walletId: wallet.id,
            },
            order: [["createdAt", "DESC"]],
        });

        res.status(200).json({
            success: true,
            count: transactions.length,
            data: transactions,
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

module.exports = {
    getTransactionHistory,
};