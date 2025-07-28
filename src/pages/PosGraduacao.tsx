import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LeadForm from "@/components/LeadForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Award, Clock, Star, TrendingUp, CheckCircle, BookOpen, Users, Target } from "lucide-react";

const PosGraduacao = () => {
  const areas = [
    {
      categoria: "Agronegócio",
      cursos: [
        "Administração e Agronegócio",
        "Agricultura e Agronegócio", 
        "Agricultura e Sustentabilidade",
        "Agrometeorologia e Climatologia",
        "Agronegócio",
        "Certificação Ambiental e Consultoria",
        "Direito Ambiental",
        "Engenharia Agronômica: Ênfase em Manejo de Pragas e Agricultura",
        "Engenharia Ambiental e Saneamento Básico",
        "Fertilidade, Manejo dos Solos e Nutrição de Plantas",
        "Gestão Ambiental e Sustentabilidade",
        "Gestão de Projetos e Suprimentos (Ênfase em Agronegócio)",
        "Gestão e Economia do Agronegócio",
        "Legislação, Perícia e Auditoria Ambiental",
        "Negócios Agroalimentares com Foco em Produção Animal",
        "Recuperação Ambiental de Áreas Degradadas e Contaminadas",
        "Recuperação de Áreas e Licenciamento Ambiental",
        "Sustentabilidade e Meio Ambiente",
        "Zoologia"
      ]
    },
    {
      categoria: "Comunicação e Design",
      cursos: [
        "Branding e Relações Públicas",
        "Desenho Industrial",
        "Design de Produtos", 
        "Design Thinking, Criatividade e Inovação",
        "Direito Eleitoral, Governança e Marketing Político",
        "Docência na Comunicação",
        "Engenharia e Desenvolvimento de Produto",
        "Gestão da Comunicação e Mídias Digitais",
        "Gestão da Comunicação Organizacional e Jornalismo",
        "Gestão de Marketing e E-Commerce",
        "Marketing Digital",
        "MBA em Comunicação Corporativa",
        "MBA em Empreendedorismo, Marketing e Finanças",
        "Novos Produtos e Gestão de Projetos Produtivos"
      ]
    },
    {
      categoria: "Direito",
      cursos: [
        "Advocacia no Direito Privado",
        "Arbitragem, Conciliação e Mediação",
        "Auditoria e Direito no Setor Público",
        "Biodireito",
        "Conciliação e Mediação",
        "Direito Administrativo",
        "Direito Administrativo e Gestão Orçamentária e Financeira no Setor Público",
        "Direito Administrativo e Gestão Pública",
        "Direito Aduaneiro",
        "Direito Ambiental",
        "Direito Aplicado ao Agronegócio",
        "Direito Constitucional",
        "Direito da Criança e do Adolescente",
        "Direito das Famílias e Sucessões",
        "Direito do Consumidor",
        "Direito do Trabalho",
        "Direito e Serviço Social no Judiciário",
        "Direito Empresarial",
        "Direito Financeiro",
        "Direito Médico e Hospitalar",
        "Direito Notarial e Registral",
        "Direito Penal e Processual Penal",
        "Direito Previdenciário e Saúde do Trabalhador",
        "Direito Previdenciário RGPS: A Nova Previdência",
        "Direito Processual Civil",
        "Direito Público",
        "Direito Tributário",
        "Direitos Difusos e Coletivos",
        "Direitos Humanos",
        "Docência em Direito Civil",
        "Docência em Direito Penal",
        "Docência em Direito Processual Civil",
        "Gestão Patrimonial e Direito no Setor Público",
        "Investigação Criminal e Psicologia Forense",
        "Licitações e Contratos – Lei 14.133/2021",
        "Perícia Criminal",
        "Psicologia Jurídica",
        "Segurança Pública"
      ]
    },
    {
      categoria: "Educação",
      cursos: [
        "A Moderna Educação: Metodologias, Tendências e Foco no Aluno",
        "ABA Aplicada ao Transtorno do Espectro Autista (TEA)",
        "Administração, Supervisão e Orientação Educacional",
        "Alfabetização, Letramento e a Psicopedagogia Institucional",
        "Andragogia: Formação de Jovens e Adultos",
        "Arte e Educação",
        "Atendimento Educacional Especializado (AEE)",
        "Atendimento Educacional Especializado (AEE) e a Educação Inclusiva",
        "Ciência e a Pesquisa Científica no Ensino Superior",
        "Ciências da Religião",
        "Coordenação Pedagógica",
        "Coordenação Pedagógica e Planejamento Educacional",
        "Coordenação Pedagógica e Supervisão Escolar",
        "Criança Digital na Aprendizagem",
        "Design e Tecnologia no Ensino Básico",
        "Design Instrucional",
        "Direito Educacional",
        "Docência e Gestão no Ensino Superior",
        "Docência no Ensino de Educação Física",
        "Docência no Ensino de Filosofia",
        "Docência no Ensino Religioso",
        "Docência no Ensino Superior em Saúde",
        "Educação Ambiental e Sustentabilidade",
        "Educação de Jovens e Adultos – EJA",
        "Educação Empreendedora",
        "Educação Especial",
        "Educação Especial com Ênfase em Deficiência Intelectual, Física e Psicomotora",
        "Educação Especial com Ênfase em Transtornos Globais de Desenvolvimento (TGD) e Altas Habilidades",
        "Educação Especial e Inclusiva",
        "Educação Especial e Psicomotricidade",
        "Educação Financeira",
        "Educação Física e a Psicomotricidade com Ênfase na Educação Inclusiva",
        "Educação Física Escolar",
        "Educação Física para Diabéticos e Doenças Crônicas",
        "Educação Infantil",
        "Educação Infantil, Educação Especial e Transtornos Globais",
        "Educação, Ludicidade e Desenvolvimento Infantil",
        "Educação Social e Cidadania",
        "Escola de Gestores: Formação Prática da Gestão Escolar",
        "Espanhol",
        "Especialização Base Nacional Comum Curricular (BNCC): Formação Docente",
        "Especialização Base Nacional Comum Curricular (BNCC): Gestão Educacional",
        "Especialização em Educação Infantil de 0 a 6 Anos"
      ]
    },
    {
      categoria: "Engenharia",
      cursos: [
        "Arquitetura da Paisagem",
        "Arquitetura e Cidades",
        "Arquitetura e Design de Interiores",
        "Ciência e Engenharia dos Materiais",
        "Construção Civil Residenciais, Industriais e Especiais",
        "Construção Civil: Residencial e Industrial",
        "Design de Produtos",
        "Desenho Industrial",
        "Desenvolvimento de Jogos Digitais",
        "Energias Renováveis",
        "Engenharia Agronômica: Ênfase em Manejo de Pragas e Agricultura",
        "Engenharia Ambiental",
        "Engenharia Ambiental e Saneamento Básico",
        "Engenharia Civil e Arquitetura Sustentável",
        "Engenharia de Alimentos",
        "Engenharia de Conforto Térmico Ambiental",
        "Engenharia de Controle e Automação Industrial",
        "Engenharia de Estruturas e Concreto",
        "Engenharia de Infraestrutura em Meios de Transporte",
        "Engenharia de Materiais",
        "Engenharia de Materiais com Ênfase em Corrosão",
        "Engenharia de Mobilidade Urbana Smart Cities",
        "Engenharia de Obras",
        "Engenharia de Operações e Logística",
        "Engenharia de Polímeros",
        "Engenharia de Produção",
        "Engenharia de Produção com Ênfase na Construção Civil",
        "Engenharia de Qualidade",
        "Engenharia de Segurança Contra Incêndio, Pânico e Eletricidade",
        "Engenharia de Segurança do Trabalho",
        "Engenharia de Software",
        "Engenharia de Tráfego",
        "Engenharia e Desenvolvimento de Produto",
        "Engenharia e Gerenciamento da Manutenção",
        "Engenharia e Gestão Hospitalar",
        "Engenharia Elétrica",
        "Engenharia Elétrica com Ênfase em Instalações Industriais",
        "Engenharia Elétrica com Ênfase em Instalações Residenciais",
        "Engenharia Farmacêutica",
        "Engenharia Genética",
        "Engenharia Geotécnica",
        "Engenharia Metalúrgica: Processos de Fabricação",
        "Engenharia Química",
        "Engenharia Termodinâmica",
        "Gerenciamento de Projetos para Engenheiros",
        "Inteligência Artificial e Big Data",
        "Inteligência Artificial e Machine Learning",
        "Lean Manufacturing",
        "Paisagismo e Iluminação",
        "Proteção de Sistemas Elétricos"
      ]
    },
    {
      categoria: "Gestão Contábil e Financeira",
      cursos: [
        "Administração Financeira e Negociação",
        "Agronegócio: Gestão e Contabilidade",
        "Análise de Custos e Orçamento Empresarial",
        "Análise de Custos e Planejamento Estratégico",
        "Auditoria em Organizações do Setor Público",
        "Auditoria, Compliance e Gestão de Riscos",
        "Auditoria e Controladoria",
        "Auditoria e Finanças",
        "Auditoria e Perícia Contábil",
        "Consultoria e Orçamento Empresarial",
        "Consultoria Tributária",
        "Contabilidade e Controladoria no Setor Público",
        "Contabilidade e Governança Corporativa",
        "Contabilidade Pública",
        "Contabilidade Pública e Auditoria",
        "Contabilidade Tributária",
        "Contabilidade, Auditoria e Perícia",
        "Contabilidade, Orçamento e Auditoria no Setor Público",
        "Controladoria e Auditoria no Setor Público",
        "Controladoria e Finanças",
        "Educação Financeira",
        "Finanças e Análise de Custos Empresariais",
        "Gestão Contábil e Financeira",
        "Gestão Contábil e Tributária",
        "Gestão da Contabilidade e Planejamento Empresarial",
        "Gestão de Custos e Formação de Preços",
        "Legislação, Perícia e Auditoria Ambiental",
        "MBA em Administração Financeira e Orçamentária",
        "MBA em Administração, Contabilidade e Finanças",
        "MBA em Economia e Finanças",
        "MBA em Finanças Corporativas",
        "MBA em Finanças Corporativas e Negociação",
        "MBA em Finanças e Mercado",
        "MBA em Gestão Financeira",
        "MBA em Gestão Tributária",
        "MBA Executivo em Gestão de Investimentos",
        "Matemática Financeira e Estatística"
      ]
    },
    {
      categoria: "Gestão Pública",
      cursos: [
        "Administração de Recursos Humanos no Setor Público",
        "Administração Pública",
        "Administração Pública e Gestão de Pessoas",
        "Administração Pública e Gestão Estratégica",
        "Auditoria e Direito no Setor Público",
        "Auditoria em Organizações do Setor Público",
        "Contabilidade e Controladoria no Setor Público",
        "Contabilidade Pública",
        "Contabilidade Pública e Auditoria",
        "Contabilidade, Orçamento e Auditoria no Setor Público",
        "Controladoria e Auditoria no Setor Público",
        "Gestão de Serviços Públicos",
        "Gestão Patrimonial e Controladoria no Setor Público",
        "Gestão Patrimonial e Direito no Setor Público",
        "Gestão Pública",
        "Governança e Políticas Públicas",
        "Governança Pública e Gestão de Pessoas",
        "Licitações e Contratos – Lei 14.133/2021",
        "Planejamento e Orçamento Público",
        "Direito Público",
        "Gestão da Informação, Inovação e Governança Pública",
        "Gestão da Informação, Inovação e Marketing no Setor Público",
        "Gestão da Informação, Inovação e Pessoas no Setor Público",
        "Gestão de Pessoas e Marketing no Setor Público",
        "Gestão Financeira e Orçamentária em Organizações Públicas"
      ]
    },
    {
      categoria: "Medicina Veterinária",
      cursos: [
        "Controle de Qualidade e Segurança de Alimentos",
        "Produção Animal"
      ]
    },
    {
      categoria: "Negócios",
      cursos: [
        "MBA em Logística e Supply Chain Management",
        "MBA em Marketing e Vendas",
        "MBA Executivo em Gestão de Investimentos",
        "PCP: Planejamento e Controle de Produção",
        "Planejamento e Orçamento Público",
        "Recursos Humanos e Finanças",
        "Varejo e Negócios Digitais",
        "MBA em Gestão de Pessoas e Psicologia Organizacional",
        "MBA em Gestão de Pessoas, Liderança e Coaching",
        "MBA em Gestão de Processos",
        "MBA em Gestão de Recursos Humanos",
        "MBA em Gestão Empresarial",
        "MBA em Gestão Empresarial e Logística",
        "MBA em Gestão Estratégica de Compras",
        "MBA em Gestão Financeira",
        "MBA em Liderança, Inovação e Gestão"
      ]
    },
    {
      categoria: "Saúde",
      cursos: [
        "Administração Hospitalar",
        "Análises Clínicas e Microbiologia",
        "Análises Clínicas e Toxicológicas",
        "Anatomia e Patologias Associadas",
        "Atividade Física em Grupos Especiais",
        "Auditoria em Saúde",
        "Avaliação Física, Esportiva e Funcional",
        "Biologia Molecular, Genética Avançada e Biotecnologia",
        "Biomedicina Estética",
        "CCIH – Controle de Infecção Hospitalar",
        "Cinesiologia, Biomecânica e Treinamento Físico",
        "Citologia Clínica",
        "Cuidados Básicos em Centro Cirúrgico",
        "Cuidados Cirúrgicos, Central de Material e Esterilização (CME)",
        "Dermatologia Estética",
        "Direito Médico e Hospitalar",
        "Docência no Ensino Superior em Saúde",
        "Educação Física para Diabéticos e Doenças Crônicas",
        "Educação Permanente em Saúde",
        "Enfermagem do Trabalho",
        "Enfermagem, Urgência e Emergência",
        "Engenharia e Gestão Hospitalar",
        "Estética e Cosmetologia",
        "Estudos em Epidemiologia",
        "Farmácia Clínica e Atenção Farmacêutica",
        "Farmácia Clínica e Serviços Farmacêuticos",
        "Farmácia Hospitalar",
        "Fisiologia do Exercício",
        "Fisioterapia Dermatofuncional",
        "Fisioterapia Hospitalar",
        "Fisioterapia Neurológica Adulta",
        "Fisioterapia Respiratória",
        "Fisioterapia Traumato-Ortopédica e Desportiva",
        "Genética Humana",
        "Gestão da Produção de Alimentos",
        "Gestão da Saúde",
        "Gestão de Clínicas, Consultórios e Hospitais",
        "Gestão de Qualidade Hospitalar",
        "Gestão de Unidades de Alimentação e Nutrição – UAN",
        "Gestão em Saúde da Família",
        "Gestão em Saúde Mental",
        "Gestão em Saúde Pública",
        "Gestão Estratégica em Saúde Pública e Coletiva",
        "Hemoterapia",
        "Imunologia e Microbiologia",
        "Instrumentalidade do Serviço Social",
        "Intervenção Psicossocial no Contexto Multidisciplinar",
        "MBA em Gestão em Saúde",
        "Medicina do Trabalho",
        "Neurociência, Aprendizagem e Toxicologia Neural",
        "Neuropsicopedagogia na Saúde",
        "Nutrição Clínica",
        "Nutrição com Ênfase em Obesidade e Emagrecimento",
        "Nutrição Comportamental",
        "Nutrição Esportiva",
        "Nutrição Hospitalar e Clínica",
        "Nutrição Infantil",
        "Nutrição Materno Infantil",
        "Odontologia Hospitalar",
        "Odontologia no Trabalho",
        "Oncologia",
        "Primeiros Socorros e Intercorrências Aplicados à Estética",
        "Psicologia da Educação",
        "Psicologia do Desenvolvimento Infantil",
        "Psicologia e Desenvolvimento da Aprendizagem",
        "Psicologia Hospitalar",
        "Psicologia Jurídica",
        "Psicologia na Saúde Mental",
        "Psicologia Organizacional",
        "Psicomotricidade na Saúde",
        "Psicopatologia",
        "Saúde Coletiva",
        "Saúde Coletiva e Comunitária",
        "Saúde Coletiva e Educação em Saúde Bucal",
        "Saúde da Mulher",
        "Saúde do Idoso",
        "Saúde do Trabalhador",
        "Saúde Pública com Ênfase em Saúde da Família",
        "Segurança do Paciente e Gestão de Qualidade",
        "Serviço Social e Saúde Pública",
        "Serviço Social Hospitalar",
        "UTI: Unidade de Terapia Intensiva",
        "Vigilância em Saúde",
        "Vigilância Sanitária",
        "Vigilância Sanitária e Qualidade de Alimentos",
        "Zoonoses e Saúde Pública"
      ]
    },
    {
      categoria: "Tecnologia",
      cursos: [
        "Análise de Sistemas",
        "Aprendizagem de Máquina",
        "Arquitetura de Servidores",
        "Arquitetura e Gestão de Infraestrutura em TI",
        "Banco de Dados",
        "Business Intelligence",
        "Ciência de Dados e Big Data",
        "Ciências de Dados",
        "Desenvolvimento de Aplicações para Dispositivos Móveis",
        "Desenvolvimento de Jogos Digitais",
        "Desenvolvimento de Sistemas com C#",
        "Desenvolvimento de Sistemas Orientado a Objetos",
        "Desenvolvimento de Sistemas Web com PHP",
        "Engenharia de Software",
        "Gerenciamento de Projetos",
        "Gestão Ágil de Projetos",
        "Gestão de Projetos",
        "Gestão e Qualidade de Software",
        "Gestão Estratégica da Tecnologia da Informação",
        "Inteligência Artificial",
        "Inteligência Artificial e Big Data",
        "Inteligência Artificial e Machine Learning",
        "MBA em Gestão da Tecnologia da Informação",
        "Programação Back-End",
        "Projeto e Desempenho de Redes",
        "Redes Sem Fio e Comunicação Móvel",
        "Segurança da Informação",
        "Segurança de Redes de Computadores",
        "Tecnologias e Inovações Web",
        "Transformação Digital"
      ]
    }
  ];

  const beneficios = [
    "Especialização em área específica",
    "Networking profissional",
    "Crescimento na carreira",
    "Aumento salarial",
    "Atualização profissional",
    "Diferencial competitivo"
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-hero text-white py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <Badge variant="secondary" className="mb-4 bg-accent text-accent-foreground">
              Pós-Graduação EAD
            </Badge>
            <h1 className="text-4xl lg:text-6xl font-bold mb-6">
              Pós-Graduação
            </h1>
            <p className="text-xl lg:text-2xl text-blue-100 mb-8">
              Especialize-se e acelere sua carreira profissional. 
              <strong> 200+ especializações disponíveis</strong> com duração de 12 a 18 meses.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">200+</div>
                <div className="text-sm opacity-90">Especializações</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">12-18</div>
                <div className="text-sm opacity-90">Meses de Duração</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">11</div>
                <div className="text-sm opacity-90">Áreas de Conhecimento</div>
              </div>
            </div>
            <Button variant="hero" size="lg" asChild>
              <a href="#contato">Quero me Especializar</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-gradient-subtle">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-6">
              Por que fazer uma Pós-Graduação?
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              A pós-graduação é o caminho para se destacar no mercado de trabalho 
              e conquistar melhores oportunidades profissionais.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {beneficios.map((beneficio, index) => (
              <Card key={index} className="text-center shadow-soft hover:shadow-elevated transition-all duration-300">
                <CardContent className="p-6">
                  <TrendingUp className="h-8 w-8 text-accent mx-auto mb-3" />
                  <p className="font-medium">{beneficio}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Stats */}
          <Card className="bg-gradient-primary text-primary-foreground shadow-floating">
            <CardContent className="p-8 lg:p-12">
              <div className="text-center mb-8">
                <Award className="h-12 w-12 mx-auto mb-4" />
                <h3 className="text-3xl font-bold mb-4">Impacto da Pós-Graduação</h3>
                <p className="text-xl text-primary-foreground/90">
                  Dados do mercado sobre profissionais especializados
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="text-3xl font-bold mb-2">40%</div>
                  <div className="text-sm opacity-90">Aumento salarial médio</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold mb-2">75%</div>
                  <div className="text-sm opacity-90">Melhores oportunidades</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold mb-2">90%</div>
                  <div className="text-sm opacity-90">Satisfação profissional</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Areas Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-6">
              Áreas de Especialização
            </h2>
            <p className="text-xl text-muted-foreground">
              Mais de 200 especializações distribuídas em 11 grandes áreas do conhecimento
            </p>
          </div>
          
          <div className="space-y-8">
            {areas.map((area, index) => (
              <Card key={index} className="shadow-soft hover:shadow-elevated transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="bg-gradient-primary p-3 rounded-lg">
                      <BookOpen className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl">{area.categoria}</CardTitle>
                      <CardDescription>
                        {area.cursos.length} especializações disponíveis
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                    {area.cursos.slice(0, 12).map((curso, cursoIndex) => (
                      <div key={cursoIndex} className="flex items-center space-x-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-accent flex-shrink-0" />
                        <span className="text-muted-foreground">{curso}</span>
                      </div>
                    ))}
                    {area.cursos.length > 12 && (
                      <div className="text-sm text-primary font-medium">
                        + {area.cursos.length - 12} outras especializações
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        const message = `Olá! Tenho interesse em Pós-graduação na área de ${area.categoria} e gostaria de saber mais sobre a oferta especial de 30% de desconto!`;
                        const whatsappUrl = `https://wa.me/559220201260?text=${encodeURIComponent(message)}`;
                        window.open(whatsappUrl, '_blank');
                      }}
                      className="text-xs"
                    >
                      Ver especializações
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* MBA Highlight */}
          <Card className="bg-gradient-accent text-accent-foreground shadow-floating mt-12">
            <CardContent className="p-8 lg:p-12">
              <div className="text-center">
                <Target className="h-12 w-12 mx-auto mb-4" />
                <h3 className="text-3xl font-bold mb-4">MBA - Master in Business Administration</h3>
                <p className="text-xl text-accent-foreground/90 mb-6">
                  Especializações voltadas para gestão empresarial e liderança
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  <div className="text-center">
                    <div className="font-bold">Gestão Empresarial</div>
                    <div className="text-sm opacity-90">Liderança e estratégia</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold">Finanças</div>
                    <div className="text-sm opacity-90">Mercado financeiro</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold">Marketing</div>
                    <div className="text-sm opacity-90">Vendas e comunicação</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold">Tecnologia</div>
                    <div className="text-sm opacity-90">Gestão de TI</div>
                  </div>
                </div>
                <Button variant="secondary" size="lg" asChild>
                  <a href="#contato">Conhecer MBAs Disponíveis</a>
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* CTA */}
          <div className="text-center mt-12">
            <Card className="bg-gradient-primary text-primary-foreground shadow-floating max-w-2xl mx-auto">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-4">
                  Pronto para se especializar?
                </h3>
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

      {/* Contact Section */}
      <section id="contato" className="py-16 bg-gradient-subtle">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-6">
              Solicite Mais Informações
            </h2>
            <p className="text-xl text-muted-foreground">
              Nossa equipe está pronta para esclarecer suas dúvidas sobre as especializações
            </p>
          </div>
          
          <div className="max-w-2xl mx-auto">
            <LeadForm 
              title="Quero saber mais sobre Pós-Graduação"
              description="Preencha o formulário e receba informações detalhadas sobre nossas especializações e condições especiais."
            />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default PosGraduacao;