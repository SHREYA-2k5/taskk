const User = require("../models/User");

const getUsers = async (req, res) => {
  try {
    const users = await User.find({})
      .select("_id name email")
      .sort({ name: 1 });

    return res.status(200).json({
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("Get users error:", error.message);

    return res.status(500).json({
      message: "Unable to retrieve users",
    });
  }
};

module.exports = { getUsers };
