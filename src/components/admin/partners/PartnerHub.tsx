import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PartnerCommissionsSection from "@/components/admin/partners/PartnerCommissionsSection";
import PartnerCrmSection from "@/components/admin/partners/PartnerCrmSection";
import PartnerManager from "@/components/admin/partners/PartnerManager";
import { useSessionStorageState } from "@/hooks/useSessionStorageState";
import { BriefcaseBusiness, Coins, UsersRound } from "lucide-react";

type PartnerHubTab = "registry" | "crm" | "commissions";

const tabMeta: Record<PartnerHubTab, { label: string; description: string }> = {
  registry: {
    label: "Parceiros",
    description: "Cadastro, acessos e visão operacional da rede.",
  },
  crm: {
    label: "CRM de Indicações",
    description: "Pipeline comercial por etapas com edição de lead em contexto.",
  },
  commissions: {
    label: "Comissões",
    description: "Lançamentos, pendências e pagamentos por parceiro.",
  },
};

export default function PartnerHub() {
  const [tab, setTab] = useSessionStorageState<PartnerHubTab>("controle.partnerHub.tab", "registry");
  const activeMeta = useMemo(() => tabMeta[tab], [tab]);

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden rounded-[28px] border-none bg-[linear-gradient(135deg,#0d3b18_0%,#21572b_42%,#70831d_100%)] text-white shadow-[0_24px_80px_rgba(13,59,24,0.24)]">
        <CardContent className="p-6 lg:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <Badge className="border border-white/15 bg-white/10 text-white hover:bg-white/10">
                Gestão de Parcerias
              </Badge>
              <h2 className="mt-4 text-3xl font-bold tracking-tight lg:text-4xl">Operação unificada de parceiros, CRM e comissões</h2>
              <p className="mt-3 text-sm leading-7 text-white/82 lg:text-base">
                Centralize cadastro, acompanhamento comercial e financeiro em um fluxo único, com menos troca de tela e leitura mais clara do pipeline.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[420px]">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                <UsersRound className="h-5 w-5 text-white/85" />
                <p className="mt-3 text-xs uppercase tracking-[0.18em] text-white/60">Rede</p>
                <p className="mt-1 text-sm font-semibold text-white">Parceiros e acessos</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                <BriefcaseBusiness className="h-5 w-5 text-white/85" />
                <p className="mt-3 text-xs uppercase tracking-[0.18em] text-white/60">CRM</p>
                <p className="mt-1 text-sm font-semibold text-white">Pipeline por etapa</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                <Coins className="h-5 w-5 text-white/85" />
                <p className="mt-3 text-xs uppercase tracking-[0.18em] text-white/60">Financeiro</p>
                <p className="mt-1 text-sm font-semibold text-white">Pagamentos e lançamentos</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={tab} onValueChange={(value) => setTab(value as PartnerHubTab)} className="space-y-5">
        <div className="flex flex-col gap-4 rounded-[28px] border bg-card/85 p-4 shadow-soft supports-[backdrop-filter]:backdrop-blur sm:p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Área ativa</p>
            <h3 className="mt-2 text-xl font-semibold">{activeMeta.label}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{activeMeta.description}</p>
          </div>

          <TabsList className="h-auto flex-wrap justify-start gap-2 rounded-[20px] bg-muted/50 p-1.5">
            <TabsTrigger value="registry" className="rounded-2xl px-4 py-2.5">Parceiros</TabsTrigger>
            <TabsTrigger value="crm" className="rounded-2xl px-4 py-2.5">CRM de Indicações</TabsTrigger>
            <TabsTrigger value="commissions" className="rounded-2xl px-4 py-2.5">Comissões</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="registry" className="mt-0">
          <PartnerManager />
        </TabsContent>

        <TabsContent value="crm" className="mt-0">
          <PartnerCrmSection />
        </TabsContent>

        <TabsContent value="commissions" className="mt-0">
          <PartnerCommissionsSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}