import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LeadForm from "@/components/LeadForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Briefcase, Clock, Star, Zap, CheckCircle, Trophy, Target, TrendingUp, Search } from "lucide-react";

const Tecnologo = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const cursos = [
    { nome: "Agente Comunitário em Saúde (ACS)", duracao: "1,5 anos", descricao: "Atendimento comunitário em saúde" },
    { nome: "Análise e Desenvolvimento de Sistemas", duracao: "2 anos", descricao: "Programação e desenvolvimento de software" },
    { nome: "Big Data e Inteligência Analítica", duracao: "2 anos", descricao: "Análise de grandes volumes de dados" },
    { nome: "Ciência da Felicidade", duracao: "1,5 anos", descricao: "Bem-estar e qualidade de vida" },
    { nome: "Cidades Inteligentes e Sustentáveis", duracao: "1,5 anos", descricao: "Tecnologia urbana sustentável" },
    { nome: "Coaching em Desenvolvimento Humano", duracao: "1,5 anos", descricao: "Desenvolvimento pessoal e profissional" },
    { nome: "Comércio Exterior", duracao: "1,5 anos", descricao: "Negócios internacionais" },
    { nome: "Desenvolvimento Comunitário", duracao: "1,5 anos", descricao: "Projetos sociais e comunitários" },
    { nome: "Design de Animação", duracao: "1,5 anos", descricao: "Criação de animações digitais" },
    { nome: "Design de Interiores", duracao: "1,5 anos", descricao: "Ambientes e decoração" },
    { nome: "Design de Produto", duracao: "1,5 anos", descricao: "Criação e desenvolvimento de produtos" },
    { nome: "Design Gráfico", duracao: "1,5 anos", descricao: "Comunicação visual e branding" },
    { nome: "Despachante Documentalista", duracao: "2,5 anos", descricao: "Documentação e despachante" },
    { nome: "Educador Social", duracao: "1,5 anos", descricao: "Educação social e comunitária" },
    { nome: "Embelezamento e Imagem Pessoal", duracao: "1,5 anos", descricao: "Estética e cuidados pessoais" },
    { nome: "Empreendedorismo Educacional", duracao: "1,5 anos", descricao: "Negócios na área educacional" },
    { nome: "Estética e Cosmética", duracao: "2 anos", descricao: "Tratamentos estéticos" },
    { nome: "Gerência em Saúde", duracao: "1,5 anos", descricao: "Gestão de serviços de saúde" },
    { nome: "Gerontologia", duracao: "1,5 anos", descricao: "Cuidados com idosos" },
    { nome: "Gestão Ambiental", duracao: "1,5 anos", descricao: "Sustentabilidade e meio ambiente" },
    { nome: "Gestão Comercial", duracao: "1,5 anos", descricao: "Vendas e relacionamento comercial" },
    { nome: "Gestão da Produção Industrial", duracao: "2,5 anos", descricao: "Processos produtivos industriais" },
    { nome: "Gestão da Qualidade", duracao: "1,5 anos", descricao: "Controle e melhoria da qualidade" },
    { nome: "Gestão da Tecnologia da Informação", duracao: "2 anos", descricao: "Gestão de TI empresarial" },
    { nome: "Gestão de Clínicas e Consultórios", duracao: "1,5 anos", descricao: "Administração de serviços de saúde" },
    { nome: "Gestão de Cooperativas", duracao: "1,5 anos", descricao: "Administração cooperativista" },
    { nome: "Gestão de Investimentos", duracao: "1,5 anos", descricao: "Mercado financeiro e investimentos" },
    { nome: "Gestão de Lojas e Pontos de Vendas", duracao: "1,5 anos", descricao: "Varejo e vendas" },
    { nome: "Gestão de Recursos Humanos", duracao: "1,5 anos", descricao: "Administração de pessoas" },
    { nome: "Gestão de Registros e Informações em Saúde", duracao: "1,5 anos", descricao: "Prontuários e sistemas de saúde" },
    { nome: "Gestão de Resíduos Sólidos", duracao: "1,5 anos", descricao: "Tratamento de resíduos" },
    { nome: "Gestão de Segurança Privada", duracao: "1,5 anos", descricao: "Segurança empresarial" },
    { nome: "Gestão de Varejo", duracao: "1,5 anos", descricao: "Comércio varejista" },
    { nome: "Gestão do Agronegócio", duracao: "2,5 anos", descricao: "Negócios agropecuários" },
    { nome: "Gestão do Esporte", duracao: "1,5 anos", descricao: "Administração esportiva" },
    { nome: "Gestão em Farmácia", duracao: "1,5 anos", descricao: "Administração farmacêutica" },
    { nome: "Gestão Financeira", duracao: "1,5 anos", descricao: "Finanças empresariais" },
    { nome: "Gestão Hospitalar", duracao: "2,5 anos", descricao: "Administração hospitalar" },
    { nome: "Gestão Pública", duracao: "2 anos", descricao: "Administração de órgãos públicos" },
    { nome: "Internet das Coisas", duracao: "2 anos", descricao: "IoT e dispositivos conectados" },
    { nome: "Investigação Forense e Perícia Jurídica", duracao: "2,5 anos", descricao: "Perícia e investigação" },
    { nome: "Jogos Digitais", duracao: "2 anos", descricao: "Desenvolvimento de games" },
    { nome: "Logística", duracao: "1,5 anos", descricao: "Cadeia de suprimentos" },
    { nome: "Marketing", duracao: "1,5 anos", descricao: "Estratégias de marketing" },
    { nome: "Marketing Digital", duracao: "1,5 anos", descricao: "Marketing online e digital" },
    { nome: "Mediação, Conciliação e Arbitragem", duracao: "1,5 anos", descricao: "Resolução de conflitos" },
    { nome: "Mídias Sociais e Digitais", duracao: "1,5 anos", descricao: "Gestão de redes sociais" },
    { nome: "Ministério Pastoral", duracao: "1,5 anos", descricao: "Liderança religiosa" },
    { nome: "Negócios Imobiliários", duracao: "1,5 anos", descricao: "Mercado imobiliário" },
    { nome: "Negócios Sustentáveis e ESG", duracao: "1,5 anos", descricao: "Sustentabilidade empresarial" },
    { nome: "Nutrição Escolar", duracao: "1,5 anos", descricao: "Alimentação escolar" },
    { nome: "Processos Gerenciais", duracao: "1,5 anos", descricao: "Gestão empresarial" },
    { nome: "Produção de Conteúdos Digitais", duracao: "1,5 anos", descricao: "Criação de conteúdo online" },
    { nome: "Psicomotricidade e Ludicidade na Educação Infantil", duracao: "1,5 anos", descricao: "Desenvolvimento infantil" },
    { nome: "Recrutamento, Seleção e Desenvolvimento de Pessoas", duracao: "1,5 anos", descricao: "Gestão de talentos" },
    { nome: "Redes de Computadores", duracao: "2 anos", descricao: "Infraestrutura de TI" },
    { nome: "Ressocialização de Toxicômanos", duracao: "1,5 anos", descricao: "Reabilitação e terapia" },
    { nome: "Secretariado", duracao: "1,5 anos", descricao: "Assistência executiva" },
    { nome: "Segurança da Informação", duracao: "2 anos", descricao: "Proteção de dados" },
    { nome: "Segurança no Trabalho", duracao: "2,5 anos", descricao: "Prevenção de acidentes" },
    { nome: "Segurança no Trânsito", duracao: "1,5 anos", descricao: "Educação e segurança viária" },
    { nome: "Segurança Pública", duracao: "2 anos", descricao: "Policiamento e segurança" },
    { nome: "Serviços Jurídicos", duracao: "1,5 anos", descricao: "Assistência jurídica" },
    { nome: "Serviços Jurídicos e Notariais", duracao: "1,5 anos", descricao: "Cartórios e notariado" },
    { nome: "Serviços Penais", duracao: "1,5 anos", descricao: "Sistema penitenciário" },
    { nome: "Sistemas para Internet", duracao: "2 anos", descricao: "Desenvolvimento web" },
    { nome: "Tradutor e Intérprete – Português-Francês", duracao: "1,5 anos", descricao: "Tradução e interpretação" },
    { nome: "Transformação Digital", duracao: "2 anos", descricao: "Digitalização empresarial" },
    { nome: "Vigilância em Saúde", duracao: "1,5 anos", descricao: "Controle sanitário" }
  ];

  const cursosFiltrados = cursos.filter((curso) =>
    curso.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const beneficios = [
    "Entrada rápida no mercado",
    "Foco prático e aplicado",
    "Alta empregabilidade",
    "Formação específica",
    "Menor tempo de estudo",
    "Custo-benefício otimizado"
  ];

  const programaEspecial = [
    "Aproveitamento de disciplinas do curso técnico",
    "Redução significativa do tempo de formação",
    "Mesmo diploma reconhecido pelo MEC",
    "Foco nas competências complementares",
    "Acompanhamento pedagógico especializado",
    "Certificação em tempo recorde"
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-hero text-white py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <Badge variant="secondary" className="mb-4 bg-warning text-warning-foreground">
              Modalidade EAD
            </Badge>
            <h1 className="text-4xl lg:text-6xl font-bold mb-6">Graduação Tecnólogo</h1>
            <p className="text-xl lg:text-2xl text-blue-100 mb-8">
              Entre rapidamente no mercado de trabalho com formação específica e prática. <strong>75+ cursos disponíveis</strong> com duração de 1,5 a 2,5 anos.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">75+</div>
                <div className="text-sm opacity-90">Cursos Disponíveis</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">1,5-2,5</div>
                <div className="text-sm opacity-90">Anos de Duração</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">1</div>
                <div className="text-sm opacity-90">Ano (Técnico→Tecnólogo)</div>
              </div>
            </div>
            <Button variant="hero" size="lg" asChild>
              <a href="#contato">Quero Entrar no Mercado Agora</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Benefícios dos Cursos Tecnólogos */}
      <section className="py-16 bg-gradient-subtle">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-6">Por que Escolher um Curso Tecnólogo?</h2>
            <p className="text-xl text-muted-foreground">
              Os cursos tecnólogos são ideais para quem busca uma formação rápida, prática e focada no mercado de trabalho.
            </p>
          </div>

          {/* Video Highlight */}
          <div className="mt-12 flex justify-center">
            <div className="relative aspect-video w-3/4 rounded-xl overflow-hidden shadow-md">
              <video
                src="https://res.cloudinary.com/dtfcavqgi/video/upload/v1759689947/GRADUA%C3%87%C3%83O_EAD_COM_1_5_ANOS_zkth5e.mp4"
                loop
                autoPlay
                muted={false}
                controls
                controlsList="nodownload"
                className="min-w-full min-h-full absolute object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Lista de Cursos com Busca */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Cursos Tecnólogos Disponíveis</h2>
            <p className="text-xl text-muted-foreground mb-6">
              Mais de 75 opções de cursos tecnólogos reconhecidos pelo MEC
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
                    <Briefcase className="h-6 w-6 text-warning" />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription className="mb-4">{curso.descricao}</CardDescription>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Star className="h-4 w-4 text-warning fill-current" />
                      <span className="text-sm text-muted-foreground">Entrada rápida no mercado</span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const message = `Olá! Tenho interesse no curso de ${curso.nome} (Tecnólogo) e gostaria de saber mais sobre a oferta especial de 30% de desconto!`;
                        const whatsappUrl = `https://wa.me/559220201260?text=${encodeURIComponent(message)}`;
                        window.open(whatsappUrl, "_blank");
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

          <div className="text-center">
            {cursosFiltrados.length === 0 && (
              <p className="text-muted-foreground">Nenhum curso encontrado. Tente outro termo de busca.</p>
            )}
            {cursosFiltrados.length < cursos.length && (
              <Button variant="link" size="sm" onClick={() => setSearchTerm("")}>
                Ver todos os cursos
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Técnico para Tecnólogo em 1 Ano */}
      <section className="py-16 bg-[#FFF8E7] text-neutral-900">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <Trophy className="h-12 w-12" />
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-900 text-lg px-6 py-2">
                Programa Exclusivo
              </Badge>
            </div>
            <h2 className="text-3xl lg:text-5xl font-bold mb-6">Técnico para Tecnólogo em 1 Ano</h2>
            <p className="text-xl lg:text-2xl text-neutral-800 mb-8">
              Já possui curso técnico? Aproveite seus conhecimentos e conclua sua graduação tecnóloga em tempo recorde!
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {programaEspecial.map((item, index) => (
                <Card key={index} className="bg-white/80 border border-neutral-300 text-neutral-900">
                  <CardContent className="p-6 text-center">
                    <Zap className="h-8 w-8 mx-auto mb-3 text-warning" />
                    <p className="font-medium">{item}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="bg-white/90 p-8 rounded-2xl mb-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="text-4xl font-bold mb-2">70%</div>
                  <div className="text-lg">Tempo Reduzido</div>
                  <div className="text-sm opacity-90">vs. curso tradicional</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold mb-2">100%</div>
                  <div className="text-lg">Reconhecido MEC</div>
                  <div className="text-sm opacity-90">mesmo diploma</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold mb-2">12</div>
                  <div className="text-lg">Meses Máximo</div>
                  <div className="text-sm opacity-90">para formatura</div>
                </div>
              </div>
            </div>

            <Button variant="secondary" size="lg" className="text-lg px-8" asChild>
              <a href="#contato">Saiba como Aproveitar seu Técnico</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Contato */}
      <section id="contato" className="py-16 bg-gradient-subtle">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-6">Solicite Mais Informações</h2>
            <p className="text-xl text-muted-foreground">
              Nossa equipe está pronta para esclarecer suas dúvidas sobre os cursos tecnólogos
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <LeadForm
              title="Quero saber mais sobre Tecnólogo"
              description="Preencha o formulário e receba informações detalhadas sobre nossos cursos tecnólogos e o programa Técnico para Tecnólogo."
            />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Tecnologo;
