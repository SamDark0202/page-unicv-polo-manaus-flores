import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  loadTechnicalCompetenceCourses,
  type TechnicalCompetenceCourse,
} from "@/lib/technicalCompetenceStorage";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Search,
  CheckCircle2,
  ShieldCheck,
  FileText,
  Award,
  MessageCircle,
  Briefcase,
  Clock,
  Building,
  HelpCircle,
  GraduationCap,
  ExternalLink,
  AlertTriangle,
  ChevronRight,
  BookOpen,
  Send,
  UserCheck,
  Layers,
  FileCheck,
  Check,
  Sparkles,
  CreditCard,
} from "lucide-react";
import {
  ContainerScroll,
  ContainerSticky,
  ProcessCard,
  ProcessCardBody,
  ProcessCardTitle,
} from "@/components/ui/process-timeline";
import { trackWhatsAppClick, trackFormSubmit } from "@/lib/tracker";

const WHATSAPP_PHONE = "559220201260";

// --- DADOS E PREÇOS DOS CURSOS ---
interface CourseCategory {
  category: string;
  courses: string[];
}

interface CoursePricing {
  originalPrice: string;
  cashPrice: string;
  boletoInstallment: string;
  creditCardInstallment: string;
  matriculaTax: string;
}

const getCoursePricing = (categoryName: string, courseName: string): CoursePricing => {
  const normalizedCategory = categoryName.trim().toLowerCase();
  const normalizedCourse = courseName.trim().toLowerCase();

  // Regra especial: Categoria "Ambiente e Saúde" e cursos de "Agricultura" / "Agropecuária"
  const isSpecialCategory = normalizedCategory === "ambiente e saúde" || normalizedCategory === "ambiente e saude";
  const isSpecialCourse =
    normalizedCourse.includes("agricultura") ||
    normalizedCourse.includes("agropecuaria") ||
    normalizedCourse.includes("agropecuária");

  if (isSpecialCategory || isSpecialCourse) {
    return {
      originalPrice: "R$ 3.597,50",
      cashPrice: "R$ 1.439,00",
      boletoInstallment: "12X de R$ 135,83",
      creditCardInstallment: "12X de R$ 123,25",
      matriculaTax: "R$ 99,00",
    };
  }

  // Cursos gerais
  return {
    originalPrice: "R$ 2.100,00",
    cashPrice: "R$ 840,00",
    boletoInstallment: "12X de R$ 108,25",
    creditCardInstallment: "12X de R$ 76,16",
    matriculaTax: "R$ 99,00",
  };
};

const COURSES_DATA: CourseCategory[] = [
  {
    category: "Gestão e Negócios",
    courses: [
      "Técnico em Administração",
      "Técnico em Contabilidade",
      "Técnico em Eventos",
      "Técnico em Logística",
      "Técnico em Secretaria Escolar",
      "Técnico em Transações Imobiliárias",
    ],
  },
  {
    category: "Informação e Comunicação",
    courses: [
      "Técnico em Desenvolvimento de Sistemas",
      "Técnico em Informática para Internet",
    ],
  },
  {
    category: "Controle e Processos Industriais",
    courses: [
      "Técnico em Automação Industrial",
      "Técnico em Eletromecânica",
      "Técnico em Eletrotécnica",
      "Técnico em Equipamentos Biomédicos",
      "Técnico em Manutenção de Máquinas Navais",
      "Técnico em Refrigeração e Climatização",
      "Técnico em Soldagem",
    ],
  },
  {
    category: "Infraestrutura",
    courses: [
      "Técnico em Edificações",
      "Técnico em Design de Interiores",
    ],
  },
  {
    category: "Desenvolvimento Educacional e Social",
    courses: ["Técnico em Tradução e Interpretação de Libras"],
  },
  {
    category: "Ambiente e Saúde",
    courses: [
      "Técnico em Enfermagem",
      "Técnico em Estética",
      "Técnico em Farmácia",
      "Técnico em Gerência em Saúde",
      "Técnico em Meio Ambiente",
      "Técnico em Nutrição e Dietética",
      "Técnico em Óptica",
      "Técnico em Radiologia",
      "Técnico em Saúde Bucal",
    ],
  },
  {
    category: "Produção Alimentícia",
    courses: ["Técnico em Agroindústria"],
  },
  {
    category: "Recursos Naturais",
    courses: ["Técnico em Agricultura", "Técnico em Mineração"],
  },
  {
    category: "Produção Industrial",
    courses: ["Técnico em Química"],
  },
  {
    category: "Turismo, Hospitalidade e Lazer",
    courses: ["Técnico em Guia de Turismo"],
  },
  {
    category: "Segurança",
    courses: ["Técnico em Defesa Civil", "Técnico em Segurança do Trabalho"],
  },
  {
    category: "Transporte",
    courses: ["Técnico em Trânsito"],
  },
];

