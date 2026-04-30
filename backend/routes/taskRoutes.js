const express = require("express");
const router = express.Router();
const {
  createTask,
  deleteTask,
  getDashboardStats,
  getTasks,
  taskValidation,
  updateTask,
} = require("../controllers/taskController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const validateRequest = require("../middleware/validateRequest");

router.use(authMiddleware);

router.post("/", roleMiddleware("admin"), taskValidation().create, validateRequest, createTask);

router.get("/", getTasks);
router.get("/dashboard/stats", getDashboardStats);

router.put("/:id", taskValidation().update, validateRequest, updateTask);
router.delete("/:id", deleteTask);

module.exports = router;