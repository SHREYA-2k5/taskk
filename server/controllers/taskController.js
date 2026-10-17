
const Task = require("../models/Task");
const User = require("../models/User");

// 1. Create a task
const createTask = async (req, res) => {
  try {
    const {
      title,
      description,
      priority,
      status,
      dueDate,
      assignedTo,
    } = req.body;

    if (typeof title !== "string" || !title.trim()) {
      return res.status(400).json({
        message: "Task title is required",
      });
    }

    // Verify the assignee exists, if one was provided
    if (assignedTo) {
      const userExists = await User.findById(assignedTo);

      if (!userExists) {
        return res.status(400).json({
          message: "Assigned user does not exist",
        });
      }
    }

    const task = await Task.create({
      title: title.trim(),
      description,
      priority,
      status,
      dueDate: dueDate || undefined,
      assignedTo: assignedTo || null,
      createdBy: req.user._id,
    });

    return res.status(201).json({
      message: "Task created successfully",
      task,
    });
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({
        message: error.message,
      });
    }

    console.error("Create task error:", error.message);

    return res.status(500).json({
      message: "Unable to create task",
    });
  }
};

// 2. Get tasks created by or assigned to the logged-in user
const getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({
      $or: [
        { createdBy: req.user._id },
        { assignedTo: req.user._id },
      ],
    })
      .populate("createdBy", "name email")
      .populate("assignedTo", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: tasks.length,
      tasks,
    });
  } catch (error) {
    console.error("Get tasks error:", error.message);

    return res.status(500).json({
      message: "Unable to retrieve tasks",
    });
  }
};

// 3. Get a single task
const getTaskById = async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      $or: [
        { createdBy: req.user._id },
        { assignedTo: req.user._id },
      ],
    })
      .populate("createdBy", "name email")
      .populate("assignedTo", "name email");

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    return res.status(200).json({ task });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid task ID",
      });
    }

    return res.status(500).json({
      message: "Unable to retrieve task",
    });
  }
};

// 4. Update a task (creator only)
const updateTask = async (req, res) => {
  try {
    const allowedFields = [
      "title",
      "description",
      "priority",
      "status",
      "dueDate",
      "assignedTo",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (updates.title !== undefined) {
      if (
        typeof updates.title !== "string" ||
        !updates.title.trim()
      ) {
        return res.status(400).json({
          message: "Task title cannot be empty",
        });
      }

      updates.title = updates.title.trim();
    }

    if (updates.assignedTo) {
      const userExists = await User.findById(updates.assignedTo);

      if (!userExists) {
        return res.status(400).json({
          message: "Assigned user does not exist",
        });
      }
    }

    if (updates.assignedTo === "") {
      updates.assignedTo = null;
    }

    if (updates.dueDate === "") {
      updates.dueDate = null;
    }

    const task = await Task.findOneAndUpdate(
      {
        _id: req.params.id,
        createdBy: req.user._id,
      },
      updates,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!task) {
      return res.status(404).json({
        message: "Task not found or you cannot edit it",
      });
    }

    return res.status(200).json({
      message: "Task updated successfully",
      task,
    });
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Unable to update task",
    });
  }
};

// 5. Delete a task (creator only)
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user._id,
    });

    if (!task) {
      return res.status(404).json({
        message: "Task not found or you cannot delete it",
      });
    }

    return res.status(200).json({
      message: "Task deleted successfully",
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid task ID",
      });
    }

    return res.status(500).json({
      message: "Unable to delete task",
    });
  }
};

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
};
