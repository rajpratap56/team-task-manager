const Project = require("../models/Project");

const createProject = async (req, res) => {
  const { name, description, members = [] } = req.body;
  const uniqueMembers = [...new Set(members.map(String))];

  if (!uniqueMembers.includes(String(req.user._id))) {
    uniqueMembers.push(String(req.user._id));
  }

  const project = await Project.create({
    name,
    description,
    members: uniqueMembers,
    createdBy: req.user._id,
  });

  return res.status(201).json(project);
};

const getProjects = async (req, res) => {
  const query =
    req.user.role === "admin"
      ? { createdBy: req.user._id }
      : { members: req.user._id };

  const projects = await Project.find(query)
    .populate("members", "name email role")
    .populate("createdBy", "name email role")
    .sort({ createdAt: -1 });

  return res.json(projects);
};

module.exports = {
  createProject,
  getProjects,
};
