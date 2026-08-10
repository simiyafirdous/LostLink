const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

// Boot check for environment variables
if (!process.env.GROQ_API_KEY) {
  console.warn("⚠️  WARNING: GROQ_API_KEY is not defined in environment variables. Groq Vision features will run in fallback mode.");
}

const connectDatabase = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const itemRoutes = require("./routes/itemRoutes");
const matchRoutes = require("./routes/match");
const claimRoutes = require("./routes/claimRoutes");
const adminRoutes = require("./routes/adminRoutes");
const envRoutes = require("./routes/envRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const lostItemRoutes = require("./routes/lostItemRoutes");
const foundItemRoutes = require("./routes/foundItemRoutes");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/api/health", (req, res) => {
  res.json({ message: "LostFound+ AI API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/items", matchRoutes); // mounts /api/items/:id/matches, /api/items/:id/reanalyze, /api/items/:id/verify-questions
app.use("/api/items", itemRoutes);
app.use("/api/claims", claimRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin/env", envRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/lost", lostItemRoutes);
app.use("/api/found", foundItemRoutes);

app.use(notFound);
app.use(errorHandler);

const startServer = async () => {
  try {
    await connectDatabase();
    app.listen(PORT, () => {
      console.log(`LostFound+ server started on port ${PORT}`);
    });
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

startServer();
