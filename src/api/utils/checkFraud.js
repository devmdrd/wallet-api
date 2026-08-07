const { Op } = require("sequelize");
const Transaction = require("../models/Transaction");

const checkFraud = async (walletId, amount) => {
    if (Number(amount) >= 5000) {
        return true;
    }

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const recentTransactions = await Transaction.count({
        where: {
            walletId,
            createdAt: {
                [Op.gte]: fiveMinutesAgo,
            },
        },
    });

    return recentTransactions >= 3;
};

module.exports = checkFraud;