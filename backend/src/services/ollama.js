const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODELO = "llama-3.3-70b-versatile";
const MODELO_FALLBACK = "llama-3.1-8b-instant";
const API_KEY = process.env.GROQ_API_KEY;

function buildPrompt(config) {
  const limite = parseInt(config.limiteCaracteres) || 280;
  const hashtag = config.hashtag || "JesusEstaVoltando";
  const limiteConteudo = limite - hashtag.length - 2;

  return [
    "Você é um escritor de mensagens bíblicas cristãs curtas para redes sociais.",
    "",
    "REGRAS OBRIGATÓRIAS:",
    "- Cada mensagem deve ser baseada na Bíblia Sagrada",
    "- Deve conduzir a: ARREPENDIMENTO, SANTIDADE ou PRÁTICA DA JUSTIÇA",
    "- Deve ser profunda, espiritual e levar à reflexão",
    "- Pregar Cristo com ousadia e verdade",
    "- NÃO use clichês genéricos ou mensagens motivacionais vazias",
    "",
    "ESPECIFICAÇÕES DA MISSÃO:",
    `Tema: ${config.tema || "Sem tema"}`,
    `Tom: ${config.tom || "Evangelístico"}`,
    `Público-alvo: ${config.publico || "Geral"}`,
    `Idioma: ${config.idioma === "en-US" ? "Inglês (EUA)" : config.idioma === "es" ? "Espanhol" : "Português do Brasil"}`,
    `Contexto extra: ${config.contexto || "Nenhum"}`,
    "",
    `REGRAS DE TAMANHO (CRÍTICO):`,
    `- Conteúdo: entre ${Math.floor(limiteConteudo * 0.6)} e ${limiteConteudo} caracteres`,
    `- A hashtag #${hashtag} será adicionada depois`,
    `- Total final com hashtag: ~${limite} caracteres`,
    `- Se passar do limite, CORTE o texto sem perder o sentido`,
    "",
    `Gere ${config.quantidade} mensagens diferentes.`,
    "NÃO repita mensagens. Cada uma deve ser única.",
    "",
    "Formato de resposta (JSON puro, sem markdown, sem explicacões):",
    '[{"conteudo": "texto da mensagem aqui"}]',
  ].join("\n");
}

function parseResponse(text) {
  const cleaned = text
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/gi, "")
    .trim();

  const parsed = JSON.parse(cleaned);

  if (!Array.isArray(parsed)) {
    throw new Error("Resposta não é um array");
  }

  return parsed.map((item, index) => ({
    id: `msg_${Date.now()}_${index}`,
    conteudo: item.conteudo,
    versiculos: item.versiculos || [],
  }));
}

function validarMensagens(mensagens, config) {
  const limite = parseInt(config.limiteCaracteres) || 280;
  const hashtag = config.hashtag || "JesusEstaVoltando";
  const limiteTotal = limite;
  const maxConteudo = limiteTotal - hashtag.length - 2;

  const validas = mensagens.filter((m) => {
    const conteudo = (m.conteudo || "").trim();
    return conteudo.length > 0;
  });

  if (validas.length < mensagens.length) {
    console.log(`[GROQ] ${mensagens.length - validas.length} mensagens vazias filtradas`);
  }

  return validas.map((m) => {
    let conteudo = m.conteudo || "";

    if (conteudo.length > maxConteudo) {
      conteudo = conteudo.substring(0, maxConteudo - 3).trim() + "...";
    }

    return {
      ...m,
      conteudo,
      tema: config.tema || "",
      hashtag: config.hashtag || "JesusEstaVoltando",
      idioma: config.idioma || "pt-BR",
      dataGeracao: new Date().toISOString(),
      status: "Gerada",
    };
  });
}

async function gerarMensagens(config) {
  if (!API_KEY) throw new Error("GROQ_API_KEY não configurada. Adicione no .env ou nas Secrets do Replit.");

  const quantidade = Math.min(Math.max(1, parseInt(config.quantidade) || 1), 400);
  const promptBase = buildPrompt(config);
  let mensagens = [];
  const TAMANHO_LOTE = 15;
  const lotes = Math.ceil(quantidade / TAMANHO_LOTE);
  let modelo = MODELO;

  for (let lote = 0; lote < lotes; lote++) {
    const restantes = quantidade - mensagens.length;
    const qtdLote = Math.min(restantes, TAMANHO_LOTE);

    console.log(`[GROQ] Lote ${lote + 1}/${lotes} - Gerando ${qtdLote} mensagens...`);

    const promptLote = promptBase.replace(
      `Gere ${config.quantidade} mensagens`,
      `Gere ${qtdLote} mensagens diferentes`
    );

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    try {
      const response = await fetch(GROQ_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          model: modelo,
          messages: [{ role: "user", content: promptLote }],
          temperature: 0.6,
          max_tokens: 4096,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        if (response.status === 429) {
          console.log(`[GROQ] Rate limit, tentando fallback...`);
          await new Promise((r) => setTimeout(r, 5000));
          continue;
        }
        const text = await response.text();
        throw new Error(`HTTP ${response.status}: ${text}`);
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || "";
      const novas = parseResponse(text);
      mensagens.push(...novas);
      console.log(`[GROQ] Lote ${lote + 1} OK: ${novas.length} mensagens`);
    } catch (err) {
      clearTimeout(timeoutId);
      console.error(`[GROQ] Erro lote ${lote + 1}: ${err.message}`);

      if (mensagens.length === 0 && modelo === MODELO) {
        console.log(`[GROQ] Tentando modelo fallback: ${MODELO_FALLBACK}`);
        modelo = MODELO_FALLBACK;
        lote--;
        continue;
      }

      if (mensagens.length === 0) throw err;
      break;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  mensagens = validarMensagens(mensagens, config);
  console.log(`[GROQ] Total: ${mensagens.length} mensagens geradas`);
  return mensagens;
}

module.exports = { gerarMensagens };
