const express = require("express");
const cors = require("cors");
const mergeRoutes = require("./routes/mergeRoutes");
const logger = require("./logger");

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api", mergeRoutes);

// Start server
if (process.env.NODE_ENV !== "production") {
    app.listen(PORT, () => {
        logger.info(`Label Merge Backend running on port ${PORT}`);
    });
}

module.exports = app;
