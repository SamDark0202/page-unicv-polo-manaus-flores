import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  MapPin,
  Phone,
  Mail,
  Instagram,
  Facebook,
  Linkedin,
  MessageCircle,
  GraduationCap,
  Clock,
  Star
} from "lucide-react";
import { Link } from "react-router-dom";
import logoImage from "@/assets/unicive-logo-branco.png"; // ✅ Import da logo

// Declare fbq on the Window interface for TypeScript
declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
  }
}

interface FooterProps {
  showPromoBanner?: boolean;
}

const Footer = ({ showPromoBanner = true }: FooterProps) => {
  const modalidades = [
    { name: "Graduação Bacharelado", link: "/bacharelado" },
    { name: "Graduação Licenciatura", link: "/licenciatura" },
    { name: "Graduação Tecnólogo", link: "/tecnologo" },
    { name: "Pós-Graduação", link: "/pos-graduacao" },
  ];

  const cursosPopulares = [
    "Administração",
    "Pedagogia",
    "Análise de Sistemas",
    "MBA Gestão Empresarial",
    "Gestão da Produção Industrial",
    "Marketing Digital"
  ];

  const handleWhatsApp = () => {
    import("@/lib/tracker").then(({ trackWhatsAppClick }) => trackWhatsAppClick("footer"));
    const message = "Olá! Gostaria de saber mais sobre os cursos da Unicive e as condições especiais.";
    const phone = "559220201260";
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <footer className="bg-secondary text-secondary-foreground">
      {showPromoBanner && (
        <>
          {/* CTA Section */}
          <div className="bg-gradient-primary text-primary-foreground py-12">
            <div className="container mx-auto px-4 text-center">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                Não Perca Esta Oportunidade!
              </h2>
              <p className="text-xl mb-8 text-primary-foreground/90">
                Bolsa com até 70% de Desconto + Matrícula por R$ 99,00 por tempo limitado
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="secondary" size="lg" className="text-lg px-8" asChild>
                  <a href="#contato">Garantir Minha Bolsa</a>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="text-lg px-8 py-6 border-white text-[#F09300] hover:bg-white hover:text-primary"
                  onClick={() => {
                    if (typeof window.fbq !== "undefined") {
                      window.fbq("track", "Contact");
                    }
                    handleWhatsApp();
                  }}
                >
                  <MessageCircle className="h-5 w-5 mr-2" />
                  WhatsApp
                </Button>
              </div>
            </div>
          </div>

          <Separator className="bg-secondary-foreground/15" />
        </>
      )}

      {/* Main Footer */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-primary p-2 rounded-lg">
                <GraduationCap className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <img
                  src={logoImage}
                  alt="Logo Unicive Polo Manaus Flores"
                  className="h-8 sm:h-10 md:h-12 lg:h-14 w-auto max-h-14 transition-all duration-200"
                  style={{ maxWidth: '180px', objectFit: 'contain' }}
                />
              </div>
            </div>

            <p className="text-secondary-foreground/80 leading-relaxed">
              Mais de uma década transformando vidas através da educação de qualidade.
              Presente em todo o Brasil.
            </p>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Star className="h-4 w-4 text-[#11493C]" />
                <span className="text-sm">Nota 5 MEC</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-[#11493C]" />
                <span className="text-sm">900+ Polos</span>
              </div>
            </div>

            {/* 🔽 ADIÇÃO SOLICITADA ABAIXO */}
            <div className="mt-4 text-left">
              <p className="text-sm text-secondary-foreground/80 mb-2">
                Consulte aqui o cadastro da Instituição no Sistema e-MEC
              </p>
              <a
                href="https://emec.mec.gov.br/emec/consulta-cadastro/detalhamento/d96957f455f6405d14c6542552b0f6eb/MzY0OQ=="
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block"
              >
                <img
                  src="https://unicv.edu.br/wp-content/uploads/elementor/thumbs/QR-code-footer-qcrkfgegejqs2ln4okid3scfy04njjpsp9lcpnirio.png"
                  alt="QR Code e-MEC"
                  className="w-24 h-24 mx-auto transition-transform hover:scale-105"
                />
              </a>
            </div>
          </div>

          {/* Modalidades */}
          <div>
            <h3 className="font-bold text-lg mb-6">Modalidades</h3>
            <div className="space-y-3">
              {modalidades.map((modalidade, index) => (
                <Link
                  key={index}
                  to={modalidade.link}
                  className="block text-secondary-foreground/80 hover:text-secondary-foreground transition-colors"
                >
                  {modalidade.name}
                </Link>
              ))}
            </div>
            <div className="mt-6 p-4 bg-warning/10 rounded-lg border border-warning/20">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="h-4 w-4 text-[#11493C]" />
                <span className="text-sm font-semibold text-[#11493C]">Destaque</span>
              </div>
              <Link
                to="/tecnico-para-tecnologo"
                className="text-sm text-secondary-foreground/80 underline-offset-2 transition-colors hover:text-secondary-foreground hover:underline"
              >
                Técnico para Tecnólogo em apenas 1 ano
              </Link>
            </div>
          </div>

          {/* Cursos Populares */}
          <div>
            <h3 className="font-bold text-lg mb-6">Cursos Populares</h3>
            <div className="space-y-3">
              {cursosPopulares.map((curso, index) => (
                <div
                  key={index}
                  className="text-secondary-foreground/80 text-sm"
                >
                  {curso}
                </div>
              ))}
            </div>
          </div>

          {/* Contato */}
          <div>
            <h3 className="font-bold text-lg mb-6">Contato</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                <div className="text-sm text-secondary-foreground/80">
                  Av. Prof. Nilton Lins, 1984<br />
                  Flores, Manaus - AM<br />
                  CEP: 69058-300
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-primary" />
                <a
                  href="tel:+559220201260"
                  className="text-sm text-secondary-foreground/80 hover:text-secondary-foreground"
                >
                  (92) 2020-1260
                </a>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-primary" />
                <a
                  href="mailto:polo.manaus.flores@gmail.com"
                  className="text-sm text-secondary-foreground/80 hover:text-secondary-foreground"
                >
                  polo.manaus.flores@unicv.edu.br
                </a>
              </div>
            </div>

            {/* Social Media */}
            <div className="mt-6">
              <h4 className="font-semibold mb-3">Redes Sociais</h4>
              <div className="flex space-x-3">
                <a
                  href="https://www.instagram.com/unicivepoloam/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-secondary-foreground/10 p-2 rounded-lg hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  <Instagram className="h-5 w-5" />
                </a>
                <a
                  href="https://www.facebook.com/unicivepoloam/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-secondary-foreground/10 p-2 rounded-lg hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  <Facebook className="h-5 w-5" />
                </a>
                <a
                  href="https://www.linkedin.com/company/unicive-polo-manaus-flores/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-secondary-foreground/10 p-2 rounded-lg hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  <Linkedin className="h-5 w-5" />
                </a>
                <button
                  onClick={() => {
                    if (typeof window.fbq !== "undefined") {
                      window.fbq("track", "Contact");
                    }
                    handleWhatsApp();
                  }}
                  className="bg-accent p-2 rounded-lg hover:bg-accent-light transition-colors text-accent-foreground"
                >
                  <MessageCircle className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Separator className="bg-secondary-foreground/20" />

      {/* Bottom Footer */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="text-sm text-secondary-foreground/60">
            © 2026 Unicive Polo Manaus Flores. Todos os direitos reservados.
          </div>
          <div className="flex items-center gap-4 text-sm">
            <Link
              to="/termos-de-servico"
              className="text-secondary-foreground/70 hover:text-secondary-foreground transition-colors"
            >
              Termos de Serviço
            </Link>
            <Link
              to="/politica-de-privacidade"
              className="text-secondary-foreground/70 hover:text-secondary-foreground transition-colors"
            >
              Política de Privacidade
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
