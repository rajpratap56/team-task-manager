const User = require("../models/User");

const getUsers = async (req, res) => {
  const users = await User.find().select("-password").sort({ createdAt: -1 });
  return res.json(users);
};

module.exports = {
  getUsers,
};
