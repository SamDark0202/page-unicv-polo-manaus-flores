import { Fragment, useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { ChevronLeft, ChevronRight, FileText, GraduationCap, LogOut, Moon, Sun, BarChart3, Settings, UsersRound } from "lucide-react";
import LoginGate from "../components/admin/LoginGate";
import PostList from "../components/admin/PostList";
import PostEditor from "../components/admin/PostEditor";
import CourseManager from "@/components/admin/courses/CourseManager";
import AnalyticsDashboard from "@/components/admin/AnalyticsDashboard";
import PartnerHub from "@/components/admin/partners/PartnerHub";
import AdminSettingsHub from "@/components/admin/settings/AdminSettingsHub";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useThemeMode } from "@/hooks/useThemeMode";
import { useSessionStorageState } from "@/hooks/useSessionStorageState";
import { useAdminAuth } from "@/contexts/AuthContext";
import { useAdminAccess } from "@/hooks/useAdminAccess";

type BlogView = "list" | "editor";
type AdminSection = "blog" | "courses" | "analytics" | "partners" | "settings";

type SidebarItem = {
  value: AdminSection;
  label: string;
  description: string;
  icon: LucideIcon;
  group?: string;
};

export default function Controle() {
  const [section, setSection] = useSessionStorageState<AdminSection>("controle.section", "blog");
  const [blogView, setBlogView] = useSessionStorageState<BlogView>("controle.blogView", "list");
  const [editingIndex, setEditingIndex] = useSessionStorageState<number | null>("controle.editingIndex", null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useSessionStorageState<boolean>("controle.sidebarCollapsed", false);
  const [signingOut, setSigningOut] = useState(false);
  const [courseCreateSignal, setCourseCreateSignal] = useState(0);
  const { theme, toggleTheme } = useThemeMode();
  const { user, signOut } = useAdminAuth();
  const { role, permissions } = useAdminAccess();
  const userEmail = user?.email ?? "Conta Unicive";
  const userInitials = userEmail.charAt(0).toUpperCase() || "UC";

  async function handleLogout() {
    try {
      setSigningOut(true);
      await signOut();
    } catch (error) {
      console.error("Erro ao encerrar sessão", error);
    } finally {
      setSigningOut(false);
    }
  }

  function openEditor(index: number | null) {
    setEditingIndex(index);
    setBlogView("editor");
  }

  function backToBlogList() {
    setBlogView("list");
    setEditingIndex(null);
  }

  function renderContent() {
    if (section === "settings") {
      return <AdminSettingsHub canManageUsers={permissions.canManageInternalUsers} />;
    }

    if (section === "analytics") {
      return <AnalyticsDashboard />;
    }

    if (section === "partners") {
      return (
        <PartnerHub
          permissions={{
            canManagePartners: permissions.canManagePartners,
            canEditCrm: permissions.canEditCrm,
            canDeleteLeads: permissions.canDeleteLeads,
            readOnlyOperational: permissions.canReadOnlyOperational,
            hideCommissions: role === "vendedor",
          }}
        />
      );
    }

    if (section === "courses") {
      const allowedSections = role === "vendedor"
        ? (["courses", "technical-to-technologist", "second-graduation"] as const)
        : undefined;
      return (
        <CourseManager
          createSignal={courseCreateSignal}
          allowedSections={allowedSections}
          canEditCourses={role !== "vendedor"}
        />
      );
    }

    if (blogView === "editor") {
      return <PostEditor index={editingIndex} onBack={backToBlogList} />;
    }

    return (
      <PostList
        onEdit={(idx) => openEditor(idx)}
        onCreate={() => openEditor(null)}
      />
    );
  }

  const sidebarItems: SidebarItem[] = [
    ...(role === "redator"
      ? ([{ value: "blog", label: "Gestão de Blog", description: "Posts, capas e SEO", icon: FileText }] satisfies SidebarItem[])
      : role === "vendedor"
        ? ([
            { value: "partners", label: "Gestão de Parcerias", description: "Parceiros e CRM", icon: UsersRound, group: "Gestão de Parcerias" },
            { value: "courses", label: "Gestão de Cursos", description: "Cursos e técnico para tecnólogo", icon: GraduationCap },
          ] satisfies SidebarItem[])
        : ([
            { value: "analytics", label: "Analytics", description: "KPIs e métricas do site", icon: BarChart3 },
            { value: "partners", label: "Gestão de Parcerias", description: "Cadastro, CRM e comissões", icon: UsersRound, group: "Gestão de Parcerias" },
            { value: "blog", label: "Gestão de Blog", description: "Posts, capas e SEO", icon: FileText },
            { value: "courses", label: "Gestão de Cursos", description: "Modalidades e ofertas", icon: GraduationCap },
          ] satisfies SidebarItem[])),
    ...(permissions.canSeeSettings
      ? ([{ value: "settings", label: "Configurações", description: "Usuários internos e logs", icon: Settings, group: "Sistema" }] satisfies SidebarItem[])
      : []),
  ];

  const isBlogSection = section === "blog";
  const isPartnersGroup = section === "partners";
  const pageTitle = section === "analytics"
    ? "Métricas do site"
    : section === "partners"
      ? "Gestão de Parcerias"
    : section === "settings"
      ? "Configurações"
    : isBlogSection
      ? blogView === "editor"
        ? "Editar Post"
        : "Posts publicados"
      : "Cursos e modalidades";
  const pageSubtitle = section === "analytics"
    ? "Acompanhe visitantes, visualizações, cliques e formulários em tempo real."
    : section === "partners"
      ? "Centralize parceiros, pipeline comercial e financeiro em uma única experiência operacional."
    : section === "settings"
      ? "Controle usuários internos, perfis de acesso e trilhas de auditoria do sistema."
    : isBlogSection
      ? "Gerencie conteúdos, capas e SEO do blog institucional."
      : "Organize matrizes curriculares e disponibilidade dos cursos.";

  useEffect(() => {
    if (!role) return;

    if (role === "redator" && section !== "blog") {
      setSection("blog");
      return;
    }

    if (role === "vendedor" && section !== "partners" && section !== "courses") {
      setSection("partners");
      return;
    }

    if (section === "settings" && !permissions.canSeeSettings) {
      setSection(role === "redator" ? "blog" : role === "vendedor" ? "partners" : "analytics");
    }
  }, [role, section, permissions.canSeeSettings, setSection]);

  return (
    <LoginGate>
      <div className="flex min-h-screen bg-muted/30 transition-colors duration-300 dark:bg-background">
        <aside
          className={cn(
            "hidden md:flex flex-col border-r bg-card/80 shadow-soft supports-[backdrop-filter]:backdrop-blur",
            "sticky top-0 h-screen overflow-y-auto transition-all duration-300",
            isSidebarCollapsed ? "w-20" : "w-72"
          )}
        >
          {/* Logo */}
          <div className="flex items-center gap-3 px-4 py-5">
            <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-lg font-bold text-primary">
              UC
            </div>
            {!isSidebarCollapsed && (
              <div className="min-w-0">
                <p className="text-sm font-semibold text-muted-foreground">Painel Unicive</p>
                <p className="text-xs text-muted-foreground/80">Administração integrada</p>
              </div>
            )}
          </div>

          {/* Navegação */}
          <nav className="flex-1 px-3 space-y-1">
            {sidebarItems.map((item, idx) => {
              const isActive = section === item.value;
              const Icon = item.icon;
              const prevGroup = idx > 0 ? sidebarItems[idx - 1].group : undefined;
              const showGroupLabel = !isSidebarCollapsed && item.group && item.group !== prevGroup;
              return (
                <Fragment key={item.value}>
                  {showGroupLabel && (
                    <p className="px-4 pb-1 pt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
                      {item.group}
                    </p>
                  )}
                <button
                  title={item.label}
                  className={cn(
                    "group flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm transition-all",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-soft"
                      : "text-muted-foreground hover:bg-muted/60",
                    isSidebarCollapsed && "justify-center px-3"
                  )}
                  onClick={() => {
                    setSection(item.value);
                    if (item.value === "blog") {
                      setBlogView("list");
                    }
                  }}
                >
                  <Icon className="h-5 w-5" />
                  {!isSidebarCollapsed && (
                    <div className="flex-1">
                      <div className="font-semibold">{item.label}</div>
                      <div
                        className={cn(
                          "text-xs",
                          isActive ? "text-primary-foreground/80" : "text-muted-foreground/80"
                        )}
                      >
                        {item.description}
                      </div>
                    </div>
                  )}
                </button>
                </Fragment>
              );
            })}
          </nav>

          {/* Rodapé: usuário + sair + recolher */}
          <div className="px-3 pb-4 pt-2 space-y-2">
            {/* Informação do usuário */}
            <div
              className={cn(
                "flex items-center gap-3 rounded-2xl px-3 py-3",
                isSidebarCollapsed && "justify-center"
              )}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold uppercase text-primary">
                {userInitials}
              </div>
              {!isSidebarCollapsed && (
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground/80">Logado como</p>
                  <p className="text-sm font-medium text-foreground truncate">{userEmail}</p>
                </div>
              )}
            </div>

            {/* Botão sair */}
            <Button
              type="button"
              variant="ghost"
              size={isSidebarCollapsed ? "icon" : "default"}
              aria-label="Encerrar sessão"
              title={signingOut ? "Saindo..." : "Sair da conta"}
              disabled={signingOut}
              onClick={handleLogout}
              className={cn(
                "w-full justify-center gap-2 rounded-2xl border border-red-200 bg-red-50/80 text-red-700 hover:bg-red-100",
                "dark:border-red-500/40 dark:bg-red-500/20 dark:text-red-50 dark:hover:bg-red-500/30",
                isSidebarCollapsed && "px-0"
              )}
            >
              <LogOut className="h-4 w-4" />
              {!isSidebarCollapsed && <span>{signingOut ? "Saindo..." : "Sair"}</span>}
            </Button>

            {/* Separador visual */}
            <div className="border-t border-border/40" />

            {/* Botão recolher/expandir */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn(
                "w-full justify-center gap-2 text-muted-foreground hover:text-foreground",
                isSidebarCollapsed && "px-0"
              )}
              onClick={() => setIsSidebarCollapsed((prev) => !prev)}
            >
              {isSidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              {!isSidebarCollapsed && <span className="text-xs">Recolher menu</span>}
            </Button>
          </div>
        </aside>

        <div className="flex flex-1 flex-col">
          <header className="border-b bg-card/80 px-6 py-4 shadow-soft transition-colors supports-[backdrop-filter]:backdrop-blur">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                  {isPartnersGroup ? "Gestão de Parcerias" : section === "analytics" ? "Analytics" : isBlogSection ? "Gestão de Blog" : "Gestão de Cursos"}
                </p>
                <h1 className="text-2xl font-bold">{pageTitle}</h1>
                <p className="text-sm text-muted-foreground">{pageSubtitle}</p>
                <div className="mt-4 flex gap-2 md:hidden">
                  {sidebarItems.map((item) => (
                    <Button
                      key={item.value}
                      variant={section === item.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setSection(item.value);
                        if (item.value === "blog") setBlogView("list");
                      }}
                    >
                      {item.label}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label={`Alternar para tema ${theme === "dark" ? "claro" : "escuro"}`}
                  onClick={toggleTheme}
                  className="shadow-soft"
                >
                  {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Sair da conta"
                  title="Sair da conta"
                  onClick={handleLogout}
                  disabled={signingOut}
                  className="shadow-soft md:hidden"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
                {isBlogSection && (
                  <div className="flex gap-2">
                    {blogView === "editor" ? (
                      <Button variant="outline" onClick={backToBlogList}>
                        Voltar para lista
                      </Button>
                    ) : (
                      <Button onClick={() => openEditor(null)}>+ Novo Post</Button>
                    )}
                  </div>
                )}
                {section === "courses" && role !== "vendedor" && (
                  <Button onClick={() => setCourseCreateSignal((p) => p + 1)}>+ Novo curso</Button>
                )}
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
            <div className="mx-auto w-full max-w-6xl">{renderContent()}</div>
          </main>
        </div>
      </div>
    </LoginGate>
  );
}
