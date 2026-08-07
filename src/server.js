require("dotenv").config();

const app = require("./app");
const sequelize = require("./config/database");

require("./api/models/User");
require("./api/models/Wallet");
require("./api/models/Transaction");

const PORT = process.env.PORT || 5000;

sequelize
    .authenticate()
    .then(() => {
        console.log("Database connected.");
        return sequelize.sync();
    })
    .then(() => {
        console.log("Database synchronized.");

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });