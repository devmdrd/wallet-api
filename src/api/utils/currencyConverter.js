const exchangeRates = {
    INR: {
        INR: 1,
        USD: 0.012,
        EUR: 0.011,
    },
    USD: {
        USD: 1,
        INR: 83,
        EUR: 0.92,
    },
    EUR: {
        EUR: 1,
        INR: 90,
        USD: 1.09,
    },
};

const convertCurrency = (amount, fromCurrency, toCurrency) => {

    if (fromCurrency === toCurrency) {
        return Number(amount);
    }

    const rate = exchangeRates[fromCurrency][toCurrency];

    return Number((amount * rate).toFixed(2));
};

module.exports = convertCurrency;