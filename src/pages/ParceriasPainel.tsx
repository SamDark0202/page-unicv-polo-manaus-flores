import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { usePasswordRecoveryCooldown } from "@/hooks/usePasswordRecoveryCooldown";
import { usePartnerAuth } from "@/contexts/AuthContext";
import { getPasswordRecoveryRetryAfterSeconds } from "@/lib/passwordRecovery";
import {
  hasPartnerPasswordSetupContext,
  isPartnerPasswordSetupPending,
} from "@/lib/partnerPasswordSetup";
import { KeyRound, Loader2, LogIn, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Helmet } from "react-helmet";
import { Navigate, useLocation, useNavigate } from "react-router-dom";

export default function ParceriasPainel() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { getRemainingSeconds, isCooldownActive, startCooldown } = usePasswordRecoveryCooldown();
  const { user, loading, signIn, resetPassword } = usePartnerAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  const recoveryCooldownKey = "partner-panel-recovery";

  const hasSetupContext = hasPartnerPasswordSetupContext(location.search, location.hash);
  const setupPending = isPartnerPasswordSetupPending();

  if (hasSetupContext || (user && setupPending)) {
    return (
      <Navigate
        to={{
          pathname: "/parcerias/definir-senha",
          search: location.search,
          hash: location.hash,
        }}
        replace
      />
    );
  }

  if (!loading && user) {
    return <Navigate to="/parcerias/painel/dashboard" replace />;
  }

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSigningIn(true);
    try {
      await signIn(email, password);
      navigate("/parcerias/painel/dashboard", { replace: true });
    } catch (error) {
      toast({
        title: "Falha no login",
        description: error instanceof Error ? error.message : "Não foi possível entrar agora.",
        variant: "destructive",
      });
    } finally {
      setIsSigningIn(false);
    }
  }

  async function handleRecoverPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsRecovering(true);
    try {
      await resetPassword(recoveryEmail);
      startCooldown(recoveryCooldownKey);
      toast({
        title: "Recuperação enviada",
        description: "Verifique seu e-mail para redefinir a senha de acesso ao painel.",
      });
      setRecoveryEmail("");
    } catch (error) {
      const retryAfterSeconds = getPasswordRecoveryRetryAfterSeconds(error);
      if (retryAfterSeconds) {
        startCooldown(recoveryCooldownKey, retryAfterSeconds);
      }
      toast({
        title: "Falha na recuperação",
        description: error instanceof Error ? error.message : "Não foi possível enviar o e-mail de recuperação.",
        variant: "destructive",
      });
    } finally {
      setIsRecovering(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Painel do Parceiro | Unicive Polo Flores</title>
        <meta
          name="description"
          content="Acesse o Painel do Parceiro para acompanhar suas indicações, resultados e comissões no programa de parcerias da Unicive Polo Flores."
        />
      </Helmet>

      <Header />

      <section className="bg-gradient-subtle py-16 lg:py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="space-y-6">
              <Badge>Painel de Indicação e Parcerias</Badge>
              <h1 className="text-4xl font-bold leading-tight">Acesso do parceiro</h1>
              <p className="text-lg leading-8 text-muted-foreground">
                Entre com seu e-mail e senha para acompanhar o desempenho das suas indicações e a evolução das comissões.
              </p>
            </div>

            <div className="space-y-6">
              <Card className="rounded-3xl shadow-soft">
                <CardContent className="p-8">
                  <div className="mb-6">
                    <h2 className="text-2xl font-semibold">Login do parceiro</h2>
                    <p className="mt-2 text-sm leading-7 text-muted-foreground">Use as credenciais cadastradas pela equipe administrativa.</p>
                  </div>

                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium" htmlFor="partner-email">E-mail</label>
                      <Input
                        id="partner-email"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="seuemail@dominio.com"
                        autoComplete="email"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium" htmlFor="partner-password">Senha</label>
                      <Input
                        id="partner-password"
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="Digite sua senha"
                        autoComplete="current-password"
                        required
                      />
                    </div>

                    <Button type="submit" className="w-full" size="lg" disabled={isSigningIn || loading}>
                      {isSigningIn ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Entrando...
                        </>
                      ) : (
                        <>
                          <LogIn className="h-4 w-4" />
                          Entrar no painel
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card className="rounded-3xl shadow-soft">
                <CardContent className="p-8">
                  <div className="mb-6">
                    <h2 className="text-2xl font-semibold">Recuperar senha</h2>
                    <p className="mt-2 text-sm leading-7 text-muted-foreground">Informe seu e-mail para receber o link de redefinição.</p>
                  </div>

                  <form onSubmit={handleRecoverPassword} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium" htmlFor="recovery-email">E-mail de recuperação</label>
                      <Input
                        id="recovery-email"
                        type="email"
                        value={recoveryEmail}
                        onChange={(event) => setRecoveryEmail(event.target.value)}
                        placeholder="seuemail@dominio.com"
                        autoComplete="email"
                        required
                      />
                    </div>

                    <Button
                      type="submit"
                      variant="outline"
                      className="w-full"
                      size="lg"
                      disabled={isRecovering || loading || isCooldownActive(recoveryCooldownKey)}
                    >
                      {isRecovering ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Enviando link...
                        </>
                      ) : isCooldownActive(recoveryCooldownKey) ? (
                        <>
                          <KeyRound className="h-4 w-4" />
                          Aguarde {getRemainingSeconds(recoveryCooldownKey)}s
                        </>
                      ) : (
                        <>
                          <KeyRound className="h-4 w-4" />
                          Enviar recuperação
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <Footer showPromoBanner={false} />
    </div>
  );
}