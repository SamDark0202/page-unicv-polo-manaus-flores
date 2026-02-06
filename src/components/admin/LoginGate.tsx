import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Lock, Mail, Eye, EyeOff, Loader2 } from "lucide-react";

export default function LoginGate({ children }: { children: React.ReactNode }) {
  const { user, loading, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await signIn(email, password);
    } catch (err: any) {
      setError(err.message || "Credenciais inválidas");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-gradient-to-br from-[#0d3b30] to-[#11493C]">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  if (user) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-br from-[#0d3b30] to-[#11493C] px-4">
      <div className="w-full max-w-md">
        {/* Logo / Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm mb-4">
            <Lock className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Painel UniCV</h1>
          <p className="text-white/60 mt-1 text-sm">Polo Flores — Área administrativa</p>
        </div>

        {/* Card do formulário */}
        <form
          onSubmit={handleLogin}
          className="bg-white rounded-2xl shadow-2xl p-8 space-y-5"
        >
          <h2 className="text-xl font-semibold text-gray-800 text-center">
            Entrar na sua conta
          </h2>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm text-center">
              {error}
            </div>
          )}

          {/* E-mail */}
          <div>
            <label htmlFor="login-email" className="block mb-1.5 text-sm font-medium text-gray-700">
              E-mail
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                id="login-email"
                type="email"
                placeholder="seu@email.com"
                className="w-full border border-gray-300 rounded-lg py-2.5 pl-10 pr-4 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#11493C]/40 focus:border-[#11493C] transition"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={submitting}
              />
            </div>
          </div>

          {/* Senha */}
          <div>
            <label htmlFor="login-password" className="block mb-1.5 text-sm font-medium text-gray-700">
              Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="w-full border border-gray-300 rounded-lg py-2.5 pl-10 pr-11 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#11493C]/40 focus:border-[#11493C] transition"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={submitting}
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Botão */}
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-[#11493C] hover:bg-[#0d3b30] text-white font-medium py-2.5 rounded-xl disabled:opacity-50 transition-colors"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Entrando...
              </>
            ) : (
              "Entrar"
            )}
          </button>
        </form>

        <p className="text-center text-white/40 text-xs mt-6">
          © {new Date().getFullYear()} UniCV Polo Flores
        </p>
      </div>
    </div>
  );
}
