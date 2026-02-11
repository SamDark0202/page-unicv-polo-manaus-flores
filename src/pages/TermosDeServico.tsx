import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Helmet } from "react-helmet";

const TermosDeServico = () => {
  return (
    <>
      <Helmet>
        <title>Termos de Servico - UniCV Polo Manaus Flores</title>
        <meta
          name="description"
          content="Termos de Servico do site UniCV Polo Manaus Flores."
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="space-y-2">
              <h1 className="text-3xl md:text-4xl font-bold">Termos de Servico</h1>
              <p className="text-sm text-muted-foreground">
                Atualizado em 11/02/2026
              </p>
            </div>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold">1. Identificacao do responsavel</h2>
              <p>
                Este site e operado por UniCV Polo Manaus Flores (doravante,
                "UniCV Polo Manaus Flores").
              </p>
              <p>
                Endereco: Av. Prof. Nilton Lins, 1984, Flores, Manaus - AM,
                CEP 69058-300.
              </p>
              <p>E-mail: polo.manaus.flores@unicv.edu.br.</p>
              <p>Telefone/WhatsApp: (92) 2020-1260.</p>
              <p>CNPJ: 46.420.464/0001-58.</p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold">2. Aceite dos termos</h2>
              <p>
                Ao acessar ou usar este site, voce concorda com estes Termos de
                Servico e com a Politica de Privacidade. Se nao concordar, nao
                utilize o site.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold">3. Objetivo do site</h2>
              <p>
                O site disponibiliza informacoes sobre cursos, servicos e
                conteudos educacionais, incluindo paginas institucionais e blog.
                Eventuais contatos realizados por meio de formularios servem
                para atendimento e relacionamento.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold">4. Elegibilidade e cadastro</h2>
              <p>
                Voce declara ter capacidade legal para utilizar o site. Ao
                fornecer dados, voce se compromete a informar dados corretos,
                completos e atualizados.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold">5. Condicoes comerciais</h2>
              <p>
                Precos, bolsas, condicoes promocionais e disponibilidade podem
                variar e estao sujeitos a confirmacao no momento do atendimento
                ou da matricula. O site nao substitui comunicacoes oficiais.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold">6. Contratacao e cancelamento</h2>
              <p>
                Quando houver contratacao de cursos ou servicos, as condicoes
                especificas estarao em instrumentos proprios (contrato, termo de
                adesao ou regulamento). Caso o site direcione para canais
                externos, prevalecem as regras desses canais.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold">7. Propriedade intelectual</h2>
              <p>
                Todo o conteudo deste site, incluindo textos, imagens, marcas,
                logos e layout, e protegido por direitos autorais e outros
                direitos de propriedade intelectual. E proibida a reproducao sem
                autorizacao previa e expressa.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold">8. Uso proibido</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Utilizar o site para fins ilegais ou nao autorizados.</li>
                <li>Violar direitos de terceiros ou normas aplicaveis.</li>
                <li>Interferir na seguranca ou no funcionamento do site.</li>
                <li>Coletar dados de usuarios sem autorizacao.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold">9. Links de terceiros</h2>
              <p>
                O site pode conter links para paginas de terceiros. Nao nos
                responsabilizamos por conteudos, politicas ou praticas de
                terceiros.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold">10. Limitacao de responsabilidade</h2>
              <p>
                Empregamos esforcos razoaveis para manter as informacoes
                atualizadas, mas nao garantimos ausencia de erros ou
                indisponibilidades. Na maxima extensao permitida por lei, nao
                nos responsabilizamos por danos indiretos decorrentes do uso do
                site.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold">11. Privacidade</h2>
              <p>
                O tratamento de dados pessoais e regido pela nossa Politica de
                Privacidade.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold">12. Alteracoes dos termos</h2>
              <p>
                Podemos atualizar estes Termos de Servico periodicamente. A data
                de atualizacao sera indicada no topo da pagina.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold">13. Legislacao e foro</h2>
              <p>
                Estes Termos de Servico sao regidos pelas leis brasileiras. Fica
                eleito o foro de Manaus/AM para dirimir eventuais conflitos.
              </p>
            </section>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default TermosDeServico;
