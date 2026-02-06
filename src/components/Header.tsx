import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Phone, Mail, MapPin, Menu, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import logoImage from "@/assets/NOVA LOGO UNICV 12-04.png";
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
  const location = useLocation();

  const navigation = [
    { name: "Início", href: "/" },
    { name: "Bacharelado", href: "/bacharelado" },
    { name: "Licenciatura", href: "/licenciatura" },
    { name: "Tecnólogo", href: "/tecnologo" },
    { name: "Pós-Graduação", href: "/pos-graduacao" },
    { name: "Blog", href: "/Blog" },
  ];

  const isCurrentPage = (href: string) => location.pathname === href;

  return (
    <header className="bg-background border-b sticky top-0 z-50">
      <div className="container py-4 px-4 flex items-center justify-between">
        {/* Logo com detalhe natalino (gorrito) */}
        <Link to="/" className="flex items-center space-x-3">
          <div className="relative">
            <img src={logoImage} alt="UniCV Polo Manaus Flores" className="h-10 w-auto" />
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
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`font-medium transition-colors hover:text-primary ${
                isCurrentPage(item.href)
                  ? "text-primary border-b-2 border-primary pb-1"
                  : "text-foreground"
              }`}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        {/* CTA Button */}
        <div className="hidden lg:flex items-center space-x-4">
          <Button variant="hero" asChild>
            <a
              href="https://wa.me/559220201260?text=Ol%C3%A1!%20Gostaria%20de%20saber%20mais%20sobre%20os%20cursos%20da%20UniCV%20e%20as%20condi%C3%A7%C3%B5es%20especiais."
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
            {navigation.map((item) => (
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
            ))}
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
