import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { partnerSupabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  clearPartnerPasswordSetupUrl,
  clearPartnerPasswordSetupPending,
  hasPartnerPasswordSetupContext,
  markPartnerPasswordSetupPending,
  resolvePartnerPasswordSetupSession,
} from "@/lib/partnerPasswordSetup";
import { AlertTriangle, CheckCircle2, KeyRound, Loader2 } from "lucide-react";
import Header from "@/components/Header";

type PageState = "loading" | "form" | "success" | "invalid";

export default function ParceriasDefinirSenha() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [pageState, setPageState] = useState<PageState>("loading");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    const hasContext = hasPartnerPasswordSetupContext();
    if (hasContext) {
      markPartnerPasswordSetupPending();
    }

    async function resolveInitialState() {
      if (!hasContext) {
        clearPartnerPasswordSetupPending();
        setPageState("invalid");
        return;
      }

      const resolvedAuth = await resolvePartnerPasswordSetupSession();
      if (resolvedAuth.error) {
        clearPartnerPasswordSetupPending();
        toast({
          title: "Link inválido ou expirado",
          description: resolvedAuth.error.message,
          variant: "destructive",
        });
        setPageState("invalid");
        return;
      }

      const { data, error } = await partnerSupabase.auth.getUser();
      if (error) {
        clearPartnerPasswordSetupPending();
        setPageState("invalid");
        return;
      }

      if (data.user) {
        clearPartnerPasswordSetupUrl();
        setUserEmail(data.user.email ?? "");
        setPageState("form");
        return;
      }

      clearPartnerPasswordSetupPending();
      setPageState("invalid");
    }

    void resolveInitialState();
  }, [toast]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (password.length < 8) {
      toast({
        title: "Senha muito curta",
        description: "A senha deve ter pelo menos 8 caracteres.",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Senhas não coincidem",
        description: "Verifique se os campos estão iguais.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await partnerSupabase.auth.updateUser({ password });
      if (error) throw error;

      clearPartnerPasswordSetupPending();
      setPageState("success");
      toast({
        title: "Senha definida com sucesso!",
        description: "Redirecionando para o login do painel...",
      });

      // Encerra a sessão temporária e redireciona para o login
      await partnerSupabase.auth.signOut();
      setTimeout(() => navigate("/parcerias/painel", { replace: true }), 2500);
    } catch (error) {
      toast({
        title: "Erro ao salvar senha",
        description:
          error instanceof Error
            ? error.message
            : "Tente novamente ou solicite um novo link ao administrador.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const passwordsMatch =
    password.length > 0 &&
    confirmPassword.length > 0 &&
    password === confirmPassword;

  const passwordMismatch =
    password.length > 0 &&
    confirmPassword.length > 0 &&
    password !== confirmPassword;

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Criar senha de acesso | Painel do Parceiro | Unicive Polo Flores</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <Header />

      <section className="min-h-[80vh] flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          {/* Carregando */}
          {pageState === "loading" && (
            <Card>
              <CardContent className="flex flex-col items-center py-16 gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground text-sm">
                  Validando seu link de acesso...
                </p>
              </CardContent>
            </Card>
          )}

          {/* Link inválido ou expirado */}
          {pageState === "invalid" && (
            <Card className="border-destructive/40">
              <CardContent className="flex flex-col items-center py-12 gap-4">
                <AlertTriangle className="h-10 w-10 text-destructive" />
                <div className="text-center space-y-1">
                  <h2 className="font-semibold text-lg">Link inválido ou expirado</h2>
                  <p className="text-muted-foreground text-sm">
                    Este link de acesso não é mais válido. Entre em contato com o
                    administrador para solicitar um novo link.
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => navigate("/parcerias/painel")}
                >
                  Ir para o login
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Formulário de criação de senha */}
          {pageState === "form" && (
            <Card>
              <CardHeader className="text-center pb-2">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <KeyRound className="h-7 w-7 text-primary" />
                </div>
                <CardTitle className="text-xl">Crie sua senha de acesso</CardTitle>
                {userEmail && (
                  <p className="text-sm text-muted-foreground mt-1">{userEmail}</p>
                )}
              </CardHeader>
              <CardContent className="pt-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="password"
                      className="text-sm font-medium"
                    >
                      Nova senha
                    </label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Mínimo 8 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoFocus
                      autoComplete="new-password"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="confirmPassword"
                      className="text-sm font-medium"
                    >
                      Confirme a senha
                    </label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Repita a senha"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                      className={
                        passwordMismatch
                          ? "border-destructive focus-visible:ring-destructive/30"
                          : passwordsMatch
                          ? "border-green-500 focus-visible:ring-green-500/30"
                          : ""
                      }
                    />
                    {passwordMismatch && (
                      <p className="text-xs text-destructive">
                        As senhas não coincidem.
                      </p>
                    )}
                    {passwordsMatch && (
                      <p className="text-xs text-green-600">Senhas conferem ✓</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={
                      isSubmitting ||
                      !password ||
                      !confirmPassword ||
                      passwordMismatch
                    }
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Salvando...
                      </>
                    ) : (
                      "Confirmar e acessar painel"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Sucesso */}
          {pageState === "success" && (
            <Card className="border-green-300">
              <CardContent className="flex flex-col items-center py-12 gap-4">
                <CheckCircle2 className="h-12 w-12 text-green-500" />
                <div className="text-center space-y-1">
                  <h2 className="font-semibold text-lg">Senha criada com sucesso!</h2>
                  <p className="text-muted-foreground text-sm">
                    Redirecionando para o login do painel do parceiro...
                  </p>
                </div>
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </div>
  );
}
