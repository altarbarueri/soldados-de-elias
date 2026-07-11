import React, { useState, useEffect, useCallback } from "react";
import { TrendingUp, BarChart3, Calendar, Hash, Layers, MessageSquare, Download, CheckCircle, Archive, Trash2, RotateCcw, X, ChevronDown, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import {
  getRelatorios, exportarMensagens,
  arquivarMensagem, arquivarMensagens,
  desarquivarMensagem, desarquivarMensagens,
  deletarMensagem, deletarMensagens,
  deletarPorHashtag, deletarPorPeriodo, deletarTodas,
  getComparativo,
} from "../services/api";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

const CORES = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

const PERIODOS = [
  { key: "semana", label: "Semana" },
  { key: "mes", label: "Mês" },
  { key: "mes-passado", label: "Mês Passado" },
  { key: "ano", label: "Ano" },
];

export default function Relatorios() {
  const [abaAtiva, setAbaAtiva] = useState("relatorios");
  const [filtros, setFiltros] = useState({ periodo: "", dataInicio: "", dataFim: "", hashtags: [], incluirArquivadas: false });
  const [hashtagInput, setHashtagInput] = useState("");
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selecionados, setSelecionados] = useState(new Set());
  const [compartilharAcoes, setCompartilharAcoes] = useState(false);

  const [compHashtags, setCompHashtags] = useState("");
  const [compDados, setCompDados] = useState(null);
  const [compLoading, setCompLoading] = useState(false);

  const carregar = useCallback(async (f = filtros) => {
    setLoading(true);
    try {
      const params = {};
      if (f.periodo) params.periodo = f.periodo;
      if (f.dataInicio) params.dataInicio = f.dataInicio;
      if (f.dataFim) params.dataFim = f.dataFim;
      if (f.hashtags.length > 0) params.hashtags = f.hashtags.join(",");
      if (f.incluirArquivadas) params.incluirArquivadas = true;
      const r = await getRelatorios(params);
      setDados(r);
      setSelecionados(new Set());
    } catch {
      toast.error("Erro ao carregar relatórios");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  function setPeriodo(key) {
    setFiltros((prev) => ({
      ...prev,
      periodo: prev.periodo === key ? "" : key,
      dataInicio: "",
      dataFim: "",
    }));
  }

  function addHashtag(tag) {
    const t = tag.trim().replace(/^#/, "");
    if (!t || filtros.hashtags.includes(t)) return;
    setFiltros((prev) => ({ ...prev, hashtags: [...prev.hashtags, t] }));
    setHashtagInput("");
  }

  function removeHashtag(tag) {
    setFiltros((prev) => ({ ...prev, hashtags: prev.hashtags.filter((h) => h !== tag) }));
  }

  function toggleSelecionado(id) {
    setSelecionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleTodos() {
    if (!dados?.mensagens) return;
    if (selecionados.size === dados.mensagens.length) {
      setSelecionados(new Set());
    } else {
      setSelecionados(new Set(dados.mensagens.map((m) => m.id)));
    }
  }

  async function handleArquivarSelecionados() {
    if (selecionados.size === 0) return;
    try {
      await arquivarMensagens([...selecionados]);
      toast.success(`${selecionados.size} mensagem(ns) arquivada(s)`);
      setCompartilharAcoes(false);
      carregar();
    } catch { toast.error("Erro ao arquivar"); }
  }

  async function handleDeletarSelecionados() {
    if (selecionados.size === 0) return;
    try {
      await deletarMensagens([...selecionados]);
      toast.success(`${selecionados.size} mensagem(ns) deletada(s)`);
      setCompartilharAcoes(false);
      carregar();
    } catch { toast.error("Erro ao deletar"); }
  }

  async function handleDesarquivarSelecionados() {
    if (selecionados.size === 0) return;
    try {
      await desarquivarMensagens([...selecionados]);
      toast.success(`${selecionados.size} mensagem(ns) restaurada(s)`);
      setCompartilharAcoes(false);
      carregar();
    } catch { toast.error("Erro ao desarquivar"); }
  }

  async function handleArquivar(id) {
    try { await arquivarMensagem(id); toast.success("Arquivada"); carregar(); }
    catch { toast.error("Erro ao arquivar"); }
  }

  async function handleDesarquivar(id) {
    try { await desarquivarMensagem(id); toast.success("Restaurada"); carregar(); }
    catch { toast.error("Erro ao restaurar"); }
  }

  async function handleDeletar(id) {
    try { await deletarMensagem(id); toast.success("Deletada"); carregar(); }
    catch { toast.error("Erro ao deletar"); }
  }

  async function handleComparar() {
    const tags = compHashtags.split(",").map((t) => t.trim().replace(/^#/, "")).filter(Boolean);
    if (tags.length < 2) { toast.warning("Digite pelo menos 2 hashtags separadas por vírgula"); return; }
    setCompLoading(true);
    try {
      const r = await getComparativo(tags.join(","));
      setCompDados(r);
    } catch { toast.error("Erro ao carregar comparativo"); }
    finally { setCompLoading(false); }
  }

  const stats = dados?.stats || {};
  const porTema = dados?.porTema || [];
  const porStatus = dados?.porStatus || [];
  const porDia = dados?.porDia || [];
  const porHashtag = dados?.porHashtag || [];
  const mensagens = dados?.mensagens || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            Relatórios
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Análise geral do banco de mensagens</p>
        </div>
        <button
          onClick={exportarMensagens}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 text-emerald-300 text-xs font-medium rounded-lg border border-emerald-800/30 hover:bg-emerald-600/30 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          Exportar XLSX
        </button>
      </div>

      <div className="flex gap-1 bg-slate-800/30 rounded-lg p-1 w-fit">
        <button
          onClick={() => setAbaAtiva("relatorios")}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${abaAtiva === "relatorios" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-200"}`}
        >
          <BarChart3 className="w-3.5 h-3.5 inline mr-1" />
          Relatórios
        </button>
        <button
          onClick={() => setAbaAtiva("comparativo")}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${abaAtiva === "comparativo" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-200"}`}
        >
          <Layers className="w-3.5 h-3.5 inline mr-1" />
          Comparativo
        </button>
      </div>

      {abaAtiva === "relatorios" && (
        <>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 space-y-3">
            <div className="flex flex-wrap gap-2">
              {PERIODOS.map((p) => (
                <button
                  key={p.key}
                  onClick={() => setPeriodo(p.key)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${filtros.periodo === p.key ? "bg-blue-600/20 text-blue-300 border-blue-700/40" : "bg-slate-800/50 text-slate-400 border-slate-700/50 hover:border-slate-600"}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-3 items-end">
              <div>
                <label className="text-[11px] text-slate-400 mb-1 block">Data Início</label>
                <input
                  type="date" value={filtros.dataInicio}
                  onChange={(e) => setFiltros((p) => ({ ...p, dataInicio: e.target.value, periodo: "" }))}
                  className="bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 mb-1 block">Data Fim</label>
                <input
                  type="date" value={filtros.dataFim}
                  onChange={(e) => setFiltros((p) => ({ ...p, dataFim: e.target.value, periodo: "" }))}
                  className="bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 mb-1 block">Hashtags</label>
                <div className="flex flex-wrap gap-1 mb-1">
                  {filtros.hashtags.map((tag) => (
                    <span key={tag} className="inline-flex items-center gap-1 bg-blue-600/20 text-blue-300 text-[11px] px-2 py-0.5 rounded-full">
                      #{tag}
                      <button onClick={() => removeHashtag(tag)} className="hover:text-blue-100"><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-1">
                  <input
                    type="text" placeholder="#hashtag" value={hashtagInput}
                    onChange={(e) => setHashtagInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addHashtag(hashtagInput); } }}
                    className="bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500/50 w-32"
                  />
                  <button
                    onClick={() => addHashtag(hashtagInput)}
                    className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs rounded-lg transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
              <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer pb-1">
                <input
                  type="checkbox" checked={filtros.incluirArquivadas}
                  onChange={(e) => setFiltros((p) => ({ ...p, incluirArquivadas: e.target.checked }))}
                  className="rounded border-slate-600 bg-slate-800 text-blue-600 focus:ring-blue-500"
                />
                Incluir arquivadas
              </label>
              <button
                onClick={() => carregar()}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                Aplicar
              </button>
            </div>
          </div>

          {selecionados.size > 0 && (
            <div className="flex items-center gap-2 bg-amber-900/20 border border-amber-700/30 rounded-xl px-4 py-2">
              <span className="text-xs text-amber-300">{selecionados.size} selecionada(s)</span>
              <div className="relative">
                <button
                  onClick={() => setCompartilharAcoes(!compartilharAcoes)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium rounded-lg transition-colors"
                >
                  Ações <ChevronDown className="w-3 h-3" />
                </button>
                {compartilharAcoes && (
                  <div className="absolute top-full mt-1 right-0 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-10 min-w-[150px]">
                    <button onClick={handleDesarquivarSelecionados} className="flex items-center gap-2 w-full px-3 py-2 text-xs text-emerald-300 hover:bg-slate-700 rounded-t-lg">
                      <RotateCcw className="w-3.5 h-3.5" /> Desarquivar
                    </button>
                    <button onClick={handleArquivarSelecionados} className="flex items-center gap-2 w-full px-3 py-2 text-xs text-amber-300 hover:bg-slate-700">
                      <Archive className="w-3.5 h-3.5" /> Arquivar
                    </button>
                    <button onClick={handleDeletarSelecionados} className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-300 hover:bg-slate-700 rounded-b-lg">
                      <Trash2 className="w-3.5 h-3.5" /> Deletar
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-slate-400 mb-1">
                    <MessageSquare className="w-4 h-4" />
                    <span className="text-[11px] uppercase tracking-wider">Total</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-100">{stats.total || 0}</p>
                </div>
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-emerald-400 mb-1">
                    <Layers className="w-4 h-4" />
                    <span className="text-[11px] uppercase tracking-wider">Aprovadas</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-100">{stats.aprovadas || 0}</p>
                </div>
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-sky-400 mb-1">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-[11px] uppercase tracking-wider">Utilizadas</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-100">{stats.utilizadas || 0}</p>
                </div>
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-yellow-400 mb-1">
                    <Calendar className="w-4 h-4" />
                    <span className="text-[11px] uppercase tracking-wider">Pendentes</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-100">{stats.pendentes || 0}</p>
                </div>
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-purple-400 mb-1">
                    <Hash className="w-4 h-4" />
                    <span className="text-[11px] uppercase tracking-wider">Temas</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-100">{porTema.length}</p>
                </div>
              </div>

              {porHashtag.length > 0 && (
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
                    <Hash className="w-4 h-4 text-purple-400" />
                    Hashtags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {porHashtag.map((h) => (
                      <button
                        key={h.nome}
                        onClick={() => {
                          if (!filtros.hashtags.includes(h.nome) && h.nome !== "Sem hashtag") {
                            setFiltros((prev) => ({ ...prev, hashtags: [...prev.hashtags, h.nome] }));
                          }
                        }}
                        className={`group px-3 py-2 rounded-lg border text-xs transition-colors text-left ${
                          filtros.hashtags.includes(h.nome)
                            ? "bg-blue-600/20 border-blue-700/40 text-blue-300"
                            : "bg-slate-800/50 border-slate-700/50 hover:border-blue-700/40 hover:bg-slate-800/80"
                        }`}
                      >
                        <div className="font-medium mb-0.5">{h.nome === "Sem hashtag" ? "Sem hashtag" : `#${h.nome}`}</div>
                        <div className="flex gap-3 text-[10px] text-slate-500">
                          <span>{h.total} total</span>
                          <span className="text-emerald-400/80">{h.utilizadas} utilizadas</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-slate-200 mb-3">Mensagens por Status</h3>
                  {porStatus.length > 0 ? (
                    <div className="h-60">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={porStatus} dataKey="valor" nameKey="nome" cx="50%" cy="50%" outerRadius={70} label>
                            {porStatus.map((_, i) => <Cell key={i} fill={CORES[i % CORES.length]} />)}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 text-center py-8">Sem dados</p>
                  )}
                </div>
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-slate-200 mb-3">Mensagens por Tema</h3>
                  {porTema.length > 0 ? (
                    <div className="h-60">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={porTema}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                          <XAxis dataKey="nome" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                          <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
                          <Tooltip />
                          <Bar dataKey="valor" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 text-center py-8">Sem dados</p>
                  )}
                </div>
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 lg:col-span-2">
                  <h3 className="text-sm font-semibold text-slate-200 mb-3">Mensagens por Dia</h3>
                  {porDia.length > 0 ? (
                    <div className="h-60">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={porDia}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                          <XAxis dataKey="nome" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                          <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
                          <Tooltip />
                          <Bar dataKey="valor" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 text-center py-8">Sem dados</p>
                  )}
                </div>
              </div>

              {mensagens.length > 0 && (
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-700/50 flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={mensagens.length > 0 && selecionados.size === mensagens.length}
                      onChange={toggleTodos}
                      className="rounded border-slate-600 bg-slate-800 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs text-slate-400">{mensagens.length} mensagen(s)</span>
                    {mensagens.some((m) => m.arquivada) && (
                      <button
                        onClick={async () => {
                          const ids = mensagens.filter((m) => m.arquivada).map((m) => m.id);
                          try {
                            await desarquivarMensagens(ids);
                            toast.success(`${ids.length} mensagen(s) restaurada(s)`);
                            carregar();
                          } catch { toast.error("Erro ao desarquivar"); }
                        }}
                        className="ml-auto flex items-center gap-1 px-2 py-1 bg-emerald-600/20 text-emerald-300 text-[11px] rounded-lg border border-emerald-800/30 hover:bg-emerald-600/30 transition-colors"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Desarquivar Todas
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-900/50 sticky top-0">
                        <tr className="text-slate-400 uppercase tracking-wider text-[10px]">
                          <th className="p-2 w-8"></th>
                          <th className="p-2 text-left">Conteúdo</th>
                          <th className="p-2 text-left">Tema</th>
                          <th className="p-2 text-left">Hashtag</th>
                          <th className="p-2 text-left">Status</th>
                          <th className="p-2 text-left">Data</th>
                          <th className="p-2 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700/30">
                        {mensagens.map((m) => (
                          <tr key={m.id} className="hover:bg-slate-700/20 transition-colors">
                            <td className="p-2">
                              <input
                                type="checkbox" checked={selecionados.has(m.id)}
                                onChange={() => toggleSelecionado(m.id)}
                                className="rounded border-slate-600 bg-slate-800 text-blue-600 focus:ring-blue-500"
                              />
                            </td>
                            <td className="p-2 text-slate-200 max-w-xs truncate">{m.conteudo}</td>
                            <td className="p-2 text-slate-400">{m.tema}</td>
                            <td className="p-2 text-blue-400">{m.hashtag ? `#${m.hashtag}` : "-"}</td>
                            <td className="p-2">
                              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                                m.status === "Aprovada" ? "bg-emerald-600/20 text-emerald-300" :
                                m.status === "Utilizada" ? "bg-sky-600/20 text-sky-300" :
                                m.status === "Pendente" ? "bg-yellow-600/20 text-yellow-300" :
                                m.status === "Rejeitada" ? "bg-red-600/20 text-red-300" :
                                "bg-slate-600/20 text-slate-400"
                              }`}>{m.status}</span>
                            </td>
                            <td className="p-2 text-slate-500 whitespace-nowrap">{m.dataGeracao?.split(" ")[0]}</td>
                            <td className="p-2 text-right">
                              <div className="flex items-center justify-end gap-1">
                                {m.arquivada ? (
                                  <button onClick={() => handleDesarquivar(m.id)} className="p-1 text-slate-500 hover:text-emerald-400 transition-colors" title="Restaurar">
                                    <RotateCcw className="w-3.5 h-3.5" />
                                  </button>
                                ) : (
                                  <button onClick={() => handleArquivar(m.id)} className="p-1 text-slate-500 hover:text-amber-400 transition-colors" title="Arquivar">
                                    <Archive className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <button onClick={() => handleDeletar(m.id)} className="p-1 text-slate-500 hover:text-red-400 transition-colors" title="Deletar">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="bg-slate-800/50 border border-red-900/30 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-red-400 flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4" />
                  Gerenciar Dados
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-slate-900/30 rounded-lg p-3">
                    <h4 className="text-xs font-medium text-slate-300 mb-2">Por Hashtag</h4>
                    <div className="flex gap-2">
                      <input
                        type="text" id="delHashtag" placeholder="#hashtag1, #hashtag2"
                        className="flex-1 bg-slate-900/50 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-red-500/50"
                        onKeyDown={(e) => { if (e.key === "Enter") e.target.nextSibling.click(); }}
                      />
                      <button
                        onClick={async (e) => {
                          const input = e.currentTarget.previousSibling;
                          const val = input.value.trim();
                          if (!val) { toast.warning("Digite uma ou mais hashtags"); return; }
                          if (!confirm(`Deletar todas as mensagens com: ${val}?`)) return;
                          try {
                            const r = await deletarPorHashtag(val);
                            toast.success(`${r.total} mensagen(s) deletada(s)`);
                            input.value = "";
                            carregar();
                          } catch { toast.error("Erro ao deletar"); }
                        }}
                        className="px-2.5 py-1.5 bg-red-600/20 text-red-300 text-xs font-medium rounded-lg border border-red-800/30 hover:bg-red-600/30 transition-colors shrink-0"
                      >
                        Deletar
                      </button>
                    </div>
                  </div>
                  <div className="bg-slate-900/30 rounded-lg p-3">
                    <h4 className="text-xs font-medium text-slate-300 mb-2">Por Período</h4>
                    <div className="flex gap-2 items-center">
                      <input type="date" id="delPerInicio"
                        className="bg-slate-900/50 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-red-500/50"
                      />
                      <span className="text-[10px] text-slate-600">até</span>
                      <input type="date" id="delPerFim"
                        className="bg-slate-900/50 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-red-500/50"
                      />
                      <button
                        onClick={async () => {
                          const inicio = document.getElementById("delPerInicio").value;
                          const fim = document.getElementById("delPerFim").value;
                          if (!inicio && !fim) { toast.warning("Selecione pelo menos uma data"); return; }
                          if (!confirm(`Deletar mensagens${inicio ? ` de ${inicio}` : ""}${fim ? ` até ${fim}` : ""}?`)) return;
                          try {
                            const r = await deletarPorPeriodo(inicio || undefined, fim || undefined);
                            toast.success(`${r.total} mensagen(s) deletada(s)`);
                            document.getElementById("delPerInicio").value = "";
                            document.getElementById("delPerFim").value = "";
                            carregar();
                          } catch { toast.error("Erro ao deletar"); }
                        }}
                        className="px-2.5 py-1.5 bg-red-600/20 text-red-300 text-xs font-medium rounded-lg border border-red-800/30 hover:bg-red-600/30 transition-colors shrink-0"
                      >
                        Deletar
                      </button>
                    </div>
                  </div>
                  <div className="bg-slate-900/30 rounded-lg p-3">
                    <h4 className="text-xs font-medium text-slate-300 mb-2">Todo o Banco</h4>
                    <button
                      onClick={async () => {
                        if (!confirm("TEM CERTEZA? Isso vai deletar TODAS as mensagens do banco de dados!")) return;
                        if (!confirm("Confirmação final: deletar todas as mensagens permanentemente?")) return;
                        try {
                          const r = await deletarTodas();
                          toast.success(`${r.total} mensagen(s) deletada(s) - banco vazio`);
                          carregar();
                        } catch { toast.error("Erro ao deletar"); }
                      }}
                      className="px-3 py-2 bg-red-600/20 text-red-300 text-xs font-medium rounded-lg border border-red-800/30 hover:bg-red-600/30 transition-colors w-full"
                    >
                      Deletar Todas as Mensagens
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {abaAtiva === "comparativo" && (
        <div className="space-y-4">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="text-[11px] text-slate-400 mb-1 block">Hashtags para comparar</label>
                <input
                  type="text" placeholder="ex: arrependimento, santidade, fe" value={compHashtags}
                  onChange={(e) => setCompHashtags(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleComparar(); }}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500/50"
                />
                <p className="text-[10px] text-slate-500 mt-1">Digite 2+ hashtags separadas por vírgula</p>
              </div>
              <button
                onClick={handleComparar}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <Layers className="w-3.5 h-3.5" />
                Comparar
              </button>
            </div>
          </div>

          {compLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" />
            </div>
          )}

          {compDados && compDados.length > 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {compDados.map((d, i) => (
                  <div key={d.hashtag} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                    <div className="flex items-center gap-2" style={{ color: CORES[i % CORES.length] }}>
                      <Hash className="w-4 h-4" />
                      <span className="text-[11px] uppercase tracking-wider">#{d.hashtag}</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-100 mt-1">{d.total}</p>
                    <p className="text-[10px] text-slate-500">mensagens</p>
                  </div>
                ))}
              </div>

              <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-slate-200 mb-3">Total por Hashtag</h3>
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={compDados.map((d, i) => ({ nome: `#${d.hashtag}`, total: d.total, fill: CORES[i % CORES.length] }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="nome" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                      <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
                      <Tooltip />
                      <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                        {compDados.map((_, i) => <Cell key={i} fill={CORES[i % CORES.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-slate-200 mb-3">Status por Hashtag</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={(() => {
                      const statusLabels = [...new Set(compDados.flatMap((d) => d.porStatus.map((s) => s.nome)))];
                      return compDados.map((d, i) => {
                        const obj = { nome: `#${d.hashtag}` };
                        d.porStatus.forEach((s) => { obj[s.nome] = s.valor; });
                        return obj;
                      });
                    })()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="nome" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                      <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
                      <Tooltip />
                      <Legend />
                      {["Aprovada", "Pendente", "Rejeitada", "Utilizada"].filter((s) =>
                        compDados.some((d) => d.porStatus.some((ps) => ps.nome === s))
                      ).map((s, i) => (
                        <Bar key={s} dataKey={s} fill={CORES[i % CORES.length]} radius={[4, 4, 0, 0]} />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-slate-200 mb-3">Evolução por Hashtag</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={(() => {
                      const dias = [...new Set(compDados.flatMap((d) => d.porDia.map((p) => p.nome)))].sort();
                      return dias.map((dia) => {
                        const obj = { nome: dia };
                        compDados.forEach((d) => {
                          const found = d.porDia.find((p) => p.nome === dia);
                          if (found) obj[`#${d.hashtag}`] = found.valor;
                        });
                        return obj;
                      });
                    })()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="nome" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                      <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
                      <Tooltip />
                      <Legend />
                      {compDados.map((d, i) => (
                        <Bar key={d.hashtag} dataKey={`#${d.hashtag}`} fill={CORES[i % CORES.length]} radius={[4, 4, 0, 0]} />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
