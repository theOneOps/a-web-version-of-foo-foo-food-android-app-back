const mongoose = require("mongoose");
const initializeDatabase = require("../utils/initializeData"); // Import the initialization function

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB connected");

        // Initialize the database with initial data
        await initializeDatabase(); // Call the function after successful connection
    } catch (error) {
        console.error("MongoDB connection error:", error);
        process.exit(1); // Stop the application if the connection fails
    }
};

module.exports = connectDB;
