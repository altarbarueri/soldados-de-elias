const express = require("express");
const { isAuthenticated } = require("../middleware/auth");
const { gerarMensagens } = require("../services/ollama");
const {
  salvarMensagens, buscarMensagens,
  deletarMensagem, deletarMensagens,
  deletarPorHashtag, deletarPorPeriodo, deletarTodas,
  getStats, getRelatorios, atualizarStatus,
  arquivarMensagem, arquivarMensagens, desarquivarMensagem, desarquivarMensagens,
  getComparativo,
} = require("../services/sheets");
const logger = require("../services/logger");

const router = express.Router();

router.post("/gerar", isAuthenticated, async (req, res) => {
  try {
    const config = req.body;
    if (!config.tema || !config.quantidade) {
      return res.status(400).json({ error: "Tema e quantidade são obrigatórios" });
    }
    const quantidade = Math.min(Math.max(1, parseInt(config.quantidade) || 1), 400);

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Tempo limite excedido (120s)")), 120000)
    );

    const mensagens = await Promise.race([
      gerarMensagens({ ...config, quantidade }),
      timeoutPromise,
    ]);

    logger.geracao(quantidade, req.user.id, {
      tema: config.tema, quantidade, idioma: config.idioma,
    });

    res.json({ mensagens, total: mensagens.length });
  } catch (err) {
    logger.erro("GERACAO", err.message, { usuario: req.user.id });
    res.status(500).json({ error: `Erro ao gerar mensagens: ${err.message}` });
  }
});

router.post("/salvar", isAuthenticated, async (req, res) => {
  try {
    const { mensagens } = req.body;
    if (!mensagens || !Array.isArray(mensagens) || mensagens.length === 0) {
      return res.status(400).json({ error: "Nenhuma mensagem para salvar" });
    }

    const resultado = await salvarMensagens(mensagens);

    mensagens.forEach((m) => {
      logger.salvamento(m.id, req.user.id, "SQLite");
      logger.aprovacao(m.id, req.user.id, "Aprovada");
    });

    res.json(resultado);
  } catch (err) {
    logger.erro("SALVAMENTO", err.message, { usuario: req.user.id });
    res.status(500).json({ error: `Erro ao salvar: ${err.message}` });
  }
});

router.get("/buscar", isAuthenticated, async (req, res) => {
  try {
    const mensagens = await buscarMensagens(req.query);
    res.json({ mensagens, total: mensagens.length });
  } catch (err) {
    logger.erro("BUSCA", err.message, { usuario: req.user.id });
    res.status(500).json({ error: `Erro ao buscar mensagens: ${err.message}` });
  }
});

router.delete("/:id", isAuthenticated, async (req, res) => {
  try {
    const resultado = await deletarMensagem(req.params.id);
    if (!resultado) return res.status(404).json({ error: "Mensagem não encontrada" });
    logger.remocao(req.params.id, req.user.id);
    res.json({ sucesso: true });
  } catch (err) {
    logger.erro("REMOCAO", err.message, { usuario: req.user.id });
    res.status(500).json({ error: `Erro ao deletar: ${err.message}` });
  }
});

router.post("/deletar", isAuthenticated, async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "Nenhum ID fornecido" });
    }
    const total = await deletarMensagens(ids);
    ids.forEach((id) => logger.remocao(id, req.user.id));
    res.json({ sucesso: true, total });
  } catch (err) {
    logger.erro("REMOCAO_MULTIPLA", err.message, { usuario: req.user.id });
    res.status(500).json({ error: `Erro ao deletar: ${err.message}` });
  }
});

router.get("/stats", isAuthenticated, async (req, res) => {
  try {
    const stats = await getStats();
    res.json(stats);
  } catch (err) {
    logger.erro("STATS", err.message, { usuario: req.user.id });
    res.status(500).json({ error: `Erro ao carregar stats: ${err.message}` });
  }
});

router.post("/:id/arquivar", isAuthenticated, async (req, res) => {
  try {
    const resultado = await arquivarMensagem(req.params.id);
    if (!resultado) return res.status(404).json({ error: "Mensagem não encontrada" });
    logger.remocao(req.params.id, req.user.id, "ARQUIVADA");
    res.json({ sucesso: true });
  } catch (err) {
    logger.erro("ARQUIVAR", err.message, { usuario: req.user.id });
    res.status(500).json({ error: `Erro ao arquivar: ${err.message}` });
  }
});

router.post("/arquivar", isAuthenticated, async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "Nenhum ID fornecido" });
    }
    const total = await arquivarMensagens(ids);
    ids.forEach((id) => logger.remocao(id, req.user.id, "ARQUIVADA"));
    res.json({ sucesso: true, total });
  } catch (err) {
    logger.erro("ARQUIVAR_MULTIPLA", err.message, { usuario: req.user.id });
    res.status(500).json({ error: `Erro ao arquivar: ${err.message}` });
  }
});

router.post("/:id/desarquivar", isAuthenticated, async (req, res) => {
  try {
    const resultado = await desarquivarMensagem(req.params.id);
    if (!resultado) return res.status(404).json({ error: "Mensagem não encontrada" });
    res.json({ sucesso: true });
  } catch (err) {
    logger.erro("DESARQUIVAR", err.message, { usuario: req.user.id });
    res.status(500).json({ error: `Erro ao desarquivar: ${err.message}` });
  }
});

router.post("/desarquivar", isAuthenticated, async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "Nenhum ID fornecido" });
    }
    const total = await desarquivarMensagens(ids);
    res.json({ sucesso: true, total });
  } catch (err) {
    logger.erro("DESARQUIVAR_MULTIPLA", err.message, { usuario: req.user.id });
    res.status(500).json({ error: `Erro ao desarquivar: ${err.message}` });
  }
});

router.get("/comparativo", isAuthenticated, async (req, res) => {
  try {
    const { hashtags } = req.query;
    if (!hashtags) return res.status(400).json({ error: "Parâmetro hashtags é obrigatório" });
    const resultado = await getComparativo(hashtags);
    res.json(resultado);
  } catch (err) {
    logger.erro("COMPARATIVO", err.message, { usuario: req.user.id });
    res.status(500).json({ error: `Erro ao carregar comparativo: ${err.message}` });
  }
});

router.post("/deletar/hashtag", isAuthenticated, async (req, res) => {
  try {
    const { hashtags } = req.body;
    if (!hashtags) return res.status(400).json({ error: "Parâmetro hashtags é obrigatório" });
    const total = await deletarPorHashtag(hashtags);
    logger.remocao(`hashtag:${hashtags}`, req.user.id, "DELETADO");
    res.json({ sucesso: true, total });
  } catch (err) {
    logger.erro("DELETAR_HASHTAG", err.message, { usuario: req.user.id });
    res.status(500).json({ error: `Erro ao deletar: ${err.message}` });
  }
});

router.post("/deletar/periodo", isAuthenticated, async (req, res) => {
  try {
    const { dataInicio, dataFim } = req.body;
    if (!dataInicio && !dataFim) return res.status(400).json({ error: "Informe data início e/ou data fim" });
    const total = await deletarPorPeriodo(dataInicio, dataFim);
    logger.remocao(`periodo:${dataInicio || ""}-${dataFim || ""}`, req.user.id, "DELETADO");
    res.json({ sucesso: true, total });
  } catch (err) {
    logger.erro("DELETAR_PERIODO", err.message, { usuario: req.user.id });
    res.status(500).json({ error: `Erro ao deletar: ${err.message}` });
  }
});

router.post("/deletar/todas", isAuthenticated, async (req, res) => {
  try {
    const total = await deletarTodas();
    logger.remocao("todas", req.user.id, "DELETADO");
    res.json({ sucesso: true, total });
  } catch (err) {
    logger.erro("DELETAR_TODAS", err.message, { usuario: req.user.id });
    res.status(500).json({ error: `Erro ao deletar: ${err.message}` });
  }
});

router.get("/relatorios", isAuthenticated, async (req, res) => {
  try {
    const { periodo, hashtags, incluirArquivadas } = req.query;
    const relatorios = await getRelatorios({
      ...req.query,
      periodo: periodo || undefined,
      hashtags: hashtags || undefined,
      arquivada: incluirArquivadas === "true" ? undefined : false,
    });
    res.json(relatorios);
  } catch (err) {
    logger.erro("RELATORIOS", err.message, { usuario: req.user.id });
    res.status(500).json({ error: `Erro ao carregar relatórios: ${err.message}` });
  }
});

router.get("/exportar", isAuthenticated, async (req, res) => {
  try {
    const XLSX = require("xlsx");

    const mensagens = await todasMensagens();
    const data = mensagens.map((m) => ({
      ID: m.id,
      Conteudo: m.conteudo,
      Tema: m.tema,
      "Data Geracao": m.dataGeracao,
      Status: m.status,
      Idioma: m.idioma,
      Hashtag: m.hashtag,
      Observacoes: m.observacoes,
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, "Mensagens");

    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename=mensagens-${new Date().toISOString().split("T")[0]}.xlsx`);
    res.send(buf);
  } catch (err) {
    logger.erro("EXPORTAR", err.message, { usuario: req.user.id });
    res.status(500).json({ error: `Erro ao exportar: ${err.message}` });
  }
});

router.get("/publicas", async (req, res) => {
  try {
    const disponiveis = await buscarMensagens({ status: "Aprovada" });
    const utilizadas = await buscarMensagens({ status: "Utilizada" });
    const mensagens = [...disponiveis, ...utilizadas];
    res.json({ mensagens, total: mensagens.length });
  } catch (err) {
    res.status(500).json({ error: `Erro ao carregar mensagens: ${err.message}` });
  }
});

router.post("/:id/utilizar", async (req, res) => {
  try {
    const resultado = await atualizarStatus(req.params.id, "Utilizada");
    if (!resultado) return res.status(404).json({ error: "Mensagem não encontrada" });
    res.json({ sucesso: true });
  } catch (err) {
    res.status(500).json({ error: `Erro ao marcar como utilizada: ${err.message}` });
  }
});

module.exports = router;
