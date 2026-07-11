import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

export async function getUser() {
  const res = await fetch("/auth/user", { credentials: "include" });
  return res.json();
}

export async function login(email, password) {
  const res = await fetch("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });
  return res.json();
}

export async function register(name, email, password) {
  const res = await fetch("/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ name, email, password }),
  });
  return res.json();
}

export async function logout() {
  await fetch("/auth/logout", { credentials: "include" });
}

export async function gerarMensagens(config) {
  const res = await api.post("/mensagens/gerar", config);
  return res.data;
}

export async function salvarMensagens(mensagens) {
  const res = await api.post("/mensagens/salvar", { mensagens });
  return res.data;
}

export async function buscarMensagens(filtros = {}) {
  const params = new URLSearchParams();
  if (filtros.status) params.set("status", filtros.status);
  if (filtros.tema) params.set("tema", filtros.tema);
  if (filtros.busca) params.set("busca", filtros.busca);
  if (filtros.dataInicio) params.set("dataInicio", filtros.dataInicio);
  if (filtros.dataFim) params.set("dataFim", filtros.dataFim);
  const res = await api.get(`/mensagens/buscar?${params}`);
  return res.data;
}

export async function deletarMensagem(id) {
  const res = await api.delete(`/mensagens/${id}`);
  return res.data;
}

export async function deletarMensagens(ids) {
  const res = await api.post("/mensagens/deletar", { ids });
  return res.data;
}

export async function getStats() {
  const res = await api.get("/mensagens/stats");
  return res.data;
}

export async function getRelatorios(filtros = {}) {
  const params = new URLSearchParams();
  if (filtros.periodo) params.set("periodo", filtros.periodo);
  if (filtros.dataInicio) params.set("dataInicio", filtros.dataInicio);
  if (filtros.dataFim) params.set("dataFim", filtros.dataFim);
  if (filtros.hashtag) params.set("hashtag", filtros.hashtag);
  if (filtros.hashtags) params.set("hashtags", filtros.hashtags);
  if (filtros.incluirArquivadas) params.set("incluirArquivadas", "true");
  const res = await api.get(`/mensagens/relatorios?${params}`);
  return res.data;
}

export async function arquivarMensagem(id) {
  const res = await api.post(`/mensagens/${id}/arquivar`);
  return res.data;
}

export async function arquivarMensagens(ids) {
  const res = await api.post("/mensagens/arquivar", { ids });
  return res.data;
}

export async function desarquivarMensagem(id) {
  const res = await api.post(`/mensagens/${id}/desarquivar`);
  return res.data;
}

export async function desarquivarMensagens(ids) {
  const res = await api.post("/mensagens/desarquivar", { ids });
  return res.data;
}

export async function getComparativo(hashtags) {
  const res = await api.get(`/mensagens/comparativo?hashtags=${encodeURIComponent(hashtags)}`);
  return res.data;
}

export async function deletarPorHashtag(hashtags) {
  const res = await api.post("/mensagens/deletar/hashtag", { hashtags });
  return res.data;
}

export async function deletarPorPeriodo(dataInicio, dataFim) {
  const res = await api.post("/mensagens/deletar/periodo", { dataInicio, dataFim });
  return res.data;
}

export async function deletarTodas() {
  const res = await api.post("/mensagens/deletar/todas");
  return res.data;
}

export async function exportarMensagens() {
  const res = await api.get("/mensagens/exportar", { responseType: "blob" });
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const a = document.createElement("a");
  a.href = url;
  a.download = `mensagens-${new Date().toISOString().split("T")[0]}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export default api;
