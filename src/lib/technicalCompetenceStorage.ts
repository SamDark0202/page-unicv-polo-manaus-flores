export interface TechnicalCompetenceCourse {
  id: string;
  category: string;
  name: string;
  cashPrice: string;
  creditCardInstallment: string;
  boletoInstallment: string;
  matriculaTax: string;
  active?: boolean;
}

export const DEFAULT_TECHNICAL_CATEGORIES = [
  "Gestão e Negócios",
  "Informação e Comunicação",
  "Controle e Processos Industriais",
  "Infraestrutura",
  "Desenvolvimento Educacional e Social",
  "Ambiente e Saúde",
  "Produção Alimentícia",
  "Recursos Naturais",
  "Produção Industrial",
  "Turismo, Hospitalidade e Lazer",
  "Segurança",
  "Transporte",
];

export const INITIAL_TECHNICAL_COMPETENCE_COURSES: TechnicalCompetenceCourse[] = [
  // Gestão e Negócios
  { id: "tc-1", category: "Gestão e Negócios", name: "Técnico em Administração", cashPrice: "R$ 840,00", creditCardInstallment: "12X de R$ 76,16", boletoInstallment: "12X de R$ 108,25", matriculaTax: "R$ 99,00", active: true },
  { id: "tc-2", category: "Gestão e Negócios", name: "Técnico em Contabilidade", cashPrice: "R$ 840,00", creditCardInstallment: "12X de R$ 76,16", boletoInstallment: "12X de R$ 108,25", matriculaTax: "R$ 99,00", active: true },
  { id: "tc-3", category: "Gestão e Negócios", name: "Técnico em Eventos", cashPrice: "R$ 840,00", creditCardInstallment: "12X de R$ 76,16", boletoInstallment: "12X de R$ 108,25", matriculaTax: "R$ 99,00", active: true },
  { id: "tc-4", category: "Gestão e Negócios", name: "Técnico em Logística", cashPrice: "R$ 840,00", creditCardInstallment: "12X de R$ 76,16", boletoInstallment: "12X de R$ 108,25", matriculaTax: "R$ 99,00", active: true },
  { id: "tc-5", category: "Gestão e Negócios", name: "Técnico em Secretaria Escolar", cashPrice: "R$ 840,00", creditCardInstallment: "12X de R$ 76,16", boletoInstallment: "12X de R$ 108,25", matriculaTax: "R$ 99,00", active: true },
  { id: "tc-6", category: "Gestão e Negócios", name: "Técnico em Transações Imobiliárias", cashPrice: "R$ 840,00", creditCardInstallment: "12X de R$ 76,16", boletoInstallment: "12X de R$ 108,25", matriculaTax: "R$ 99,00", active: true },

  // Informação e Comunicação
  { id: "tc-7", category: "Informação e Comunicação", name: "Técnico em Desenvolvimento de Sistemas", cashPrice: "R$ 840,00", creditCardInstallment: "12X de R$ 76,16", boletoInstallment: "12X de R$ 108,25", matriculaTax: "R$ 99,00", active: true },
  { id: "tc-8", category: "Informação e Comunicação", name: "Técnico em Informática para Internet", cashPrice: "R$ 840,00", creditCardInstallment: "12X de R$ 76,16", boletoInstallment: "12X de R$ 108,25", matriculaTax: "R$ 99,00", active: true },

  // Controle e Processos Industriais
  { id: "tc-9", category: "Controle e Processos Industriais", name: "Técnico em Automação Industrial", cashPrice: "R$ 840,00", creditCardInstallment: "12X de R$ 76,16", boletoInstallment: "12X de R$ 108,25", matriculaTax: "R$ 99,00", active: true },
  { id: "tc-10", category: "Controle e Processos Industriais", name: "Técnico em Eletromecânica", cashPrice: "R$ 840,00", creditCardInstallment: "12X de R$ 76,16", boletoInstallment: "12X de R$ 108,25", matriculaTax: "R$ 99,00", active: true },
  { id: "tc-11", category: "Controle e Processos Industriais", name: "Técnico em Eletrotécnica", cashPrice: "R$ 840,00", creditCardInstallment: "12X de R$ 76,16", boletoInstallment: "12X de R$ 108,25", matriculaTax: "R$ 99,00", active: true },
  { id: "tc-12", category: "Controle e Processos Industriais", name: "Técnico em Equipamentos Biomédicos", cashPrice: "R$ 840,00", creditCardInstallment: "12X de R$ 76,16", boletoInstallment: "12X de R$ 108,25", matriculaTax: "R$ 99,00", active: true },
  { id: "tc-13", category: "Controle e Processos Industriais", name: "Técnico em Manutenção de Máquinas Navais", cashPrice: "R$ 840,00", creditCardInstallment: "12X de R$ 76,16", boletoInstallment: "12X de R$ 108,25", matriculaTax: "R$ 99,00", active: true },
  { id: "tc-14", category: "Controle e Processos Industriais", name: "Técnico em Refrigeração e Climatização", cashPrice: "R$ 840,00", creditCardInstallment: "12X de R$ 76,16", boletoInstallment: "12X de R$ 108,25", matriculaTax: "R$ 99,00", active: true },
  { id: "tc-15", category: "Controle e Processos Industriais", name: "Técnico em Soldagem", cashPrice: "R$ 840,00", creditCardInstallment: "12X de R$ 76,16", boletoInstallment: "12X de R$ 108,25", matriculaTax: "R$ 99,00", active: true },

  // Infraestrutura
  { id: "tc-16", category: "Infraestrutura", name: "Técnico em Edificações", cashPrice: "R$ 840,00", creditCardInstallment: "12X de R$ 76,16", boletoInstallment: "12X de R$ 108,25", matriculaTax: "R$ 99,00", active: true },
  { id: "tc-17", category: "Infraestrutura", name: "Técnico em Design de Interiores", cashPrice: "R$ 840,00", creditCardInstallment: "12X de R$ 76,16", boletoInstallment: "12X de R$ 108,25", matriculaTax: "R$ 99,00", active: true },

  // Desenvolvimento Educacional e Social
  { id: "tc-18", category: "Desenvolvimento Educacional e Social", name: "Técnico em Tradução e Interpretação de Libras", cashPrice: "R$ 840,00", creditCardInstallment: "12X de R$ 76,16", boletoInstallment: "12X de R$ 108,25", matriculaTax: "R$ 99,00", active: true },

  // Ambiente e Saúde
  { id: "tc-19", category: "Ambiente e Saúde", name: "Técnico em Enfermagem", cashPrice: "R$ 1.439,00", creditCardInstallment: "12X de R$ 123,25", boletoInstallment: "12X de R$ 135,83", matriculaTax: "R$ 99,00", active: true },
  { id: "tc-20", category: "Ambiente e Saúde", name: "Técnico em Estética", cashPrice: "R$ 1.439,00", creditCardInstallment: "12X de R$ 123,25", boletoInstallment: "12X de R$ 135,83", matriculaTax: "R$ 99,00", active: true },
  { id: "tc-21", category: "Ambiente e Saúde", name: "Técnico em Farmácia", cashPrice: "R$ 1.439,00", creditCardInstallment: "12X de R$ 123,25", boletoInstallment: "12X de R$ 135,83", matriculaTax: "R$ 99,00", active: true },
  { id: "tc-22", category: "Ambiente e Saúde", name: "Técnico em Gerência em Saúde", cashPrice: "R$ 1.439,00", creditCardInstallment: "12X de R$ 123,25", boletoInstallment: "12X de R$ 135,83", matriculaTax: "R$ 99,00", active: true },
  { id: "tc-23", category: "Ambiente e Saúde", name: "Técnico em Meio Ambiente", cashPrice: "R$ 1.439,00", creditCardInstallment: "12X de R$ 123,25", boletoInstallment: "12X de R$ 135,83", matriculaTax: "R$ 99,00", active: true },
  { id: "tc-24", category: "Ambiente e Saúde", name: "Técnico em Nutrição e Dietética", cashPrice: "R$ 1.439,00", creditCardInstallment: "12X de R$ 123,25", boletoInstallment: "12X de R$ 135,83", matriculaTax: "R$ 99,00", active: true },
  { id: "tc-25", category: "Ambiente e Saúde", name: "Técnico em Óptica", cashPrice: "R$ 1.439,00", creditCardInstallment: "12X de R$ 123,25", boletoInstallment: "12X de R$ 135,83", matriculaTax: "R$ 99,00", active: true },
  { id: "tc-26", category: "Ambiente e Saúde", name: "Técnico em Radiologia", cashPrice: "R$ 1.439,00", creditCardInstallment: "12X de R$ 123,25", boletoInstallment: "12X de R$ 135,83", matriculaTax: "R$ 99,00", active: true },
  { id: "tc-27", category: "Ambiente e Saúde", name: "Técnico em Saúde Bucal", cashPrice: "R$ 1.439,00", creditCardInstallment: "12X de R$ 123,25", boletoInstallment: "12X de R$ 135,83", matriculaTax: "R$ 99,00", active: true },

  // Produção Alimentícia
  { id: "tc-28", category: "Produção Alimentícia", name: "Técnico em Agroindústria", cashPrice: "R$ 840,00", creditCardInstallment: "12X de R$ 76,16", boletoInstallment: "12X de R$ 108,25", matriculaTax: "R$ 99,00", active: true },

  // Recursos Naturais
  { id: "tc-29", category: "Recursos Naturais", name: "Técnico em Agricultura", cashPrice: "R$ 1.439,00", creditCardInstallment: "12X de R$ 123,25", boletoInstallment: "12X de R$ 135,83", matriculaTax: "R$ 99,00", active: true },
  { id: "tc-30", category: "Recursos Naturais", name: "Técnico em Mineração", cashPrice: "R$ 840,00", creditCardInstallment: "12X de R$ 76,16", boletoInstallment: "12X de R$ 108,25", matriculaTax: "R$ 99,00", active: true },

  // Produção Industrial
  { id: "tc-31", category: "Produção Industrial", name: "Técnico em Química", cashPrice: "R$ 840,00", creditCardInstallment: "12X de R$ 76,16", boletoInstallment: "12X de R$ 108,25", matriculaTax: "R$ 99,00", active: true },

  // Turismo, Hospitalidade e Lazer
  { id: "tc-32", category: "Turismo, Hospitalidade e Lazer", name: "Técnico em Guia de Turismo", cashPrice: "R$ 840,00", creditCardInstallment: "12X de R$ 76,16", boletoInstallment: "12X de R$ 108,25", matriculaTax: "R$ 99,00", active: true },

  // Segurança
  { id: "tc-33", category: "Segurança", name: "Técnico em Defesa Civil", cashPrice: "R$ 840,00", creditCardInstallment: "12X de R$ 76,16", boletoInstallment: "12X de R$ 108,25", matriculaTax: "R$ 99,00", active: true },
  { id: "tc-34", category: "Segurança", name: "Técnico em Segurança do Trabalho", cashPrice: "R$ 840,00", creditCardInstallment: "12X de R$ 76,16", boletoInstallment: "12X de R$ 108,25", matriculaTax: "R$ 99,00", active: true },

  // Transporte
  { id: "tc-35", category: "Transporte", name: "Técnico em Trânsito", cashPrice: "R$ 840,00", creditCardInstallment: "12X de R$ 76,16", boletoInstallment: "12X de R$ 108,25", matriculaTax: "R$ 99,00", active: true },
];

const STORAGE_KEY = "unicv_technical_competence_courses";

export function loadTechnicalCompetenceCourses(): TechnicalCompetenceCourse[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_TECHNICAL_COMPETENCE_COURSES;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_TECHNICAL_COMPETENCE_COURSES;
  } catch {
    return INITIAL_TECHNICAL_COMPETENCE_COURSES;
  }
}

export function saveTechnicalCompetenceCourses(courses: TechnicalCompetenceCourse[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(courses));
    window.dispatchEvent(new Event("technicalCompetenceCoursesUpdated"));
  } catch (e) {
    console.error("Erro ao salvar cursos de técnico por competência no localStorage:", e);
  }
}
