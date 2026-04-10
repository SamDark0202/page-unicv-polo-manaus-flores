import PartnershipDetailPage from "@/components/PartnershipDetailPage";
import { GraduationCap, HandCoins, Presentation } from "lucide-react";

export default function ParceriasEscolas() {
  return (
    <PartnershipDetailPage
          metaTitle="Parcerias com Escolas | Unicive Polo Flores"
          metaDescription="Proposta de parceria educacional para escolas de ensino médio e técnico com comissão de R$ 50,00 por matrícula confirmada."
          badge="Parcerias com escolas"
          title="Uma ponte entre a formação escolar e o ingresso no ensino superior"
          subtitle="A parceria com escolas foi pensada para instituições de ensino médio e técnico que desejam ampliar as perspectivas acadêmicas dos seus alunos, ex-alunos e comunidade escolar, sem perder simplicidade operacional."
          audienceTitle="Escolas que querem ampliar horizontes para seus alunos"
          audienceText="A proposta é indicada para escolas que desejam fortalecer a continuidade acadêmica dos seus estudantes, criar uma conexão mais prática com o ensino superior e oferecer uma alternativa concreta para quem está concluindo o ensino médio ou a formação técnica."
          modelTitle="A escola apresenta a oportunidade e o polo conduz a jornada"
          modelText="A escola parceira ativa sua comunicação com alunos, ex-alunos ou responsáveis, enquanto o polo recebe os interessados, apresenta opções acadêmicas, tira dúvidas e organiza a matrícula. Assim, a instituição parceira participa do resultado sem carregar a operação."
          benefitCards={[
              {
                  title: "Continuidade acadêmica visível",
                  description: "A escola fortalece sua proposta institucional ao mostrar caminhos concretos para a progressão dos alunos após a conclusão do ciclo atual.",
                  icon: GraduationCap,
              },
              {
                  title: "Comissão sobre resultado real",
                  description: "A escola recebe R$ 50,00 por cada matrícula confirmada vinda da parceria, em um modelo simples e objetivo de acompanhamento.",
                  icon: HandCoins,
              },
              {
                  title: "Ações conjuntas de orientação",
                  description: "O polo pode apoiar apresentações, conversas orientativas e materiais para aproximar a proposta de alunos interessados em avançar para o ensino superior.",
                  icon: Presentation,
              },
          ]}
          steps={[
              {
                  title: "Definição do público-alvo",
                  description: "Alinhamos com a escola se a parceria será focada em turmas concluintes, ex-alunos, comunidade escolar ou múltiplos públicos ao mesmo tempo.",
              },
              {
                  title: "Comunicação da oportunidade",
                  description: "A escola divulga a parceria por canais internos e institucionais com o apoio do polo em materiais e direcionamentos de abordagem.",
              },
              {
                  title: "Atendimento individual",
                  description: "Os interessados são atendidos pelo polo, que apresenta cursos, esclarece dúvidas e orienta todo o processo de inscrição e matrícula.",
              },
              {
                  title: "Registro da indicação",
                  description: "Com a matrícula confirmada, o resultado é vinculado ao fluxo da parceria para acompanhamento e repasse da comissão correspondente.",
              },
          ]}
          partnerBenefitsTitle="O que a escola parceira passa a oferecer"
          partnerBenefits={[
              "Nova possibilidade institucional para alunos que estão saindo do ensino médio ou técnico.",
              "Comissão de R$ 50,00 por matrícula confirmada originada pela parceria.",
              "Maior percepção de valor da escola ao apoiar a continuidade acadêmica dos seus públicos.",
              "Canal direto com o polo para ações de orientação, divulgação e relacionamento institucional.",
          ]}
          supportTitle="Como o polo sustenta a parceria"
          supportItems={[
              "Atendimento consultivo aos alunos, ex-alunos e responsáveis encaminhados pela escola.",
              "Materiais de divulgação e apoio para comunicação da parceria.",
              "Organização do fluxo comercial e acompanhamento das matrículas geradas.",
              "Estrutura para formalização da parceria e avanço para o contrato automatizado nas próximas etapas do projeto.",
          ]}
          faqs={[
              {
                  question: "A parceria serve apenas para alunos do terceiro ano?",
                  answer: "Não. Ela pode contemplar alunos concluintes, ex-alunos, estudantes de cursos técnicos e outros públicos definidos junto à escola parceira.",
              },
              {
                  question: "A escola precisa fazer processo de inscrição?",
                  answer: "Não. A escola faz a ponte institucional e o polo assume o atendimento, a orientação acadêmica e o fechamento da matrícula.",
              },
              {
                  question: "Há comissão para cada matrícula confirmada?",
                  answer: "Sim. Para escolas parceiras, o valor definido para cada matrícula confirmada originada pela parceria é de R$ 50,00.",
              },
              {
                  question: "A parceria pode incluir ações de apresentação para alunos?",
                  answer: "Sim. O polo pode apoiar materiais, comunicação e ações orientativas conforme o alinhamento feito com a escola.",
              },
          ]}
          ctaTitle="Se a escola tiver interesse em avançar, o processo já é simples e pode ser iniciado agora."
          ctaDescription="Você pode falar diretamente com o polo para tirar dúvidas ou seguir para a área de formalização da parceria."
          ctaButtons={[
              {
                  label: "Tirar dúvidas no WhatsApp",
                  href: "https://wa.me/559220201260?text=Ol%C3%A1%2C%20quero%20mais%20informa%C3%A7%C3%B5es%20sobre%20a%20parceria%20educacional%20para%20escolas.",
                  variant: "whatsapp",
                  external: true,
                  trackSource: "partnership_escola_whatsapp",
              },
              {
                  label: "Fazer parceria",
                  to: "/parcerias/escolas/formulario",
                  variant: "secondary",
              },
          ]} highlightNote={""} stats={[]}    />
  );
}