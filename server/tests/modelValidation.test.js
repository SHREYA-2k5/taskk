const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const Task = require("../models/Task");
const User = require("../models/User");

const validationError = async (document) => {
  try {
    await document.validate();
    return null;
  } catch (error) {
    return error;
  }
};

test("task model requires a title and creator", async () => {
  const error = await validationError(new Task({}));

  assert.ok(error);
  assert.ok(error.errors.title);
  assert.ok(error.errors.createdBy);
});

test("task model rejects unsupported priority and status values", async () => {
  const task = new Task({
    title: "Write tests",
    createdBy: new mongoose.Types.ObjectId(),
    priority: "Urgent",
    status: "Blocked",
  });
  const error = await validationError(task);

  assert.ok(error);
  assert.ok(error.errors.priority);
  assert.ok(error.errors.status);
});

test("user model validates email and minimum password length", async () => {
  const user = new User({
    name: "TaskFlow User",
    email: "invalid-email",
    password: "short",
  });
  const error = await validationError(user);

  assert.ok(error);
  assert.ok(error.errors.email);
  assert.ok(error.errors.password);
});

test("user password is excluded from normal queries", () => {
  assert.equal(User.schema.path("password").options.select, false);
});
