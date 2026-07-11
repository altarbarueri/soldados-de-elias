import React, { useState, useEffect } from "react";
import { getUser, logout } from "./services/api";
import Login from "./components/Login";
import Layout from "./components/Layout";
import CentralComando from "./components/CentralComando";
import QuartelGeneral from "./components/QuartelGeneral";
import Relatorios from "./components/Relatorios";
import SharedView from "./components/SharedView";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aba, setAba] = useState("comando");
  const [mensagensGeradas, setMensagensGeradas] = useState([]);

  const isShared = typeof window !== "undefined" && window.location.pathname === "/soldados";

  useEffect(() => {
    if (isShared) return;
    (async () => {
      try {
        const data = await getUser();
        if (data.autenticado) setUser(data.usuario);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleLogout() {
    await logout();
    setUser(null);
  }

  if (isShared) {
    return <SharedView />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) return <Login onLogin={setUser} />;

  const abas = [
    { key: "comando", label: "Comando", desktopLabel: "Central de Comando" },
    { key: "quartel", label: "Quartel", desktopLabel: "Quartel General" },
    { key: "relatorios", label: "Relatórios", desktopLabel: "Relatórios" },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <Layout user={user} abas={abas} abaAtiva={aba} onAbaChange={setAba} onLogout={handleLogout}>
        {aba === "comando" && (
          <CentralComando
            user={user}
            mensagensGeradas={mensagensGeradas}
            onMensagensChange={setMensagensGeradas}
          />
        )}
        {aba === "quartel" && <QuartelGeneral user={user} />}
        {aba === "relatorios" && <Relatorios />}
      </Layout>
    </div>
  );
}
