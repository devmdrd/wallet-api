const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const authRoutes = require("./api/routes/authRoutes");
const walletRoutes = require("./api/routes/walletRoutes");
const transactionRoutes = require("./api/routes/transactionRoutes");

const rateLimiter = require("./api/middleware/rateLimiter");

dotenv.config();

const app = express();

app.use(express.json());

app.use(rateLimiter);

app.use(cors());
app.use(helmet());
app.use(morgan("dev"));

app.use("/api/auth", authRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/transactions", transactionRoutes);

module.exports = app;