const db = require("../config/database");

const DEFAULT_HEADERS = [
  "ID único", "Conteúdo da mensagem", "Tema",
  "Data e hora de geração", "Status", "Idioma",
  "Hashtag", "Observações",
];

async function ensureTable() {
  const row = db.prepare("SELECT COUNT(*) as total FROM messages").get();
  return { total: row.total };
}

function getPeriodoRange(periodo) {
  const now = new Date();
  const inicio = new Date(now);

  switch (periodo) {
    case "semana": {
      inicio.setDate(inicio.getDate() - 7);
      break;
    }
    case "mes": {
      inicio.setMonth(inicio.getMonth() - 1);
      break;
    }
    case "mes-passado": {
      inicio.setMonth(inicio.getMonth(), 1);
      inicio.setMonth(inicio.getMonth() - 1, 1);
      const fim = new Date(inicio.getFullYear(), inicio.getMonth() + 1, 0, 23, 59, 59);
      return { dataInicio: inicio.toISOString().split("T")[0], dataFim: fim.toISOString().split("T")[0] };
    }
    case "ano": {
      inicio.setFullYear(inicio.getFullYear() - 1);
      break;
    }
    default:
      return {};
  }

  return { dataInicio: inicio.toISOString().split("T")[0], dataFim: now.toISOString().split("T")[0] };
}

