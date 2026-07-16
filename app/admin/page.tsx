"use client";

import { useState } from "react";

export default function Admin() {
  const [senha, setSenha] = useState("");
  const [token, setToken] = useState("");
  const [status, setStatus] = useState<"idle" | "salvando" | "ok" | "erro">("idle");
  const [mensagem, setMensagem] = useState("");

  async function salvar() {
    setStatus("salvando");
    try {
      const res = await fetch("/api/admin/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senha, token }),
      });
      const data = await res.json();
      if (data.ok) {
        setStatus("ok");
        setMensagem("Token salvo com sucesso.");
        setToken("");
      } else {
        setStatus("erro");
        setMensagem(data.erro || "Erro ao salvar.");
      }
    } catch {
      setStatus("erro");
      setMensagem("Erro de conexão.");
    }
  }

  return (
    <main className="mx-auto flex min-h-full max-w-md flex-col justify-center px-4 py-12">
      <h1 className="text-xl font-semibold text-white">Atualizar acesso ao GIP</h1>
      <p className="mt-2 text-sm text-neutral-400">
        Cole aqui o token atual copiado do DevTools (cabeçalho Authorization, sem a
        palavra &quot;Bearer&quot;).
      </p>

      <label className="mt-6 block text-xs font-medium text-neutral-500">Senha</label>
      <input
        type="password"
        value={senha}
        onChange={(e) => setSenha(e.target.value)}
        className="mt-1 w-full rounded-lg bg-white/5 px-3 py-2 text-sm text-neutral-200 ring-1 ring-inset ring-white/10 focus:outline-none focus:ring-white/25"
      />

      <label className="mt-4 block text-xs font-medium text-neutral-500">Token</label>
      <textarea
        value={token}
        onChange={(e) => setToken(e.target.value)}
        rows={4}
        className="mt-1 w-full resize-none rounded-lg bg-white/5 px-3 py-2 text-xs text-neutral-200 ring-1 ring-inset ring-white/10 focus:outline-none focus:ring-white/25"
      />

      <button
        onClick={salvar}
        disabled={status === "salvando" || !senha || !token}
        className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-neutral-800 disabled:text-neutral-500"
      >
        {status === "salvando" ? "Salvando..." : "Salvar token"}
      </button>

      {mensagem && (
        <p
          className={`mt-3 text-sm ${status === "ok" ? "text-emerald-400" : "text-red-400"}`}
        >
          {mensagem}
        </p>
      )}
    </main>
  );
}
