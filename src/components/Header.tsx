import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Phone, Mail, MapPin, Menu, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

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
  ];

  const isCurrentPage = (href: string) => location.pathname === href;

  return (
    <header className="bg-background/95 backdrop-blur-md border-b border-border sticky top-0 z-50 shadow-soft">
      {/* Top bar with contact info */}
      <div className="bg-secondary text-secondary-foreground">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-2 text-sm">
            <div className="hidden md:flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4" />
                <span>(92) 2020-1260</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span>polo.manaus.flores@unicv.edu.br</span>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-custom-green font-semibold">
              <span>🎓 Bolsa de 30% OFF + Matrícula por R$ 100!</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main navigation */}
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <div className="bg-gradient-primary p-2 rounded-lg">
              <span className="text-primary-foreground font-bold text-xl">UniCV</span>
            </div>
            <div>
              <div className="font-bold text-lg text-foreground">Polo Manaus</div>
              <div className="text-sm text-muted-foreground">Flores</div>
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
            <Button
              variant="hero"
              asChild
            >
              <a
                href="https://wa.me/559220201260?text=Ol%C3%A1!%20Gostaria%20de%20saber%20mais%20sobre%20os%20cursos%20da%20UniCV%20Polo%20Manaus%20Flores%20e%20as%20condi%C3%A7%C3%B5es%20especiais."
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  if (typeof window.fbq === "function") {
                    window.fbq('track', 'Contact');
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
      </div>
    </header>
  );
};

export default Header;