async function salvarMensagens(mensagens) {
  const stmt = db.prepare(`
    INSERT INTO messages (id, conteudo, tema, data_geracao, status, idioma, hashtag, observacoes, criado_por)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((items) => {
    for (const m of items) {
      stmt.run(
        m.id,
        m.conteudo,
        m.tema || "",
        m.dataGeracao || new Date().toISOString(),
        m.status || "Aprovada",
        m.idioma || "",
        m.hashtag || "",
        m.observacoes || "",
        m.criadoPor || ""
      );
    }
  });

  insertMany(mensagens);
  return { totalInserido: mensagens.length };
}

async function buscarMensagens(filtros = {}) {
  let sql = "SELECT * FROM messages WHERE 1=1";
  const params = [];

  if (filtros.status) {
    sql += " AND status = ?";
    params.push(filtros.status);
  }
  if (filtros.tema) {
    sql += " AND LOWER(tema) LIKE ?";
    params.push(`%${filtros.tema.toLowerCase()}%`);
  }
  if (filtros.busca) {
    sql += " AND LOWER(conteudo) LIKE ?";
    params.push(`%${filtros.busca.toLowerCase()}%`);
  }
  if (filtros.dataInicio) {
    sql += " AND data_geracao >= ?";
    params.push(filtros.dataInicio);
  }
  if (filtros.dataFim) {
    sql += " AND data_geracao <= ?";
    params.push(filtros.dataFim);
  }

  sql += " ORDER BY created_at DESC";

  const rows = db.prepare(sql).all(...params);
  return rows.map(normalizar);
}

function normalizar(row) {
  return {
    id: row.id,
    conteudo: row.conteudo,
    tema: row.tema,
    dataGeracao: row.data_geracao,
    status: row.status,
    idioma: row.idioma,
    hashtag: row.hashtag,
    observacoes: row.observacoes,
    arquivada: !!row.arquivada,
  };
}

async function arquivarMensagem(id) {
  const result = db.prepare("UPDATE messages SET arquivada = 1 WHERE id = ?").run(id);
  return result.changes > 0;
}

async function arquivarMensagens(ids) {
  const placeholders = ids.map(() => "?").join(",");
  const result = db.prepare(`UPDATE messages SET arquivada = 1 WHERE id IN (${placeholders})`).run(...ids);
  return result.changes;
}

async function desarquivarMensagem(id) {
  const result = db.prepare("UPDATE messages SET arquivada = 0 WHERE id = ?").run(id);
  return result.changes > 0;
}

async function desarquivarMensagens(ids) {
  const placeholders = ids.map(() => "?").join(",");
  const result = db.prepare(`UPDATE messages SET arquivada = 0 WHERE id IN (${placeholders})`).run(...ids);
  return result.changes;
}

async function deletarMensagem(id) {
  const result = db.prepare("DELETE FROM messages WHERE id = ?").run(id);
  return result.changes > 0;
}

async function deletarMensagens(ids) {
  const placeholders = ids.map(() => "?").join(",");
  const result = db.prepare(`DELETE FROM messages WHERE id IN (${placeholders})`).run(...ids);
  return result.changes;
}

async function deletarPorHashtag(hashtags) {
  const tags = hashtags.split(",").map((t) => t.trim().replace(/^#/, "")).filter(Boolean);
  if (tags.length === 0) return 0;
  const conditions = tags.map(() => "hashtag LIKE ?");
  const params = tags.map((t) => `%${t}%`);
  const result = db.prepare(`DELETE FROM messages WHERE ${conditions.join(" OR ")}`).run(...params);
  return result.changes;
}

async function deletarPorPeriodo(dataInicio, dataFim) {
  let sql = "DELETE FROM messages WHERE 1=1";
  const params = [];
  if (dataInicio) { sql += " AND data_geracao >= ?"; params.push(dataInicio); }
  if (dataFim) { sql += " AND data_geracao <= ?"; params.push(dataFim); }
  if (params.length === 0) return 0;
  const result = db.prepare(sql).run(...params);
  return result.changes;
}

async function deletarTodas() {
  const result = db.prepare("DELETE FROM messages").run();
  return result.changes;
}

async function getStats() {
  const total = db.prepare("SELECT COUNT(*) as valor FROM messages").get().valor;
  const aprovadas = db.prepare("SELECT COUNT(*) as valor FROM messages WHERE status = 'Aprovada'").get().valor;
  const pendentes = db.prepare("SELECT COUNT(*) as valor FROM messages WHERE status = 'Pendente'").get().valor;
  const rejeitadas = db.prepare("SELECT COUNT(*) as valor FROM messages WHERE status = 'Rejeitada'").get().valor;
  const utilizadas = db.prepare("SELECT COUNT(*) as valor FROM messages WHERE status = 'Utilizada'").get().valor;

  return { total, aprovadas, pendentes, rejeitadas, utilizadas };
}

async function getRelatorios(filtros = {}) {
  let sql = "SELECT * FROM messages WHERE 1=1";
  const params = [];

  if (filtros.periodo) {
    const range = getPeriodoRange(filtros.periodo);
    if (range.dataInicio) filtros.dataInicio = range.dataInicio;
    if (range.dataFim) filtros.dataFim = range.dataFim;
  }

  if (filtros.dataInicio) {
    sql += " AND data_geracao >= ?";
    params.push(filtros.dataInicio);
  }
  if (filtros.dataFim) {
    sql += " AND data_geracao <= ?";
    params.push(filtros.dataFim);
  }
  if (filtros.hashtag) {
    sql += " AND hashtag LIKE ?";
    params.push(`%${filtros.hashtag}%`);
  }
  if (filtros.hashtags) {
    const tags = filtros.hashtags.split(",").map((t) => t.trim()).filter(Boolean);
    if (tags.length > 0) {
      const conditions = tags.map(() => "hashtag LIKE ?");
      sql += ` AND (${conditions.join(" OR ")})`;
      tags.forEach((t) => params.push(`%${t}%`));
    }
  }
  if (filtros.arquivada !== undefined) {
    sql += " AND arquivada = ?";
    params.push(filtros.arquivada ? 1 : 0);
  }

  sql += " ORDER BY created_at DESC";

  const rows = db.prepare(sql).all(...params);
  const data = rows.map(normalizar);

  const statusMap = {}, temaMap = {}, diaMap = {}, hashtagMap = {};
  data.forEach((d) => {
    statusMap[d.status || "Sem status"] = (statusMap[d.status || "Sem status"] || 0) + 1;
    temaMap[d.tema || "Sem tema"] = (temaMap[d.tema || "Sem tema"] || 0) + 1;
    const dia = d.dataGeracao ? d.dataGeracao.split(" ")[0] : "Sem data";
    diaMap[dia] = (diaMap[dia] || 0) + 1;
    const tag = d.hashtag || "Sem hashtag";
    if (!hashtagMap[tag]) hashtagMap[tag] = { total: 0, utilizadas: 0 };
    hashtagMap[tag].total++;
    if (d.status === "Utilizada") hashtagMap[tag].utilizadas++;
  });

  const stats = {
    total: data.length,
    aprovadas: data.filter((d) => d.status === "Aprovada").length,
    pendentes: data.filter((d) => d.status === "Pendente").length,
    rejeitadas: data.filter((d) => d.status === "Rejeitada").length,
    utilizadas: data.filter((d) => d.status === "Utilizada").length,
  };

  return {
    stats,
    porStatus: Object.entries(statusMap).map(([nome, valor]) => ({ nome, valor })),
    porTema: Object.entries(temaMap).map(([nome, valor]) => ({ nome, valor })),
    porDia: Object.entries(diaMap).map(([nome, valor]) => ({ nome, valor })),
    porHashtag: Object.entries(hashtagMap).map(([nome, { total, utilizadas }]) => ({ nome, total, utilizadas })),
    mensagens: data,
  };
}

async function getComparativo(hashtags) {
  const tags = hashtags.split(",").map((t) => t.trim()).filter(Boolean);
  if (tags.length === 0) return {};

  const results = [];
  for (const tag of tags) {
    const rows = db.prepare("SELECT * FROM messages WHERE hashtag LIKE ? ORDER BY created_at DESC").all(`%${tag}%`);
    const data = rows.map(normalizar);

    const porStatus = {};
    data.forEach((d) => {
      porStatus[d.status || "Sem status"] = (porStatus[d.status || "Sem status"] || 0) + 1;
    });

    const porDia = {};
    data.forEach((d) => {
      const dia = d.dataGeracao ? d.dataGeracao.split(" ")[0] : "Sem data";
      porDia[dia] = (porDia[dia] || 0) + 1;
    });

    results.push({
      hashtag: tag,
      total: data.length,
      porStatus: Object.entries(porStatus).map(([nome, valor]) => ({ nome, valor })),
      porDia: Object.entries(porDia).map(([nome, valor]) => ({ nome, valor })),
    });
  }

  return results;
}

async function todasMensagens() {
  const rows = db.prepare("SELECT * FROM messages ORDER BY created_at DESC").all();
  return rows.map(normalizar);
}

async function atualizarStatus(id, status) {
  const result = db.prepare("UPDATE messages SET status = ? WHERE id = ?").run(status, id);
  return result.changes > 0;
}

module.exports = {
  ensureTable, salvarMensagens, buscarMensagens,
  deletarMensagem, deletarMensagens,
  deletarPorHashtag, deletarPorPeriodo, deletarTodas,
  getStats, getRelatorios,
  todasMensagens, atualizarStatus, DEFAULT_HEADERS,
  arquivarMensagem, arquivarMensagens, desarquivarMensagem, desarquivarMensagens, getComparativo,
};
