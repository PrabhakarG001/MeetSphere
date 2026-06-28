import express from "express";
import { createServer } from "node:http";
import mongoose from "mongoose";
import connectToSocket from "./controllers/socketManager.js";
import cors from "cors";
import userRoutes from "./controllers/routes/users.routes.js";


const app = express();
const server = createServer(app);
connectToSocket(server);

const PORT = Number(process.env.PORT) || 8000;
const MONGODB_URI =
    process.env.MONGODB_URI ||
    process.env.MONGO_URI ||
    process.env.MONGODB_URL ||
    process.env.DATABASE_URL ||
    "";
const DB_RETRY_MS = Number(process.env.DB_RETRY_MS) || 10000;
const MONGO_CONNECT_OPTIONS = {
    readPreference: "secondaryPreferred",
    serverSelectionTimeoutMS: 5000
};

let isDatabaseConnected = false;
let databaseError = "";

mongoose.set("bufferCommands", false);

app.use(cors());
app.use(express.json({limit: "40kb"}));
app.use(express.urlencoded({limit:"40kb", extended:true}));

app.get("/health", (_req, res) => {
    return res.status(200).json({
        ok: true,
        database: {
            connected: isDatabaseConnected,
            state: mongoose.connection.readyState,
            error: isDatabaseConnected ? null : databaseError || null
        }
    });
});

app.use((req, res, next) => {
    if (isDatabaseConnected) {
        return next();
    }

    return res.status(503).json({
        message: "Database unavailable. Set MONGODB_URI and try again shortly.",
        database: {
            connected: false,
            error: databaseError || "Database connection not ready"
        }
    });
});

app.use("/users", userRoutes);
app.use("/api/v1/users", userRoutes);

const connectDatabase = async () => {
    if (!MONGODB_URI) {
        isDatabaseConnected = false;
        databaseError = "MONGODB_URI is not set";
        console.error("MongoDB URI missing. Set MONGODB_URI in environment variables.");
        setTimeout(connectDatabase, DB_RETRY_MS);
        return;
    }

    try {
        const connectionDb = await mongoose.connect(MONGODB_URI, MONGO_CONNECT_OPTIONS);
        isDatabaseConnected = true;
        databaseError = "";
        console.log(`MONGO connected host: ${connectionDb.connection.host}`);
    } catch (error) {
        isDatabaseConnected = false;
        databaseError = error?.message || "Unknown MongoDB error";
        console.error(`MongoDB connection failed: ${databaseError}`);
        setTimeout(connectDatabase, DB_RETRY_MS);
    }
};

mongoose.connection.on("disconnected", () => {
    isDatabaseConnected = false;
    console.warn("MongoDB disconnected.");
});

mongoose.connection.on("reconnected", () => {
    isDatabaseConnected = true;
    databaseError = "";
    console.log("MongoDB reconnected.");
});

server.on("error", (error) => {
    if (error?.code === "EADDRINUSE") {
        console.error(
            `Port ${PORT} is already in use. Stop the process using this port or set a different PORT value.`
        );
        process.exitCode = 1;
        return;
    }

    console.error("Server failed to start:", error);
    process.exitCode = 1;
});

server.listen(PORT, () => {
    console.log(`LISTENING ON PORT ${PORT}`);
    connectDatabase();
});
