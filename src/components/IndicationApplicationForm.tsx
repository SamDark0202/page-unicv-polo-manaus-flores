import { zodResolver } from "@hookform/resolvers/zod";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { trackFormSubmit, trackWhatsAppClick } from "@/lib/tracker";
import {
  formatCep,
  formatDocumentValue,
  formatPhone,
  indicationFieldText,
  indicationFormSchema,
  normalizeState,
  type IndicationDocumentType,
  type IndicationFormValues,
} from "@/lib/indicationForm";
import { ArrowLeft, Loader2, MailCheck, MessageCircleMore, ShieldCheck } from "lucide-react";
import { Helmet } from "react-helmet";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";

const WHATSAPP_URL = "https://wa.me/559220201260";

export default function IndicationApplicationForm() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const form = useForm<IndicationFormValues>({
    resolver: zodResolver(indicationFormSchema),
    defaultValues: {
      documentType: "CPF",
      registeredName: "",
      documentNumber: "",
      street: "",
      number: "",
      neighborhood: "",
      complement: "",
      city: "",
      state: "",
      zipCode: "",
      email: "",
      phone: "",
      pixKey: "",
      website: "",
    },
  });

  const documentType = form.watch("documentType");
  const text = indicationFieldText[documentType];

  async function onSubmit(values: IndicationFormValues) {
    try {
      const response = await fetch("/api/indication-webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(values),
      });

      const result = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        throw new Error(result.error || "Não foi possível enviar os dados agora.");
      }

      trackFormSubmit("indication_partnership_form", {
        document_type: values.documentType,
      });

      navigate("/indique-e-ganhe/sucesso");
    } catch (error) {
      toast({
        title: "Erro no envio",
        description:
          error instanceof Error ? error.message : "Não foi possível enviar os dados do formulário.",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Cadastro do Programa Indique e Ganhe | Unicive Polo Flores</title>
        <meta
          name="description"
          content="Formulário seguro do Programa Indique e Ganhe da Unicive para cadastro de indicadores com CPF ou CNPJ."
        />
      </Helmet>

      <Header />

      <section className="bg-gradient-subtle py-16 lg:py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <Link to="/indique-e-ganhe" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
            <ArrowLeft className="h-4 w-4" />
            Voltar para o Programa Indique e Ganhe
          </Link>

          <div className="mt-6 grid gap-8 lg:grid-cols-[0.92fr_1.08fr]">
            <div className="space-y-6">
              <div>
                <Badge className="mb-4">Cadastro do parceiro</Badge>
                <h1 className="text-4xl font-bold leading-tight">Formalize seu acesso ao Programa Indique e Ganhe</h1>
                <p className="mt-4 text-lg leading-8 text-muted-foreground">
                  Preencha os dados para receber o termo de parceria por e-mail e avançar para a próxima etapa do programa.
                </p>
              </div>

              <Card className="rounded-3xl shadow-soft">
                <CardContent className="p-8">
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">Antes de enviar</p>
                  <div className="mt-5 space-y-4">
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="mt-0.5 h-5 w-5 text-primary" />
                      <p className="text-sm leading-7 text-muted-foreground">
                        Escolha se o cadastro será com CPF ou CNPJ e informe exatamente os dados do titular da parceria.
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <MailCheck className="mt-0.5 h-5 w-5 text-primary" />
                      <p className="text-sm leading-7 text-muted-foreground">
                        Após o envio, o termo será encaminhado para assinatura no e-mail informado no formulário.
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="mt-0.5 h-5 w-5 text-primary" />
                      <p className="text-sm leading-7 text-muted-foreground">
                        Depois da assinatura confirmada, a equipe fará o contato, liberará o sistema de indicação e incluirá você no grupo de suporte.
                      </p>
                    </div>
                  </div>

                  <Button asChild variant="whatsapp" className="mt-6 w-full">
                    <a
                      href={`${WHATSAPP_URL}?text=${encodeURIComponent("Olá, quero tirar dúvidas sobre o cadastro do Programa Indique e Ganhe.")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() =>
                        trackWhatsAppClick("indication_form_whatsapp", {
                          destination: WHATSAPP_URL,
                        })
                      }
                    >
                      <MessageCircleMore className="h-4 w-4" />
                      Falar com o polo no WhatsApp
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Card className="rounded-3xl shadow-soft">
              <CardContent className="p-8">
                <div className="mb-6">
                  <h2 className="text-2xl font-semibold">Dados para ativação da parceria</h2>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">
                    Preencha todos os campos obrigatórios. O formulário valida os dados para evitar erro no termo e no repasse.
                  </p>
                </div>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" noValidate>
                    <input type="text" autoComplete="off" tabIndex={-1} className="hidden" {...form.register("website")} />

                    <FormField
                      control={form.control}
                      name="documentType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de cadastro</FormLabel>
                          <FormControl>
                            <RadioGroup
                              value={field.value}
                              onValueChange={(value) => {
                                field.onChange(value as IndicationDocumentType);
                                form.setValue("documentNumber", "");
                              }}
                              className="grid gap-3 sm:grid-cols-2"
                            >
                              {(["CPF", "CNPJ"] as const).map((option) => (
                                <label
                                  key={option}
                                  className="flex cursor-pointer items-center gap-3 rounded-2xl border border-border bg-background px-4 py-4 transition-colors hover:border-primary/40"
                                >
                                  <RadioGroupItem value={option} />
                                  <div>
                                    <p className="font-medium text-foreground">{option}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {option === "CPF" ? "Pessoa física" : "Pessoa jurídica"}
                                    </p>
                                  </div>
                                </label>
                              ))}
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid gap-5 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="registeredName"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>{text.registeredNameLabel}</FormLabel>
                            <FormControl>
                              <Input placeholder={text.registeredNamePlaceholder} autoComplete="name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="documentNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{text.documentLabel}</FormLabel>
                            <FormControl>
                              <Input
                                placeholder={text.documentPlaceholder}
                                inputMode="numeric"
                                autoComplete="off"
                                {...field}
                                onChange={(event) => field.onChange(formatDocumentValue(documentType, event.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Telefone</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="(00) 00000-0000"
                                inputMode="tel"
                                autoComplete="tel"
                                {...field}
                                onChange={(event) => field.onChange(formatPhone(event.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>E-mail</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="voce@exemplo.com.br" autoComplete="email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="street"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Rua</FormLabel>
                            <FormControl>
                              <Input placeholder="Nome da rua" autoComplete="address-line1" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="number"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Número</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex.: 123" autoComplete="address-line2" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="neighborhood"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bairro</FormLabel>
                            <FormControl>
                              <Input placeholder="Bairro" autoComplete="address-level3" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="complement"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Complemento</FormLabel>
                            <FormControl>
                              <Input placeholder="Apartamento, bloco, sala ou referência" autoComplete="address-line2" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cidade</FormLabel>
                            <FormControl>
                              <Input placeholder="Cidade" autoComplete="address-level2" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Estado</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="UF"
                                autoComplete="address-level1"
                                maxLength={2}
                                {...field}
                                onChange={(event) => field.onChange(normalizeState(event.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="zipCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CEP</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="00000-000"
                                inputMode="numeric"
                                autoComplete="postal-code"
                                {...field}
                                onChange={(event) => field.onChange(formatCep(event.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="pixKey"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Chave Pix</FormLabel>
                            <FormControl>
                              <Input placeholder="CPF, CNPJ, e-mail, telefone ou chave aleatória" autoComplete="off" {...field} />
                            </FormControl>
                            <FormDescription>
                              A chave Pix informada deve ser da mesma titularidade da pessoa ou empresa cadastrada.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button type="submit" size="lg" className="w-full" disabled={form.formState.isSubmitting}>
                      {form.formState.isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Enviando cadastro...
                        </>
                      ) : (
                        "Enviar cadastro para análise"
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer showPromoBanner={false} />
    </div>
  );
}