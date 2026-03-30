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
  const [isDesktopTecnologoOpen, setIsDesktopTecnologoOpen] = useState(false);
  const [isMobileTecnologoOpen, setIsMobileTecnologoOpen] = useState(false);
  const location = useLocation();
  const closeTimeoutRef = useRef<number | null>(null);

  type NavigationItem = {
    name: string;
    href: string;
    children?: Array<{ name: string; href: string }>;
  };

  const navigation = [
    { name: "Início", href: "/" },
    { name: "Bacharelado", href: "/bacharelado" },
    { name: "Licenciatura", href: "/licenciatura" },
    {
      name: "Tecnólogo",
      href: "/tecnologo",
      children: [{ name: "Técnico Para Tecnólogo", href: "/tecnico-para-tecnologo" }],
    },
    { name: "Pós-Graduação", href: "/pos-graduacao" },
    { name: "Blog", href: "/Blog" },
  ] satisfies NavigationItem[];

  const isCurrentPage = (href: string) => location.pathname === href;

  const isActiveItem = (item: NavigationItem) =>
    isCurrentPage(item.href) || (item.children?.some((child) => isCurrentPage(child.href)) ?? false);

  useEffect(() => {
    setIsMenuOpen(false);
    setIsDesktopTecnologoOpen(false);
    setIsMobileTecnologoOpen(false);
  }, [location.pathname]);

  const openDesktopTecnologoMenu = () => {
    if (closeTimeoutRef.current) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setIsDesktopTecnologoOpen(true);
  };

  const closeDesktopTecnologoMenuWithDelay = () => {
    closeTimeoutRef.current = window.setTimeout(() => {
      setIsDesktopTecnologoOpen(false);
    }, 120);
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
        <nav className="hidden lg:flex items-center space-x-8">
          {navigation.map((item) =>
            item.children ? (
              <div
                key={item.name}
                className="relative"
                onMouseEnter={openDesktopTecnologoMenu}
                onMouseLeave={closeDesktopTecnologoMenuWithDelay}
              >
                <button
                  type="button"
                  onClick={() => setIsDesktopTecnologoOpen((prev) => !prev)}
                  className={`font-medium transition-colors hover:text-primary inline-flex items-center gap-1 px-1 py-2 rounded-md ${
                    isActiveItem(item)
                      ? "text-primary"
                      : "text-foreground"
                  }`}
                  aria-haspopup="menu"
                  aria-expanded={isDesktopTecnologoOpen}
                >
                  {item.name}
                  <ChevronDown className={`h-4 w-4 transition-transform ${isDesktopTecnologoOpen ? "rotate-180" : ""}`} />
                </button>

                {isDesktopTecnologoOpen && (
                  <div
                    className="absolute left-0 top-full mt-2 z-50 min-w-[260px] rounded-lg border bg-background shadow-elevated p-2"
                    role="menu"
                    onMouseEnter={openDesktopTecnologoMenu}
                    onMouseLeave={closeDesktopTecnologoMenuWithDelay}
                  >
                    <Link
                      to={item.href}
                      className={`block px-3 py-2 rounded-md transition-colors font-semibold ${
                        isCurrentPage(item.href)
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground hover:bg-muted"
                      }`}
                      role="menuitem"
                    >
                      Ver {item.name}
                    </Link>

                    {item.children.map((child) => (
                      <Link
                        key={child.name}
                        to={child.href}
                        className={`block px-3 py-2 rounded-md transition-colors ${
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
                to={item.href}
                className={`font-medium transition-colors hover:text-primary px-1 py-2 rounded-md ${
                  isCurrentPage(item.href)
                    ? "text-primary"
                    : "text-foreground"
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
        >
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="lg:hidden py-4 border-t border-border">
          <nav className="flex flex-col space-y-4">
            {navigation.map((item) =>
              item.children ? (
                <div key={item.name} className="space-y-2">
                  <button
                    type="button"
                    className={`w-full text-left font-medium py-2 px-4 rounded-lg transition-colors inline-flex items-center justify-between gap-1 ${
                      isActiveItem(item)
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-muted"
                    }`}
                    onClick={() => setIsMobileTecnologoOpen((prev) => !prev)}
                    aria-expanded={isMobileTecnologoOpen}
                  >
                    {item.name}
                    <ChevronDown className={`h-4 w-4 transition-transform ${isMobileTecnologoOpen ? "rotate-180" : ""}`} />
                  </button>

                  {isMobileTecnologoOpen && (
                    <div className="ml-4 flex flex-col space-y-2 border-l border-border pl-3">
                      <Link
                        to={item.href}
                        className={`font-medium py-2 px-3 rounded-lg transition-colors ${
                          isCurrentPage(item.href)
                            ? "bg-primary text-primary-foreground"
                            : "text-foreground hover:bg-muted"
                        }`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Ver {item.name}
                      </Link>

                      {item.children.map((child) => (
                        <Link
                          key={child.name}
                          to={child.href}
                          className={`font-medium py-2 px-3 rounded-lg transition-colors ${
                            isCurrentPage(child.href)
                              ? "bg-primary text-primary-foreground"
                              : "text-foreground hover:bg-muted"
                          }`}
                          onClick={() => setIsMenuOpen(false)}
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
                  to={item.href}
                  className={`font-medium py-2 px-4 rounded-lg transition-colors ${
                    isCurrentPage(item.href)
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
              <Link to="#contato" onClick={() => setIsMenuOpen(false)}>
                Quero minha Bolsa!
              </Link>
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
