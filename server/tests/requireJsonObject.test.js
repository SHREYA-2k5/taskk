const assert = require("node:assert/strict");
const test = require("node:test");
const { requireJsonObject } = require("../middleware/requireJsonObject");

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

test("requireJsonObject accepts an object body", () => {
  const response = createResponse();
  let nextCalled = false;

  requireJsonObject({ body: { title: "Task" } }, response, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(response.statusCode, 200);
  assert.equal(response.body, null);
});

test("requireJsonObject rejects null, arrays, and missing bodies", () => {
  for (const body of [null, [], undefined]) {
    const response = createResponse();
    let nextCalled = false;

    requireJsonObject({ body }, response, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, false);
    assert.equal(response.statusCode, 400);
    assert.deepEqual(response.body, {
      message: "Request body must be a JSON object",
    });
  }
});
