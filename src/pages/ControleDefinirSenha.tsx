import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { adminSupabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  clearAdminPasswordSetupUrl,
  hasAdminPasswordSetupContext,
  resolveAdminPasswordSetupSession,
} from "@/lib/adminPasswordSetup";
import { AlertTriangle, CheckCircle2, KeyRound, Loader2 } from "lucide-react";

type PageState = "loading" | "form" | "success" | "invalid";

export default function ControleDefinirSenha() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [pageState, setPageState] = useState<PageState>("loading");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    async function resolveInitialState() {
      const hasContext = hasAdminPasswordSetupContext();
      if (!hasContext) {
        const { data } = await adminSupabase.auth.getUser();
        if (data.user) {
          setUserEmail(data.user.email || "");
          setPageState("form");
          return;
        }

        setPageState("invalid");
        return;
      }

      const resolvedAuth = await resolveAdminPasswordSetupSession();
      if (resolvedAuth.error) {
        toast({
          title: "Link inválido ou expirado",
          description: resolvedAuth.error.message,
          variant: "destructive",
        });
        setPageState("invalid");
        return;
      }

      const { data, error } = await adminSupabase.auth.getUser();
      if (error || !data.user) {
        setPageState("invalid");
        return;
      }

      clearAdminPasswordSetupUrl();
      setUserEmail(data.user.email ?? "");
      setPageState("form");
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
      const { error } = await adminSupabase.auth.updateUser({ password });
      if (error) throw error;

      setPageState("success");
      toast({
        title: "Senha definida com sucesso!",
        description: "Redirecionando para o painel administrativo...",
      });

      setTimeout(() => navigate("/controle", { replace: true }), 1500);
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
    <div className="min-h-screen grid place-items-center bg-gradient-to-br from-[#0d3b30] to-[#11493C] px-4 py-10">
      <Helmet>
        <title>Definir senha administrativa | Painel Unicive</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="w-full max-w-md">
        {pageState === "loading" && (
          <Card>
            <CardContent className="flex flex-col items-center py-14 gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground text-sm">Validando seu link de acesso...</p>
            </CardContent>
          </Card>
        )}

        {pageState === "invalid" && (
          <Card className="border-destructive/40">
            <CardContent className="flex flex-col items-center py-12 gap-4">
              <AlertTriangle className="h-10 w-10 text-destructive" />
              <div className="text-center space-y-1">
                <h2 className="font-semibold text-lg">Link inválido ou expirado</h2>
                <p className="text-muted-foreground text-sm">
                  Este link não é mais válido. Solicite ao administrador um novo e-mail para definição de senha.
                </p>
              </div>
              <Button variant="outline" onClick={() => navigate("/controle")}>Ir para o painel</Button>
            </CardContent>
          </Card>
        )}

        {pageState === "form" && (
          <Card>
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <KeyRound className="h-7 w-7 text-primary" />
              </div>
              <CardTitle className="text-xl">Defina sua senha administrativa</CardTitle>
              {userEmail && <p className="text-sm text-muted-foreground mt-1">{userEmail}</p>}
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="password" className="text-sm font-medium">Nova senha</label>
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
                  <label htmlFor="confirmPassword" className="text-sm font-medium">Confirme a senha</label>
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
                  {passwordMismatch && <p className="text-xs text-destructive">As senhas não coincidem.</p>}
                  {passwordsMatch && <p className="text-xs text-green-600">Senhas conferem ✓</p>}
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting || !password || !confirmPassword || passwordMismatch}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Salvando...
                    </>
                  ) : (
                    "Confirmar e entrar no painel"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {pageState === "success" && (
          <Card className="border-green-300">
            <CardContent className="flex flex-col items-center py-12 gap-4">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
              <div className="text-center space-y-1">
                <h2 className="font-semibold text-lg">Senha criada com sucesso!</h2>
                <p className="text-muted-foreground text-sm">Redirecionando para o painel de controle...</p>
              </div>
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
