const mongoose = require("mongoose");
const Task = require("../models/Task");
const Project = require("../models/Project");

const canAccessTask = (task, userId, role) => {
  if (role === "admin") {
    return true;
  }
  return task.assignedTo && String(task.assignedTo._id || task.assignedTo) === String(userId);
};

const createTask = async (req, res) => {
  const payload = req.body;

  if (payload.projectId) {
    const project = await Project.findById(payload.projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
  }

  const task = await Task.create({
    ...payload,
    completed: payload.status ? payload.status === "done" : Boolean(payload.completed),
  });

  return res.status(201).json(task);
};

const getTasks = async (req, res) => {
  const query = req.user.role === "admin" ? {} : { assignedTo: req.user._id };
  const tasks = await Task.find(query)
    .populate("assignedTo", "name email role")
    .populate("projectId", "name description")
    .sort({ createdAt: -1 });
  return res.json(tasks);
};

const updateTask = async (req, res) => {
  const task = await Task.findById(req.params.id).populate("assignedTo", "name email role");
  if (!task) {
    return res.status(404).json({ message: "Task not found" });
  }

  if (!canAccessTask(task, req.user._id, req.user.role)) {
    return res.status(403).json({ message: "Forbidden: cannot modify this task" });
  }

  const updatePayload = { ...req.body };
  if (req.user.role !== "admin") {
    const memberAllowedFields = ["status", "completed", "description", "dueDate"];
    Object.keys(updatePayload).forEach((key) => {
      if (!memberAllowedFields.includes(key)) {
        delete updatePayload[key];
      }
    });
  }

  if (updatePayload.status) {
    updatePayload.completed = updatePayload.status === "done";
  }

  const updatedTask = await Task.findByIdAndUpdate(req.params.id, updatePayload, {
    new: true,
  })
    .populate("assignedTo", "name email role")
    .populate("projectId", "name description");

  return res.json(updatedTask);
};

const deleteTask = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Only admin can delete tasks" });
  }

  const deleted = await Task.findByIdAndDelete(req.params.id);
  if (!deleted) {
    return res.status(404).json({ message: "Task not found" });
  }

  return res.json({ message: "Task deleted" });
};

const getDashboardStats = async (req, res) => {
  const query = req.user.role === "admin" ? {} : { assignedTo: req.user._id };
  const now = new Date();

  const [total, completed, pending, overdue] = await Promise.all([
    Task.countDocuments(query),
    Task.countDocuments({ ...query, status: "done" }),
    Task.countDocuments({
      ...query,
      status: { $in: ["todo", "in-progress"] },
    }),
    Task.countDocuments({
      ...query,
      status: { $in: ["todo", "in-progress"] },
      dueDate: { $lt: now },
    }),
  ]);

  return res.json({
    totalTasks: total,
    completedTasks: completed,
    pendingTasks: pending,
    overdueTasks: overdue,
  });
};

const taskValidation = () => {
  const { body, param } = require("express-validator");

  return {
    create: [
      body("title").trim().notEmpty().withMessage("Task title is required"),
      body("status")
        .optional()
        .isIn(["todo", "in-progress", "done"])
        .withMessage("Invalid status"),
      body("assignedTo")
        .optional()
        .custom((value) => mongoose.Types.ObjectId.isValid(value))
        .withMessage("assignedTo must be a valid user id"),
      body("projectId")
        .optional()
        .custom((value) => mongoose.Types.ObjectId.isValid(value))
        .withMessage("projectId must be a valid project id"),
      body("dueDate").optional().isISO8601().withMessage("dueDate must be a valid date"),
    ],
    update: [
      param("id").isMongoId().withMessage("Invalid task id"),
      body("status")
        .optional()
        .isIn(["todo", "in-progress", "done"])
        .withMessage("Invalid status"),
      body("dueDate").optional().isISO8601().withMessage("dueDate must be a valid date"),
    ],
  };
};

module.exports = {
  createTask,
  getTasks,
  updateTask,
  deleteTask,
  getDashboardStats,
  taskValidation,
};
