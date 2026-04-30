const express = require("express");
const { body } = require("express-validator");
const { createProject, getProjects } = require("../controllers/projectController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const validateRequest = require("../middleware/validateRequest");

const router = express.Router();

router.use(authMiddleware);

router.post(
  "/",
  roleMiddleware("admin"),
  [
    body("name").trim().notEmpty().withMessage("Project name is required"),
    body("description").optional().isString(),
    body("members").optional().isArray().withMessage("Members must be an array"),
  ],
  validateRequest,
  createProject
);

router.get("/", getProjects);

module.exports = router;
