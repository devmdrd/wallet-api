const express = require("express");
const router = express.Router();

const walletController = require("../controllers/walletController");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/balance", authMiddleware, walletController.getBalance);

router.post("/add-funds", authMiddleware, walletController.addFunds);

router.post("/withdraw", authMiddleware, walletController.withdrawFunds);

router.post("/transfer", authMiddleware, walletController.transferFunds);

module.exports = router;