// --- 5 ETAPAS DO PROCESSO ---
const PROCESS_STEPS = [
  {
    step: "01",
    title: "ESCOLHA O CURSO",
    subtitle: "Escolha do Curso Técnico Compatível",
    description:
      "O candidato escolhe o curso técnico estritamente compatível com sua atuação e experiência profissional comprovada na área.",
    highlights: [
      "Orientação gratuita sobre a compatibilidade com sua função",
      "Escolha entre mais de 30 formações técnicas autorizadas",
    ],
    icon: BookOpen,
    badgeColor: "bg-blue-500/20 text-blue-400 border-blue-500/40",
    gradient: "from-slate-900 via-blue-950/80 to-slate-900",
    borderColor: "border-blue-500/40",
  },
  {
    step: "02",
    title: "ENVIE SUA DOCUMENTAÇÃO",
    subtitle: "Comprovação Profissional e Pessoal",
    description:
      "São analisados seus documentos pessoais (RG, CPF, Ensino Médio) e comprovantes de experiência na área de atuação.",
    highlights: [
      "Envio 100% digital e seguro dos documentos",
      "Aceitamos CTPS, MEI, Contratos, Portarias e Holerites",
    ],
    icon: FileText,
    badgeColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
    gradient: "from-slate-900 via-emerald-950/80 to-slate-900",
    borderColor: "border-emerald-500/40",
  },
  {
    step: "03",
    title: "ANÁLISE DA EXPERIÊNCIA",
    subtitle: "Avaliação pela Comissão de Ensino",
    description:
      "A equipe pedagógica e de análise verifica se os documentos apresentados demonstram os 2 anos (24 meses) ou mais de experiência exigidos.",
    highlights: [
      "Conferência minuciosa da validade jurídica dos comprovantes",
      "Confirmação dos 24 meses de atuação na área pretendida",
    ],
    icon: UserCheck,
    badgeColor: "bg-cyan-500/20 text-cyan-400 border-cyan-500/40",
    gradient: "from-slate-900 via-cyan-950/80 to-slate-900",
    borderColor: "border-cyan-500/40",
  },
  {
    step: "04",
    title: "REALIZE AS AVALIAÇÕES",
    subtitle: "Provas Obrigatórias Online",
    description:
      "O candidato realiza avaliações online por módulo para demonstrar seus conhecimentos técnicos e precisa alcançar o aproveitamento mínimo de 70%.",
    highlights: [
      "Provas aplicadas em plataforma digital intuitiva",
      "Exigência de nota 7,0 (70%) com direito a refação pedagógica",
    ],
    icon: FileCheck,
    badgeColor: "bg-purple-500/20 text-purple-400 border-purple-500/40",
    gradient: "from-slate-900 via-purple-950/80 to-slate-900",
    borderColor: "border-purple-500/40",
  },
  {
    step: "05",
    title: "CONCLUSÃO E EMISSÃO",
    subtitle: "Diploma Oficial e Histórico Escolar",
    description:
      "Após aprovação nas avaliações, entrega documental completa e validação final, o diploma técnico de nível médio é emitido e registrado no SISTEC / MEC.",
    highlights: [
      "Emissão do diploma físico/digital com histórico escolar completo",
      "Registro público no SISTEC (MEC) e QR Code para validação",
    ],
    icon: Award,
    badgeColor: "bg-amber-500/20 text-amber-400 border-amber-500/40",
    gradient: "from-slate-900 via-amber-950/80 to-slate-900",
    borderColor: "border-amber-500/40",
  },
];

// --- CARDS DA SEÇÃO PARA QUEM É ---
const TARGET_AUDIENCE_CARDS = [
  {
    id: 1,
    title: "Você já trabalha na área",
    subtitle: "Prática do dia a dia",
    description:
      "Possui experiência prática profissional sólida e deseja formalizar legalmente seus conhecimentos com uma habilitação técnica.",
    bg: "from-slate-900 via-blue-950 to-slate-900",
    border: "border-blue-500/30",
    badge: "Experiência Prática",
  },
  {
    id: 2,
    title: "Você tem 2 anos ou mais de experiência",
    subtitle: "Tempo de atuação",
    description:
      "A experiência pode ser comprovada por diferentes modalidades de documentos (CLT, autônomo, MEI, serviço público ou empresa).",
    bg: "from-slate-900 via-emerald-950 to-slate-900",
    border: "border-emerald-500/30",
    badge: "Mínimo 2 Anos",
  },
  {
    id: 3,
    title: "Você não possui formação técnica correspondente",
    subtitle: "Necessidade de Diploma",
    description:
      "Aprendeu a profissão na prática ou em treinamentos, mas precisa do diploma oficial para progresso na carreira ou exigência profissional.",
    bg: "from-slate-900 via-indigo-950 to-slate-900",
    border: "border-indigo-500/30",
    badge: "Formalização",
  },
  {
    id: 4,
    title: "Você quer formalizar sua experiência",
    subtitle: "Processo estruturado",
    description:
      "Passe pelo processo regulamentado de análise documental e avaliações técnicas para buscar sua certificação profissional reconhecida.",
    bg: "from-slate-900 via-cyan-950 to-slate-900",
    border: "border-cyan-500/30",
    badge: "Validação Oficial",
  },
];

