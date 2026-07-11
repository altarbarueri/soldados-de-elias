const fs = require("fs");
const path = require("path");

const LOG_DIR = path.join(__dirname, "../../logs");

if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

function getLogFile() {
  const date = new Date().toISOString().split("T")[0];
  return path.join(LOG_DIR, `audit-${date}.log`);
}

function logEntry(level, action, details) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    action,
    details,
  };

  const line = JSON.stringify(entry) + "\n";
  fs.appendFileSync(getLogFile(), line, "utf8");

  if (process.env.NODE_ENV !== "production") {
    console.log(`[${level}] ${action}:`, details);
  }

  return entry;
}

function geracao(quantidade, usuario, config) {
  return logEntry("INFO", "GERACAO", { quantidade, usuario, config });
}

function aprovacao(mensagemId, usuario, status) {
  return logEntry("INFO", "APROVACAO", { mensagemId, usuario, status });
}

function edicao(mensagemId, usuario, camposAlterados) {
  return logEntry("INFO", "EDICAO", { mensagemId, usuario, camposAlterados });
}

function salvamento(mensagemId, usuario, planilha) {
  return logEntry("INFO", "SALVAMENTO", { mensagemId, usuario, planilha });
}

function remocao(mensagemId, usuario) {
  return logEntry("INFO", "REMOCAO", { mensagemId, usuario });
}

function erro(origem, mensagem, dados) {
  return logEntry("ERROR", `ERRO_${origem}`, { mensagem, dados });
}

module.exports = { geracao, aprovacao, edicao, salvamento, remocao, erro, logEntry };
