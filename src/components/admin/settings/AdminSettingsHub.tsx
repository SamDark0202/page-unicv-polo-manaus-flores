import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  createInternalUser,
  deleteInternalUser,
  fetchAuditLogs,
  fetchInternalUsers,
  resetInternalUserPassword,
  updateInternalUser,
  type AuditLogRecord,
  type InternalUserRecord,
} from "@/lib/adminUsersApi";
import { Loader2, RefreshCcw, Shield, Trash2, UserCog, KeyRound } from "lucide-react";

type UserFormState = {
  id: string | null;
  email: string;
  nome: string;
  role: "redator" | "analista" | "vendedor" | "administrador";
  status: "ativo" | "inativo";
};

const EMPTY_FORM: UserFormState = {
  id: null,
  email: "",
  nome: "",
  role: "redator",
  status: "ativo",
};

function roleLabel(role: string) {
  if (role === "administrador") return "Administrador";
  if (role === "analista") return "Analista";
  if (role === "vendedor") return "Vendedor";
  return "Redator";
}

export default function AdminSettingsHub({ canManageUsers }: { canManageUsers: boolean }) {
  const { toast } = useToast();
  const [users, setUsers] = useState<InternalUserRecord[]>([]);
  const [logs, setLogs] = useState<AuditLogRecord[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<UserFormState>(EMPTY_FORM);

  async function loadUsers() {
    try {
      setLoadingUsers(true);
      const rows = await fetchInternalUsers();
      setUsers(rows);
    } catch (error) {
      toast({
        title: "Erro ao carregar usuários internos",
        description: error instanceof Error ? error.message : "Falha inesperada.",
        variant: "destructive",
      });
    } finally {
      setLoadingUsers(false);
    }
  }

  async function loadLogs() {
    try {
      setLoadingLogs(true);
      const rows = await fetchAuditLogs(100);
      setLogs(rows);
    } catch (error) {
      toast({
        title: "Erro ao carregar logs de auditoria",
        description: error instanceof Error ? error.message : "Falha inesperada.",
        variant: "destructive",
      });
    } finally {
      setLoadingLogs(false);
    }
  }

  useEffect(() => {
    void loadUsers();
    void loadLogs();
  }, []);

  const isEditing = Boolean(form.id);

  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  }, [users]);

  async function handleSaveUser() {
    if (!canManageUsers) return;

    try {
      setSaving(true);
      if (form.id) {
        await updateInternalUser({
          id: form.id,
          nome: form.nome.trim(),
          role: form.role,
          status: form.status,
        });
        toast({ title: "Usuário interno atualizado" });
      } else {
        const created = await createInternalUser({
          email: form.email.trim().toLowerCase(),
          nome: form.nome.trim(),
          role: form.role,
          status: form.status,
        });
        toast({
          title: "Usuário interno criado",
          description:
            created.accessDelivery?.mode === "recovery"
              ? "O usuário já existia e recebeu e-mail para redefinir senha."
              : "Convite enviado por e-mail para o usuário definir a senha.",
        });
      }

      setForm(EMPTY_FORM);
      await loadUsers();
    } catch (error) {
      toast({
        title: "Não foi possível salvar o usuário",
        description: error instanceof Error ? error.message : "Falha inesperada.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteUser(id: string) {
    if (!canManageUsers) return;

    try {
      setSaving(true);
      await deleteInternalUser(id);
      toast({ title: "Usuário interno excluído" });
      if (form.id === id) {
        setForm(EMPTY_FORM);
      }
      await loadUsers();
    } catch (error) {
      toast({
        title: "Não foi possível excluir o usuário",
        description: error instanceof Error ? error.message : "Falha inesperada.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleResetPassword(id: string) {
    if (!canManageUsers) return;

    try {
      setSaving(true);
      await resetInternalUserPassword(id);
      toast({ title: "Link de redefinição enviado" });
    } catch (error) {
      toast({
        title: "Erro ao resetar senha",
        description: error instanceof Error ? error.message : "Falha inesperada.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden rounded-[28px] border-none bg-[linear-gradient(135deg,#0b1f3b_0%,#194d6d_45%,#4f7d53_100%)] text-white shadow-[0_24px_80px_rgba(11,31,59,0.28)]">
        <CardContent className="p-6 lg:p-8">
          <Badge className="border border-white/15 bg-white/10 text-white hover:bg-white/10">Configurações do Sistema</Badge>
          <h2 className="mt-4 text-3xl font-bold tracking-tight lg:text-4xl">Acessos internos, perfis e auditoria</h2>
          <p className="mt-3 text-sm leading-7 text-white/85 lg:text-base">
            Gerencie os usuários administrativos por papel e acompanhe trilhas de auditoria para ações sensíveis no painel.
          </p>
        </CardContent>
      </Card>

      <Tabs defaultValue="users" className="space-y-5">
        <TabsList className="h-auto flex-wrap justify-start gap-2 rounded-[20px] bg-muted/50 p-1.5">
          <TabsTrigger value="users" className="rounded-2xl px-4 py-2.5">Usuários Internos</TabsTrigger>
          <TabsTrigger value="logs" className="rounded-2xl px-4 py-2.5">Logs de Auditoria</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-0 space-y-4">
          <Card className="rounded-2xl">
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Cadastro de usuários internos</h3>
                <Button variant="outline" onClick={() => void loadUsers()} disabled={loadingUsers || saving}>
                  <RefreshCcw className="mr-2 h-4 w-4" /> Atualizar
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="internal-email">E-mail</Label>
                  <Input
                    id="internal-email"
                    value={form.email}
                    onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                    disabled={isEditing || !canManageUsers || saving}
                    placeholder="usuario@empresa.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="internal-name">Nome</Label>
                  <Input
                    id="internal-name"
                    value={form.nome}
                    onChange={(e) => setForm((prev) => ({ ...prev, nome: e.target.value }))}
                    disabled={!canManageUsers || saving}
                    placeholder="Nome completo"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Papel</Label>
                  <Select
                    value={form.role}
                    onValueChange={(value) => setForm((prev) => ({ ...prev, role: value as UserFormState["role"] }))}
                    disabled={!canManageUsers || saving}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="redator">Redator</SelectItem>
                      <SelectItem value="analista">Analista</SelectItem>
                      <SelectItem value="vendedor">Vendedor</SelectItem>
                      <SelectItem value="administrador">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={form.status}
                    onValueChange={(value) => setForm((prev) => ({ ...prev, status: value as UserFormState["status"] }))}
                    disabled={!canManageUsers || saving}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="inativo">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button onClick={() => void handleSaveUser()} disabled={!canManageUsers || saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isEditing ? "Salvar alterações" : "Cadastrar usuário"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setForm(EMPTY_FORM)}
                  disabled={saving}
                >
                  Limpar
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardContent className="p-5">
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Usuários cadastrados</h4>
              {loadingUsers ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Carregando usuários...
                </div>
              ) : sortedUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum usuário interno cadastrado.</p>
              ) : (
                <div className="space-y-3">
                  {sortedUsers.map((row) => (
                    <div key={row.id} className="flex flex-col gap-3 rounded-2xl border bg-muted/25 p-4 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <p className="font-semibold">{row.nome}</p>
                        <p className="text-sm text-muted-foreground">{row.email}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <Badge variant="secondary">{roleLabel(row.role)}</Badge>
                          <Badge variant={row.status === "ativo" ? "default" : "outline"}>{row.status}</Badge>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setForm({
                            id: row.id,
                            email: row.email,
                            nome: row.nome,
                            role: row.role,
                            status: row.status,
                          })}
                          disabled={saving}
                        >
                          <UserCog className="mr-2 h-4 w-4" /> Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => void handleResetPassword(row.id)}
                          disabled={!canManageUsers || saving}
                        >
                          <KeyRound className="mr-2 h-4 w-4" /> Resetar senha
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => void handleDeleteUser(row.id)}
                          disabled={!canManageUsers || saving}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Excluir
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="mt-0">
          <Card className="rounded-2xl">
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Logs de auditoria</h3>
                <Button variant="outline" onClick={() => void loadLogs()} disabled={loadingLogs}>
                  <RefreshCcw className="mr-2 h-4 w-4" /> Atualizar
                </Button>
              </div>

              {loadingLogs ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Carregando logs...
                </div>
              ) : logs.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum log de auditoria disponível.</p>
              ) : (
                <div className="space-y-3">
                  {logs.map((log) => (
                    <div key={log.id} className="rounded-2xl border bg-card p-4">
                      <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                        <Shield className="h-3.5 w-3.5" />
                        <span>{new Date(log.created_at).toLocaleString("pt-BR")}</span>
                        <span>{log.table_name}</span>
                      </div>
                      <p className="mt-2 text-sm font-semibold">{log.action}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {log.actor_nome || "Usuário"} ({log.actor_email || "sem e-mail"})
                      </p>
                      {log.record_id && <p className="mt-1 text-xs text-muted-foreground">Registro: {log.record_id}</p>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