// --- DADOS DO FAQ ---
const FAQ_ITEMS = [
  {
    q: "O que é Técnico por Competência?",
    a: "O Técnico por Competência é uma modalidade legalmente respaldada destinada a profissionais que já possuem experiência comprovada na área de atuação. Em vez de cursar todas as disciplinas do zero em uma formação tradicional, o candidato apresenta sua experiência profissional, passa por análise documental e realiza avaliações para demonstrar suas competências.",
  },
  {
    q: "Quem pode participar?",
    a: "Profissionais que possuem pelo menos 2 anos de experiência comprovada na área do curso pretendido, com ensino médio concluído e documentação que comprove a atuação profissional.",
  },
  {
    q: "Preciso ter experiência profissional?",
    a: "Sim. A comprovação de experiência profissional na área é requisito obrigatório para ingressar no processo de certificação por competência.",
  },
  {
    q: "Quantos anos de experiência são necessários?",
    a: "É necessário comprovar o mínimo de 2 anos (24 meses) de atuação profissional na área correspondente ao curso técnico escolhido.",
  },
  {
    q: "Como comprovo minha experiência?",
    a: "A comprovação pode ser feita via Carteira de Trabalho (CTPS), contracheques, declaração de empresa com firma reconhecida, contratos de prestação de serviço, MEI/CNPJ, portarias de órgãos públicos ou documentos equivalentes que atestem a função exercida.",
  },
  {
    q: "Posso somar experiência de empresas diferentes?",
    a: "Sim. Você pode apresentar documentos de diferentes empresas ou vínculos profissionais, desde que o somatório dos períodos cumpra o requisito mínimo de 2 anos na área.",
  },
  {
    q: "Posso comprovar experiência como autônomo?",
    a: "Sim. Autônomos podem comprovar experiência mediante contratos de prestação de serviços, notas fiscais emitidas, declarações de função com firma reconhecida e comprovantes de atuação na área.",
  },
  {
    q: "Posso usar experiência como MEI ou PJ?",
    a: "Sim. O registro de MEI ou empresa PJ na área do curso, acompanhado de comprovante de CNPJ ativo, contratos ou notas fiscais da atividade exercida, serve como comprovação.",
  },
  {
    q: "Preciso fazer prova?",
    a: "Sim. A realização de avaliações é etapa obrigatória do processo para demonstrar seus conhecimentos técnicos na área escolhida.",
  },
  {
    q: "Qual é a nota mínima para aprovação?",
    a: "O candidato precisa alcançar um aproveitamento mínimo de 70% (nota 7,0) nas avaliações exigidas.",
  },
  {
    q: "As provas são online?",
    a: "Sim, as avaliações são realizadas em plataforma digital online conforme as orientações da instituição responsável.",
  },
  {
    q: "Posso refazer a prova se não atingir a nota mínima?",
    a: "Sim. Caso não alcance o aproveitamento de 70% de primeira, o candidato poderá refazer a avaliação conforme o regulamento da instituição.",
  },
  {
    q: "Quais documentos pessoais preciso enviar?",
    a: "Documento de identidade (RG ou CNH), CPF, comprovante de residência atualizado, certidão de nascimento ou casamento e certificado/histórico de conclusão do Ensino Médio.",
  },
  {
    q: "Preciso ter Ensino Médio concluído?",
    a: "Sim. O Ensino Médio completo é pré-requisito legal para a emissão do diploma de nível técnico.",
  },
  {
    q: "Posso escolher qualquer curso?",
    a: "O curso escolhido precisa ser rigorosamente compatível com a experiência profissional que você consegue comprovar documentalmente.",
  },
  {
    q: "Como saber se minha função é compatível com o curso?",
    a: "Nossa equipe realiza uma pré-análise gratuita do seu histórico profissional e documentos para orientar qual curso técnico se adequa ao seu perfil.",
  },
  {
    q: "Quem emite o diploma?",
    a: "O diploma é emitido pelo Colégio Técnico Universal (Tec), instituição de ensino credenciada, com sede em Redenção - Pará (Código SISTEC 61295).",
  },
  {
    q: "Como verificar a autenticidade do diploma?",
    a: "Após a emissão e registro, o diploma possui registro no SISTEC, podendo ser consultado publicamente pelo CPF do aluno no sistema do Ministério da Educação, além de contar com QR Code de validação no próprio documento.",
  },
  {
    q: "O diploma possui QR Code para verificação?",
    a: "Sim, o diploma impresso/digital acompanha QR Code para verificação instantânea de autenticidade.",
  },
  {
    q: "O diploma é registrado no SISTEC?",
    a: "Sim. Conforme as regras da educação profissional, o registro é inserido no SISTEC (Sistema Nacional de Informações da Educação Profissional e Tecnológica) após a conclusão de todas as etapas.",
  },
  {
    q: "Quanto tempo demora o processo de emissão?",
    a: "O tempo varia de acordo com a celeridade do envio de documentos pelo aluno, análise pedagógica e aprovação nas avaliações. Após tudo aprovado e regularizado, abre-se a solicitação de emissão.",
  },
  {
    q: "Posso fazer mais de um curso se tiver experiência em áreas diferentes?",
    a: "Sim, desde que comprove documentalmente o tempo de experiência de pelo menos 2 anos para cada área/curso pretendido.",
  },
  {
    q: "Posso trocar de curso durante o processo?",
    a: "Trocas de curso são analisadas pela equipe técnica antes da realização das avaliações e emissão, sujeitas à compatibilidade da documentação.",
  },
  {
    q: "O que acontece se minha documentação for insuficiente?",
    a: "Nossa equipe indicará quais documentos complementares são necessários para regularizar a análise antes de prosseguir com a etapa de provas.",
  },
];

const formatPhone = (val: string) => {
  const digits = val.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits ? `(${digits}` : "";
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
};

