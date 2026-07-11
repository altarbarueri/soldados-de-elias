import React, { useState } from "react";
import { Satellite, Mail, Lock, User, LogIn, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { login, register } from "../services/api";

export default function Login({ onLogin }) {
  const [modo, setModo] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error("Preencha email e senha");
      return;
    }
    if (modo === "register" && !form.name) {
      toast.error("Preencha seu nome");
      return;
    }

    setLoading(true);
    try {
      if (modo === "login") {
        const data = await login(form.email, form.password);
        if (data.error) {
          toast.error(data.error);
        } else if (data.autenticado) {
          onLogin(data.usuario);
        }
      } else {
        const data = await register(form.name, form.email, form.password);
        if (data.error) {
          toast.error(data.error);
        } else {
          toast.success("Conta criada! Faça login.");
          setModo("login");
        }
      }
    } catch (err) {
      toast.error("Erro de conexão com o servidor");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8 max-w-md w-full backdrop-blur-sm">
        <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Satellite className="w-8 h-8 text-blue-400" />
        </div>
        <h1 className="text-2xl font-bold text-slate-100 text-center mb-1">SOLDADOS DE ELIAS</h1>
        <p className="text-sm text-slate-400 text-center mb-2">Sistema Tático de Evangelismo</p>
        <p className="text-xs text-slate-500 text-center mb-8">Gere e gerencie mensagens evangelísticas com IA</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {modo === "register" && (
            <div>
              <label className="flex items-center gap-1.5 text-xs text-slate-300 mb-1">
                <User className="w-3 h-3 text-blue-400" /> Nome
              </label>
              <input
                type="text" name="name" placeholder="Seu nome" value={form.name}
                onChange={handleChange}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500/50"
              />
            </div>
          )}

          <div>
            <label className="flex items-center gap-1.5 text-xs text-slate-300 mb-1">
              <Mail className="w-3 h-3 text-blue-400" /> Email
            </label>
            <input
              type="email" name="email" placeholder="seu@email.com" value={form.email}
              onChange={handleChange}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500/50"
            />
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs text-slate-300 mb-1">
              <Lock className="w-3 h-3 text-blue-400" /> Senha
            </label>
            <input
              type="password" name="password" placeholder="Mínimo 4 caracteres" value={form.password}
              onChange={handleChange}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500/50"
            />
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? (
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            ) : modo === "login" ? (
              <LogIn className="w-4 h-4" />
            ) : (
              <UserPlus className="w-4 h-4" />
            )}
            {modo === "login" ? "Entrar" : "Criar Conta"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setModo(modo === "login" ? "register" : "login")}
            className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            {modo === "login"
              ? "Não tem conta? Cadastre-se"
              : "Já tem conta? Faça login"}
          </button>
        </div>
      </div>
    </div>
  );
}
