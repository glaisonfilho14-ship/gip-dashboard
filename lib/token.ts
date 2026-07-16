import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

const CHAVE_TOKEN = "gip:bearer-token";
const CHAVE_ATUALIZADO_EM = "gip:token-atualizado-em";

export async function salvarToken(token: string) {
  await redis.set(CHAVE_TOKEN, token);
  await redis.set(CHAVE_ATUALIZADO_EM, new Date().toISOString());
}

export async function obterToken() {
  return redis.get<string>(CHAVE_TOKEN);
}

export async function obterAtualizadoEm() {
  return redis.get<string>(CHAVE_ATUALIZADO_EM);
}