export default function TecnicoPorCompetencia() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Todos");
  const [technicalCourses, setTechnicalCourses] = useState<TechnicalCompetenceCourse[]>(loadTechnicalCompetenceCourses);

  useEffect(() => {
    const handleUpdate = () => setTechnicalCourses(loadTechnicalCompetenceCourses());
    window.addEventListener("technicalCompetenceCoursesUpdated", handleUpdate);
    return () => window.removeEventListener("technicalCompetenceCoursesUpdated", handleUpdate);
  }, []);

  // Categorias disponíveis
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    technicalCourses.forEach((c) => {
      if (c.category?.trim()) set.add(c.category.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [technicalCourses]);

  // Form State
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    whatsapp: "",
    cargoAtual: "",
    tempoExperiencia: "",
    cursoInteresse: "",
    aceitaTermos: false,
    website_hp: "", // Honeypot field (anti-spam bot)
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Smooth scroll helper
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  // WhatsApp open helper
  const openWhatsAppWithMessage = (customMessage: string, source: string) => {
    trackWhatsAppClick(source);
    if (typeof window.fbq === "function") {
      window.fbq("track", "Contact");
    }
    const url = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(customMessage)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  // Filtered Courses
  const filteredCoursesData = useMemo(() => {
    const map = new Map<string, TechnicalCompetenceCourse[]>();

    technicalCourses.forEach((c) => {
      const cat = c.category || "Outros";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(c);
    });

    return Array.from(map.entries())
      .map(([categoryName, catCourses]) => {
        const isCatSelected = selectedCategory === "Todos" || selectedCategory === categoryName;
        if (!isCatSelected) return null;

        const query = searchQuery.toLowerCase().trim();
        const matchingCourses = catCourses.filter((course) =>
          course.name.toLowerCase().includes(query) || course.category.toLowerCase().includes(query)
        );

        if (matchingCourses.length === 0) return null;

        return {
          category: categoryName,
          courses: matchingCourses,
        };
      })
      .filter((item): item is { category: string; courses: TechnicalCompetenceCourse[] } => item !== null);
  }, [technicalCourses, searchQuery, selectedCategory]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 🛡️ Camada de Proteção 1: Honeypot Check (Bot Trap)
    if (formData.website_hp) {
      navigate("/tecnico-por-competencia/obrigado");
      return;
    }

    // 🛡️ Camada de Proteção 2: Validações do Lado do Cliente & Anti-Script Injection
    const nomeClean = formData.nome.trim();
    const emailClean = formData.email.trim().toLowerCase();
    const phoneDigits = formData.whatsapp.replace(/\D/g, "");
    const cargoClean = formData.cargoAtual.trim();

    // Filtro para prevenir injeção de HTML/scripts
    const hasScript = (val: string) => /<[a-z][\s\S]*>/i.test(val) || /(javascript:|on\w+=)/i.test(val);
    if (
      hasScript(nomeClean) ||
      hasScript(emailClean) ||
      hasScript(cargoClean) ||
      hasScript(formData.tempoExperiencia) ||
      hasScript(formData.cursoInteresse)
    ) {
      toast.error("Conteúdo ou scripts inválidos foram detectados no formulário.");
      return;
    }

    if (!nomeClean || nomeClean.length < 3) {
      toast.error("Por favor, informe seu nome completo.");
      return;
    }

    if (nomeClean.length > 100) {
      toast.error("O nome completo excede o limite máximo de 100 caracteres.");
      return;
    }

    if (!emailClean || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailClean)) {
      toast.error("Por favor, informe um endereço de e-mail válido (ex: seu@email.com).");
      return;
    }

    if (emailClean.length > 100) {
      toast.error("O e-mail excede o limite máximo de 100 caracteres.");
      return;
    }

    if (!phoneDigits || (phoneDigits.length !== 10 && phoneDigits.length !== 11)) {
      toast.error("WhatsApp inválido! Informe o DDD e o número completo (10 ou 11 dígitos).");
      return;
    }

    if (!cargoClean || cargoClean.length < 2) {
      toast.error("Por favor, informe seu cargo ou função atual.");
      return;
    }

    if (cargoClean.length > 100) {
      toast.error("O cargo ou função excede o limite máximo de 100 caracteres.");
      return;
    }

    if (formData.tempoExperiencia.length > 50) {
      toast.error("O tempo de experiência excede o limite máximo de 50 caracteres.");
      return;
    }

    if (formData.cursoInteresse.length > 100) {
      toast.error("O curso de interesse excede o limite máximo de 100 caracteres.");
      return;
    }

    if (!formData.aceitaTermos) {
      toast.error("Você precisa concordar com os termos de envio de dados (LGPD) para prosseguir.");
      return;
    }

    setIsSubmitting(true);
    trackFormSubmit("tecnico_competencia_analise_experiencia", formData);

    try {
      // 🛡️ Camada de Proteção 3: Rota relativa segura de API server-side
      const res = await fetch("/api/tecnico-competencia-lead", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome: nomeClean,
          email: emailClean,
          whatsapp: formData.whatsapp,
          cargoAtual: cargoClean,
          tempoExperiencia: formData.tempoExperiencia,
          resumoAtividades: `Curso: ${formData.cursoInteresse || "N/I"}`,
          website_hp: formData.website_hp,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Não foi possível enviar os dados no momento.");
      }

      // Redireciona para a página de obrigado
      navigate("/tecnico-por-competencia/obrigado");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao enviar formulário. Tente novamente.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary selection:text-white">
      <Header />

      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white py-16 lg:py-24 border-b border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(37,99,235,0.25),rgba(255,255,255,0))] pointer-events-none" />

        <div className="container relative z-10 mx-auto px-4 text-center max-w-5xl">

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.15] text-white mb-6">
            Já trabalha na área há{" "}<br>
            </br>
            <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-emerald-400 bg-clip-text text-transparent">
              2 anos ou mais?
            </span>
            <br />
            Transforme sua experiência profissional em uma certificação técnica.
          </h1>

          <p className="text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto mb-8 font-normal leading-relaxed">
            Na modalidade <strong className="text-white">Técnico por Competência</strong>, sua experiência profissional é analisada e você passa por avaliações para demonstrar seus conhecimentos e competências na área escolhida.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <Button
              size="lg"
              className="w-full sm:w-auto text-base sm:text-lg font-bold px-8 py-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-xl shadow-blue-900/30 transition-all duration-300"
              onClick={() => scrollToSection("formulario-analise")}
            >
              SABER MAIS
              <ChevronRight className="h-5 w-5 ml-2" />
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto text-base sm:text-lg font-semibold px-8 py-6 rounded-xl border-slate-700 bg-slate-900/50 hover:bg-slate-800 text-slate-200 hover:text-white"
              onClick={() => scrollToSection("como-funciona")}
            >
              VER COMO FUNCIONA
            </Button>
          </div>

          {/* Security Disclaimer */}
          <div className="inline-flex items-center gap-2 text-xs sm:text-sm text-slate-400 bg-slate-900/60 px-4 py-2 rounded-lg border border-slate-800">
            <ShieldCheck className="h-4 w-4 text-emerald-400 flex-shrink-0" />
            <span>
              Processo sujeito à análise documental, comprovação de experiência e aprovação nas avaliações.
            </span>
          </div>
        </div>
      </section>

      {/* SEÇÃO PARA QUEM É? (Cards com Stacked Transition Effect) */}
      <section className="py-20 bg-gradient-to-b from-slate-100 via-slate-50 to-slate-100 text-slate-900 border-y border-slate-200/80 relative shadow-inner">
        <div className="container mx-auto px-4 max-w-5xl mb-12 text-center">
          <Badge variant="outline" className="mb-3 border-blue-600/30 bg-blue-50 text-blue-700 font-bold px-3 py-1">
            Perfil do Candidato
          </Badge>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-900 mb-4">
            Para Quem É Este Processo?
          </h2>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto font-medium">
            Identifique se o seu perfil profissional é compatível com os requisitos exigidos.
          </p>
        </div>

        {/* Stacked Sticky Cards Container */}
        <div className="container mx-auto px-4 max-w-4xl space-y-6">
          {TARGET_AUDIENCE_CARDS.map((card, idx) => (
            <div
              key={card.id}
              className={`sticky top-24 rounded-3xl border ${card.border} bg-gradient-to-br ${card.bg} p-8 sm:p-10 shadow-2xl transition-all duration-300`}
              style={{
                zIndex: idx + 1,
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs uppercase tracking-widest font-bold px-3 py-1 rounded-full bg-white/10 text-white border border-white/10">
                  {card.badge}
                </span>
                <span className="text-3xl font-extrabold text-white/20">
                  0{card.id}
                </span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
                {card.title}
              </h3>
              <p className="text-sm font-medium text-blue-300 mb-4">
                {card.subtitle}
              </p>
              <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
                {card.description}
              </p>
            </div>
          ))}
        </div>

        {/* Alert Box Below Cards */}
        <div className="container mx-auto px-4 max-w-4xl mt-12">
          <div className="bg-amber-50 border border-amber-300/80 p-6 rounded-2xl flex items-start gap-4 shadow-md">
            <AlertTriangle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-extrabold text-amber-900 text-lg mb-1">
                Importante
              </h4>
              <p className="text-amber-900/90 text-sm font-medium leading-relaxed">
                Ter experiência não significa aprovação automática. A documentação precisa comprovar efetivamente a atuação na área e o candidato precisa ser aprovado nas avaliações exigidas com nota mínima de 70%.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO COMO FUNCIONA? (PASSOS CENTRALIZADOS E COM VOLUME) */}
      <section id="como-funciona" className="py-20 bg-slate-950 text-white relative border-b border-slate-800">
        <div className="container mx-auto px-4 max-w-5xl text-center mb-14">
          <Badge variant="outline" className="mb-3 border-blue-400/40 text-blue-400 font-bold px-4 py-1">
            Passo a Passo Estruturado
          </Badge>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white mb-4">
            Como Funciona o Processo?
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto font-medium">
            Conheça as 5 etapas desde a análise documental até a emissão oficial da sua certificação.
          </p>
        </div>

        {/* Centered Stacked Cards Container - Zero empty side space, 100% centered & voluminous */}
        <div className="container mx-auto px-4 max-w-4xl space-y-8">
          {PROCESS_STEPS.map((step, idx) => {
            const IconComponent = step.icon;
            return (
              <div
                key={step.step}
                className={`sticky top-24 rounded-3xl border-2 ${step.borderColor} bg-gradient-to-br ${step.gradient} p-8 sm:p-10 md:p-12 shadow-2xl backdrop-blur-xl transition-all duration-300 mx-auto w-full`}
                style={{
                  zIndex: idx + 1,
                }}
              >
                {/* Header Step Number */}
                <div className="flex items-center justify-end gap-4 mb-6">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-400 uppercase tracking-widest hidden sm:inline">Etapa</span>
                    <span className="text-3xl sm:text-4xl font-black text-white/30">
                      {step.step}
                    </span>
                  </div>
                </div>

                {/* Card Title & Icon */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-3.5 rounded-2xl bg-blue-600/30 border border-blue-400/30 text-blue-300 flex-shrink-0">
                    <IconComponent className="h-7 w-7 sm:h-8 sm:w-8" />
                  </div>
                  <div>
                    <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                      {step.title}
                    </h3>
                    <p className="text-sm font-semibold text-blue-300 mt-1">
                      {step.subtitle}
                    </p>
                  </div>
                </div>

                {/* Main Description */}
                <p className="text-slate-200 text-base sm:text-lg leading-relaxed mb-6 font-normal">
                  {step.description}
                </p>

                {/* Highlights / Checklists box (Adds volume and high value detail!) */}
                <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 space-y-2.5">
                  {step.highlights.map((item, hIdx) => (
                    <div key={hIdx} className="flex items-center gap-2.5 text-sm sm:text-base text-slate-200 font-medium">
                      <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* SEÇÃO COMO COMPROVAR MINHA EXPERIÊNCIA? */}
      <section className="py-20 bg-background border-b border-border">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-3 text-primary border-primary/30">
              Comprovação Flexível
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-4">
              Você não precisa ter apenas carteira assinada para comprovar sua experiência.
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg max-w-3xl mx-auto">
              Os documentos apresentados variam conforme sua situação profissional atual ou histórica.
            </p>
          </div>

          {/* 4 Category Cards */}
          <div className="grid sm:grid-cols-2 gap-6 mb-10">
            {/* CLT */}
            <Card className="border-border hover:border-primary/50 transition-all shadow-md">
              <CardHeader className="pb-3 flex flex-row items-center gap-3">
                <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <Briefcase className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl">CLT (Carteira Assinada)</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    CTPS (Digital ou Física) com registro na área
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    Contracheques / Holerites com descrição da função
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    Declaração da empresa (com firma reconhecida)
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    Contrato individual de trabalho
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* FUNCIONÁRIO PÚBLICO */}
            <Card className="border-border hover:border-primary/50 transition-all shadow-md">
              <CardHeader className="pb-3 flex flex-row items-center gap-3">
                <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <Building className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl">Servidor / Func. Público</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    Ato de nomeação ou posse no cargo
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    Portaria oficial publicada
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    Contracheques / Comprovante de rendimentos
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    Declaração oficial expedida pelo órgão público
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* AUTÔNOMO */}
            <Card className="border-border hover:border-primary/50 transition-all shadow-md">
              <CardHeader className="pb-3 flex flex-row items-center gap-3">
                <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <UserCheck className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl">Autônomo / Prestador</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    Registro de MEI / PJ ativo na área
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    Notas fiscais de serviços prestados
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    Contratos formais de prestação de serviços
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    Declarações de função emitidas por clientes
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* EMPRESÁRIO */}
            <Card className="border-border hover:border-primary/50 transition-all shadow-md">
              <CardHeader className="pb-3 flex flex-row items-center gap-3">
                <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Layers className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl">Empresário / Sócio</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    Cartão CNPJ ativo no ramo do curso
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    Contrato Social ou requerimento de empresário
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    Documentos fiscais e contratuais empresariais
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    Comprovantes de atuação direta nas operações
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="bg-muted/40 p-6 rounded-xl border border-border space-y-2 text-sm text-muted-foreground">
            <p>
              💡 <strong>Soma de Períodos:</strong> A experiência profissional pode ser composta por diferentes períodos ou contratos, desde que o somatório total atinja no mínimo 2 anos de atuação comprovada no segmento pretendido.
            </p>
            <p>
              🔍 <strong>Análise de Validade:</strong> Todos os documentos apresentados passam por criteriosa conferência pedagógica e validação documental.
            </p>
          </div>
        </div>
      </section>

      {/* SEÇÃO QUAIS CURSOS POSSO FAZER? (Catálogo com WhatsApp por curso) */}
      <section id="cursos" className="py-20 bg-slate-900 text-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-3 border-blue-400/40 text-blue-400">
              Catálogo Oficial
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-4">
              Cursos Técnicos por Competência Disponíveis
            </h2>
            <p className="text-slate-300 max-w-2xl mx-auto text-base sm:text-lg">
              Explore os cursos autorizados e encontre a opção compatível com a sua atuação profissional.
            </p>
          </div>

          {/* Controls: Search & Category filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400" />
              <Input
                placeholder="Buscar por nome do curso (ex: Administração, Enfermagem, Eletrotécnica)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 py-6 bg-slate-800 border-slate-700 text-white placeholder:text-slate-400 rounded-xl"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Todos">Todas as Categorias</option>
              {availableCategories.map((catName) => (
                <option key={catName} value={catName}>
                  {catName}
                </option>
              ))}
            </select>
          </div>

          {/* Courses Grid */}
          <div className="space-y-8">
            {filteredCoursesData.length === 0 ? (
              <div className="text-center py-12 bg-slate-800/50 rounded-2xl border border-slate-700">
                <HelpCircle className="h-12 w-12 text-slate-500 mx-auto mb-3" />
                <h3 className="text-xl font-bold text-white mb-1">
                  Nenhum curso encontrado para essa busca.
                </h3>
                <p className="text-slate-400 text-sm">
                  Tente buscar por outro termo ou converse diretamente com nossa equipe.
                </p>
              </div>
            ) : (
              filteredCoursesData.map((cat) => (
                <div key={cat.category} className="space-y-4">
                  <h3 className="text-xl sm:text-2xl font-bold text-blue-300 flex items-center gap-2 border-b border-slate-800 pb-2">
                    <GraduationCap className="h-6 w-6 text-blue-400" />
                    {cat.category}
                  </h3>

                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {cat.courses.map((course) => {
                      return (
                        <div
                          key={course.id || course.name}
                          className="bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 hover:border-blue-500/50 rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 shadow-xl group hover:shadow-2xl hover:shadow-blue-950/30 relative overflow-hidden"
                        >
                          <div>
                            {/* Header: Tag e Badge de Desconto */}
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">
                                Formação Técnica
                              </span>
                              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                <Sparkles className="h-3 w-3 text-emerald-400" /> 60% OFF
                              </span>
                            </div>

                            {/* Título do Curso */}
                            <h4 className="text-lg font-black text-white mb-4 group-hover:text-blue-300 transition-colors leading-snug">
                              {course.name}
                            </h4>

                            {/* Bloco de Valores Promocionais */}
                            <div className="bg-slate-900/90 border border-slate-700/70 rounded-xl p-3.5 mb-5 space-y-2.5">
                              {/* À vista */}
                              <div className="flex items-center justify-between gap-1 pb-2.5 border-b border-slate-800">
                                <span className="text-xs font-bold text-slate-300">À vista:</span>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-bold text-emerald-400">Por</span>
                                  <span className="text-xl font-black text-emerald-400">{course.cashPrice || "R$ 840,00"}</span>
                                </div>
                              </div>

                              {/* Cartão de Crédito com Desconto Extra */}
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-300 flex items-center gap-1.5 font-medium">
                                  <CreditCard className="h-3.5 w-3.5 text-blue-400 flex-shrink-0" />
                                  Cartão de Crédito:
                                </span>
                                <span className="font-bold text-white bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                                  Até {course.creditCardInstallment || "12X de R$ 76,16"}
                                </span>
                              </div>

                              {/* Boleto Bancário */}
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-300 flex items-center gap-1.5 font-medium">
                                  <FileText className="h-3.5 w-3.5 text-purple-400 flex-shrink-0" />
                                  Boleto Bancário:
                                </span>
                                <span className="font-bold text-slate-200">
                                  Até {course.boletoInstallment || "12X de R$ 108,25"}
                                </span>
                              </div>

                              {/* Taxa de Matrícula */}
                              <div className="text-[11px] text-slate-400 text-right pt-0.5 font-medium">
                                + Taxa de Matrícula de <span className="text-slate-300 font-bold">{course.matriculaTax || "R$ 99,00"}</span>
                              </div>
                            </div>
                          </div>

                          <Button
                            size="sm"
                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl py-5 flex items-center justify-center shadow-lg shadow-emerald-950/30 transition-all duration-200"
                            onClick={() => {
                              const msg = `Olá! Tenho experiência profissional e gostaria de verificar minha compatibilidade para o curso ${course.name} por competência.`;
                              openWhatsAppWithMessage(
                                msg,
                                `curso_card_${course.name}`
                              );
                            }}
                          >
                            VERIFICAR ESTE CURSO
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* SEÇÃO NÃO SABE QUAL CURSO ESCOLHER? (Formulário de Análise) */}
      <section id="formulario-analise" className="py-20 bg-background border-b border-border">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-8 sm:p-12 shadow-2xl border border-slate-700 relative overflow-hidden">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <Badge variant="outline" className="mb-3 border-blue-400/40 text-blue-400">
                Análise de Compatibilidade
              </Badge>
              <h3 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">
                Não sabe qual curso corresponde à sua experiência?
              </h3>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-6">
              {/* Honeypot Anti-Bot Field */}
              <input
                type="text"
                name="website_hp"
                maxLength={100}
                value={formData.website_hp}
                onChange={(e) => setFormData({ ...formData, website_hp: e.target.value })}
                className="hidden"
                tabIndex={-1}
                autoComplete="off"
              />
              {/* Grid 1: Nome e Email */}
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-2">
                    Seu Nome Completo *
                  </label>
                  <Input
                    required
                    maxLength={100}
                    placeholder="Ex: João da Silva"
                    value={formData.nome}
                    onChange={(e) =>
                      setFormData({ ...formData, nome: e.target.value })
                    }
                    className="bg-slate-800/90 border-slate-700 text-white placeholder:text-slate-500 py-5 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-2">
                    E-mail Principal *
                  </label>
                  <Input
                    required
                    type="email"
                    maxLength={100}
                    placeholder="Ex: joao@email.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="bg-slate-800/90 border-slate-700 text-white placeholder:text-slate-500 py-5 rounded-xl"
                  />
                </div>
              </div>

              {/* Grid 2: WhatsApp e Cargo */}
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-2">
                    WhatsApp com DDD *
                  </label>
                  <Input
                    required
                    type="tel"
                    maxLength={15}
                    placeholder="(92) 99999-9999"
                    value={formData.whatsapp}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        whatsapp: formatPhone(e.target.value),
                      })
                    }
                    className="bg-slate-800/90 border-slate-700 text-white placeholder:text-slate-500 py-5 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-2">
                    Cargo ou Função Atual *
                  </label>
                  <Input
                    required
                    maxLength={100}
                    placeholder="Ex: Eletricista, Auxiliar de Enfermagem..."
                    value={formData.cargoAtual}
                    onChange={(e) =>
                      setFormData({ ...formData, cargoAtual: e.target.value })
                    }
                    className="bg-slate-800/90 border-slate-700 text-white placeholder:text-slate-500 py-5 rounded-xl"
                  />
                </div>
              </div>

              {/* Grid 3: Tempo de Experiência e Curso de Interesse */}
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-2">
                    Tempo de Experiência
                  </label>
                  <Input
                    maxLength={50}
                    placeholder="Ex: 3 anos e 6 meses"
                    value={formData.tempoExperiencia}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tempoExperiencia: e.target.value,
                      })
                    }
                    className="bg-slate-800/90 border-slate-700 text-white placeholder:text-slate-500 py-5 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-2">
                    Curso de Interesse (opcional)
                  </label>
                  <Input
                    maxLength={100}
                    placeholder="Ex: Técnico em Eletrotécnica"
                    value={formData.cursoInteresse}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        cursoInteresse: e.target.value,
                      })
                    }
                    className="bg-slate-800/90 border-slate-700 text-white placeholder:text-slate-500 py-5 rounded-xl"
                  />
                </div>
              </div>

              {/* Termos LGPD */}
              <div className="flex items-start space-x-3 pt-2">
                <Checkbox
                  id="aceitaTermos"
                  checked={formData.aceitaTermos}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, aceitaTermos: !!checked })
                  }
                  className="mt-1 border-slate-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                />
                <label
                  htmlFor="aceitaTermos"
                  className="text-xs sm:text-sm text-slate-300 leading-snug cursor-pointer select-none"
                >
                  Concordo com o envio dos meus dados para contato e análise de compatibilidade do meu perfil profissional, de acordo com a <span className="text-slate-100 font-semibold underline">Lei Geral de Proteção de Dados (LGPD)</span>. *
                </label>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                size="lg"
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-6 text-lg rounded-xl shadow-xl shadow-blue-950/50 transition-all duration-300"
              >
                <Send className="h-5 w-5 mr-2" />
                {isSubmitting ? "ENVIANDO..." : "SOLICITAR ANÁLISE"}
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* SEÇÃO COMO SÃO AS PROVAS? */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-3 border-blue-400/40 text-blue-400">
              Avaliação de Conhecimento
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-4">
              Você precisa demonstrar seus conhecimentos.
            </h2>
            <p className="text-slate-300 max-w-2xl mx-auto text-base sm:text-lg">
              As avaliações fazem parte do processo de certificação por competência. O candidato precisa alcançar o aproveitamento mínimo de 70%.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="bg-slate-800 border-slate-700 text-white shadow-lg">
              <CardHeader className="pb-2">
                <div className="p-3 bg-blue-500/20 text-blue-400 rounded-xl w-fit mb-2">
                  <FileText className="h-6 w-6" />
                </div>
                <CardTitle className="text-lg">Provas Online</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-300">
                As avaliações são realizadas em ambiente virtual com questões objetivas preparadas para avaliar a experiência teórica e prática do módulo.
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700 text-white shadow-lg">
              <CardHeader className="pb-2">
                <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl w-fit mb-2">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <CardTitle className="text-lg">Nota Mínima (70%)</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-300">
                É exigido aproveitamento mínimo de 70% (nota 7,0) em cada módulo de avaliação para validar a proficiência técnica.
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700 text-white shadow-lg">
              <CardHeader className="pb-2">
                <div className="p-3 bg-purple-500/20 text-purple-400 rounded-xl w-fit mb-2">
                  <Clock className="h-6 w-6" />
                </div>
                <CardTitle className="text-lg">Oportunidade de Refação</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-300">
                Caso não atinja os 70% na primeira tentativa, as avaliações podem ser refeitas conforme o regulamento informado pela instituição.
              </CardContent>
            </Card>
          </div>

          {/* Destaque Visual Obrigatório */}
          <div className="bg-gradient-to-r from-blue-900/60 via-indigo-900/60 to-blue-900/60 border-2 border-blue-400/50 p-8 rounded-2xl text-center shadow-2xl backdrop-blur-md">
            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-wide uppercase">
              "Não é apenas enviar documentos. Existe uma etapa de avaliação."
            </h3>
            <p className="text-blue-200 mt-2 text-sm sm:text-base">
              Garantia de seriedade, rigor pedagógico e conformidade com as diretrizes da Educação Profissional.
            </p>
          </div>
        </div>
      </section>

      {/* SEÇÃO QUEM É A INSTITUIÇÃO RESPONSÁVEL? & SISTEC */}
      <section className="py-20 bg-background border-b border-border">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <Badge variant="outline" className="mb-3 text-primary border-primary/30">
                Instituição Emissora
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-4">
                Quem está por trás da certificação?
              </h2>
              <p className="text-muted-foreground text-base leading-relaxed mb-6">
                O processo de certificação por competência é realizado no âmbito da instituição de ensino responsável pela emissão do diploma, devidamente autorizada e cadastrada nos órgãos competentes:
              </p>

              <div className="bg-card p-6 rounded-2xl border border-border shadow-md space-y-4">
                <div className="flex items-center gap-4">
                  <div className="bg-slate-100 dark:bg-slate-900 p-2 rounded-xl border border-border">
                    <img
                      src="/logo-colegio-tec-universal.png"
                      alt="Colégio Técnico Universal"
                      className="h-12 w-auto object-contain"
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl text-foreground">
                      Colégio Técnico Universal
                    </h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      📍 Redenção – Pará
                    </p>
                  </div>
                </div>

                <div className="border-t border-border pt-4 text-sm space-y-2">
                  <p className="font-semibold text-foreground flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-emerald-500" />
                    Código SISTEC: <span className="text-primary font-bold">61295</span>
                  </p>
                  <a
                    href="https://sistec.mec.gov.br/consultapublicaunidadeensino#"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Consultar Unidade no SISTEC / MEC
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            </div>

            {/* SISTEC E VALIDAÇÃO */}
            <div className="bg-slate-900 text-white p-8 rounded-3xl border border-slate-800 shadow-xl space-y-6">
              <Badge variant="outline" className="border-blue-400/40 text-blue-400">
                Autenticidade Garantida
              </Badge>
              <h3 className="text-2xl font-bold text-white">
                Como verificar a autenticidade do diploma?
              </h3>

              <div className="space-y-4 text-slate-300 text-sm leading-relaxed">
                <p>
                  Após a conclusão de todas as etapas e aprovação final, o diploma é devidamente registrado no <strong className="text-white">SISTEC — Sistema Nacional de Informações da Educação Profissional e Tecnológica</strong>.
                </p>

                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-1 flex-shrink-0" />
                    <span>Consulta pública do registro via CPF do aluno após emissão.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-1 flex-shrink-0" />
                    <span>Diploma físico/digital com QR Code para validação imediata.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-1 flex-shrink-0" />
                    <span>Histórico escolar completo detalhando a carga horária e módulos.</span>
                  </li>
                </ul>

                <p className="text-xs text-slate-400 bg-slate-800/80 p-3 rounded-lg border border-slate-700">
                  ℹ️ O <strong>SISTEC</strong> é o sistema oficial do Ministério da Educação (MEC) utilizado para informações, cadastros e registros relacionados à educação profissional e tecnológica em todo o país.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-3 border-blue-400/40 text-blue-400">
              Tire Suas Dúvidas
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-4">
              Perguntas Frequentes (FAQ)
            </h2>
            <p className="text-slate-300 text-base sm:text-lg">
              Respostas diretas e transparentes sobre o processo de certificação.
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full space-y-3">
            {FAQ_ITEMS.map((item, idx) => (
              <AccordionItem
                key={idx}
                value={`faq-${idx}`}
                className="bg-slate-800/90 border border-slate-700/80 rounded-xl px-6 py-1 text-white shadow-md"
              >
                <AccordionTrigger className="text-left text-base sm:text-lg font-bold text-white hover:text-blue-300 hover:no-underline py-4">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-slate-300 text-sm sm:text-base leading-relaxed pb-4">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* FINAL CTA SECTION */}
      <section className="py-20 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white border-t border-slate-800 relative">
        <div className="container mx-auto px-4 max-w-4xl text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 px-4 py-1.5 rounded-full text-blue-400 text-sm font-semibold mb-6">
            <Sparkles className="h-4 w-4" />
            Sua Experiência Merece Reconhecimento
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-6">
            Você já construiu sua experiência.
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-emerald-400 bg-clip-text text-transparent">
              Agora descubra se ela pode ser formalizada.
            </span>
          </h2>

          <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
            Informe sua função, área de atuação e tempo de experiência. Nossa equipe poderá orientar você sobre o curso mais compatível e os documentos necessários para iniciar o processo.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              className="w-full sm:w-auto text-base sm:text-lg font-bold px-8 py-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-xl shadow-blue-900/40"
              onClick={() => scrollToSection("formulario-analise")}
            >
              SOLICITAR ANÁLISE
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto text-base sm:text-lg font-semibold px-8 py-6 rounded-xl border-emerald-500/50 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 hover:text-white"
              onClick={() =>
                openWhatsAppWithMessage(
                  "Olá! Gostaria de falar com um consultor sobre a Certificação Técnica por Competência.",
                  "cta_final_consultor"
                )
              }
            >
              <MessageCircle className="h-5 w-5 mr-2" />
              FALAR COM UM CONSULTOR
            </Button>
          </div>
        </div>
      </section>

      <Footer showPromoBanner={false} />
    </div>
  );
}
