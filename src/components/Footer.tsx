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

// Declare fbq on the Window interface for TypeScript
declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
  }
}

const Footer = () => {
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
    "Psicologia",
    "Marketing Digital"
  ];

  const handleWhatsApp = () => {
    const message = "Olá! Gostaria de saber mais sobre os cursos da UniCV Polo Manaus Flores e as condições especiais.";
    const phone = "559220201260";
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  return (
    <footer className="bg-secondary text-secondary-foreground">
      {/* CTA Section */}
      <div className="bg-gradient-primary text-primary-foreground py-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Não Perca Esta Oportunidade!
          </h2>
          <p className="text-xl mb-8 text-primary-foreground/90">
            Bolsa de 30% + Matrícula por R$ 100 por tempo limitado
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="secondary" size="lg" className="text-lg px-8" asChild>
              <a href="#contato">Garantir Minha Bolsa</a>
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="text-lg px-8 py-6 border-white text-[#F09300] hover:bg-white hover:text-primary"
              onClick={handleWhatsApp}
            >
              <MessageCircle className="h-5 w-5 mr-2" />
              WhatsApp
            </Button>
          </div>
        </div>
      </div>

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
                <div className="font-bold text-xl">UniCV</div>
                <div className="text-sm text-secondary-foreground/80">Polo Manaus Flores</div>
              </div>
            </div>
            <p className="text-secondary-foreground/80 leading-relaxed">
              Mais de uma década transformando vidas através da educação de qualidade. 
              Nota máxima MEC e presente em todo o Brasil.
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
              <p className="text-sm text-secondary-foreground/80">
                Técnico para Tecnólogo em apenas 1 ano
              </p>
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
                  href="https://www.instagram.com/unicvpoloam/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-secondary-foreground/10 p-2 rounded-lg hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  <Instagram className="h-5 w-5" />
                </a>
                <a
                  href="https://www.facebook.com/unicvpoloam"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-secondary-foreground/10 p-2 rounded-lg hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  <Facebook className="h-5 w-5" />
                </a>
                <a
                  href="https://www.linkedin.com/company/unicv-polo-manaus-flores/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-secondary-foreground/10 p-2 rounded-lg hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  <Linkedin className="h-5 w-5" />
                </a>
                <button
                  onClick={() => {if (typeof window.fbq !== 'undefined') {
                       fbq('track', 'Contact');}
                     handleWhatsApp();}}
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
            © 2025 UniCV Polo Manaus Flores. Todos os direitos reservados.
          </div>
          <div className="flex items-center space-x-6 text-sm text-secondary-foreground/60">
            <span>Credenciada pelo MEC</span>
            <span>•</span>
            <span>Nota 5 no MEC</span>
            <span>•</span>
            <span>Diplomas Reconhecidos</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;