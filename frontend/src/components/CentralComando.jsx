import React, { useState } from "react";
import { Rocket, Hash, Globe, Users, Target, BookOpen, MessageSquare, Trash2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { gerarMensagens, salvarMensagens } from "../services/api";
import MessageCard from "./MessageCard";

const TONS = [
  "Evangelístico", "Pastoral", "Profético", "Devocional",
  "Motivacional", "Reflexivo", "Celebração de Milagres",
  "Mestre", "Professor de Hebraico", "Professor de Grego",
  "Alerta Apocalíptico",
];

const IDIOMAS = [
  { value: "pt-BR", label: "Português (Brasil)" },
  { value: "en-US", label: "English (US)" },
  { value: "es", label: "Español" },
];

export default function CentralComando({ user, mensagensGeradas, onMensagensChange }) {
  const [config, setConfig] = useState({
    tema: "",
    tom: "Evangelístico",
    publico: "",
    idioma: "pt-BR",
    hashtag: "JesusEstaVoltando",
    contexto: "Utilize a Bíblia como referência principal. Conduzindo sempre ao arrependimento, santidade ou prática da justiça.",
    quantidade: 10,
    limiteCaracteres: 280,
  });
  const [loading, setLoading] = useState(false);
  const [selecionadas, setSelecionadas] = useState(new Set());

  function handleChange(e) {
    const { name, value } = e.target;
    setConfig((prev) => ({ ...prev, [name]: value }));
  }

  async function handleGerar(e) {
    e.preventDefault();
    if (!config.tema.trim()) {
      toast.error("Defina um tema para a missão");
      return;
    }
    setLoading(true);
    try {
      const data = await gerarMensagens(config);
      const comHashtag = data.mensagens.map((m) => ({ ...m, hashtag: config.hashtag, tema: config.tema, idioma: config.idioma }));
      onMensagensChange((prev) => [...prev, ...comHashtag]);
      toast.success(`${data.mensagens.length} mensagens geradas!`);
    } catch (err) {
      toast.error(err.response?.data?.error || "Erro ao gerar mensagens");
    } finally {
      setLoading(false);
    }
  }

  async function handleAprovarUma(msg) {
    setLoading(true);
    try {
      const aprovada = [{ ...msg, status: "Aprovada" }];
      await salvarMensagens(aprovada);
      onMensagensChange((prev) => prev.filter((m) => m.id !== msg.id));
      toast.success("Mensagem aprovada e salva!");
    } catch (err) {
      toast.error(err.response?.data?.error || "Erro ao salvar");
    } finally {
      setLoading(false);
    }
  }

  async function handleAprovarTodas() {
    if (mensagensGeradas.length === 0) return;
    setLoading(true);
    try {
      const aprovadas = mensagensGeradas.map((m) => ({ ...m, status: "Aprovada" }));
      await salvarMensagens(aprovadas);
      toast.success(`${aprovadas.length} mensagens salvas!`);
      onMensagensChange([]);
    } catch (err) {
      toast.error(err.response?.data?.error || "Erro ao salvar");
    } finally {
      setLoading(false);
    }
  }

  function handleRemoverMensagem(id) {
    onMensagensChange((prev) => prev.filter((m) => m.id !== id));
  }

  function handleEditarMensagem(id, novoConteudo) {
    onMensagensChange((prev) =>
      prev.map((m) => (m.id === id ? { ...m, conteudo: novoConteudo } : m))
    );
  }

  function handleToggleSelecao(id) {
    setSelecionadas((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function handleApagarSelecionadas() {
    if (selecionadas.size === 0) {
      toast.error("Selecione mensagens para apagar");
      return;
    }
    onMensagensChange((prev) => prev.filter((m) => !selecionadas.has(m.id)));
    setSelecionadas(new Set());
    toast.success(`${selecionadas.size} mensagens removidas`);
  }

  async function handleRejeitarSelecionadas() {
    if (selecionadas.size === 0) {
      toast.error("Selecione mensagens para rejeitar");
      return;
    }
    setLoading(true);
    try {
      const rejeitadas = mensagensGeradas
        .filter((m) => selecionadas.has(m.id))
        .map((m) => ({ ...m, status: "Rejeitada" }));
      await salvarMensagens(rejeitadas);
      onMensagensChange((prev) => prev.filter((m) => !selecionadas.has(m.id)));
      setSelecionadas(new Set());
      toast.success(`${rejeitadas.length} mensagens rejeitadas`);
    } catch (err) {
      toast.error(err.response?.data?.error || "Erro ao rejeitar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <Rocket className="w-5 h-5 text-blue-400" />
          Central de Comando
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure e gere suas mensagens evangelísticas
        </p>
      </div>

      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-slate-200 mb-0.5">Configuração da Missão</h2>
        <p className="text-xs text-slate-500 mb-4">Defina os parâmetros para geração de mensagens</p>

        <form onSubmit={handleGerar} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1.5 text-xs text-slate-300 mb-1">
                <Target className="w-3 h-3 text-blue-400" />
                Tema da Missão
              </label>
              <input
                type="text" name="tema" placeholder="Ex: Esperança em tempos difíceis"
                value={config.tema} onChange={handleChange}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500/50"
                required
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs text-slate-300 mb-1">
                <BookOpen className="w-3 h-3 text-blue-400" />
                Tom
              </label>
              <select
                name="tom" value={config.tom} onChange={handleChange}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50"
              >
                {TONS.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs text-slate-300 mb-1">
                <Users className="w-3 h-3 text-blue-400" />
                Público Alvo
              </label>
              <input
                type="text" name="publico" placeholder="Ex: Jovens adultos, pessoas em luto"
                value={config.publico} onChange={handleChange}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500/50"
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs text-slate-300 mb-1">
                <Globe className="w-3 h-3 text-blue-400" />
                Idioma
              </label>
              <select
                name="idioma" value={config.idioma} onChange={handleChange}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50"
              >
                {IDIOMAS.map((i) => <option key={i.value} value={i.value}>{i.label}</option>)}
              </select>
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs text-slate-300 mb-1">
                <Hash className="w-3 h-3 text-blue-400" />
                Hashtag Fixa
              </label>
              <input
                type="text" name="hashtag" placeholder="Ex: JesusEstaVoltando"
                value={config.hashtag} onChange={handleChange}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500/50"
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs text-slate-300 mb-1">
                <MessageSquare className="w-3 h-3 text-blue-400" />
                Quantidade
              </label>
              <input
                type="number" name="quantidade" min="1" max="200"
                value={config.quantidade}
                onChange={handleChange}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50"
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs text-slate-300 mb-1">
                <Hash className="w-3 h-3 text-blue-400" />
                Limite de Caracteres
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number" name="limiteCaracteres" min="50" max="500"
                  value={config.limiteCaracteres}
                  onChange={handleChange}
                  className="flex-1 bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50"
                />
                <button
                  type="button"
                  onClick={() => setConfig((p) => ({ ...p, limiteCaracteres: 280 }))}
                  className="px-2 py-2 text-[11px] text-slate-400 hover:text-slate-200 bg-slate-800/50 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors"
                  title="Resetar para 280"
                >
                  Padrão
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs text-slate-300 mb-1">
              Contexto Adicional
            </label>
            <textarea
              name="contexto" rows="3"
              placeholder="Ex: Versículos bíblicos específicos..."
              value={config.contexto} onChange={handleChange}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500/50 resize-none"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit" disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <Rocket className="w-4 h-4" />
              )}
              {loading ? "Gerando..." : "Iniciar Operação"}
            </button>

            {mensagensGeradas.length > 0 && (
              <button
                type="button"
                onClick={handleAprovarTodas}
                className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Aprovar Todas ({mensagensGeradas.length})
              </button>
            )}
          </div>
        </form>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-200">
            Mensagens Geradas
          </h2>
          <span className="text-xs text-slate-500">
            {mensagensGeradas.length} mensagens aguardando aprovação
          </span>
        </div>

        {mensagensGeradas.length === 0 ? (
          <div className="bg-slate-800/30 border-2 border-dashed border-slate-700/50 rounded-xl p-8 text-center">
            <p className="text-sm text-slate-500">Nenhuma mensagem gerada ainda</p>
            <p className="text-xs text-slate-600 mt-1">
              Configure a missão e clique em "Iniciar Operação"
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3">
              <label className="flex items-center gap-1.5 text-xs text-slate-400">
                <input
                  type="checkbox"
                  checked={selecionadas.size === mensagensGeradas.length}
                  onChange={() => {
                    if (selecionadas.size === mensagensGeradas.length) {
                      setSelecionadas(new Set());
                    } else {
                      setSelecionadas(new Set(mensagensGeradas.map((m) => m.id)));
                    }
                  }}
                  className="rounded border-slate-600 bg-slate-800"
                />
                Selecionar todas ({mensagensGeradas.length})
              </label>
              <div className="flex items-center gap-2">
                {selecionadas.size > 0 && (
                  <>
                    <button
                      onClick={handleApagarSelecionadas}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/20 text-red-300 text-xs font-medium rounded-lg border border-red-800/30 hover:bg-red-600/30 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      Apagar ({selecionadas.size})
                    </button>
                    <button
                      onClick={handleRejeitarSelecionadas}
                      disabled={loading}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-600/20 text-orange-300 text-xs font-medium rounded-lg border border-orange-800/30 hover:bg-orange-600/30 transition-colors disabled:opacity-50"
                    >
                      {loading ? (
                        <div className="animate-spin w-3 h-3 border-2 border-orange-300 border-t-transparent rounded-full" />
                      ) : (
                        <XCircle className="w-3 h-3" />
                      )}
                      Rejeitar ({selecionadas.size})
                    </button>
                  </>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {mensagensGeradas.map((msg) => (
                <MessageCard
                  key={msg.id}
                  msg={msg}
                  selecionada={selecionadas.has(msg.id)}
                  onToggleSelecao={handleToggleSelecao}
                  onRemover={handleRemoverMensagem}
                  onAprovar={handleAprovarUma}
                  onEditar={handleEditarMensagem}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
