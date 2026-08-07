const bcrypt = require("bcrypt");

const User = require("../models/User");
const Wallet = require("../models/Wallet");
const generateToken = require("../utils/generateToken");

const register = async (req, res) => {
    try {
        const { name, email, password, defaultCurrency } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, email and password are required.",
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters.",
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: "Invalid email format.",
            });
        }

        const allowedCurrencies = ["USD", "EUR", "INR"];

        if (defaultCurrency && !allowedCurrencies.includes(defaultCurrency)) {
            return res.status(400).json({
                success: false,
                message: "Invalid currency.",
            });
        }

        const existingUser = await User.findOne({
            where: { email },
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "Email already exists.",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            defaultCurrency: defaultCurrency || "INR",
        });

        await Wallet.create({
            userId: user.id,
            currency: defaultCurrency || "INR",
        });

        res.status(201).json({
            success: true,
            message: "User registered successfully.",
            data: {
                id: user.id,
                name: user.name,
                email: user.email,
                defaultCurrency: user.defaultCurrency,
            },
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};


const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required.",
            });
        }

        const user = await User.findOne({
            where: { email },
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password.",
            });
        }

        const isMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password.",
            });
        }

        const token = generateToken(user.id);

        res.status(200).json({
            success: true,
            message: "Login successful.",
            data: {
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    defaultCurrency: user.defaultCurrency,
                },
            },
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};


const getProfile = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: {
                exclude: ["password"],
            },
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found.",
            });
        }

        res.status(200).json({
            success: true,
            data: user,
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};


module.exports = {
    register,
    login,
    getProfile,
};