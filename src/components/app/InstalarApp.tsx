import { useState } from "react";
import { Download, MonitorDown, Share, SquarePlus } from "lucide-react";
import { Icone } from "@/components/marca/Icone";
import { NuvoxSimbolo } from "@/components/marca/NuvoxLogo";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useInstalarApp } from "@/hooks/useInstalarApp";

/**
 * Botão "Instalar app" do menu.
 * - Chrome/Edge (computador) e Android: abre a janela de instalação do navegador.
 * - iPhone/iPad e Safari no Mac: mostra o passo a passo.
 * - Já instalado ou navegador sem suporte: não aparece.
 */
export function InstalarApp({ className }: { className?: string }) {
  const { modo, instalar } = useInstalarApp();
  const [aberto, setAberto] = useState(false);

  if (modo === "instalado" || modo === "indisponivel") return null;

  return (
    <>
      <Button
        variant="secundario"
        size="sm"
        className={className}
        onClick={() => (modo === "automatico" ? instalar() : setAberto(true))}
      >
        <Icone icone={Download} className="size-4" />
        Instalar app
      </Button>

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent>
          <NuvoxSimbolo className="mb-5 size-12" />
          <DialogTitle>Instalar o Nuvox CRM</DialogTitle>
          <DialogDescription>
            {modo === "ios"
              ? "No iPhone e no iPad, a instalação é pelo Safari. Leva 10 segundos:"
              : "No Safari do Mac, a instalação é pelo menu do navegador:"}
          </DialogDescription>

          {modo === "ios" ? (
            <ol className="mt-5 flex flex-col gap-4">
              <Passo numero={1}>
                Toque em <strong className="text-tatame">Compartilhar</strong>{" "}
                <Icone icone={Share} className="inline size-4 align-[-2px]" /> na barra do Safari.
              </Passo>
              <Passo numero={2}>
                Role e toque em <strong className="text-tatame">Adicionar à Tela de Início</strong>{" "}
                <Icone icone={SquarePlus} className="inline size-4 align-[-2px]" />.
              </Passo>
              <Passo numero={3}>
                Toque em <strong className="text-tatame">Adicionar</strong>. O ícone da Nuvox aparece na tela do celular.
              </Passo>
            </ol>
          ) : (
            <ol className="mt-5 flex flex-col gap-4">
              <Passo numero={1}>
                No menu <strong className="text-tatame">Arquivo</strong>, clique em{" "}
                <strong className="text-tatame">Adicionar ao Dock</strong>{" "}
                <Icone icone={MonitorDown} className="inline size-4 align-[-2px]" />.
              </Passo>
              <Passo numero={2}>
                Clique em <strong className="text-tatame">Adicionar</strong>. O Nuvox CRM abre como app, direto do Dock.
              </Passo>
            </ol>
          )}

          <p className="mt-6 border-t border-borda pt-4 text-xs text-apoio">
            Se a opção não aparecer, confira se o site está aberto no Safari (não dentro de outro app).
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Passo({ numero, children }: { numero: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3 text-sm text-apoio">
      <span
        aria-hidden
        className="flex size-7 shrink-0 items-center justify-center bg-limao font-titulo text-xs text-podio"
      >
        {numero}
      </span>
      <span className="pt-1">{children}</span>
    </li>
  );
}
