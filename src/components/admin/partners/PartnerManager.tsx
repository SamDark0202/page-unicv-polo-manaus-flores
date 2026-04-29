import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { usePasswordRecoveryCooldown } from "@/hooks/usePasswordRecoveryCooldown";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import {
  createAdminPartner,
  fetchAdminPartners,
  reassignAndDeletePartner,
  resetPartnerPassword,
  sendPartnerAccessLink,
  type AdminPartnerRecord,
  updateAdminPartner,
} from "@/lib/adminPartnerApi";
import { formatPartnerTypeLabel, type PartnerType } from "@/lib/partnerProfile";
import { useSessionStorageState } from "@/hooks/useSessionStorageState";
import { normalizeText } from "@/utils/normalize";
import { getPasswordRecoveryRetryAfterSeconds } from "@/lib/passwordRecovery";
import { KeyRound, Loader2, Mail, Pencil, Plus, RefreshCcw, Search, Trash2, UsersRound } from "lucide-react";

const schema = z.object({
  nome: z.string().trim().min(2, "Nome obrigatório.").max(160, "Nome muito longo."),
  email: z.string().trim().email("E-mail inválido.").max(254, "E-mail muito longo."),
  tipo: z.enum(["institucional", "indicador"]),
  chave_pix: z.string().trim().max(200, "Chave PIX muito longa.").optional().or(z.literal("")),
  link_personalizado: z.string().trim().max(120, "Link muito longo.").optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
});

