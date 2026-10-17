import test from "node:test";
import assert from "node:assert/strict";
import {
  clearAuthSession,
  getAuthToken,
  getStoredUser,
  saveAuthSession,
} from "../src/utils/authStorage.js";

class MemoryStorage {
  values = new Map();

  getItem(key) {
    return this.values.get(key) ?? null;
  }

  setItem(key, value) {
    this.values.set(key, String(value));
  }

  removeItem(key) {
    this.values.delete(key);
  }
}

const localStorage = new MemoryStorage();
const sessionStorage = new MemoryStorage();
globalThis.window = { localStorage, sessionStorage };

test.beforeEach(() => {
  clearAuthSession();
});

test("Remember Me stores the session persistently", () => {
  const user = { id: "user-1", email: "user@example.com" };
  saveAuthSession({ token: "persistent-token", user }, true);

  assert.equal(localStorage.getItem("token"), "persistent-token");
  assert.equal(sessionStorage.getItem("token"), null);
  assert.deepEqual(getStoredUser(), user);
  assert.equal(getAuthToken(), "persistent-token");
});

test("unchecked Remember Me limits the session to session storage", () => {
  const user = { id: "user-2", email: "user@example.com" };
  saveAuthSession({ token: "temporary-token", user });

  assert.equal(localStorage.getItem("token"), null);
  assert.equal(sessionStorage.getItem("token"), "temporary-token");
  assert.deepEqual(getStoredUser(), user);
});

test("logout clears both persistent and temporary credentials", () => {
  localStorage.setItem("token", "persistent-token");
  localStorage.setItem("user", JSON.stringify({ id: "user-1" }));
  sessionStorage.setItem("token", "temporary-token");
  sessionStorage.setItem("user", JSON.stringify({ id: "user-2" }));

  clearAuthSession();

  assert.equal(getAuthToken(), null);
  assert.equal(getStoredUser(), null);
});

test("corrupt saved user data is discarded", () => {
  localStorage.setItem("token", "stale-token");
  localStorage.setItem("user", "{not json");

  assert.equal(getStoredUser(), null);
  assert.equal(localStorage.getItem("token"), null);
});
