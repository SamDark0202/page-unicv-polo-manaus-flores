import { zodResolver } from "@hookform/resolvers/zod";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { trackFormSubmit, trackWhatsAppClick } from "@/lib/tracker";
import {
  formatCep,
  formatCnpj,
  formatCpf,
  formatPhone,
  normalizeState,
  partnershipFieldText,
  partnershipFormSchema,
  type PartnershipFormValues,
  type PartnershipType,
} from "@/lib/partnershipForm";
import { ArrowLeft, Loader2, MessageCircleMore, ShieldCheck } from "lucide-react";
import { Helmet } from "react-helmet";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";

interface PartnershipApplicationFormProps {
  partnershipType: PartnershipType;
  backTo: string;
  backLabel: string;
}

const WHATSAPP_URL = "https://wa.me/559220201260";

export default function PartnershipApplicationForm({
  partnershipType,
  backTo,
  backLabel,
}: PartnershipApplicationFormProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const text = partnershipFieldText[partnershipType];

  const form = useForm<PartnershipFormValues>({
    resolver: zodResolver(partnershipFormSchema),
    defaultValues: {
      legalName: "",
      cnpj: "",
      street: "",
      number: "",
      neighborhood: "",
      complement: "",
      city: "",
      state: "",
      zipCode: "",
      email: "",
      contractorName: "",
      contractorCpf: "",
      phone: "",
      website: "",
    },
  });

  async function onSubmit(values: PartnershipFormValues) {
    try {
      const response = await fetch("/api/partnership-webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          partnershipType,
          legalName: values.legalName,
          cnpj: values.cnpj,
          street: values.street,
          number: values.number,
          neighborhood: values.neighborhood,
          complement: values.complement ?? "",
          city: values.city,
          state: values.state,
          zipCode: values.zipCode,
          email: values.email,
          contractorName: values.contractorName,
          contractorCpf: values.contractorCpf,
          phone: values.phone,
          website: values.website ?? "",
        }),
      });

      const result = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        throw new Error(result.error || "Não foi possível enviar os dados agora.");
      }

      trackFormSubmit("partnership_form", {
        partnership_type: partnershipType,
      });

      navigate(`/parcerias/sucesso?tipo=${encodeURIComponent(partnershipType.toLowerCase())}`);
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
        <title>{text.heroTitle} | Unicive Polo Flores</title>
        <meta
          name="description"
          content={`Formulário seguro para formalização da parceria do tipo ${partnershipType.toLowerCase()} com a Unicive Polo Flores.`}
        />
      </Helmet>

      <Header />

      <section className="bg-gradient-subtle py-16 lg:py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <Link to={backTo} className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
            <ArrowLeft className="h-4 w-4" />
            {backLabel}
          </Link>

          <div className="mt-6 grid gap-8 lg:grid-cols-[0.92fr_1.08fr]">
            <div className="space-y-6">
              <div>
                <Badge className="mb-4">Etapa 3</Badge>
                <h1 className="text-4xl font-bold leading-tight">{text.heroTitle}</h1>
                <p className="mt-4 text-lg leading-8 text-muted-foreground">{text.heroDescription}</p>
                <p className="mt-4 text-base leading-7 text-muted-foreground">
                  Informe os dados corretamente para que o contrato seja gerado sem atraso e enviado para assinatura no e-mail cadastrado.
                </p>
              </div>

              <Card className="rounded-3xl shadow-soft">
                <CardContent className="p-8">
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">Antes de enviar</p>
                  <div className="mt-5 space-y-4">
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="mt-0.5 h-5 w-5 text-primary" />
                      <p className="text-sm leading-7 text-muted-foreground">
                        Revise os dados com atenção. As informações serão usadas para gerar o contrato da parceria.
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="mt-0.5 h-5 w-5 text-primary" />
                      <p className="text-sm leading-7 text-muted-foreground">
                        O envio passa por validação antes de seguir para a formalização do contrato.
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="mt-0.5 h-5 w-5 text-primary" />
                      <p className="text-sm leading-7 text-muted-foreground">
                        Depois do envio, você verá a confirmação da solicitação e poderá falar com o polo se precisar.
                      </p>
                    </div>
                  </div>

                  <Button asChild variant="whatsapp" className="mt-6 w-full">
                    <a
                      href={`${WHATSAPP_URL}?text=${encodeURIComponent(`Olá, quero tirar dúvidas sobre a formalização da parceria de ${partnershipType.toLowerCase()}.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() =>
                        trackWhatsAppClick("partnership_form_whatsapp", {
                          partnership_type: partnershipType,
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
                  <h2 className="text-2xl font-semibold">Dados para formalização</h2>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">
                    Preencha todos os campos obrigatórios. O formulário valida os dados para evitar erro no contrato.
                  </p>
                </div>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" noValidate>
                    <input type="text" autoComplete="off" tabIndex={-1} className="hidden" {...form.register("website")} />

                    <div className="grid gap-5 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="legalName"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>{text.legalNameLabel}</FormLabel>
                            <FormControl>
                              <Input placeholder={text.legalNameLabel} autoComplete="organization" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="cnpj"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CNPJ</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="00.000.000/0000-00"
                                inputMode="numeric"
                                autoComplete="off"
                                {...field}
                                onChange={(event) => field.onChange(formatCnpj(event.target.value))}
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
                          <FormItem>
                            <FormLabel>E-mail</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="contato@empresa.com.br" autoComplete="email" {...field} />
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
                              <Input placeholder="Sala, bloco, referência ou complemento" autoComplete="address-line2" {...field} />
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
                        name="contractorName"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>{text.contractorLabel}</FormLabel>
                            <FormControl>
                              <Input placeholder={text.contractorLabel} autoComplete="name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="contractorCpf"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{text.contractorCpfLabel}</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="000.000.000-00"
                                inputMode="numeric"
                                autoComplete="off"
                                {...field}
                                onChange={(event) => field.onChange(formatCpf(event.target.value))}
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
                    </div>

                    <Button type="submit" size="lg" className="w-full" disabled={form.formState.isSubmitting}>
                      {form.formState.isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Enviando dados...
                        </>
                      ) : (
                        text.submitLabel
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
