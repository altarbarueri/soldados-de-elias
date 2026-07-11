import React from "react";
import { Satellite, Gauge, Shield, TrendingUp, LogOut } from "lucide-react";

const icones = {
  comando: Gauge,
  quartel: Shield,
  relatorios: TrendingUp,
};

export default function Layout({ user, abas, abaAtiva, onAbaChange, onLogout, children }) {
  return (
    <>
      <nav className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-2">
              <Satellite className="w-5 h-5 text-blue-400" />
              <span className="font-bold text-sm hidden sm:block">SOLDADOS DE ELIAS</span>
              <span className="text-[10px] text-slate-500 hidden sm:block">Sistema Tático</span>
            </div>

            <div className="flex items-center gap-1">
              {abas.map((a) => {
                const Icon = icones[a.key];
                return (
                  <button
                    key={a.key}
                    onClick={() => onAbaChange(a.key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      abaAtiva === a.key
                        ? "bg-blue-600 text-white"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{a.desktopLabel}</span>
                    <span className="sm:hidden">{a.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 hidden sm:block">{user?.nome}</span>
              <button
                onClick={onLogout}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                <LogOut className="w-3 h-3" />
                <span className="hidden sm:inline">Sair</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </>
  );
}
