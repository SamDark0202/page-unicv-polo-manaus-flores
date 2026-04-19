import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Brain, Search, RefreshCw, GraduationCap, Mail, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

// ─── Tipos ────────────────────────────────────────────────────────────────────
type VocacionalLead = {
  id: string;
  nome: string;
  telefone: string;
  email: string;
  perfil: string | null;
  top_areas: string[] | null;
  top_cursos: string[] | null;
  score_json: Record<string, number> | null;
  status: string | null;
  origem: string | null;
  created_at: string;
};

// ─── Fetch via API (service role — bypass RLS) ────────────────────────────────
async function fetchLeads(): Promise<VocacionalLead[]> {
  const res = await fetch("/api/vocacional-lead");
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  return res.json();
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const AREA_LABELS: Record<string, string> = {
  Tech: "Tecnologia",
  Business: "Negócios",
  Health: "Saúde",
  Education: "Educação",
  Creative: "Criativo",
  Law: "Direito",
  Security: "Segurança",
};

const AREA_COLORS: Record<string, string> = {
  Tech: "bg-blue-100 text-blue-700",
  Business: "bg-emerald-100 text-emerald-700",
  Health: "bg-rose-100 text-rose-700",
  Education: "bg-violet-100 text-violet-700",
  Creative: "bg-orange-100 text-orange-700",
  Law: "bg-slate-100 text-slate-700",
  Security: "bg-indigo-100 text-indigo-700",
};

// ─── Modal de detalhes ────────────────────────────────────────────────────────
type ResendState = "idle" | "loading" | "success" | "error";

function LeadDetailModal({
  lead,
  open,
  onClose,
}: {
  lead: VocacionalLead | null;
  open: boolean;
  onClose: () => void;
}) {
  const [resendState, setResendState] = useState<ResendState>("idle");
  const [resendError, setResendError] = useState("");

  async function handleResend() {
    if (!lead) return;
    setResendState("loading");
    setResendError("");
    try {
      const res = await fetch("/api/vocacional-lead", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: lead.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setResendError((data as { error?: string }).error ?? `Erro ${res.status}`);
        setResendState("error");
      } else {
        setResendState("success");
        setTimeout(() => setResendState("idle"), 4000);
      }
    } catch (err) {
      setResendError("Falha de rede. Tente novamente.");
      setResendState("error");
    }
  }
  if (!lead) return null;

  const topScore =
    lead.score_json
      ? Math.max(...Object.values(lead.score_json), 1)
      : 1;

  const sortedAreas = lead.score_json
    ? (Object.entries(lead.score_json) as [string, number][])
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
    : [];

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { setResendState("idle"); setResendError(""); onClose(); } }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Brain className="h-4 w-4 text-primary" />
            Resultado de {lead.nome.split(" ")[0]}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 text-sm">
          {/* Dados pessoais */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Nome</p>
              <p className="font-medium">{lead.nome}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Telefone</p>
              <p className="font-medium">{lead.telefone}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">E-mail</p>
              <p className="font-medium truncate">{lead.email}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Data</p>
              <p className="font-medium">{formatDate(lead.created_at)}</p>
            </div>
          </div>

          {/* Perfil */}
          {lead.perfil && (
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">Perfil identificado</p>
              <span className="inline-block bg-primary/10 text-primary font-semibold px-3 py-1 rounded-full text-sm">
                {lead.perfil}
              </span>
            </div>
          )}

          {/* Compatibilidade por área */}
          {sortedAreas.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Compatibilidade por área</p>
              <div className="space-y-2">
                {sortedAreas.map(([area, score], i) => {
                  const pct = Math.max(62, Math.min(97, Math.round((score / topScore) * 95) - i * 2));
                  const colorClass = AREA_COLORS[area] ?? "bg-gray-100 text-gray-700";
                  return (
                    <div key={area} className="flex items-center gap-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full w-28 text-center shrink-0 ${colorClass}`}>
                        {AREA_LABELS[area] ?? area}
                      </span>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-primary w-9 text-right shrink-0">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Cursos recomendados */}
          {lead.top_cursos && lead.top_cursos.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                <GraduationCap className="h-3.5 w-3.5" /> Cursos recomendados
              </p>
              <ul className="space-y-1.5">
                {lead.top_cursos.map((curso) => (
                  <li key={curso} className="flex items-start gap-2">
                    <span className="mt-0.5 h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                    <span className="text-sm">{curso}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Reenviar e-mail */}
          <div className="border-t pt-4">
            <p className="text-xs text-muted-foreground mb-2">
              Reenviar o e-mail de resultado para <strong>{lead.email}</strong>
            </p>
            <Button
              size="sm"
              variant={resendState === "success" ? "outline" : "default"}
              className="gap-1.5"
              disabled={resendState === "loading" || resendState === "success"}
              onClick={handleResend}
            >
              {resendState === "loading" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {resendState === "success" && <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />}
              {resendState === "error" && <AlertCircle className="h-3.5 w-3.5 text-destructive" />}
              {resendState === "idle" && <Mail className="h-3.5 w-3.5" />}
              {resendState === "loading"
                ? "Enviando…"
                : resendState === "success"
                ? "E-mail enviado!"
                : "Reenviar e-mail"}
            </Button>
            {resendState === "error" && (
              <p className="mt-2 text-xs text-destructive">{resendError}</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function VocacionalMonitor() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<VocacionalLead | null>(null);

  const { data: leads = [], isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["vocacional-leads"],
    queryFn: fetchLeads,
    staleTime: 2 * 60 * 1000,
  });

  const filtered = leads.filter((l) => {
    const q = search.toLowerCase();
    return (
      !q ||
      l.nome.toLowerCase().includes(q) ||
      l.email.toLowerCase().includes(q) ||
      l.telefone.includes(q) ||
      (l.perfil ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, e-mail ou perfil..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => refetch()}
          disabled={isFetching}
          title="Atualizar lista"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
        </Button>
        <span className="text-sm text-muted-foreground">
          {filtered.length} registro{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Tabela */}
      {isError ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-center text-sm text-destructive">
          Erro ao carregar os testes. Verifique as permissões do banco.
        </div>
      ) : isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-12 w-full animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground text-sm">
          {search ? "Nenhum resultado para a busca." : "Nenhum teste vocacional registrado ainda."}
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Nome</TableHead>
                <TableHead className="hidden sm:table-cell">Telefone</TableHead>
                <TableHead className="hidden md:table-cell">E-mail</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead className="hidden lg:table-cell">Áreas top</TableHead>
                <TableHead className="hidden lg:table-cell">Data</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((lead) => (
                <TableRow key={lead.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium">{lead.nome}</TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground text-xs">
                    {lead.telefone}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground text-xs truncate max-w-[160px]">
                    {lead.email}
                  </TableCell>
                  <TableCell>
                    {lead.perfil ? (
                      <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full whitespace-nowrap">
                        {lead.perfil}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">—</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {(lead.top_areas ?? []).slice(0, 2).map((area) => (
                        <Badge
                          key={area}
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0 ${AREA_COLORS[area] ?? ""}`}
                        >
                          {AREA_LABELS[area] ?? area}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground text-xs whitespace-nowrap">
                    {formatDate(lead.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-7 px-3"
                      onClick={() => setSelected(lead)}
                    >
                      Ver
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <LeadDetailModal
        lead={selected}
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
