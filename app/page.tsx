"use client";

import { useEffect, useState, type ReactNode } from "react";
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

const icones = {
  planejamento: (
    <svg viewBox="0 0 20 20" className="h-4 w-4 fill-none stroke-current">
      <rect x="2.5" y="4" width="15" height="13.5" rx="2" strokeWidth="1.6" />
      <path strokeWidth="1.6" strokeLinecap="round" d="M2.5 8h15M7 2.2v3M13 2.2v3" />
    </svg>
  ),
  chamada: (
    <svg viewBox="0 0 20 20" className="h-4 w-4 fill-none stroke-current">
      <path
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 10.5l3.5 3.5L16 5.5"
      />
    </svg>
  ),
  alunos: (
    <svg viewBox="0 0 20 20" className="h-4 w-4 fill-none stroke-current">
      <circle cx="7" cy="6.5" r="2.5" strokeWidth="1.6" />
      <path
        strokeWidth="1.6"
        strokeLinecap="round"
        d="M2 17c0-3 2.2-5 5-5s5 2 5 5"
      />
      <circle cx="14.5" cy="7.5" r="2" strokeWidth="1.5" />
      <path strokeWidth="1.5" strokeLinecap="round" d="M13 17c0-2.2 1.3-4 3.5-4" />
    </svg>
  ),
  professor: (
    <svg viewBox="0 0 20 20" className="h-4 w-4 fill-none stroke-current">
      <path
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.5 6.5 10 3l7.5 3.5L10 10 2.5 6.5Z"
      />
      <path strokeWidth="1.6" strokeLinecap="round" d="M5.5 8.3v4c0 1.5 2 2.7 4.5 2.7s4.5-1.2 4.5-2.7v-4" />
    </svg>
  ),
};

