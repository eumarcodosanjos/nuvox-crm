import { useEffect, useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { RefreshCw, WifiOff } from "lucide-react";
import { Icone } from "@/components/marca/Icone";
import { Button } from "@/components/ui/button";
import { EVENTO_CONEXAO } from "@/lib/api";

const UMA_HORA = 60 * 60 * 1000;

/**
 * Avisos do app instalado:
 * - "Versão nova disponível": quando publicamos uma atualização, o usuário decide quando recarregar.
 * - "Sem internet": a tela continua aberta, mas os dados só aparecem com conexão.
 */
export function AvisosApp() {
  const {
    needRefresh: [versaoNova, setVersaoNova],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registro) {
      // App que fica aberto o dia todo também descobre versões novas.
      if (registro) setInterval(() => registro.update().catch(() => {}), UMA_HORA);
    },
  });
  const online = useOnline();

  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-4 z-40 flex flex-col items-end gap-2 lg:left-[236px]">
      {!online && (
        <div role="status" className="pointer-events-auto flex w-full max-w-md items-center gap-3 border-l-2 border-alerta bg-superficie px-4 py-3 text-sm text-tatame">
          <Icone icone={WifiOff} className="size-4 shrink-0 text-alerta" />
          Sem internet. Os dados voltam a aparecer quando a conexão voltar.
        </div>
      )}
      {versaoNova && (
        <div role="status" className="pointer-events-auto flex w-full max-w-md flex-wrap items-center gap-x-4 gap-y-2 border border-borda bg-superficie p-4">
          <p className="flex flex-1 items-center gap-2 text-sm text-tatame">
            <Icone icone={RefreshCw} className="size-4 shrink-0 text-limao" />
            Versão nova do Nuvox CRM disponível.
          </p>
          <div className="flex gap-2">
            <Button variant="fantasma" size="sm" onClick={() => setVersaoNova(false)}>
              Depois
            </Button>
            <Button size="sm" onClick={() => updateServiceWorker(true)}>
              Atualizar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Online = o navegador diz que tem rede E a última chamada ao servidor funcionou. */
function useOnline() {
  const [rede, setRede] = useState(() => navigator.onLine);
  const [servidor, setServidor] = useState(true);
  useEffect(() => {
    const on = () => setRede(true);
    const off = () => setRede(false);
    const conexao = (e: Event) => setServidor((e as CustomEvent<boolean>).detail);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    window.addEventListener(EVENTO_CONEXAO, conexao);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
      window.removeEventListener(EVENTO_CONEXAO, conexao);
    };
  }, []);
  return rede && servidor;
}
