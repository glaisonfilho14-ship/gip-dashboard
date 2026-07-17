import { NextRequest, NextResponse } from "next/server";
import { buscarAulasDoDia, GipError, hojeNoBrasil } from "@/lib/gip";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const data = req.nextUrl.searchParams.get("data") || hojeNoBrasil();

  try {
    const dados = await buscarAulasDoDia(id, data);
    return NextResponse.json(dados);
  } catch (err) {
    if (err instanceof GipError) {
      return NextResponse.json({ erro: err.message }, { status: err.status });
    }
    return NextResponse.json({ erro: "Erro inesperado" }, { status: 500 });
  }
}
