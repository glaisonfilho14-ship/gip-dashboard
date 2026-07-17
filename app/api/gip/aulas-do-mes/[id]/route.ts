import { NextRequest, NextResponse } from "next/server";
import { buscarAulasDoMes, GipError, hojeNoBrasil } from "@/lib/gip";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const hoje = hojeNoBrasil();
  const [anoHoje, mesHoje] = hoje.split("-").map(Number);

  const ano = Number(req.nextUrl.searchParams.get("ano")) || anoHoje;
  const mes = Number(req.nextUrl.searchParams.get("mes")) || mesHoje;

  try {
    const dias = await buscarAulasDoMes(id, ano, mes);
    return NextResponse.json({ dias });
  } catch (err) {
    if (err instanceof GipError) {
      return NextResponse.json({ erro: err.message }, { status: err.status });
    }
    return NextResponse.json({ erro: "Erro inesperado" }, { status: 500 });
  }
}