export default function PartnerManager({ readOnly = false }: { readOnly?: boolean }) {
  const { toast } = useToast();
  const { getRemainingSeconds, isCooldownActive, startCooldown } = usePasswordRecoveryCooldown();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [partners, setPartners] = useState<AdminPartnerRecord[]>([]);
  const [query, setQuery] = useSessionStorageState<string>("controle.partnerManager.query", "");
  const [tipo, setTipo] = useSessionStorageState<PartnerType | "todos">("controle.partnerManager.tipo", "todos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<AdminPartnerRecord | null>(null);
  const [sendingAccessId, setSendingAccessId] = useState<string | null>(null);
  const [resettingPasswordId, setResettingPasswordId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [partnerPendingDeletion, setPartnerPendingDeletion] = useState<AdminPartnerRecord | null>(null);
  const [reassignTargetId, setReassignTargetId] = useState<string>("");

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome: "",
      email: "",
      tipo: "indicador",
      chave_pix: "",
      link_personalizado: "",
    },
  });

  const summary = useMemo(() => {
    return partners.reduce(
      (acc, item) => {
        acc.total += 1;
        acc.indicacoes += item.totalIndicacoes;
        acc.convertidas += item.convertidas;
        acc.comissaoPendente += Number(item.comissaoPendente || 0);
        return acc;
      },
      { total: 0, indicacoes: 0, convertidas: 0, comissaoPendente: 0 },
    );
  }, [partners]);

  const filteredPartners = useMemo(() => {
    const q = normalizeText(query.trim());
    return partners.filter((p) => {
      const matchesTipo = tipo === "todos" || p.tipo === tipo;
      if (!matchesTipo) return false;
      if (!q) return true;
      return (
        normalizeText(p.nome).includes(q) ||
        normalizeText(p.email).includes(q) ||
        normalizeText(p.link_personalizado ?? "").includes(q)
      );
    });
  }, [partners, query, tipo]);

  async function loadPartners() {
    try {
      setLoading(true);
      const rows = await fetchAdminPartners();
      setPartners(rows);
    } catch (error) {
      toast({
        title: "Erro ao carregar parceiros",
        description: error instanceof Error ? error.message : "Não foi possível carregar parceiros.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPartners();
  }, []);

  function openCreateDialog() {
    setEditingPartner(null);
    form.reset({
      nome: "",
      email: "",
      tipo: "indicador",
      chave_pix: "",
      link_personalizado: "",
    });
    setDialogOpen(true);
  }

  function openEditDialog(partner: AdminPartnerRecord) {
    setEditingPartner(partner);
    form.reset({
      nome: partner.nome,
      email: partner.email,
      tipo: partner.tipo,
      chave_pix: partner.chave_pix || "",
      link_personalizado: partner.link_personalizado || "",
    });
    setDialogOpen(true);
  }

  async function onSubmit(values: FormValues) {
    try {
      setSubmitting(true);

      if (editingPartner) {
        await updateAdminPartner({
          id: editingPartner.id,
          ...values,
        });
        toast({ title: "Parceiro atualizado", description: "Dados do parceiro atualizados com sucesso." });
      } else {
        await createAdminPartner(values);
        toast({ title: "Parceiro criado", description: "Novo parceiro cadastrado com sucesso." });
      }

      setDialogOpen(false);
      await loadPartners();
    } catch (error) {
      toast({
        title: "Falha ao salvar parceiro",
        description: error instanceof Error ? error.message : "Não foi possível salvar o parceiro.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSendAccess(partner: AdminPartnerRecord) {
    const cooldownKey = `access:${partner.id}`;
    try {
      setSendingAccessId(partner.id);
      const result = await sendPartnerAccessLink(partner.id);
      startCooldown(cooldownKey);
      toast({
        title: "Link de acesso enviado",
        description:
          result.mode === "invite"
            ? `Convite de criação de senha enviado para ${partner.email}.`
            : `Link de redefinição de senha enviado para ${partner.email}.`,
      });
      await loadPartners();
    } catch (error) {
      const retryAfterSeconds = getPasswordRecoveryRetryAfterSeconds(error);
      if (retryAfterSeconds) {
        startCooldown(cooldownKey, retryAfterSeconds);
      }
      toast({
        title: "Falha ao enviar acesso",
        description: error instanceof Error ? error.message : "Não foi possível enviar o link de acesso.",
        variant: "destructive",
      });
    } finally {
      setSendingAccessId(null);
    }
  }

  async function handleResetPassword(partner: AdminPartnerRecord) {
    const cooldownKey = `reset:${partner.id}`;
    try {
      setResettingPasswordId(partner.id);
      await resetPartnerPassword(partner.id);
      startCooldown(cooldownKey);
      toast({
        title: "E-mail de redefinição enviado",
        description: `Link para redefinir senha enviado para ${partner.email}.`,
      });
    } catch (error) {
      const retryAfterSeconds = getPasswordRecoveryRetryAfterSeconds(error);
      if (retryAfterSeconds) {
        startCooldown(cooldownKey, retryAfterSeconds);
      }
      toast({
        title: "Falha ao redefinir senha",
        description: error instanceof Error ? error.message : "Não foi possível enviar o e-mail de redefinição.",
        variant: "destructive",
      });
    } finally {
      setResettingPasswordId(null);
    }
  }

  async function handleFullDelete() {
    if (!partnerPendingDeletion) return;

    try {
      setDeletingId(partnerPendingDeletion.id);
      const result = await reassignAndDeletePartner(partnerPendingDeletion.id, reassignTargetId || null);
      
      let description = `O parceiro ${partnerPendingDeletion.nome} foi removido do sistema.`;
      if (result.leadsReassigned && result.leadsReassigned > 0) {
        description += ` ${result.leadsReassigned} lead(s) foram transferidos.`;
      }
      
      toast({
        title: "Parceiro excluído",
        description,
      });
      setPartnerPendingDeletion(null);
      setReassignTargetId("");
      await loadPartners();
    } catch (error) {
      toast({
        title: "Falha ao excluir parceiro",
        description: error instanceof Error ? error.message : "Não foi possível excluir o parceiro.",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Parceiros</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{summary.total}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Indicações totais</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{summary.indicacoes}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Convertidas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{summary.convertidas}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Comissão pendente</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{brl.format(summary.comissaoPendente)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por nome, e-mail ou link"
                className="pl-9"
              />
            </div>

            <Select value={tipo} onValueChange={(value) => setTipo(value as PartnerType | "todos")}>
              <SelectTrigger className="w-full lg:w-[220px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os tipos</SelectItem>
                <SelectItem value="institucional">Institucional</SelectItem>
                <SelectItem value="indicador">Indicador</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => loadPartners()}
            >
              <RefreshCcw className="h-4 w-4" />
              Atualizar
            </Button>

            {!readOnly && (
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4" />
                Novo parceiro
              </Button>
            )}
          </div>

          <div className="mt-5 space-y-3">
            {loading ? (
              <div className="flex items-center justify-center rounded-xl border py-10 text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Carregando parceiros...
              </div>
            ) : filteredPartners.length === 0 ? (
              <div className="rounded-xl border py-10 text-center text-muted-foreground">
                Nenhum parceiro encontrado para os filtros informados.
              </div>
            ) : (
              filteredPartners.map((partner) => (
                <div
                  key={partner.id}
                  className="rounded-xl border bg-background/80 p-4 shadow-sm transition hover:border-primary/40"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold">{partner.nome}</h3>
                        <Badge variant="outline">{formatPartnerTypeLabel(partner.tipo)}</Badge>
                        <Badge variant={partner.auth_user_id ? "default" : "secondary"}>
                          {partner.auth_user_id ? "Acesso ativo" : "Sem acesso"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{partner.email}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Link: {partner.link_personalizado ? `/parceiro/${partner.link_personalizado}` : `/parceiro/${partner.id}`}
                      </p>
                    </div>

                    <div className="grid gap-3 text-sm sm:grid-cols-4 lg:min-w-[520px]">
                      <div>
                        <p className="text-xs text-muted-foreground">Indicações</p>
                        <p className="font-semibold">{partner.totalIndicacoes}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Convertidas</p>
                        <p className="font-semibold">{partner.convertidas}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Em negociação</p>
                        <p className="font-semibold">{partner.emNegociacao}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Pendente</p>
                        <p className="font-semibold">{brl.format(Number(partner.comissaoPendente || 0))}</p>
                      </div>
                    </div>

                    <TooltipProvider>
                      <div className="flex flex-wrap gap-2">
                        {readOnly ? (
                          <Badge variant="secondary">Somente visualização</Badge>
                        ) : (
                          <>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleSendAccess(partner)}
                              disabled={sendingAccessId === partner.id || isCooldownActive(`access:${partner.id}`)}
                            >
                              {sendingAccessId === partner.id
                                ? <Loader2 className="h-4 w-4 animate-spin" />
                                : <KeyRound className="h-4 w-4" />}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {isCooldownActive(`access:${partner.id}`)
                              ? `Aguarde ${getRemainingSeconds(`access:${partner.id}`)}s`
                              : "Enviar acesso"}
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleResetPassword(partner)}
                              disabled={resettingPasswordId === partner.id || isCooldownActive(`reset:${partner.id}`)}
                            >
                              {resettingPasswordId === partner.id
                                ? <Loader2 className="h-4 w-4 animate-spin" />
                                : <Mail className="h-4 w-4" />}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {isCooldownActive(`reset:${partner.id}`)
                              ? `Aguarde ${getRemainingSeconds(`reset:${partner.id}`)}s`
                              : "Redefinir senha"}
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => openEditDialog(partner)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Editar</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => {
                                setPartnerPendingDeletion(partner);
                                setReassignTargetId("");
                              }}
                              disabled={deletingId === partner.id}
                            >
                              {deletingId === partner.id
                                ? <Loader2 className="h-4 w-4 animate-spin" />
                                : <Trash2 className="h-4 w-4" />}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Excluir parceiro</TooltipContent>
                        </Tooltip>
                          </>
                        )}
                      </div>
                    </TooltipProvider>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!readOnly && dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPartner ? "Editar parceiro" : "Novo parceiro"}</DialogTitle>
            <DialogDescription>
              Configure os dados principais e o link personalizado para rastrear captação e indicações.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do parceiro" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="parceiro@email.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select value={field.value} onValueChange={(value) => field.onChange(value as PartnerType)}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="indicador">Indicador</SelectItem>
                        <SelectItem value="institucional">Institucional</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="chave_pix"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chave PIX</FormLabel>
                    <FormControl>
                      <Input placeholder="Opcional" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="link_personalizado"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Link personalizado (opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Se vazio, será gerado automaticamente" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <UsersRound className="h-4 w-4" />
                      {editingPartner ? "Salvar alterações" : "Criar parceiro"}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(partnerPendingDeletion)}
        onOpenChange={(open) => {
          if (!open && !deletingId) {
            setPartnerPendingDeletion(null);
            setReassignTargetId("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir parceiro permanentemente</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  Esta ação remove <strong>{partnerPendingDeletion?.nome}</strong> do sistema e exclui seu acesso no Supabase.
                  {partnerPendingDeletion?.totalIndicacoes > 0 && (
                    <> Os leads associados serão transferidos para o parceiro selecionado abaixo.</>
                  )}
                </p>
                {partnerPendingDeletion && partnerPendingDeletion.totalIndicacoes > 0 && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">Transferir leads para:</p>
                    <Select
                      value={reassignTargetId}
                      onValueChange={setReassignTargetId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o parceiro destino" />
                      </SelectTrigger>
                      <SelectContent>
                        {partners
                          .filter((p) => p.id !== partnerPendingDeletion.id)
                          .map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.nome} ({p.email})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    {!reassignTargetId && (
                      <p className="text-xs text-destructive">
                        Este parceiro possui {partnerPendingDeletion.totalIndicacoes} lead(s). Selecione um parceiro destino para continuar.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={Boolean(deletingId)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                handleFullDelete();
              }}
              disabled={Boolean(deletingId) || ((partnerPendingDeletion?.totalIndicacoes ?? 0) > 0 && !reassignTargetId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingId ? "Excluindo..." : "Confirmar exclusão"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}