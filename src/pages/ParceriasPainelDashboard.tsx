import PartnerCommissionsSection from "@/components/partner/PartnerCommissionsSection";
import CreatePartnerIndicationDialog from "@/components/partner/CreatePartnerIndicationDialog";
import PartnerIndicationsSection from "@/components/partner/PartnerIndicationsSection";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { usePartnerAuth } from "@/contexts/AuthContext";
import { usePartnerIndicators } from "@/hooks/usePartnerIndicators";
import { usePartnerProfile } from "@/hooks/usePartnerProfile";
import { isPartnerPasswordSetupPending } from "@/lib/partnerPasswordSetup";
import {
  buildPartnerPublicLink,
  formatPartnerTypeLabel,
  maskPixKey,
  partnerTypeCopy,
} from "@/lib/partnerProfile";
import { AlertCircle, Copy, Link2, Loader2, LogOut, Sparkles, TrendingUp, UserCheck, UserRoundX, UsersRound, WalletCards } from "lucide-react";
import { useState } from "react";
import { Helmet } from "react-helmet";
import { Navigate, useNavigate } from "react-router-dom";

export default function ParceriasPainelDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading, signOut } = usePartnerAuth();
  const { partnerProfile, loadingProfile, profileError } = usePartnerProfile(user);
  const [indicatorsReloadKey, setIndicatorsReloadKey] = useState(0);
  const setupPending = isPartnerPasswordSetupPending();
  const { indicators, loadingIndicators, indicatorsError } = usePartnerIndicators(
    partnerProfile?.id ?? null,
    indicatorsReloadKey,
  );

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-[#f5f8f3]">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Carregando painel...
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/parcerias/painel" replace />;
  }

  if (setupPending) {
    return <Navigate to="/parcerias/definir-senha" replace />;
  }

  async function handleSignOut() {
    await signOut();
    navigate("/parcerias/painel", { replace: true });
  }

  async function handleCopyLink() {
    if (!partnerProfile) return;
    const link = buildPartnerPublicLink(partnerProfile);

    try {
      await navigator.clipboard.writeText(link);
      toast({
        title: "Link copiado",
        description: "O link personalizado foi copiado para a área de transferência.",
      });
    } catch {
      toast({
        title: "Falha ao copiar",
        description: "Não foi possível copiar automaticamente. Copie manualmente o link exibido.",
        variant: "destructive",
      });
    }
  }

  const copy = partnerProfile ? partnerTypeCopy(partnerProfile.tipo) : null;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(106,160,83,0.16),_transparent_28%),linear-gradient(180deg,_#f7faf4_0%,_#eef5ea_100%)]">
      <Helmet>
        <title>Dashboard do Parceiro | Unicive Polo Flores</title>
      </Helmet>

      <div className="mx-auto max-w-7xl px-3 py-4 sm:px-4 sm:py-6 lg:px-8 lg:py-8">
        <div className="flex flex-col gap-4 rounded-[28px] border border-white/60 bg-white/70 p-4 shadow-[0_25px_90px_rgba(15,23,42,0.10)] backdrop-blur sm:p-5 lg:rounded-[32px] lg:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <Badge className="w-fit rounded-full bg-emerald-100 px-3 py-1 text-emerald-900 hover:bg-emerald-100">
                Painel do Parceiro
              </Badge>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl lg:text-5xl">
                  {partnerProfile ? `Bem-vindo, ${partnerProfile.nome}` : "Dashboard do parceiro"}
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 lg:text-base lg:leading-7">
                  {copy?.description || "Carregando dados de perfil do parceiro..."}
                </p>
              </div>
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end lg:w-auto">
              <div className="rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-center text-sm text-emerald-900 sm:text-left">
                {user.email}
              </div>
              <Button variant="outline" className="w-full rounded-full sm:w-auto" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
                Sair
              </Button>
            </div>
          </div>

          {loadingProfile && (
            <Card className="rounded-[28px] shadow-soft">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Carregando perfil...
                </div>
              </CardContent>
            </Card>
          )}

          {profileError && (
            <Card className="rounded-[28px] border-destructive/30 shadow-soft">
              <CardContent className="p-6">
                <div className="flex items-start gap-3 text-destructive">
                  <AlertCircle className="mt-0.5 h-5 w-5" />
                  <p className="text-sm leading-7">Não foi possível carregar os dados do perfil. Detalhe: {profileError}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {!loadingProfile && !profileError && !partnerProfile && (
            <Card className="rounded-[28px] border-amber-400/40 shadow-soft">
              <CardContent className="p-6">
                <p className="text-sm leading-7 text-muted-foreground">
                  Seu usuário autenticado ainda não está vinculado a um parceiro na tabela parceiros. Vincule o campo auth_user_id no cadastro para habilitar o painel completo.
                </p>
              </CardContent>
            </Card>
          )}

          {partnerProfile && (
            <Tabs defaultValue="overview" className="space-y-6">
              <div className="sticky top-3 z-20">
                <TabsList className="grid h-auto w-full grid-cols-3 rounded-[26px] border border-emerald-100 bg-white/92 p-1.5 shadow-[0_12px_40px_rgba(15,23,42,0.10)] backdrop-blur sm:mx-auto sm:max-w-fit sm:grid-cols-none sm:auto-cols-max sm:grid-flow-col sm:rounded-full sm:p-2">
                  <TabsTrigger value="overview" className="min-w-0 rounded-[20px] px-2 py-3 text-[11px] font-semibold data-[state=active]:bg-[#0d3b18] data-[state=active]:text-white sm:rounded-full sm:px-5 sm:py-2.5 sm:text-sm">
                    <Sparkles className="h-4 w-4" />
                    <span className="sm:hidden">Visão</span>
                    <span className="hidden sm:inline">Visão geral</span>
                  </TabsTrigger>
                  <TabsTrigger value="indications" className="min-w-0 rounded-[20px] px-2 py-3 text-[11px] font-semibold data-[state=active]:bg-[#0d3b18] data-[state=active]:text-white sm:rounded-full sm:px-5 sm:py-2.5 sm:text-sm">
                    <UsersRound className="h-4 w-4" />
                    <span className="sm:hidden">Leads</span>
                    <span className="hidden sm:inline">Minhas indicações</span>
                  </TabsTrigger>
                  <TabsTrigger value="commissions" className="min-w-0 rounded-[20px] px-2 py-3 text-[11px] font-semibold data-[state=active]:bg-[#0d3b18] data-[state=active]:text-white sm:rounded-full sm:px-5 sm:py-2.5 sm:text-sm">
                    <WalletCards className="h-4 w-4" />
                    <span>Comissões</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="overview" className="space-y-6">
                <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
                  <Card className="rounded-[32px] border-none bg-[#0d3b18] text-white shadow-[0_24px_80px_rgba(13,59,24,0.30)]">
                    <CardContent className="p-5 sm:p-6 lg:p-8">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-200">Perfil ativo</p>
                          <h2 className="mt-3 text-xl font-semibold sm:text-2xl lg:text-3xl">
                            {formatPartnerTypeLabel(partnerProfile.tipo)}
                          </h2>
                          <p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-100/90 lg:leading-7">
                            {copy?.highlight}
                          </p>
                        </div>

                        <CreatePartnerIndicationDialog
                          parceiroId={partnerProfile.id}
                          onCreated={() => setIndicatorsReloadKey((value) => value + 1)}
                        />
                      </div>

                      <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
                        <div className="rounded-[24px] bg-white/8 p-5 backdrop-blur">
                          <p className="text-xs uppercase tracking-[0.2em] text-emerald-200">Total de indicações</p>
                          <p className="mt-3 text-3xl font-bold sm:text-4xl">{loadingIndicators ? "..." : indicators.totalIndicacoes}</p>
                        </div>
                        <div className="rounded-[24px] bg-white/8 p-5 backdrop-blur">
                          <div className="flex items-center gap-2 text-emerald-200">
                            <TrendingUp className="h-4 w-4" />
                            <p className="text-xs uppercase tracking-[0.2em]">Em negociação</p>
                          </div>
                          <p className="mt-3 text-3xl font-bold sm:text-4xl">{loadingIndicators ? "..." : indicators.emNegociacao}</p>
                        </div>
                        <div className="rounded-[24px] bg-white/8 p-5 backdrop-blur">
                          <div className="flex items-center gap-2 text-emerald-200">
                            <UserCheck className="h-4 w-4" />
                            <p className="text-xs uppercase tracking-[0.2em]">Convertidas</p>
                          </div>
                          <p className="mt-3 text-3xl font-bold sm:text-4xl">{loadingIndicators ? "..." : indicators.convertidas}</p>
                        </div>
                        <div className="rounded-[24px] bg-white/8 p-5 backdrop-blur">
                          <div className="flex items-center gap-2 text-emerald-200">
                            <UserRoundX className="h-4 w-4" />
                            <p className="text-xs uppercase tracking-[0.2em]">Não convertidas</p>
                          </div>
                          <p className="mt-3 text-3xl font-bold sm:text-4xl">{loadingIndicators ? "..." : indicators.naoConvertidas}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid gap-4">
                    <Card className="rounded-[28px] border-white/60 bg-white/88 shadow-soft">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-2 text-primary">
                          <Link2 className="h-4 w-4" />
                          <p className="text-xs font-semibold uppercase tracking-[0.2em]">Link do parceiro</p>
                        </div>
                        <p className="mt-3 break-all text-sm font-medium text-slate-900">{buildPartnerPublicLink(partnerProfile)}</p>
                        <Button variant="outline" size="sm" className="mt-4 w-full rounded-full sm:w-auto" onClick={handleCopyLink}>
                          <Copy className="h-4 w-4" />
                          Copiar link
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="rounded-[28px] border-white/60 bg-white/88 shadow-soft">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-2 text-primary">
                          <WalletCards className="h-4 w-4" />
                          <p className="text-xs font-semibold uppercase tracking-[0.2em]">Chave Pix</p>
                        </div>
                        <p className="mt-3 break-all text-base font-medium text-slate-900">{maskPixKey(partnerProfile.chave_pix)}</p>
                        <p className="mt-2 text-sm text-muted-foreground">Gerenciada pelo admin por segurança.</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {indicatorsError && (
                  <Card className="rounded-[28px] border-destructive/30 shadow-soft">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-3 text-destructive">
                        <AlertCircle className="mt-0.5 h-5 w-5" />
                        <p className="text-sm leading-7">Não foi possível carregar os indicadores. Detalhe: {indicatorsError}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="indications">
                <PartnerIndicationsSection
                  parceiroId={partnerProfile.id}
                  reloadKey={indicatorsReloadKey}
                />
              </TabsContent>

              <TabsContent value="commissions">
                <PartnerCommissionsSection
                  parceiroId={partnerProfile.id}
                  reloadKey={indicatorsReloadKey}
                />
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
}