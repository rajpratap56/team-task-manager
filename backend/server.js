const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const taskRoutes = require("./routes/taskRoutes");
const authRoutes = require("./routes/authRoutes");
const projectRoutes = require("./routes/projectRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();


// ✅ CORS (Production + Public Access)
app.use(cors({
  origin: "*",   // allow all (best for your case)
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));


// ✅ Middleware
app.use(express.json());


// ✅ Routes
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/users", userRoutes);


// ✅ Root test route
app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});


// ✅ MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("MongoDB Connected ✅"))
.catch(err => {
  console.error("MongoDB ERROR ❌:", err.message);
  process.exit(1);
});


// ✅ Global Error Handler (important)
app.use((err, req, res, next) => {
  console.error("Server Error ❌:", err.stack);
  res.status(500).json({
    message: err.message || "Internal Server Error"
  });
});


// ✅ Start Server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});