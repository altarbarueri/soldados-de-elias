const MODELS = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-flash"];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildPrompt(config) {
  const partes = [
    `Gere ${config.quantidade} mensagens inéditas e exclusivas.`,
    `Tema principal: ${config.tema}`,
    `Tom: ${config.tom}`,
    `Intenção comunicacional: ${config.intencao}`,
    `Público-alvo: ${config.publico}`,
    `Palavras-chave obrigatórias: ${config.palavrasChave}`,
    `Referências: ${config.referencias}`,
    `Idioma: ${config.idioma}`,
    `Estilo textual: ${config.estilo}`,
    `Emoções desejadas: ${config.emocao}`,
    `Termos proibidos: ${config.termosProibidos}`,
    `Tamanho mínimo: ${config.tamanhoMin || 0} caracteres.`,
    `Tamanho máximo: ${config.tamanhoMax || 2000} caracteres.`,
    "",
    `IMPORTANTE: Cada mensagem deve ser ÚNICA, INÉDITA e obedecer rigorosamente a TODAS as condições acima.`,
    `NÃO repita mensagens de gerações anteriores.`,
    `NÃO inclua os termos proibidos.`,
    "",
    `Formato de resposta: JSON array de objetos, exatamente como abaixo, sem formatação adicional:`,
    `[{"conteudo": "texto da mensagem aqui"}]`,
    `Sem markdown, sem código adicional, apenas o JSON puro.`,
  ];

  return partes.join("\n");
}

function parseGeminiResponse(text) {
  const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
  const parsed = JSON.parse(cleaned);

  if (!Array.isArray(parsed)) {
    throw new Error("Resposta da IA não é um array");
  }

  return parsed.map((item, index) => ({
    id: `msg_${Date.now()}_${index}`,
    conteudo: item.conteudo,
    tema: "",
    dataGeracao: new Date().toISOString(),
    status: "Gerada",
    idioma: "",
    observacoes: "",
  }));
}

async function callGemini(modelName, prompt, apiKey) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

  const body = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.7,
      topP: 0.9,
      maxOutputTokens: 8192,
    },
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);

  console.log(`[GEMINI] Chamando ${modelName}...`);

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    signal: controller.signal,
  });

  clearTimeout(timeoutId);

  if (!response.ok) {
    const errText = await response.text();
    console.error(`[GEMINI] Erro ${response.status}:`, errText.slice(0, 200));
    const err = new Error(`HTTP ${response.status}: ${errText}`);
    err.status = response.status;
    throw err;
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error("Resposta vazia da IA");
  }

  return text;
}

async function gerarMensagens(config) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY não configurada");
  }

  const prompt = buildPrompt(config);
  let ultimoErro;

  for (const modelName of MODELS) {
    for (let tentativa = 0; tentativa < 3; tentativa++) {
      try {
        const text = await callGemini(modelName, prompt, apiKey);
        return parseGeminiResponse(text);
      } catch (err) {
        ultimoErro = err;

        if (err.status === 429) {
          const wait = (tentativa + 1) * 30;
          await sleep(wait * 1000);
          continue;
        }

        if (err.status === 403) {
          break;
        }

        await sleep(3000);
      }
    }
  }

  throw new Error(ultimoErro?.message || "Falha ao gerar mensagens");
}

module.exports = { gerarMensagens, buildPrompt };
