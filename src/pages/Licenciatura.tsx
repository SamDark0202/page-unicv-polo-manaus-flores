import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LeadForm from "@/components/LeadForm";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GraduationCap, Clock, Star, Users, CheckCircle, BookOpen, Search } from "lucide-react";

const Licenciatura = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const cursos = [
    { nome: "Andragogia", duracao: "3 anos", descricao: "Educação de jovens e adultos" },
    { nome: "Artes", duracao: "3 anos", descricao: "Ensino de artes visuais e plásticas" },
    { nome: "Artes Visuais", duracao: "4 anos", descricao: "Formação artística e visual" },
    { nome: "Ciências Biológicas", duracao: "3 anos", descricao: "Ensino de biologia e ciências" },
    { nome: "Ciências da Religião", duracao: "4 anos", descricao: "Estudos religiosos e filosóficos" },
    { nome: "Ciências Sociais", duracao: "3 anos", descricao: "Sociologia e ciências humanas" },
    { nome: "Computação e Informática", duracao: "3 anos", descricao: "Ensino de tecnologia" },
    { nome: "Educação Especial", duracao: "4 anos", descricao: "Educação inclusiva e especial" },
    { nome: "Educação Física", duracao: "4 anos", descricao: "Ensino de educação física" },
    { nome: "Filosofia", duracao: "4 anos", descricao: "Pensamento filosófico e crítico" },
    { nome: "Física", duracao: "3 anos", descricao: "Ensino de física e ciências exatas" },
    { nome: "Geografia", duracao: "4 anos", descricao: "Geografia humana e física" },
    { nome: "História", duracao: "4 anos", descricao: "História do Brasil e mundial" },
    { nome: "Letras - Língua Portuguesa e Libras", duracao: "4 anos", descricao: "Português e língua de sinais" },
    { nome: "Letras - Português e Espanhol", duracao: "4 anos", descricao: "Línguas portuguesa e espanhola" },
    { nome: "Letras - Português e Francês", duracao: "4 anos", descricao: "Línguas portuguesa e francesa" },
    { nome: "Letras - Português e Inglês", duracao: "4 anos", descricao: "Línguas portuguesa e inglesa" },
    { nome: "Matemática", duracao: "4 anos", descricao: "Ensino de matemática" },
    { nome: "Pedagogia", duracao: "4 anos", descricao: "Educação infantil e anos iniciais" },
    { nome: "Psicopedagogia", duracao: "3 anos", descricao: "Dificuldades de aprendizagem" },
    { nome: "Química", duracao: "3 anos", descricao: "Ensino de química e laboratório" },
    { nome: "Sociologia", duracao: "4 anos", descricao: "Sociedade e relações sociais" }
  ];

  const cursosFiltrados = cursos.filter((curso) =>
    curso.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const beneficios = [
    "Carreira na educação",
    "Estabilidade profissional",
    "Impacto social positivo",
    "Múltiplas oportunidades de ensino",
    "Formação humanística sólida",
    "Possibilidade de concurso público"
  ];

  const areasAtuacao = [
    "Educação Infantil",
    "Ensino Fundamental",
    "Ensino Médio",
    "Educação de Jovens e Adultos (EJA)",
    "Educação Especial",
    "Coordenação Pedagógica"
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-hero text-white py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <Badge variant="secondary" className="mb-4 bg-accent text-accent-foreground">
              Graduação Licenciatura
            </Badge>
            <h1 className="text-4xl lg:text-6xl font-bold mb-6">Graduação Licenciatura</h1>
            <p className="text-xl lg:text-2xl text-blue-100 mb-8">
              Forme-se professor e transforme vidas através da educação.{" "}
              <strong>22 cursos disponíveis</strong> com duração de 3 a 4 anos.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">22</div>
                <div className="text-sm opacity-90">Cursos Disponíveis</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">3-4</div>
                <div className="text-sm opacity-90">Anos de Duração</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">100%</div>
                <div className="text-sm opacity-90">Reconhecido MEC</div>
              </div>
            </div>
            <Button variant="hero" size="lg" asChild>
              <a href="#contato">Quero ser Professor</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-gradient-subtle">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-6">
              Por que escolher Licenciatura?
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              A licenciatura prepara você para ser um educador qualificado,
              com conhecimentos pedagógicos e didáticos para ensinar.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
            <div>
              <h3 className="text-2xl font-bold mb-6">Benefícios da Licenciatura</h3>
              <div className="space-y-4">
                {beneficios.map((beneficio, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-accent flex-shrink-0" />
                    <span>{beneficio}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-bold mb-6">Áreas de Atuação</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {areasAtuacao.map((area, index) => (
                  <Card key={index} className="text-center shadow-soft">
                    <CardContent className="p-4">
                      <BookOpen className="h-6 w-6 text-primary mx-auto mb-2" />
                      <p className="font-medium text-sm">{area}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Lista de cursos com filtro */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Cursos de Licenciatura Disponíveis</h2>
            <p className="text-xl text-muted-foreground mb-6">
              Escolha entre nossos 22 cursos de licenciatura reconhecidos pelo MEC
            </p>

            <div className="flex justify-center mb-8">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar curso..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full rounded-lg border border-muted shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {cursosFiltrados.map((curso, index) => (
              <Card key={index} className="hover:shadow-elevated transition-all duration-300 hover:-translate-y-1">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{curso.nome}</CardTitle>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{curso.duracao}</span>
                      </div>
                    </div>
                    <Users className="h-6 w-6 text-accent" />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription className="mb-4">
                    {curso.descricao}
                  </CardDescription>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Star className="h-4 w-4 text-warning fill-current" />
                      <span className="text-sm text-muted-foreground">Licenciatura Plena</span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const message = `Olá! Tenho interesse no curso de ${curso.nome} (Licenciatura) e gostaria de saber mais sobre a oferta especial de 30% de desconto!`;
                        const whatsappUrl = `https://wa.me/559220201260?text=${encodeURIComponent(message)}`;
                        window.open(whatsappUrl, '_blank');
                      }}
                      className="text-xs"
                    >
                      Quero saber mais
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Destaque para Pedagogia */}
          <Card className="bg-gradient-accent text-accent-foreground shadow-floating max-w-4xl mx-auto mb-12">
            <CardContent className="p-8 lg:p-12">
              <div className="text-center">
                <GraduationCap className="h-12 w-12 mx-auto mb-4" />
                <h3 className="text-3xl font-bold mb-4">Pedagogia - Nosso Destaque</h3>
                <p className="text-xl text-accent-foreground/90 mb-6">
                  Forme-se para atuar na educação infantil, anos iniciais do ensino fundamental e gestão educacional.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <div className="font-bold">Educação Infantil</div>
                    <div className="text-sm opacity-90">0 a 5 anos</div>
                  </div>
                  <div>
                    <div className="font-bold">Anos Iniciais</div>
                    <div className="text-sm opacity-90">1º ao 5º ano</div>
                  </div>
                  <div>
                    <div className="font-bold">Gestão Escolar</div>
                    <div className="text-sm opacity-90">Coordenação e supervisão</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CTA */}
          <div className="text-center">
            <Card className="bg-gradient-primary text-primary-foreground shadow-floating max-w-2xl mx-auto">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-4">Pronto para ser professor?</h3>
                <p className="mb-6 text-primary-foreground/90">
                  Aproveite nossa oferta especial: 30% de desconto + matrícula por R$ 100
                </p>
                <Button variant="secondary" size="lg" asChild>
                  <a href="#contato">Solicitar Informações</a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Contato */}
      <section id="contato" className="py-16 bg-gradient-subtle">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-6">Solicite Mais Informações</h2>
            <p className="text-xl text-muted-foreground">
              Nossa equipe está pronta para esclarecer suas dúvidas sobre os cursos de licenciatura
            </p>
          </div>
          <div className="max-w-2xl mx-auto">
            <LeadForm
              title="Quero saber mais sobre Licenciatura"
              description="Preencha o formulário e receba informações detalhadas sobre nossos cursos de licenciatura e condições especiais."
            />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Licenciatura;
