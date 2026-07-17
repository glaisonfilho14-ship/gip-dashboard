import { obterToken } from "./token";

export type TrilhaAluno = {
  status: string;
  block_id: number;
  level_id: number;
  trail_id: number;
  block_name: string;
  level_name: string;
};

export type AlunoTurma = {
  id: number;
  name: string;
  age_group: string | null;
  school_grade: string | null;
  status: string;
  completed_trails: TrilhaAluno[];
};

export type DadosTurma = {
  id: number;
  name: string;
  type: string;
  start_date: string;
  students: AlunoTurma[];
};

export class GipError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function buscarTurma(turmaId: string): Promise<DadosTurma> {
  const token = await obterToken();

  if (!token) {
    throw new GipError(401, "Nenhum token configurado. Acesse /admin para configurar.");
  }

  const bearer = token.startsWith("Bearer ") ? token : `Bearer ${token}`;

  const res = await fetch(`https://lms-production-api.alicerceedu.com/class/${turmaId}`, {
    headers: {
      Authorization: bearer,
      Origin: "https://gip.eduquest.dev",
      Referer: "https://gip.eduquest.dev/",
    },
    cache: "no-store",
  });

  if (res.status === 401 || res.status === 403) {
    throw new GipError(res.status, "Token expirado ou inválido. Acesse /admin para atualizar.");
  }

  if (!res.ok) {
    const corpo = await res.text().catch(() => "");
    throw new GipError(
      res.status,
      `Erro ao buscar turma: ${res.status} ${corpo.slice(0, 300)}`,
    );
  }

  return res.json();
}
