import React, { useState, useEffect, useCallback } from "react";
import { Search, Shield, Filter, Trash2, RefreshCw, Hash, Calendar, Loader2, CheckCircle, XCircle, Clock, Download } from "lucide-react";
import { toast } from "sonner";
import { buscarMensagens, deletarMensagem, deletarMensagens, exportarMensagens } from "../services/api";
import MessageCard from "./MessageCard";

const STATUS = [
  { value: "", label: "Todos" },
  { value: "Aprovada", label: "Aprovada", icon: CheckCircle },
  { value: "Pendente", label: "Pendente", icon: Clock },
  { value: "Rejeitada", label: "Rejeitada", icon: XCircle },
];

export default function QuartelGeneral({ user }) {
  const [mensagens, setMensagens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    status: "",
    tema: "",
    busca: "",
    dataInicio: "",
    dataFim: "",
  });
  const [selecionadas, setSelecionadas] = useState(new Set());
  const [excluindo, setExcluindo] = useState(false);

  const carregar = useCallback(async (f = filtros) => {
    setLoading(true);
    try {
      const data = await buscarMensagens(f);
      setMensagens(data.mensagens || []);
    } catch (err) {
      toast.error("Erro ao carregar mensagens");
      setMensagens([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, []);

  function handleFiltroChange(e) {
    const { name, value } = e.target;
    setFiltros((prev) => ({ ...prev, [name]: value }));
  }

  async function handleBuscar(e) {
    e.preventDefault();
    await carregar(filtros);
  }

  function handleSelecionar(id) {
    setSelecionadas((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleSelecionarTodas() {
    if (selecionadas.size === mensagens.length) {
      setSelecionadas(new Set());
    } else {
      setSelecionadas(new Set(mensagens.map((m) => m.id)));
    }
  }

  async function handleDeletarMensagem(id) {
    try {
      await deletarMensagem(id);
      setMensagens((prev) => prev.filter((m) => m.id !== id));
      toast.success("Mensagem excluída");
    } catch (err) {
      toast.error("Erro ao excluir");
    }
  }

  async function handleDeletarSelecionadas() {
    if (selecionadas.size === 0) return;
    setExcluindo(true);
    try {
      await deletarMensagens({ ids: Array.from(selecionadas) });
      setMensagens((prev) => prev.filter((m) => !selecionadas.has(m.id)));
      setSelecionadas(new Set());
      toast.success(`${selecionadas.size} mensagens excluídas`);
    } catch (err) {
      toast.error("Erro ao excluir mensagens");
    } finally {
      setExcluindo(false);
    }
  }

  async function handleReescreverMensagem(id) {
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-400" />
            Quartel General
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Gerencie o arsenal de mensagens ({mensagens.length} registros)
          </p>
        </div>
        <button
          onClick={handleDeletarSelecionadas}
          disabled={selecionadas.size === 0 || excluindo}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/20 text-red-300 text-xs font-medium rounded-lg border border-red-800/30 hover:bg-red-600/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {excluindo ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
          Excluir ({selecionadas.size})
        </button>
        <button
          onClick={exportarMensagens}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 text-emerald-300 text-xs font-medium rounded-lg border border-emerald-800/30 hover:bg-emerald-600/30 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          Exportar XLSX
        </button>
      </div>

      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
        <form onSubmit={handleBuscar} className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="text-[11px] text-slate-400 mb-1 block">Buscar</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text" name="busca" placeholder="Pesquisar no conteúdo..."
                value={filtros.busca} onChange={handleFiltroChange}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500/50"
              />
            </div>
          </div>
          <div>
            <label className="text-[11px] text-slate-400 mb-1 block">Status</label>
            <select
              name="status" value={filtros.status} onChange={handleFiltroChange}
              className="bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50"
            >
              {STATUS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[11px] text-slate-400 mb-1 block">Tema</label>
            <input
              type="text" name="tema" placeholder="Filtrar por tema"
              value={filtros.tema} onChange={handleFiltroChange}
              className="bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500/50 w-36"
            />
          </div>
          <div>
            <label className="text-[11px] text-slate-400 mb-1 block">
              <Calendar className="w-3 h-3 inline mr-1" />
              De
            </label>
            <input
              type="date" name="dataInicio" value={filtros.dataInicio} onChange={handleFiltroChange}
              className="bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50"
            />
          </div>
          <div>
            <label className="text-[11px] text-slate-400 mb-1 block">Até</label>
            <input
              type="date" name="dataFim" value={filtros.dataFim} onChange={handleFiltroChange}
              className="bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50"
            />
          </div>
          <button
            type="submit"
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Filter className="w-3.5 h-3.5" />
            Filtrar
          </button>
          <button
            type="button" onClick={() => carregar()}
            className="flex items-center gap-1.5 px-3 py-2 text-slate-400 hover:text-slate-200 text-sm rounded-lg transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Limpar
          </button>
        </form>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
        </div>
      ) : mensagens.length === 0 ? (
        <div className="bg-slate-800/30 border-2 border-dashed border-slate-700/50 rounded-xl p-8 text-center">
          <Shield className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-sm text-slate-500">Nenhuma mensagem encontrada</p>
          <p className="text-xs text-slate-600 mt-1">Use a Central de Comando para gerar novas mensagens</p>
        </div>
      ) : (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <label className="flex items-center gap-1.5 text-xs text-slate-400">
              <input
                type="checkbox"
                checked={selecionadas.size === mensagens.length && mensagens.length > 0}
                onChange={handleSelecionarTodas}
                className="rounded border-slate-600 bg-slate-800"
              />
              Selecionar todas ({mensagens.length})
            </label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {mensagens.map((msg) => (
              <div key={msg.id} className="relative group">
                <label className="absolute top-2 left-2 z-10">
                  <input
                    type="checkbox"
                    checked={selecionadas.has(msg.id)}
                    onChange={() => handleSelecionar(msg.id)}
                    className="rounded border-slate-600 bg-slate-800 opacity-0 group-hover:opacity-100 checked:opacity-100 transition-opacity"
                  />
                </label>
                <MessageCard
                  msg={msg}
                  onRemover={() => handleDeletarMensagem(msg.id)}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
