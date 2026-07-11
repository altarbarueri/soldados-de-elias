const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const DB_DIR = path.join(__dirname, "../../data");
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

const db = new Database(path.join(DB_DIR, "soldados.db"));
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    created_at TEXT DEFAULT (datetime('now'))
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    conteudo TEXT NOT NULL,
    tema TEXT DEFAULT '',
    data_geracao TEXT DEFAULT (datetime('now')),
    status TEXT DEFAULT 'Pendente',
    idioma TEXT DEFAULT 'pt-BR',
    hashtag TEXT DEFAULT '',
    observacoes TEXT DEFAULT '',
    criado_por TEXT DEFAULT '',
    arquivada INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  )
`);

try {
  db.exec(`ALTER TABLE messages ADD COLUMN arquivada INTEGER DEFAULT 0`);
} catch (e) {
  if (!e.message.includes("duplicate column")) throw e;
}

module.exports = db;
