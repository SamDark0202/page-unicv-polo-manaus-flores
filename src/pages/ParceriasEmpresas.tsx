import PartnershipDetailPage from "@/components/PartnershipDetailPage";
import { BriefcaseBusiness, HandCoins, Presentation, UsersRound } from "lucide-react";

export default function ParceriasEmpresas() {
  return (
    <PartnershipDetailPage
          metaTitle="Parcerias com Empresas | Unicive Polo Flores"
          metaDescription="Proposta de parceria educacional para empresas com benefício aos colaboradores e comissão de R$ 50,00 por matrícula confirmada."
          badge="Parcerias com empresas"
          title="Educação como benefício corporativo, com operação simples e retorno por matrícula"
          subtitle="A parceria empresarial da Unicive Polo Flores foi pensada para organizações que desejam ampliar o acesso à graduação, pós-graduação e segunda graduação para seus colaboradores, sem assumir a operação comercial do processo."
          audienceTitle="Empresas que valorizam desenvolvimento e retenção"
          audienceText="Esse modelo é adequado para empresas que desejam entregar um diferencial real aos colaboradores, fortalecer ações internas de valorização profissional e oferecer uma ponte concreta para formação superior, atualização de carreira e continuidade acadêmica."
          benefitCards={[
              {
                  title: "Benefício de valor percebido",
                  description: "A parceria posiciona a empresa como facilitadora de crescimento profissional, com acesso a formações alinhadas à evolução de carreira do colaborador.",
                  icon: BriefcaseBusiness,
              },
              {
                  title: "Retorno financeiro claro",
                  description: "Cada matrícula confirmada vinda da indicação da empresa gera comissão de R$ 50,00, criando um modelo simples de incentivo e acompanhamento.",
                  icon: HandCoins,
              },
              {
                  title: "Apoio comercial estruturado",
                  description: "O polo pode apoiar apresentação da proposta, orientar comunicação interna e oferecer materiais de divulgação adaptados ao contexto da empresa.",
                  icon: Presentation,
              },
          ]}
          steps={[
              {
                  title: "Alinhamento da proposta",
                  description: "Definimos o formato da parceria, os públicos internos que serão atendidos e a abordagem de comunicação mais adequada para a empresa.",
              },
              {
                  title: "Divulgação interna",
                  description: "A empresa ativa seus canais com o apoio do polo, apresentando a oportunidade para colaboradores interessados em iniciar ou avançar sua formação.",
              },
              {
                  title: "Atendimento e matrícula",
                  description: "A equipe do polo conduz o atendimento individual, explica condições, orienta a escolha do curso e acompanha o fechamento da matrícula.",
              },
              {
                  title: "Confirmação e repasse",
                  description: "Com a matrícula confirmada, a indicação entra no fluxo de acompanhamento da parceria para registro do resultado e comissão correspondente.",
              },
          ]}
          partnerBenefitsTitle="O que a empresa ganha com a parceria"
          partnerBenefits={[
              "Comissão de R$ 50,00 por matrícula confirmada proveniente da parceria.",
              "Oferta de benefício educacional sem necessidade de criar estrutura própria de atendimento.",
              "Aumento do valor percebido da marca empregadora em ações de RH, retenção e clima interno.",
              "Possibilidade de divulgar oportunidades acadêmicas para colaboradores em diferentes momentos de carreira.",
          ]}
          supportTitle="O que a Unicive Polo Flores entrega"
          supportItems={[
              "Atendimento dedicado aos colaboradores interessados, do primeiro contato à matrícula.",
              "Suporte na apresentação da proposta e no desenho da comunicação interna.",
              "Materiais de divulgação para circulação em canais corporativos.",
              "Acompanhamento das indicações geradas e organização do fluxo de formalização da parceria.",
          ]}
          faqs={[
              {
                  question: "A empresa precisa administrar inscrições ou documentos?",
                  answer: "Não. A condução do atendimento e da matrícula fica com o polo. A empresa atua como parceira institucional na divulgação e no direcionamento dos interessados.",
              },
              {
                  question: "A comissão vale para qualquer interessado vindo da empresa?",
                  answer: "A comissão de R$ 50,00 se aplica às matrículas confirmadas que forem identificadas dentro do fluxo da parceria empresarial.",
              },
              {
                  question: "A parceria pode ser usada em campanhas internas ou ações de RH?",
                  answer: "Sim. O modelo foi desenhado justamente para permitir comunicação institucional organizada, com apoio do polo na apresentação e nas orientações iniciais.",
              },
              {
                  question: "Quais tipos de curso podem ser apresentados ao colaborador?",
                  answer: "A parceria pode contemplar graduações, segunda graduação e pós-graduação, conforme o interesse do público atendido e a estratégia definida com a empresa.",
              },
          ]}
          ctaTitle="Se a empresa quiser formalizar a parceria, o processo já pode ser iniciado agora."
          ctaDescription="Você pode falar com o polo para tirar dúvidas ou seguir diretamente para a formalização."
          ctaButtons={[
              {
                  label: "Tirar dúvidas no WhatsApp",
                  href: "https://wa.me/559220201260?text=Ol%C3%A1%2C%20quero%20mais%20informa%C3%A7%C3%B5es%20sobre%20a%20parceria%20educacional%20para%20empresas.",
                  variant: "whatsapp",
                  external: true,
                  trackSource: "partnership_empresa_whatsapp",
              },
              {
                  label: "Fazer parceria",
                  to: "/parcerias/empresas/formulario",
                  variant: "secondary",
              },
          ]} highlightNote={""} stats={[]} modelTitle={""} modelText={""}    />
  );
}