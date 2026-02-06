import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginGate({ children }: { children: React.ReactNode }) {
  const { user, loading, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      <div className="min-h-screen grid place-items-center bg-gray-50">
        <div className="text-gray-600">Carregando...</div>
      </div>
    );
  }

  if (user) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen grid place-items-center bg-gray-50">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded-2xl shadow-md w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-4">Acesso ao Painel</h1>
        
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        <label className="block mb-2 text-sm">E-mail</label>
        <input
          type="email"
          className="w-full border rounded p-2 mb-4"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={submitting}
        />
        
        <label className="block mb-2 text-sm">Senha</label>
        <input
          type="password"
          className="w-full border rounded p-2 mb-6"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={submitting}
        />
        
        <button
          type="submit"
          className="w-full bg-[#11493C] text-white py-2 rounded-2xl disabled:opacity-50"
          disabled={submitting}
        >
          {submitting ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
