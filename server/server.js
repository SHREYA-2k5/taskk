 
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const taskRoutes = require("./routes/taskRoutes");
const { requireJsonObject } = require("./middleware/requireJsonObject");
const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
  })
);

app.use(express.json());
app.use((req, res, next) => {
  if (["POST", "PUT", "PATCH"].includes(req.method)) {
    return requireJsonObject(req, res, next);
  }

  return next();
});

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Task & Team Management API is running",
  });
});

app.use("/", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/users", require("./routes/userRoutes"));

app.use((req, res) => {
  res.status(404).json({
    message: "Resource not found",
  });
});

app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  if (error.type === "entity.parse.failed") {
    return res.status(400).json({
      message: "Request body must contain valid JSON",
    });
  }

  console.error("Unhandled API error:", error.message);
  return res.status(500).json({
    message: "An unexpected server error occurred",
  });
});

const startServer = async () => {
  for (const variable of ["MONGODB_URI", "JWT_SECRET"]) {
    if (!process.env[variable]) {
      throw new Error(`Missing required environment variable: ${variable}`);
    }
  }

  await connectDB();

  const PORT = process.env.PORT || 5000;

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
