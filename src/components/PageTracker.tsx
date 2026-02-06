import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { initTracker, trackPageView } from "@/lib/tracker";

/**
 * Componente invisível que:
 * 1. Inicializa o tracker (uma vez)
 * 2. Registra page_view a cada troca de rota
 */
export default function PageTracker() {
  const { pathname } = useLocation();
  const prevPath = useRef<string | null>(null);

  useEffect(() => {
    initTracker();
  }, []);

  useEffect(() => {
    // Evita duplicar no mount inicial quando pathname não mudou
    if (prevPath.current !== pathname) {
      trackPageView(pathname);
      prevPath.current = pathname;
    }
  }, [pathname]);

  return null;
}
