import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import LeadForm from "./LeadForm";
import { GraduationCap, Star, Users, Award } from "lucide-react";
import { Link } from "react-router-dom";

const Hero = () => {
  return (
    <section className="relative bg-gradient-hero text-white overflow-hidden">
      {/* ✅ Video Background */}
      <div className="absolute inset-0 overflow-hidden opacity-20 pointer-events-none" aria-hidden="true">
        <iframe
          src="https://www.youtube.com/embed/Ejylx2UGs3Y?autoplay=1&mute=1&loop=1&playlist=Ejylx2UGs3Y&controls=0&modestbranding=1&rel=0&playsinline=1&disablekb=1"
          title="YouTube video player"
          frameBorder="0"
          allow="autoplay; encrypted-media; picture-in-picture"
          referrerPolicy="strict-origin-when-cross-origin"
          tabIndex={-1}
          className="absolute left-1/2 top-1/2 h-[56.25vw] w-[177.7778vh] min-h-full min-w-full -translate-x-1/2 -translate-y-1/2"
        ></iframe>
      </div>
      
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
                Graduação e Pós-graduação EAD e SEMIPRESENCIAL com até<strong> 70% de desconto</strong> + 
                Matrícula por <strong>R$ 99,00</strong>
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
              description="Preencha seus dados e ganhe 50% de desconto na sua matrícula!"
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