import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import LeadForm from "./LeadForm";
import heroImage from "@/assets/hero-education.jpg";
import { GraduationCap, Star, Users, Award } from "lucide-react";
import { Link } from "react-router-dom";

const Hero = () => {
  return (
    <section className="relative bg-gradient-hero text-white overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      
      {/* Content */}
      <div className="relative container mx-auto px-4 py-16 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            {/* Badges */}
            <div className="flex flex-wrap gap-3">
              <Badge variant="secondary" className="bg-warning text-warning-foreground text-sm px-3 py-1">
                🎓 Oferta Limitada
              </Badge>
              <Badge variant="outline" className="border-white text-white text-sm px-3 py-1">
                ⭐ Nota Máxima MEC
              </Badge>
            </div>

            {/* Main Headline */}
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
                Transforme seu
                <span className="block bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                  Futuro Profissional
                </span>
              </h1>
              <p className="text-xl lg:text-2xl text-blue-100 leading-relaxed">
                Graduação e Pós-graduação EAD com <strong>30% de desconto</strong> + 
                Matrícula por apenas <strong>R$ 100</strong>
              </p>
            </div>

            {/* Key Benefits */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <div className="bg-accent p-2 rounded-lg">
                  <GraduationCap className="h-6 w-6 text-accent-foreground" />
                </div>
                <div>
                  <div className="font-semibold">900+ Polos</div>
                  <div className="text-sm text-blue-200">Em todo Brasil</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="bg-accent p-2 rounded-lg">
                  <Star className="h-6 w-6 text-accent-foreground" />
                </div>
                <div>
                  <div className="font-semibold">Nota Máxima MEC</div>
                  <div className="text-sm text-blue-200">Qualidade garantida</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="bg-accent p-2 rounded-lg">
                  <Users className="h-6 w-6 text-accent-foreground" />
                </div>
                <div>
                  <div className="font-semibold">Professores Mestres</div>
                  <div className="text-sm text-blue-200">e Doutores</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="bg-accent p-2 rounded-lg">
                  <Award className="h-6 w-6 text-accent-foreground" />
                </div>
                <div>
                  <div className="font-semibold">Técnico → Tecnólogo</div>
                  <div className="text-sm text-blue-200">Em até 1 ano</div>
                </div>
              </div>
            </div>

            {/* Special Offer */}
            <Card className="bg-warning/10 border-warning text-warning-foreground p-6">
              <div className="text-center space-y-2">
                <div className="text-2xl font-bold">🔥 OFERTA ESPECIAL</div>
                <div className="text-lg">
                  <span className="line-through text-warning/70">R$ 200</span> 
                  <span className="ml-2 text-2xl font-bold">R$ 100</span>
                  <span className="ml-2">de matrícula</span>
                </div>
                <div className="text-sm">+ 30% de desconto nas mensalidades</div>
              </div>
            </Card>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="hero" size="lg" className="text-lg px-8 py-6" asChild>
                <a href="#contato">Quero Minha Bolsa Agora!</a>
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="text-lg px-8 py-6 border-white text-black hover:bg-white hover:text-primary"
                asChild
              >
                <a href="#Modalidades">Ver Todos os Cursos</a>
              </Button>
            </div>
          </div>

          {/* Right Content - Lead Form */}
          <div className="lg:pl-8">
            <LeadForm 
              title="Garanta sua Bolsa Agora!"
              description="Preencha seus dados e ganhe 30% de desconto + matrícula por R$ 100"
            />
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-warning/10 rounded-full blur-3xl"></div>
    </section>
  );
};

export default Hero;