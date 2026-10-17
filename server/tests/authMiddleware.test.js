const assert = require("node:assert/strict");
const { after, before, test } = require("node:test");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { protect } = require("../middleware/authMiddleware");

const originalSecret = process.env.JWT_SECRET;

before(() => {
  process.env.JWT_SECRET = "middleware-test-secret";
});

after(() => {
  if (originalSecret === undefined) {
    delete process.env.JWT_SECRET;
  } else {
    process.env.JWT_SECRET = originalSecret;
  }
});

const createResponse = () => ({
  statusCode: 200,
  body: null,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
});

test("protect rejects a missing bearer token", async () => {
  const response = createResponse();
  let passedError;

  await protect({ headers: {} }, response, (error) => {
    passedError = error;
  });

  assert.equal(response.statusCode, 401);
  assert.deepEqual(response.body, { message: "Authentication required" });
  assert.equal(passedError, undefined);
});

test("protect rejects an invalid token", async () => {
  const response = createResponse();
  let passedError;

  await protect({ headers: { authorization: "Bearer invalid-token" } }, response, (error) => {
    passedError = error;
  });

  assert.equal(response.statusCode, 401);
  assert.deepEqual(response.body, { message: "Invalid or expired token" });
  assert.equal(passedError, undefined);
});

test("protect forwards user lookup failures as server errors", async () => {
  const originalFindById = User.findById;
  const databaseError = new Error("database unavailable");
  User.findById = async () => {
    throw databaseError;
  };

  try {
    const response = createResponse();
    let passedError;
    const token = jwt.sign({ id: "507f1f77bcf86cd799439011" }, process.env.JWT_SECRET);

    await protect(
      { headers: { authorization: `Bearer ${token}` } },
      response,
      (error) => {
        passedError = error;
      }
    );

    assert.equal(passedError, databaseError);
    assert.equal(response.statusCode, 200);
    assert.equal(response.body, null);
  } finally {
    User.findById = originalFindById;
  }
});
