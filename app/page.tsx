"use client";

import { useEffect, useState } from "react";
import type { DadosTurma, Aluno } from "@/lib/gip";

const ESCOLAS = [
  {
    nome: "João Belchior",
    turmas: ["4329", "4328", "3425"],
  },
  {
    nome: "Décio Martins",
    turmas: ["3255", "3252", "3264", "3263", "3462", "3261"],
  },
];

function resumoAluno(aluno: Aluno) {
  const total = aluno.completed_trails.length;
  const concluidas = aluno.completed_trails.filter(
    (t) => t.status === "completed",
  ).length;
  return { total, concluidas };
}

export default function Home() {
  const [escolaIndex, setEscolaIndex] = useState(0);
  const [turmaId, setTurmaId] = useState(ESCOLAS[0].turmas[0]);
  const [dados, setDados] = useState<DadosTurma | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    setCarregando(true);
    setErro(null);
    setDados(null);

    fetch(`/api/gip/turma/${turmaId}`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.erro || "Erro ao carregar");
        setDados(json);
      })
      .catch((e) => setErro(e.message))
      .finally(() => setCarregando(false));
  }, [turmaId]);

  const escola = ESCOLAS[escolaIndex];
  const alunos = dados?.enrollments.map((e) => e.student) ?? [];

  return (
    <main className="mx-auto flex min-h-full w-full max-w-3xl flex-col px-4 py-8">
      <h1 className="text-lg font-semibold text-white">GIP Dashboard</h1>

      <div className="mt-4 flex gap-1.5 overflow-x-auto rounded-xl bg-white/[0.03] p-1.5 ring-1 ring-inset ring-white/10">
        {ESCOLAS.map((e, i) => (
          <button
            key={e.nome}
            onClick={() => {
              setEscolaIndex(i);
              setTurmaId(e.turmas[0]);
            }}
            className={`shrink-0 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
              i === escolaIndex
                ? "bg-white/10 text-white"
                : "text-neutral-400 hover:bg-white/5"
            }`}
          >
            {e.nome}
          </button>
        ))}
      </div>

      <div className="mt-2 flex gap-1.5 overflow-x-auto">
        {escola.turmas.map((id) => (
          <button
            key={id}
            onClick={() => setTurmaId(id)}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              id === turmaId
                ? "bg-emerald-600 text-white"
                : "bg-white/5 text-neutral-400 hover:bg-white/10"
            }`}
          >
            Turma {id}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {carregando && <p className="text-sm text-neutral-500">Carregando...</p>}

        {erro && (
          <div className="rounded-xl bg-red-500/10 p-4 text-sm text-red-300 ring-1 ring-inset ring-red-500/25">
            {erro}
          </div>
        )}

        {dados && (
          <div>
            <h2 className="text-xl font-semibold text-white">{dados.name}</h2>

            <div className="mt-2 flex gap-4 text-sm text-neutral-500">
              <span>{alunos.length} alunos</span>
              <span>{dados.teachers.length} professores</span>
            </div>

            {dados.teachers.length > 0 && (
              <div className="mt-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Professores
                </h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {dados.teachers.map((prof) => (
                    <span
                      key={prof.id}
                      className="rounded-lg bg-sky-500/10 px-3 py-1.5 text-sm text-sky-300 ring-1 ring-inset ring-sky-500/25"
                    >
                      {prof.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Alunos
              </h3>
              <div className="mt-2 divide-y divide-white/10 rounded-xl ring-1 ring-inset ring-white/10">
                {alunos.map((aluno) => {
                  const { total, concluidas } = resumoAluno(aluno);
                  return (
                    <div
                      key={aluno.id}
                      className="flex items-center justify-between gap-3 px-4 py-3"
                    >
                      <span className="text-sm text-neutral-200">{aluno.name}</span>
                      <span className="shrink-0 rounded-full bg-white/5 px-2.5 py-1 text-xs font-medium text-neutral-400">
                        {concluidas}/{total} trilhas
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
