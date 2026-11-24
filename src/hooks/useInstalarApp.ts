import { useEffect, useState } from "react";

/** Evento que Chrome, Edge e Android disparam quando o app pode ser instalado. */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/*
 * O navegador pode avisar que o app é instalável antes do React montar a tela,
 * então guardamos o evento desde o carregamento deste módulo (importado em main.tsx).
 */
let pedidoGuardado: BeforeInstallPromptEvent | null = null;
const ouvintes = new Set<() => void>();
const avisar = () => ouvintes.forEach((f) => f());

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault(); // nós mostramos o botão "Instalar app" no lugar do aviso padrão
    pedidoGuardado = e as BeforeInstallPromptEvent;
    avisar();
  });
  window.addEventListener("appinstalled", () => {
    pedidoGuardado = null;
    avisar();
  });
}

function rodandoComoApp(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: minimal-ui)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/** iPhone/iPad não têm instalação automática: é pelo menu Compartilhar do Safari. */
function ehIOS(): boolean {
  const ua = navigator.userAgent;
  return /iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1);
}

/** Safari no Mac (17+) instala pelo menu Arquivo → Adicionar ao Dock. */
function ehSafariMac(): boolean {
  const ua = navigator.userAgent;
  return /macintosh/i.test(ua) && /safari/i.test(ua) && !/chrome|chromium|edg|firefox/i.test(ua) && navigator.maxTouchPoints <= 1;
}

export type ModoInstalacao =
  | "instalado" // já está rodando como app
  | "automatico" // Chrome/Edge/Android: um clique abre a janela do navegador
  | "ios" // passo a passo do Safari no iPhone/iPad
  | "safari-mac" // passo a passo do Safari no Mac
  | "indisponivel"; // navegador sem suporte (ex.: Firefox no computador)

export function useInstalarApp() {
  const [, forcar] = useState(0);
  useEffect(() => {
    const f = () => forcar((n) => n + 1);
    ouvintes.add(f);
    const mq = window.matchMedia("(display-mode: standalone)");
    mq.addEventListener("change", f);
    return () => {
      ouvintes.delete(f);
      mq.removeEventListener("change", f);
    };
  }, []);

  let modo: ModoInstalacao = "indisponivel";
  if (rodandoComoApp()) modo = "instalado";
  else if (pedidoGuardado) modo = "automatico";
  else if (ehIOS()) modo = "ios";
  else if (ehSafariMac()) modo = "safari-mac";

  async function instalar(): Promise<boolean> {
    if (!pedidoGuardado) return false;
    const pedido = pedidoGuardado;
    await pedido.prompt();
    const { outcome } = await pedido.userChoice;
    if (outcome === "accepted") pedidoGuardado = null;
    avisar();
    return outcome === "accepted";
  }

  return { modo, instalar };
}
