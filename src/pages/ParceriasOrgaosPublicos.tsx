import PartnershipDetailPage from "@/components/PartnershipDetailPage";
import { FileText, Presentation, UsersRound } from "lucide-react";

export default function ParceriasOrgaosPublicos() {
  return (
    <PartnershipDetailPage
          metaTitle="Parcerias com Órgãos Públicos | UNICV Polo Flores"
          metaDescription="Proposta institucional de parceria educacional com órgãos públicos, focada em qualificação e acesso facilitado ao ensino superior para servidores."
          badge="Parcerias com órgãos públicos"
          title="Convênio educacional para ampliar a qualificação de servidores"
          subtitle="Órgãos públicos, a proposta é simples: criar um convênio para facilitar o acesso à formação superior com apoio do polo no atendimento aos interessados."
          audienceTitle="Para órgãos que querem facilitar o acesso à formação"
          audienceText="Essa parceria atende órgãos públicos que desejam ampliar oportunidades de qualificação para servidores e outros públicos definidos pelo próprio órgão."
          modelTitle="Como funciona"
          modelText="O órgão define com o polo o público que será atendido. Depois disso, o convênio é apresentado e o polo recebe os interessados para orientar e acompanhar o processo."
          benefitCards={[
              {
                  title: "Mais acesso à qualificação",
                  description: "O convênio cria um caminho mais simples para servidores e públicos vinculados avançarem na formação.",
                  icon: UsersRound,
              },
              {
                  title: "Convênio claro",
                  description: "A proposta é definida de forma objetiva, com foco no público atendido e no funcionamento da parceria.",
                  icon: FileText,
              },
              {
                  title: "Apoio do polo",
                  description: "O polo apoia a apresentação do convênio e faz o atendimento dos interessados.",
                  icon: Presentation,
              },
          ]}
          steps={[
              {
                  title: "Definição do público",
                  description: "O órgão define com o polo quem será atendido pelo convênio.",
              },
              {
                  title: "Organização da proposta",
                  description: "A parceria é ajustada conforme a realidade e a necessidade do órgão.",
              },
              {
                  title: "Apresentação e ativação",
                  description: "Depois do alinhamento, o convênio é apresentado ao público definido e o polo começa o atendimento.",
              },
              {
                  title: "Acompanhamento",
                  description: "O polo acompanha a parceria e mantém o suporte ao órgão ao longo do processo.",
              },
          ]}
          partnerBenefitsTitle="O que o órgão ganha"
          partnerBenefits={[
              "Mais acesso à qualificação para o público atendido.",
              "Um convênio educacional claro e fácil de apresentar.",
              "Apoio do polo para orientar os interessados.",
              "Um modelo sem comissão, focado no benefício prático da parceria.",
          ]}
          supportTitle="O que o polo faz"
          supportItems={[
              "Ajuda o órgão a definir o formato do convênio.",
              "Apoia a apresentação da parceria ao público escolhido.",
              "Atende os interessados e explica as opções de formação.",
              "Mantém o acompanhamento da parceria ao longo do tempo.",
          ]}
          faqs={[
              {
                  question: "O convênio pode atender públicos específicos do órgão?",
                  answer: "Sim. O convênio pode ser ajustado conforme a necessidade do órgão e o público definido para atendimento.",
              },
              {
                  question: "Quem faz o atendimento dos interessados?",
                  answer: "O polo faz o atendimento, orienta os interessados e acompanha o processo.",
              },
              {
                  question: "A proposta pode ser ajustada ao perfil do órgão?",
                  answer: "Sim. A parceria pode ser organizada de acordo com a realidade do órgão e do público que será atendido.",
              },
          ]}
          ctaTitle="Quer conversar sobre o convênio?"
          ctaDescription="Fale com o polo para entender como a parceria pode ser aplicada ao perfil do seu órgão."
          ctaButtons={[
              {
                  label: "Falar com o polo no WhatsApp",
                  href: "https://wa.me/559220201260?text=Ol%C3%A1%2C%20quero%20conversar%20sobre%20uma%20parceria%20educacional%20para%20%C3%B3rg%C3%A3o%20p%C3%BAblico.",
                  variant: "whatsapp",
                  external: true,
                  trackSource: "partnership_orgao_whatsapp",
              },
              {
                  label: "Voltar para visão geral",
                  to: "/parcerias",
                  variant: "outline",
              },
          ]} highlightNote={""} stats={[]}    />
  );
}