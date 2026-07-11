import React, { useState } from "react";
import { Copy, Trash2, CheckCircle, Pencil, X, Save } from "lucide-react";
import { toast } from "sonner";

export default function MessageCard({ msg, onRemover, onAprovar, onEditar, selecionada, onToggleSelecao }) {
  const [editando, setEditando] = useState(false);
  const [editado, setEditado] = useState(msg.conteudo);

  function handleCopiar() {
    const texto = `${msg.conteudo}\n\n#${msg.hashtag || "JesusEstaVoltando"}`;
    navigator.clipboard.writeText(texto).then(() => {
      toast.success("Mensagem copiada com hashtag!");
    }).catch(() => {
      toast.error("Erro ao copiar");
    });
  }

  function handleSalvarEdicao() {
    if (!editado.trim()) {
      toast.error("A mensagem não pode ficar vazia");
      return;
    }
    onEditar(msg.id, editado);
    setEditando(false);
    toast.success("Mensagem editada!");
  }

  function handleCancelar() {
    setEditado(msg.conteudo);
    setEditando(false);
  }

  return (
    <div className={`bg-slate-800/50 border rounded-xl p-4 transition-colors group ${
      selecionada ? "border-blue-500/50 bg-slate-800/80" : "border-slate-700/50 hover:border-slate-600/50"
    }`}>
      {editando ? (
        <textarea
          value={editado}
          onChange={(e) => setEditado(e.target.value)}
          className="w-full bg-slate-900/70 border border-blue-500/50 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-400 resize-none min-h-[100px]"
          autoFocus
        />
      ) : (
        <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">{msg.conteudo}</p>
      )}

      {msg.versiculos && msg.versiculos.length > 0 && !editando && (
        <div className="mt-2 flex flex-wrap gap-1">
          {msg.versiculos.map((v, i) => (
            <span
              key={i}
              className="text-[11px] bg-emerald-900/30 text-emerald-300 px-2 py-0.5 rounded-full"
            >
              {v}
            </span>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {onToggleSelecao && (
            <input
              type="checkbox"
              checked={!!selecionada}
              onChange={() => onToggleSelecao(msg.id)}
              className="rounded border-slate-600 bg-slate-800"
            />
          )}
          <span className="text-[11px] text-slate-500">#{msg.hashtag || "JesusEstaVoltando"}</span>
        </div>
        <div className="flex items-center gap-1">
          {editando ? (
            <>
              <button
                onClick={handleSalvarEdicao}
                className="p-1.5 rounded-lg text-emerald-400 hover:text-emerald-300 hover:bg-emerald-900/20 transition-colors"
                title="Salvar edição"
              >
                <Save className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleCancelar}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-colors"
                title="Cancelar edição"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleCopiar}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-colors"
                title="Copiar com hashtag"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              {onEditar && (
                <button
                  onClick={() => { setEditado(msg.conteudo); setEditando(true); }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-900/20 transition-colors"
                  title="Editar mensagem"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}
              {onAprovar && (
                <button
                  onClick={() => onAprovar(msg)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-emerald-900/20 transition-colors"
                  title="Aprovar individualmente"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                </button>
              )}
              {onRemover && (
                <button
                  onClick={() => onRemover(msg.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-900/20 transition-colors"
                  title="Remover"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
