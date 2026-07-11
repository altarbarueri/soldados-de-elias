import React, { useState, useEffect } from "react";
import { Satellite, Search, Copy, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function SharedView() {
  const [mensagens, setMensagens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [utilizando, setUtilizando] = useState(null);

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    try {
      const res = await fetch("/api/mensagens/publicas");
      const data = await res.json();
      setMensagens(data.mensagens || []);
    } catch {
      setMensagens([]);
    } finally {
      setLoading(false);
    }
  }

  const filtradas = busca
    ? mensagens.filter((m) =>
        m.conteudo.toLowerCase().includes(busca.toLowerCase()) ||
        (m.tema && m.tema.toLowerCase().includes(busca.toLowerCase())) ||
        (m.hashtag && m.hashtag.toLowerCase().includes(busca.toLowerCase()))
      )
    : mensagens;

  const ordenadas = [
    ...filtradas.filter((m) => m.status !== "Utilizada"),
    ...filtradas.filter((m) => m.status === "Utilizada"),
  ];

  async function handleCopiar(msg) {
    const texto = `${msg.conteudo}\n\n#${msg.hashtag || "JesusEstaVoltando"}`;

    setUtilizando(msg.id);
    try {
      await navigator.clipboard.writeText(texto);
      if (msg.status !== "Utilizada") {
        await fetch(`/api/mensagens/${msg.id}/utilizar`, { method: "POST" });
      }
      setMensagens((prev) => {
        const updated = prev.map((m) => (m.id === msg.id ? { ...m, status: "Utilizada" } : m));
        return [
          ...updated.filter((m) => m.status !== "Utilizada"),
          ...updated.filter((m) => m.status === "Utilizada"),
        ];
      });
      if (msg.status !== "Utilizada") {
        toast.success("Mensagem copiada e marcada como Utilizada!");
      }
    } catch {
      toast.error("Erro ao copiar");
    } finally {
      setUtilizando(null);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-blue-600/20 rounded-2xl flex items-center justify-center mx-auto mb-2">
            <Satellite className="w-6 h-6 text-blue-400" />
          </div>
          <h1 className="text-lg font-bold text-slate-100">SOLDADOS DE ELIAS</h1>
          <p className="text-xs text-slate-400">Banco de Mensagens</p>
          <div className="flex items-center justify-center gap-4 mt-1.5">
            <span className="text-[11px] text-emerald-400">{mensagens.filter((m) => m.status !== "Utilizada").length} disponíveis</span>
            <span className="text-[11px] text-slate-600">|</span>
            <span className="text-[11px] text-slate-500">{mensagens.filter((m) => m.status === "Utilizada").length} utilizadas</span>
          </div>
        </div>

        <div className="relative mb-4">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar mensagens..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full bg-slate-800/50 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500/50"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
          </div>
        ) : filtradas.length === 0 ? (
          <div className="bg-slate-800/30 border-2 border-dashed border-slate-700/50 rounded-xl p-8 text-center">
            <p className="text-sm text-slate-500">
              {busca ? "Nenhuma mensagem encontrada" : "Nenhuma mensagem disponível"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {ordenadas.map((msg) => {
              const jaUtilizada = msg.status === "Utilizada";
              return (
                <div
                  key={msg.id}
                  onClick={() => handleCopiar(msg)}
                  className={`rounded-lg p-3 border transition-all cursor-pointer select-none ${
                    jaUtilizada
                      ? "bg-slate-800/10 border-slate-700/10 opacity-50 hover:opacity-70"
                      : "bg-slate-800/40 border-slate-700/40 hover:border-blue-600/40 hover:bg-slate-800/60"
                  }`}
                >
                  <p className={`text-xs leading-relaxed whitespace-pre-wrap line-clamp-3 ${
                    jaUtilizada ? "text-slate-600" : "text-slate-200"
                  }`}>
                    {msg.conteudo}
                  </p>
                  <div className="mt-2 flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {msg.tema && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ${
                          jaUtilizada
                            ? "bg-slate-700/20 text-slate-600"
                            : "bg-blue-900/30 text-blue-300"
                        }`}>
                          {msg.tema}
                        </span>
                      )}
                      <span className={`text-[10px] truncate ${jaUtilizada ? "text-slate-600" : "text-slate-500"}`}>
                        #{msg.hashtag || "JesusEstaVoltando"}
                      </span>
                    </div>
                    {utilizando === msg.id ? (
                      <Loader2 className="w-3 h-3 animate-spin text-emerald-400 shrink-0" />
                    ) : jaUtilizada ? (
                      <CheckCircle className="w-3 h-3 text-slate-600 shrink-0" />
                    ) : (
                      <Copy className="w-3 h-3 text-emerald-400/70 shrink-0" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
