"use client";

import { useEffect, useState } from "react";
import type { DadosTurma, Aluno, DiaDoMes, Periodo, RegistroPresenca } from "@/lib/gip";

function formatarDiaMes(data: string) {
  const [, mes, dia] = data.split("-");
  return `${dia}/${mes}`;
}

function formatarDataCurta(iso: string) {
  const [ano, mes, dia] = iso.slice(0, 10).split("-");
  return `${dia}/${mes}/${ano.slice(2)}`;
}

function periodoAtual(periodo: Periodo) {
  const hoje = new Date();
  const inicio = new Date(periodo.start_date);
  const fim = new Date(periodo.end_date);
  return hoje >= inicio && hoje <= fim;
}

const ESCOLAS = [
  {
    nome: "João Belchior",
    turmas: ["4329", "4328", "3425"],
  },
  {
    nome: "Décio Martins",
    turmas: ["3255", "3252", "3264", "3263", "3262", "3261"],
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
  const [diasDoMes, setDiasDoMes] = useState<DiaDoMes[] | null>(null);
  const [periodos, setPeriodos] = useState<Periodo[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [somentePendentes, setSomentePendentes] = useState(false);
  const [aulaExpandida, setAulaExpandida] = useState<string | null>(null);
  const [presencasPorAula, setPresencasPorAula] = useState<
    Record<string, RegistroPresenca[]>
  >({});
  const [carregandoPresenca, setCarregandoPresenca] = useState<string | null>(null);

  function alternarAula(aulaId: string) {
    if (aulaExpandida === aulaId) {
      setAulaExpandida(null);
      return;
    }
    setAulaExpandida(aulaId);
    if (!presencasPorAula[aulaId]) {
      setCarregandoPresenca(aulaId);
      fetch(`/api/gip/presencas/${aulaId}`)
        .then((res) => res.json())
        .then((json) => {
          setPresencasPorAula((prev) => ({ ...prev, [aulaId]: json.items ?? [] }));
        })
        .finally(() => setCarregandoPresenca(null));
    }
  }

  useEffect(() => {
    setCarregando(true);
    setErro(null);
    setDados(null);
    setDiasDoMes(null);
    setPeriodos(null);
    setAulaExpandida(null);
    setPresencasPorAula({});

    Promise.all([
      fetch(`/api/gip/turma/${turmaId}`).then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.erro || "Erro ao carregar turma");
        return json as DadosTurma;
      }),
      fetch(`/api/gip/aulas-do-mes/${turmaId}`).then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.erro || "Erro ao carregar o mês");
        return json.dias as DiaDoMes[];
      }),
      fetch(`/api/gip/periodos/${turmaId}`).then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.erro || "Erro ao carregar planejamento");
        return (json.items?.sprint?.periods ?? []) as Periodo[];
      }),
    ])
      .then(([turma, dias, periodosDoSprint]) => {
        setDados(turma);
        setDiasDoMes(dias);
        setPeriodos(periodosDoSprint);
      })
      .catch((e) => setErro(e.message))
      .finally(() => setCarregando(false));
  }, [turmaId]);

  const escola = ESCOLAS[escolaIndex];
  const alunos = dados?.enrollments.map((e) => e.student) ?? [];

  const todasAsAulas = (diasDoMes ?? []).flatMap((dia) =>
    dia.aulas.map((aula) => ({ data: dia.data, aula })),
  );
  const chamadasFeitas = todasAsAulas.filter((a) => a.aula.attendance_given).length;
  const aulasExibidas = somentePendentes
    ? todasAsAulas.filter((a) => !a.aula.attendance_given)
    : todasAsAulas;

  const periodosFeitos = (periodos ?? []).filter((p) => p.plan?.document_link).length;

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

            <div className="mt-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Planejamento por período
              </h3>
              {!periodos || periodos.length === 0 ? (
                <p className="mt-2 text-sm text-neutral-500">
                  Nenhum período encontrado.
                </p>
              ) : (
                <>
                  <div className="mt-2">
                    <span className="rounded-lg bg-white/5 px-3 py-2 text-xs text-neutral-300">
                      <strong className="text-neutral-100">
                        {periodosFeitos}/{periodos.length}
                      </strong>{" "}
                      planejamentos feitos
                    </span>
                  </div>
                  <div className="mt-2 divide-y divide-white/10 rounded-xl ring-1 ring-inset ring-white/10">
                    {periodos.map((periodo) => {
                      const feito = Boolean(periodo.plan?.document_link);
                      const atual = periodoAtual(periodo);
                      return (
                        <div
                          key={periodo.id}
                          className={`flex flex-wrap items-center gap-2 px-4 py-2.5 ${
                            atual ? "bg-sky-500/[0.06]" : ""
                          }`}
                        >
                          <span className="min-w-0 flex-1 text-sm text-neutral-200">
                            {periodo.name}
                            {atual && (
                              <span className="ml-1.5 text-xs text-sky-400">(atual)</span>
                            )}
                          </span>
                          <span className="shrink-0 text-xs text-neutral-500">
                            {formatarDataCurta(periodo.start_date)}–
                            {formatarDataCurta(periodo.end_date)}
                          </span>
                          {feito ? (
                            <a
                              href={periodo.plan!.document_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="shrink-0 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/25"
                            >
                              Feito
                            </a>
                          ) : (
                            <span className="shrink-0 rounded-full bg-red-500/15 px-2.5 py-1 text-xs font-semibold text-red-300">
                              Pendente
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Chamadas do mês
                </h3>
                {todasAsAulas.length > 0 && (
                  <button
                    onClick={() => setSomentePendentes((v) => !v)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                      somentePendentes
                        ? "bg-amber-500/15 text-amber-300"
                        : "bg-white/5 text-neutral-400 hover:bg-white/10"
                    }`}
                  >
                    {somentePendentes ? "Mostrando só pendentes" : "Mostrar só pendentes"}
                  </button>
                )}
              </div>

              {!diasDoMes || diasDoMes.length === 0 ? (
                <p className="mt-2 text-sm text-neutral-500">
                  Nenhuma aula registrada neste mês.
                </p>
              ) : (
                <>
                  <div className="mt-2">
                    <span className="rounded-lg bg-white/5 px-3 py-2 text-xs text-neutral-300">
                      <strong className="text-neutral-100">
                        {chamadasFeitas}/{todasAsAulas.length}
                      </strong>{" "}
                      chamadas feitas
                    </span>
                  </div>

                  {aulasExibidas.length === 0 ? (
                    <p className="mt-2 text-sm text-neutral-500">
                      Nada pendente esse mês 🎉
                    </p>
                  ) : (
                    <div className="mt-2 divide-y divide-white/10 rounded-xl ring-1 ring-inset ring-white/10">
                      {aulasExibidas.map(({ data, aula }) => {
                        const expandida = aulaExpandida === aula.id;
                        const presencas = presencasPorAula[aula.id];
                        const presentes = (presencas ?? []).filter(
                          (p) => p.presence && p.student,
                        );
                        const ausentes = (presencas ?? []).filter(
                          (p) => !p.presence && p.student,
                        );

                        return (
                          <div key={aula.id}>
                            <button
                              onClick={() =>
                                aula.attendance_given && alternarAula(aula.id)
                              }
                              disabled={!aula.attendance_given}
                              className={`flex w-full flex-wrap items-center gap-2 px-4 py-2 text-left ${
                                aula.attendance_given ? "hover:bg-white/[0.03]" : ""
                              }`}
                            >
                              <span className="w-12 shrink-0 text-sm font-medium text-neutral-300">
                                {formatarDiaMes(data)}
                              </span>
                              <span className="w-24 shrink-0 text-xs text-neutral-500">
                                {aula.start_time.slice(0, 5)}–{aula.end_time.slice(0, 5)}
                              </span>
                              <span
                                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                  aula.attendance_given
                                    ? "bg-emerald-500/15 text-emerald-300"
                                    : "bg-red-500/15 text-red-300"
                                }`}
                              >
                                {aula.attendance_given
                                  ? "Chamada feita"
                                  : "Chamada pendente"}
                              </span>
                              {aula.attendance_given && (
                                <span className="ml-auto text-xs text-neutral-500">
                                  {expandida ? "▲" : "▼"}
                                </span>
                              )}
                            </button>

                            {expandida && (
                              <div className="bg-black/20 px-4 py-3">
                                {carregandoPresenca === aula.id ? (
                                  <p className="text-xs text-neutral-500">
                                    Carregando presenças...
                                  </p>
                                ) : (
                                  <div className="flex flex-col gap-3 sm:flex-row">
                                    <div className="flex-1">
                                      <p className="text-xs font-semibold text-emerald-400">
                                        Presentes ({presentes.length})
                                      </p>
                                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                                        {presentes.map((p) => (
                                          <span
                                            key={p.id}
                                            className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-300"
                                          >
                                            {p.student!.name}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                    <div className="flex-1">
                                      <p className="text-xs font-semibold text-red-400">
                                        Ausentes ({ausentes.length})
                                      </p>
                                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                                        {ausentes.map((p) => (
                                          <span
                                            key={p.id}
                                            className="rounded-full bg-red-500/10 px-2.5 py-1 text-xs text-red-300"
                                          >
                                            {p.student!.name}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>

            {dados.teachers.length > 0 && (
              <div className="mt-6">
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

            <div className="mt-6">
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
