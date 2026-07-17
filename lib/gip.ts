import { obterToken } from "./token";

export type TrilhaAluno = {
  status: string;
  block_id: number;
  level_id: number;
  trail_id: number;
  block_name: string;
  level_name: string;
  trail_name: string;
};

export type Aluno = {
  id: string;
  name: string;
  age_group: string | null;
  school_grade: string | null;
  status: string;
  completed_trails: TrilhaAluno[];
};

export type Enrollment = {
  id: string;
  student: Aluno;
};

export type Professor = {
  id: string;
  name: string;
  status: string;
};

export type DadosTurma = {
  id: number;
  name: string;
  type: string;
  start_date: string;
  expected_students: string;
  teachers: Professor[];
  enrollments: Enrollment[];
};

export type AulaDoDia = {
  id: string;
  class_id: string;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  attendance_given: boolean;
  plan: unknown | null;
};

export type AulasDoDiaResponse = {
  totalItems: number;
  items: AulaDoDia[];
};

export class GipError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function chamarApiGip(path: string): Promise<Response> {
  const token = await obterToken();

  if (!token) {
    throw new GipError(401, "Nenhum token configurado. Acesse /admin para configurar.");
  }

  const bearer = token.startsWith("Bearer ") ? token : `Bearer ${token}`;

  const res = await fetch(`https://lms-production-api.alicerceedu.com${path}`, {
    headers: {
      Authorization: bearer,
      Origin: "https://gip.eduquest.dev",
      Referer: "https://gip.eduquest.dev/",
      Accept: "application/json, text/plain, */*",
      "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
      "User-Agent":
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36",
    },
    cache: "no-store",
  });

  if (res.status === 401 || res.status === 403) {
    throw new GipError(res.status, "Token expirado ou inválido. Acesse /admin para atualizar.");
  }

  if (!res.ok) {
    const corpo = await res.text().catch(() => "");
    throw new GipError(res.status, `Erro na API do GIP: ${res.status} ${corpo.slice(0, 300)}`);
  }

  return res;
}

export async function buscarTurma(turmaId: string): Promise<DadosTurma> {
  const res = await chamarApiGip(`/class/${turmaId}`);
  return res.json();
}

export function hojeNoBrasil(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
}

export async function buscarAulasDoDia(
  turmaId: string,
  data: string,
): Promise<AulasDoDiaResponse> {
  const res = await chamarApiGip(
    `/daily-class?order=dc.start_time&size=9999&class_id=${turmaId}&date=${data}`,
  );
  return res.json();
}

export type DiaDoMes = {
  data: string;
  aulas: AulaDoDia[];
};

export async function buscarAulasDoMes(
  turmaId: string,
  ano: number,
  mes: number,
): Promise<DiaDoMes[]> {
  const diasNoMes = new Date(ano, mes, 0).getDate();
  const datas = Array.from(
    { length: diasNoMes },
    (_, i) => `${ano}-${String(mes).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`,
  );

  const resultados = await Promise.all(
    datas.map((data) =>
      buscarAulasDoDia(turmaId, data).catch(() => ({ totalItems: 0, items: [] })),
    ),
  );

  return datas
    .map((data, i) => ({ data, aulas: resultados[i].items }))
    .filter((dia) => dia.aulas.length > 0);
}
