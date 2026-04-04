import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronDown } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import logoImage from "@/assets/unicive-logo-principal.png";
import { isChristmas } from "@/lib/isChristmas";

// Nota: colocar um arquivo `public/gorro-natal.png` com fundo transparente
// permitirá que o gorro seja renderizado sobre a logo quando `isChristmas` for true.

// Declare fbq on the Window interface for TypeScript
declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
  }
}

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDesktopGraduacaoOpen, setIsDesktopGraduacaoOpen] = useState(false);
  const [isMobileGraduacaoOpen, setIsMobileGraduacaoOpen] = useState(false);
  const location = useLocation();
  const openTimeoutRef = useRef<number | null>(null);
  const closeTimeoutRef = useRef<number | null>(null);

  type NavigationItem = {
    name: string;
    href?: string;
    children?: Array<{ name: string; href: string }>;
  };

  const navigation = [
    { name: "Início", href: "/" },
    {
      name: "Graduação EAD/SEMI",
      children: [
        { name: "Bacharelado", href: "/bacharelado" },
        { name: "Licenciatura", href: "/licenciatura" },
        { name: "Tecnólogo", href: "/tecnologo" },
      ],
    },
    { name: "Técnico para Tecnólogo", href: "/tecnico-para-tecnologo" },
    { name: "2ª Graduação", href: "/segunda-graduacao" },
    { name: "Pós-Graduação", href: "/pos-graduacao" },
    { name: "Blog", href: "/blog" },
  ] satisfies NavigationItem[];

  const isCurrentPage = (href: string) => location.pathname.toLowerCase() === href.toLowerCase();

  const isActiveItem = (item: NavigationItem) =>
    (item.href ? isCurrentPage(item.href) : false) ||
    (item.children?.some((child) => isCurrentPage(child.href)) ?? false);

  const clearMenuTimers = () => {
    if (openTimeoutRef.current) {
      window.clearTimeout(openTimeoutRef.current);
      openTimeoutRef.current = null;
    }
    if (closeTimeoutRef.current) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    setIsMenuOpen(false);
    setIsDesktopGraduacaoOpen(false);
    setIsMobileGraduacaoOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    return () => {
      clearMenuTimers();
    };
  }, []);

  const openDesktopGraduacaoMenuWithDelay = () => {
    if (closeTimeoutRef.current) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }

    if (isDesktopGraduacaoOpen) return;

    if (closeTimeoutRef.current) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }

    openTimeoutRef.current = window.setTimeout(() => {
      setIsDesktopGraduacaoOpen(true);
      openTimeoutRef.current = null;
    }, 80);
  };

  const closeDesktopGraduacaoMenuWithDelay = () => {
    if (openTimeoutRef.current) {
      window.clearTimeout(openTimeoutRef.current);
      openTimeoutRef.current = null;
    }

    closeTimeoutRef.current = window.setTimeout(() => {
      setIsDesktopGraduacaoOpen(false);
      closeTimeoutRef.current = null;
    }, 140);
  };

  return (
    <header className="bg-background border-b sticky top-0 z-50">
      <div className="container py-4 px-4 flex items-center justify-between">
        {/* Logo com detalhe natalino (gorrito) */}
        <Link to="/" className="flex items-center space-x-3">
          <div className="relative">
            <img 
              src={logoImage} 
              alt="Unicive Polo Manaus Flores" 
              className="h-8 sm:h-10 md:h-12 lg:h-14 w-auto max-h-14 transition-all duration-200"
              style={{ maxWidth: '180px', objectFit: 'contain' }}
            />
            {isChristmas && (
              <img
                src="/gorro-natal.png"
                alt="Gorro de Natal"
                className="absolute -top-2 -right-2 w-8 sm:w-10 pointer-events-none"
              />
            )}
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center space-x-5">
          {navigation.map((item) =>
            item.children ? (
              <div
                key={item.name}
                className="relative"
                onMouseEnter={openDesktopGraduacaoMenuWithDelay}
                onMouseLeave={closeDesktopGraduacaoMenuWithDelay}
              >
                <button
                  type="button"
                  onClick={() => setIsDesktopGraduacaoOpen((prev) => !prev)}
                  className={`inline-flex items-center gap-1 px-2 py-2 text-[15px] font-medium transition-all rounded-md border-b-2 ${
                    isActiveItem(item)
                      ? "text-primary border-primary"
                      : "text-foreground border-transparent hover:text-primary hover:border-primary/50"
                  }`}
                  aria-haspopup="menu"
                  aria-expanded={isDesktopGraduacaoOpen}
                >
                  {item.name}
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isDesktopGraduacaoOpen ? "rotate-180" : ""}`} />
                </button>

                {isDesktopGraduacaoOpen && (
                  <div
                    className="absolute left-0 top-full mt-2 z-50 min-w-[260px] rounded-lg border bg-background shadow-elevated p-2 opacity-100 translate-y-0 transition-all duration-200 ease-out"
                    role="menu"
                    onMouseEnter={openDesktopGraduacaoMenuWithDelay}
                    onMouseLeave={closeDesktopGraduacaoMenuWithDelay}
                  >
                    <p className="px-3 pb-1 text-xs uppercase tracking-wide text-muted-foreground">Cursos de Graduação</p>
                    {item.children.map((child) => (
                      <Link
                        key={child.name}
                        to={child.href}
                        className={`block px-3 py-2 rounded-md transition-colors text-sm ${
                          isCurrentPage(child.href)
                            ? "bg-primary text-primary-foreground"
                            : "text-foreground hover:bg-muted"
                        }`}
                        role="menuitem"
                      >
                        {child.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Link
                key={item.name}
                to={item.href!}
                className={`px-2 py-2 text-[15px] font-medium transition-all rounded-md border-b-2 ${
                  isCurrentPage(item.href!)
                    ? "text-primary border-primary"
                    : "text-foreground border-transparent hover:text-primary hover:border-primary/50"
                }`}
              >
                {item.name}
              </Link>
            )
          )}
        </nav>

        {/* CTA Button */}
        <div className="hidden lg:flex items-center space-x-4">
          <Button variant="hero" asChild>
            <a
              href="https://wa.me/559220201260?text=Ol%C3%A1!%20Gostaria%20de%20saber%20mais%20sobre%20os%20cursos%20da%20Unicive%20e%20as%20condi%C3%A7%C3%B5es%20especiais."
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                (async () => {
                  const { trackWhatsAppClick } = await import("@/lib/tracker");
                  trackWhatsAppClick("header_cta");
                })();
                if (typeof window.fbq === "function") {
                  window.fbq("track", "Contact");
                }
              }}
            >
              Quero minha Bolsa!
            </a>
          </Button>
        </div>

        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label={isMenuOpen ? "Fechar menu" : "Abrir menu"}
        >
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="lg:hidden py-4 border-t border-border">
          <nav className="flex flex-col space-y-2">
            {navigation.map((item) =>
              item.children ? (
                <div key={item.name} className="space-y-1 px-2">
                  <button
                    type="button"
                    className={`w-full text-left text-base font-medium py-3 px-4 rounded-lg transition-colors inline-flex items-center justify-between gap-2 ${
                      isActiveItem(item)
                        ? "bg-primary/10 text-primary"
                        : "text-foreground hover:bg-muted"
                    }`}
                    onClick={() => setIsMobileGraduacaoOpen((prev) => !prev)}
                    aria-expanded={isMobileGraduacaoOpen}
                    aria-controls="mobile-submenu-graduacao"
                  >
                    {item.name}
                    <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isMobileGraduacaoOpen ? "rotate-180" : ""}`} />
                  </button>

                  <div
                    id="mobile-submenu-graduacao"
                    className={`overflow-hidden transition-all duration-300 ease-out ${
                      isMobileGraduacaoOpen ? "max-h-64 opacity-100 mt-1" : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="ml-2 flex flex-col space-y-1 border-l border-border pl-3">
                      {item.children.map((child) => (
                        <Link
                          key={child.name}
                          to={child.href}
                          className={`py-2.5 px-3 rounded-lg text-sm font-medium transition-colors ${
                            isCurrentPage(child.href)
                              ? "bg-primary text-primary-foreground"
                              : "text-foreground hover:bg-muted"
                          }`}
                          onClick={() => {
                            setIsMenuOpen(false);
                            setIsMobileGraduacaoOpen(false);
                          }}
                        >
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <Link
                  key={item.name}
                  to={item.href!}
                  className={`mx-2 py-3 px-4 rounded-lg text-base font-medium transition-colors ${
                    isCurrentPage(item.href!)
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-muted"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              )
            )}
            <Button variant="hero" className="mx-4 mt-4" asChild>
              <a
                href="https://wa.me/559220201260?text=Ol%C3%A1!%20Gostaria%20de%20saber%20mais%20sobre%20os%20cursos%20da%20Unicive%20e%20as%20condi%C3%A7%C3%B5es%20especiais."
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsMenuOpen(false)}
              >
                Quero minha Bolsa!
              </a>
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