function Secao({
  titulo,
  icone,
  acao,
  resumo,
  children,
}: {
  titulo: string;
  icone: ReactNode;
  acao?: ReactNode;
  resumo?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-white/[0.03] p-4 ring-1 ring-inset ring-white/10 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
          <span className="text-neutral-400">{icone}</span>
          {titulo}
        </h3>
        {acao}
      </div>
      {resumo && <div className="mt-3">{resumo}</div>}
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Contador({ feitos, total, rotulo }: { feitos: number; total: number; rotulo: string }) {
  const completo = total > 0 && feitos === total;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium ${
        completo ? "bg-emerald-500/10 text-emerald-300" : "bg-white/5 text-neutral-300"
      }`}
    >
      <strong className={completo ? "text-emerald-200" : "text-neutral-100"}>
        {feitos}/{total}
      </strong>
      {rotulo}
    </span>
  );
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
  const [todosPeriodos, setTodosPeriodos] = useState(false);
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
    setSomentePendentes(false);
    setTodosPeriodos(false);

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
  const periodosExibidos = todosPeriodos
    ? periodos ?? []
    : (periodos ?? []).filter((p) => !p.plan?.document_link || periodoAtual(p));

  return (
    <main className="mx-auto flex min-h-full w-full max-w-3xl flex-col px-4 py-6 sm:py-8">
      <header>
        <h1 className="text-lg font-semibold text-white">GIP Dashboard</h1>
        <p className="text-xs text-neutral-500">Acompanhamento em tempo real das turmas</p>
      </header>

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

      <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1">
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

      <div className="mt-5 flex flex-col gap-4">
        {carregando && (
          <div className="rounded-2xl bg-white/[0.03] p-5 text-sm text-neutral-500 ring-1 ring-inset ring-white/10">
            Carregando...
          </div>
        )}

        {erro && (
          <div className="rounded-2xl bg-red-500/10 p-4 text-sm text-red-300 ring-1 ring-inset ring-red-500/25">
            {erro}
          </div>
        )}

        {dados && (
          <>
            <section className="rounded-2xl bg-gradient-to-br from-emerald-500/10 to-transparent p-4 ring-1 ring-inset ring-emerald-500/20 sm:p-5">
              <h2 className="text-xl font-semibold text-white">{dados.name}</h2>
              <div className="mt-2 flex flex-wrap gap-4 text-sm text-neutral-400">
                <span className="flex items-center gap-1.5">
                  <span className="text-neutral-500">{icones.alunos}</span>
                  {alunos.length} alunos
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="text-neutral-500">{icones.professor}</span>
                  {dados.teachers.map((p) => p.name).join(", ") || "—"}
                </span>
              </div>
            </section>

            <Secao
              titulo="Planejamento por período"
              icone={icones.planejamento}
              resumo={
                periodos && periodos.length > 0 ? (
                  <Contador
                    feitos={periodosFeitos}
                    total={periodos.length}
                    rotulo="planejamentos feitos"
                  />
                ) : undefined
              }
              acao={
                periodos && periodos.length > 0 ? (
                  <button
                    onClick={() => setTodosPeriodos((v) => !v)}
                    className="rounded-full bg-white/5 px-3 py-1 text-xs font-semibold text-neutral-400 transition-colors hover:bg-white/10"
                  >
                    {todosPeriodos ? "Ver só pendentes" : "Ver todos"}
                  </button>
                ) : undefined
              }
            >
              {!periodos || periodos.length === 0 ? (
                <p className="text-sm text-neutral-500">Nenhum período encontrado.</p>
              ) : (
                <div className="-mx-4 divide-y divide-white/10 sm:-mx-5">
                  {periodosExibidos.map((periodo) => {
                    const feito = Boolean(periodo.plan?.document_link);
                    const atual = periodoAtual(periodo);
                    return (
                      <div
                        key={periodo.id}
                        className={`flex flex-wrap items-center gap-2 px-4 py-2.5 sm:px-5 ${
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
              )}
            </Secao>

            <Secao
              titulo="Chamadas do mês"
              icone={icones.chamada}
              resumo={
                diasDoMes && diasDoMes.length > 0 ? (
                  <Contador
                    feitos={chamadasFeitas}
                    total={todasAsAulas.length}
                    rotulo="chamadas feitas"
                  />
                ) : undefined
              }
              acao={
                todasAsAulas.length > 0 ? (
                  <button
                    onClick={() => setSomentePendentes((v) => !v)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                      somentePendentes
                        ? "bg-amber-500/15 text-amber-300"
                        : "bg-white/5 text-neutral-400 hover:bg-white/10"
                    }`}
                  >
                    {somentePendentes ? "Só pendentes" : "Ver pendentes"}
                  </button>
                ) : undefined
              }
            >
              {!diasDoMes || diasDoMes.length === 0 ? (
                <p className="text-sm text-neutral-500">Nenhuma aula registrada neste mês.</p>
              ) : aulasExibidas.length === 0 ? (
                <p className="text-sm text-neutral-500">Nada pendente esse mês 🎉</p>
              ) : (
                <div className="-mx-4 divide-y divide-white/10 sm:-mx-5">
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
                          onClick={() => aula.attendance_given && alternarAula(aula.id)}
                          disabled={!aula.attendance_given}
                          className={`flex w-full flex-wrap items-center gap-2 px-4 py-2.5 text-left sm:px-5 ${
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
                            {aula.attendance_given ? "Feita" : "Pendente"}
                          </span>
                          {aula.attendance_given && (
                            <span className="ml-auto text-xs text-neutral-500">
                              {expandida ? "▲" : "▼"}
                            </span>
                          )}
                        </button>

                        {expandida && (
                          <div className="bg-black/20 px-4 py-3 sm:px-5">
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
            </Secao>

            <Secao titulo="Alunos" icone={icones.alunos}>
              <div className="-mx-4 divide-y divide-white/10 sm:-mx-5">
                {alunos.map((aluno) => {
                  const { total, concluidas } = resumoAluno(aluno);
                  return (
                    <div
                      key={aluno.id}
                      className="flex items-center justify-between gap-3 px-4 py-2.5 sm:px-5"
                    >
                      <span className="text-sm text-neutral-200">{aluno.name}</span>
                      <span className="shrink-0 rounded-full bg-white/5 px-2.5 py-1 text-xs font-medium text-neutral-400">
                        {concluidas}/{total} trilhas
                      </span>
                    </div>
                  );
                })}
              </div>
            </Secao>
          </>
        )}
      </div>
    </main>
  );
}
