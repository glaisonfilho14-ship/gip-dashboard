import { NextRequest, NextResponse } from "next/server";
import { buscarTurma, GipError } from "@/lib/gip";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const dados = await buscarTurma(id);
    return NextResponse.json(dados);
  } catch (err) {
    if (err instanceof GipError) {
      return NextResponse.json({ erro: err.message }, { status: err.status });
    }
    return NextResponse.json({ erro: "Erro inesperado" }, { status: 500 });
  }
}
