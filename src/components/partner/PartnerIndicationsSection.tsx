import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usePartnerIndications } from "@/hooks/usePartnerIndications";
import {
  formatPartnerIndicationStatus,
  type PartnerIndicationFilters,
  type PartnerIndicationRecord,
  type PartnerIndicationStatus,
} from "@/lib/partnerIndication";
import { AlertCircle, CalendarDays, ChevronLeft, ChevronRight, Eye, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

interface PartnerIndicationsSectionProps {
  parceiroId: string;
  reloadKey: number;
}

const PAGE_SIZE = 10;

const STATUS_OPTIONS: Array<{ value: PartnerIndicationStatus | "todos"; label: string }> = [
  { value: "todos", label: "Todos os status" },
  { value: "novo", label: "Novo" },
  { value: "em_negociacao", label: "Em negociação" },
  { value: "convertido", label: "Convertido" },
  { value: "nao_convertido", label: "Não convertido" },
];

function formatDateLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("pt-BR");
}

function formatDateTimeLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return `${date.toLocaleDateString("pt-BR")} às ${date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

function getVisiblePages(currentPage: number, totalPages: number) {
  if (totalPages <= 3) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 2) {
    return [1, 2, 3];
  }

  if (currentPage >= totalPages - 1) {
    return [totalPages - 2, totalPages - 1, totalPages];
  }

  return [currentPage - 1, currentPage, currentPage + 1];
}

export default function PartnerIndicationsSection({ parceiroId, reloadKey }: PartnerIndicationsSectionProps) {
  const [status, setStatus] = useState<PartnerIndicationStatus | "todos">("todos");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selected, setSelected] = useState<PartnerIndicationRecord | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const filters = useMemo<PartnerIndicationFilters>(
    () => ({ status, startDate: startDate || undefined, endDate: endDate || undefined }),
    [endDate, startDate, status],
  );

  const { indications, loadingIndications, indicationsError } = usePartnerIndications(parceiroId, filters, reloadKey);

  useEffect(() => {
    setCurrentPage(1);
  }, [status, startDate, endDate, parceiroId, reloadKey]);

  const totalPages = Math.max(1, Math.ceil(indications.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const visiblePages = getVisiblePages(safeCurrentPage, totalPages);
  const paginatedIndications = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * PAGE_SIZE;
    return indications.slice(startIndex, startIndex + PAGE_SIZE);
  }, [indications, safeCurrentPage]);

  const pageStart = indications.length === 0 ? 0 : (safeCurrentPage - 1) * PAGE_SIZE + 1;
  const pageEnd = Math.min(safeCurrentPage * PAGE_SIZE, indications.length);

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Minhas indicações</h2>
          <p className="mt-1 text-sm leading-7 text-muted-foreground">
            Visualize seus leads em modo tabela, acompanhe status e consulte detalhes completos.
          </p>
        </div>
        <Badge variant="secondary" className="w-fit">{indications.length} registro(s)</Badge>
      </div>

      <Card className="rounded-[28px] border-white/60 bg-white/85 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
        <CardContent className="p-4 sm:p-6">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Status</p>
              <Select value={status} onValueChange={(value) => setStatus(value as PartnerIndicationStatus | "todos") }>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Data inicial</p>
              <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Data final</p>
              <Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
            </div>

            <div className="flex items-end">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  setStatus("todos");
                  setStartDate("");
                  setEndDate("");
                }}
              >
                Limpar filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {loadingIndications && (
        <Card className="rounded-[28px] shadow-soft">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Carregando indicações...
            </div>
          </CardContent>
        </Card>
      )}

      {indicationsError && (
        <Card className="rounded-[28px] border-destructive/30 shadow-soft">
          <CardContent className="p-6">
            <div className="flex items-start gap-3 text-destructive">
              <AlertCircle className="mt-0.5 h-5 w-5" />
              <p className="text-sm leading-7">Não foi possível carregar as indicações. Detalhe: {indicationsError}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {!loadingIndications && !indicationsError && indications.length === 0 && (
        <Card className="rounded-[28px] shadow-soft">
          <CardContent className="p-6">
            <p className="text-sm leading-7 text-muted-foreground">
              Nenhuma indicação encontrada para os filtros selecionados.
            </p>
          </CardContent>
        </Card>
      )}

      {!loadingIndications && !indicationsError && indications.length > 0 && (
        <Card className="overflow-hidden rounded-[28px] border-white/60 bg-white/90 shadow-[0_25px_80px_rgba(15,23,42,0.10)]">
          <CardContent className="p-0">
            <div className="border-b border-border/60 px-4 py-4 sm:px-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">Tabela de indicações</p>
                  <p className="text-sm text-muted-foreground">
                    Exibindo {pageStart} a {pageEnd} de {indications.length} registros.
                  </p>
                </div>
                <div className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
                  <CalendarDays className="h-3.5 w-3.5" />
                  10 registros por página
                </div>
              </div>
            </div>

            <div className="space-y-3 p-4 md:hidden">
              {paginatedIndications.map((indication) => (
                <div key={indication.id} className="rounded-[24px] border border-border/60 bg-white p-4 shadow-[0_12px_32px_rgba(15,23,42,0.06)]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-foreground">{indication.nome}</p>
                      <p className="mt-1 text-xs text-muted-foreground">ID: {indication.id.slice(0, 8)}</p>
                    </div>
                    <Badge variant="secondary" className="shrink-0">{formatPartnerIndicationStatus(indication.status)}</Badge>
                  </div>

                  <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Telefone</p>
                      <p className="mt-1 font-medium text-foreground">{indication.telefone}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Criada em</p>
                      <p className="mt-1 font-medium text-foreground">{formatDateLabel(indication.data_criacao)}</p>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">E-mail</p>
                      <p className="mt-1 break-words font-medium text-foreground">{indication.email || "E-mail não informado"}</p>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Observação</p>
                      <p className="mt-1 line-clamp-3 text-sm leading-6 text-muted-foreground">{indication.observacao || "Sem observações."}</p>
                    </div>
                  </div>

                  <Button variant="outline" className="mt-4 w-full" onClick={() => setSelected(indication)}>
                    <Eye className="h-4 w-4" />
                    Ver detalhes
                  </Button>
                </div>
              ))}
            </div>

            <div className="hidden px-2 py-2 md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lead</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Criada em</TableHead>
                    <TableHead className="hidden xl:table-cell">Observação</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedIndications.map((indication) => (
                    <TableRow key={indication.id}>
                      <TableCell>
                        <div>
                          <p className="font-semibold text-foreground">{indication.nome}</p>
                          <p className="text-xs text-muted-foreground">ID: {indication.id.slice(0, 8)}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p>{indication.telefone}</p>
                          <p className="text-xs text-muted-foreground">{indication.email || "E-mail não informado"}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{formatPartnerIndicationStatus(indication.status)}</Badge>
                      </TableCell>
                      <TableCell>{formatDateLabel(indication.data_criacao)}</TableCell>
                      <TableCell className="hidden max-w-[280px] xl:table-cell">
                        <p className="line-clamp-2 text-sm text-muted-foreground">
                          {indication.observacao || "Sem observações."}
                        </p>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => setSelected(indication)}>
                          <Eye className="h-4 w-4" />
                          Ver
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <div className="border-t border-border/60 bg-[#0a3817] px-3 py-4 text-white sm:px-4">
                <div className="flex flex-col items-stretch justify-between gap-3 sm:items-center lg:flex-row">
                  <p className="text-center text-sm text-emerald-100 lg:text-left">
                    Página {safeCurrentPage} de {totalPages}
                  </p>

                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="rounded-full border border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white disabled:opacity-40"
                      onClick={() => setCurrentPage(1)}
                      disabled={safeCurrentPage === 1}
                    >
                      <span className="hidden sm:inline">Primeira</span>
                      <span className="sm:hidden">1a</span>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="rounded-full border border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white disabled:opacity-40"
                      onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                      disabled={safeCurrentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span className="hidden sm:inline">Anterior</span>
                    </Button>

                    {visiblePages.map((page) => (
                      <Button
                        key={page}
                        type="button"
                        variant="ghost"
                        size="icon"
                        className={page === safeCurrentPage
                          ? "h-10 w-10 rounded-2xl bg-lime-500 text-black hover:bg-lime-400"
                          : "h-10 w-10 rounded-2xl border border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                        }
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>
                    ))}

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="rounded-full border border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white disabled:opacity-40"
                      onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                      disabled={safeCurrentPage === totalPages}
                    >
                      <span className="hidden sm:inline">Próxima</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="rounded-full border border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white disabled:opacity-40"
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={safeCurrentPage === totalPages}
                    >
                      <span className="hidden sm:inline">Última</span>
                      <span className="sm:hidden">Fim</span>
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-h-[85vh] max-w-xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da indicação</DialogTitle>
            <DialogDescription>Informações completas do lead vinculado ao parceiro.</DialogDescription>
          </DialogHeader>

          {selected && (
            <div className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Nome</p>
                <p className="mt-1 font-medium">{selected.nome}</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Telefone</p>
                  <p className="mt-1 font-medium">{selected.telefone}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Status</p>
                  <p className="mt-1 font-medium">{formatPartnerIndicationStatus(selected.status)}</p>
                </div>
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Email</p>
                <p className="mt-1 font-medium">{selected.email || "Não informado"}</p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Observação</p>
                <p className="mt-1 text-sm leading-7 text-muted-foreground">{selected.observacao || "Sem observações."}</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Criada em</p>
                  <p className="mt-1 text-sm">{formatDateTimeLabel(selected.data_criacao)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Atualizada em</p>
                  <p className="mt-1 text-sm">{formatDateTimeLabel(selected.atualizado_em)}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}