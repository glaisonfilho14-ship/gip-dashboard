import { NextRequest, NextResponse } from "next/server";
import { salvarToken, obterAtualizadoEm } from "@/lib/token";

export async function POST(req: NextRequest) {
  const { senha, token } = await req.json();

  if (senha !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ ok: false, erro: "Senha incorreta" }, { status: 401 });
  }

  if (!token || typeof token !== "string" || token.length < 20) {
    return NextResponse.json({ ok: false, erro: "Token inválido" }, { status: 400 });
  }

  await salvarToken(token.trim());
  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest) {
  const senha = req.nextUrl.searchParams.get("senha");

  if (senha !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ ok: false, erro: "Senha incorreta" }, { status: 401 });
  }

  const atualizadoEm = await obterAtualizadoEm();
  return NextResponse.json({ ok: true, atualizadoEm });
}
