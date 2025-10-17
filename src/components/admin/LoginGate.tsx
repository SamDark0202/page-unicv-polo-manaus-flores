import { useEffect, useState } from "react";

const USER = "Samuel";
const PASS = "unicv2025";

export default function LoginGate({ children }: { children: React.ReactNode }) {
  const [ok, setOk] = useState<boolean>(false);
  const [u, setU] = useState("");
  const [p, setP] = useState("");

  useEffect(() => {
    const flag = sessionStorage.getItem("ucv-auth") === "1";
    setOk(flag);
  }, []);

  function login(e: React.FormEvent) {
    e.preventDefault();
    if (u === USER && p === PASS) {
      sessionStorage.setItem("ucv-auth", "1");
      setOk(true);
    } else {
      alert("Credenciais inválidas");
    }
  }

  if (ok) return <>{children}</>;

  return (
    <div className="min-h-screen grid place-items-center bg-gray-50">
      <form onSubmit={login} className="bg-white p-8 rounded-2xl shadow-md w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-4">Acesso ao Painel</h1>
        <label className="block mb-2 text-sm">Usuário</label>
        <input className="w-full border rounded p-2 mb-4" value={u} onChange={(e)=>setU(e.target.value)} />
        <label className="block mb-2 text-sm">Senha</label>
        <input className="w-full border rounded p-2 mb-6" type="password" value={p} onChange={(e)=>setP(e.target.value)} />
        <button className="w-full bg-[#11493C] text-white py-2 rounded-2xl">Entrar</button>
      </form>
    </div>
  );
}
