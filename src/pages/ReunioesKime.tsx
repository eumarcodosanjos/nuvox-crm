import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "@/lib/api";

const kime = "https://kime-prototipo-navegacao.eumarcoodosanjos.chatgpt.site";

interface Ficha {
  negocio: { nome: string; produto: string };
  reunioes: { id: string; titulo: string; dia: string; hora: string | null; meet: string | null }[];
}

export default function ReunioesKime() {
  const { id } = useParams();
  const [token] = useState(() => new URLSearchParams(window.location.hash.slice(1)).get("acesso"));
  const [ficha, setFicha] = useState<Ficha>();
  const [erro, setErro] = useState(token ? "" : "Abra pelo Kime para ver os dados das reuniões.");
  useEffect(() => {
    if (!token || !id) return;
    window.history.replaceState(window.history.state, "", window.location.pathname);
    const controle = new AbortController();
    api<Ficha>(`integracoes/kime/negocios/${encodeURIComponent(id)}/reunioes`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controle.signal,
    }).then(setFicha).catch((falha: Error) => {
      if (!controle.signal.aborted) setErro(falha.message);
    });
    return () => controle.abort();
  }, [id, token]);

  return (
    <section className="mx-auto max-w-3xl space-y-5">
      <Link to="/pipeline" className="text-sm font-semibold text-apoio hover:text-tatame">Voltar ao pipeline</Link>
      <header>
        <h1 className="text-3xl font-bold text-tatame">Reuniões do negócio</h1>
        {ficha && <p className="mt-2 text-sm text-apoio">{ficha.negocio.nome} · {ficha.negocio.produto}</p>}
      </header>
      {erro ? (
        <div className="space-y-3">
          <p role="status" className="text-apoio">{erro}</p>
          <a href={`${kime}/api/nuvox-crm/negocios/${id}/abrir`} rel="noreferrer" className="font-semibold text-tatame underline">Abrir pelo Kime</a>
        </div>
      ) : !ficha ? (
        <p role="status" className="text-apoio">Carregando reuniões…</p>
      ) : ficha.reunioes.length === 0 ? (
        <p className="text-apoio">Nenhuma reunião vinculada a este negócio.</p>
      ) : (
        <ul className="divide-y divide-borda">
          {ficha.reunioes.map((reuniao) => (
            <li key={reuniao.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
              <div>
                <p className="font-semibold text-tatame">{reuniao.titulo}</p>
                <p className="text-sm text-apoio">{reuniao.dia.split("-").reverse().join("/")}{reuniao.hora ? ` · ${reuniao.hora} (Brasília)` : ""}</p>
              </div>
              {reuniao.meet && <a href={reuniao.meet} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-tatame underline">Abrir Google Meet</a>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
