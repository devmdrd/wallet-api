const { Op } = require("sequelize");
const Transaction = require("../models/Transaction");

const DAILY_LIMIT = 10000;

const checkDailyLimit = async (walletId, amount) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const transactions = await Transaction.findAll({
        where: {
            walletId,
            type: ["DEBIT", "TRANSFER"],
            status: "SUCCESS",
            createdAt: {
                [Op.gte]: today,
            },
        },
    });

    const totalAmount = transactions.reduce((sum, transaction) => {
        return sum + Number(transaction.amount);
    }, 0);

    return totalAmount + Number(amount) <= DAILY_LIMIT;
};

module.exports = checkDailyLimit;