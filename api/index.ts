/**
 * Função única da Vercel para toda a API.
 * O vercel.json reescreve /api/<rota> para /api?rota=<rota>.
 */
import { tratar } from "../server/rotas.js";

export const GET = tratar;
export const POST = tratar;
export const PATCH = tratar;
export const DELETE = tratar;
