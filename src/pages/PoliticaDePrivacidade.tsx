import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Helmet } from "react-helmet";

const PoliticaDePrivacidade = () => {
  return (
    <>
      <Helmet>
        <title>Politica de Privacidade - UniCV Polo Manaus Flores</title>
        <meta
          name="description"
          content="Politica de Privacidade do site UniCV Polo Manaus Flores."
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="space-y-2">
              <h1 className="text-3xl md:text-4xl font-bold">Politica de Privacidade</h1>
              <p className="text-sm text-muted-foreground">
                Atualizado em 11/02/2026
              </p>
            </div>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold">1. Controlador dos dados</h2>
              <p>
                O controlador dos dados pessoais tratados neste site e o UniCV
                Polo Manaus Flores.
              </p>
              <p>
                Endereco: Av. Prof. Nilton Lins, 1984, Flores, Manaus - AM,
                CEP 69058-300.
              </p>
              <p>E-mail: polo.manaus.flores@unicv.edu.br.</p>
              <p>Telefone/WhatsApp: (92) 2020-1260.</p>
              <p>Encarregado (LGPD): atendimento via e-mail acima.</p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold">2. Dados coletados</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Dados de contato: nome, e-mail, telefone e cidade.</li>
                <li>Informacoes sobre interesse em cursos e preferencias.</li>
                <li>Dados de navegacao, como IP, dispositivo e paginas acessadas.</li>
                <li>Cookies e tecnologias similares para analise e marketing.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold">3. Finalidades do tratamento</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Atender solicitacoes e fornecer informacoes sobre cursos.</li>
                <li>Enviar comunicacoes sobre novidades e campanhas.</li>
                <li>Melhorar o funcionamento, conteudo e seguranca do site.</li>
                <li>Mensurar desempenho e efetividade de campanhas.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold">4. Bases legais</h2>
              <p>
                Tratamos dados com base no consentimento, no legitimo interesse
                e na execucao de procedimentos preliminares relacionados a uma
                possivel contratacao, conforme a LGPD.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold">5. Compartilhamento de dados</h2>
              <p>
                Podemos compartilhar dados com fornecedores de tecnologia,
                hospedagem, analytics e marketing, sempre com salvaguardas
                adequadas. Dados poderao ser compartilhados por obrigacao legal
                ou mediante ordem de autoridade competente.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold">6. Cookies e tecnologias similares</h2>
              <p>
                Utilizamos cookies para lembrar preferencias, medir desempenho e
                exibir anuncios relevantes. Voce pode gerenciar cookies no seu
                navegador, ciente de que isso pode afetar funcionalidades.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold">7. Retencao de dados</h2>
              <p>
                Os dados sao mantidos pelo tempo necessario para cumprir as
                finalidades informadas ou conforme obrigacoes legais.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold">8. Direitos do titular</h2>
              <p>
                Voce pode solicitar confirmacao do tratamento, acesso, correcao,
                exclusao, portabilidade e outras medidas previstas na LGPD.
                Para exercer seus direitos, entre em contato pelo e-mail
                informado.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold">9. Seguranca</h2>
              <p>
                Adotamos medidas tecnicas e organizacionais razoaveis para
                proteger seus dados. Nenhum metodo e 100% seguro, mas buscamos
                reduzir riscos.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold">10. Transferencias internacionais</h2>
              <p>
                Alguns fornecedores podem armazenar dados fora do Brasil. Nesses
                casos, garantimos salvaguardas adequadas e conformidade com a
                LGPD.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold">11. Privacidade de criancas</h2>
              <p>
                Este site nao e destinado a menores de 13 anos. Caso identifiquemos
                dados de criancas, adotaremos medidas para exclusao.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold">12. Alteracoes desta politica</h2>
              <p>
                Podemos atualizar esta Politica de Privacidade periodicamente.
                A data de atualizacao sera indicada no topo da pagina.
              </p>
            </section>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default PoliticaDePrivacidade;
