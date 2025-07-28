import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Diferenciais from "@/components/Diferenciais";
import Modalidades from "@/components/Modalidades";
import LeadForm from "@/components/LeadForm";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, Mail, Clock, Star, CheckCircle } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Hero />
      <Diferenciais />
      <Modalidades />
      
      {/* Contact Section */}
      <section id="contato" className="py-16 lg:py-24 bg-gradient-subtle">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">
              Entre em contato
            </Badge>
            <h2 className="text-3xl lg:text-5xl font-bold mb-6">
              Fale Conosco
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Nossa equipe está pronta para tirar suas dúvidas e ajudar você a escolher o melhor curso.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Contact Info */}
            <div className="space-y-8">
              <Card className="shadow-soft">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold mb-6">Informações de Contato</h3>
                  <div className="space-y-6">
                    <div className="flex items-start space-x-4">
                      <div className="bg-primary p-3 rounded-lg">
                        <MapPin className="h-6 w-6 text-primary-foreground" />
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">Endereço</h4>
                        <p className="text-muted-foreground">
                          Av. Prof. Nilton Lins, 1984<br />
                          Flores, Manaus - AM<br />
                          CEP: 69058-300
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-4">
                      <div className="bg-accent p-3 rounded-lg">
                        <Phone className="h-6 w-6 text-accent-foreground" />
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">Telefone/WhatsApp</h4>
                        <p className="text-muted-foreground">(92) 2020-1260</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-4">
                      <div className="bg-warning p-3 rounded-lg">
                        <Mail className="h-6 w-6 text-warning-foreground" />
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">E-mail</h4>
                        <p className="text-muted-foreground">polo.manaus.flores@unicv.edu.br</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-4">
                      <div className="bg-secondary p-3 rounded-lg">
                        <Clock className="h-6 w-6 text-secondary-foreground" />
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">Horário de Atendimento</h4>
                        <p className="text-muted-foreground">
                          Segunda a Sexta: 8h às 18h<br />
                          Sábado: 8h às 12h
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Special Offers Reminder */}
              <Card className="bg-gradient-primary text-primary-foreground shadow-elevated">
                <CardContent className="p-8">
                  <h3 className="text-xl font-bold mb-4">🎯 Oferta Especial Ativa!</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-accent" />
                      <span>30% de desconto nas mensalidades</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-accent" />
                      <span>Taxa de matrícula: R$ 100 (era R$ 200)</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-accent" />
                      <span>Programa Técnico → Tecnólogo em 1 ano</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Lead Form */}
            <div>
              <LeadForm 
                title="Solicite Informações"
                description="Preencha o formulário e nossa equipe entrará em contato para esclarecer todas suas dúvidas sobre nossos cursos e condições especiais."
              />
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Index;
