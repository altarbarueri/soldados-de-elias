const db = require("../config/database");
const { v4: uuidv4 } = require("uuid");

function createUser(name, email, hashedPassword) {
  const id = uuidv4();
  const count = db.prepare("SELECT COUNT(*) as total FROM users").get().total;
  const role = count === 0 ? "admin" : "user";
  db.prepare(
    "INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)"
  ).run(id, name, email, hashedPassword, role);
  return { id, name, email, role };
}

function findByEmail(email) {
  return db.prepare("SELECT * FROM users WHERE email = ?").get(email);
}

function findById(id) {
  return db.prepare("SELECT id, name, email, role, created_at FROM users WHERE id = ?").get(id);
}

function listUsers() {
  return db.prepare("SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC").all();
}

module.exports = { createUser, findByEmail, findById, listUsers };
