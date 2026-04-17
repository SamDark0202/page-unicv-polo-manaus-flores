import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { resolvePartnerOriginSlug } from "@/lib/partnerOrigin";
import { formatPartnerPublicLeadPhone } from "@/lib/partnerPublicLeadForm";
import { trackFormSubmit, trackWhatsAppClick } from "@/lib/tracker";
import { MessageCircle, X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const schema = z.object({
  nome: z.string().trim().min(2, "Informe seu nome."),
  telefone: z
    .string()
    .trim()
    .refine((value) => value.replace(/\D/g, "").length >= 10, "Informe um telefone válido com DDD."),
  email: z
    .string()
    .trim()
    .email("Informe um e-mail válido.")
    .max(254, "E-mail está muito longo.")
    .optional()
    .or(z.literal("")),
  website: z.string().max(0).optional().or(z.literal("")),
});

type Values = z.infer<typeof schema>;

type PartnerWhatsAppMiniFormProps = {
  partnerSlug: string;
};

export default function PartnerWhatsAppMiniForm({ partnerSlug }: PartnerWhatsAppMiniFormProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const resolvedPartnerSlug = resolvePartnerOriginSlug(partnerSlug);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome: "",
      telefone: "",
      email: "",
      website: "",
    },
  });

  async function onSubmit(values: Values) {
    if (!resolvedPartnerSlug) {
      toast({
        title: "Link inválido",
        description: "Não foi possível identificar o parceiro desta página.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("/api/partner-public-lead", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          slug: resolvedPartnerSlug,
          nome: values.nome,
          telefone: values.telefone,
          email: values.email || "",
          website: values.website || "",
        }),
      });

      const result = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        throw new Error(result.error || "Não foi possível enviar os dados para atendimento.");
      }

      const cleanPhone = values.telefone.replace(/\D/g, "");
      const message = `Olá! Meu nome é ${values.nome}. Vim por um link de parceiro (${resolvedPartnerSlug}) e quero atendimento sobre os cursos.${values.email ? ` Meu e-mail é ${values.email}.` : ""}`;
      const whatsappUrl = `https://wa.me/559220201260?text=${encodeURIComponent(message)}`;

      trackFormSubmit("partner_whatsapp_mini_form", {
        partner_slug: resolvedPartnerSlug,
        has_email: Boolean(values.email),
      });
      trackWhatsAppClick("partner_mini_form", {
        partner_slug: resolvedPartnerSlug,
        phone_digits: cleanPhone.length,
        has_email: Boolean(values.email),
      });
      if (typeof window.fbq === "function") {
        window.fbq("track", "Contact");
      }

      window.open(whatsappUrl, "_blank", "noopener,noreferrer");
      toast({
        title: "Pronto!", 
        description: "Abrimos o WhatsApp com sua mensagem e registramos seu atendimento.",
      });
      form.reset();
      setOpen(false);
    } catch (error) {
      toast({
        title: "Falha no envio",
        description: error instanceof Error ? error.message : "Não foi possível abrir o atendimento agora.",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-[70]">
      {open ? (
        <div className="w-[min(90vw,340px)] rounded-2xl border border-green-400/40 bg-white p-4 text-foreground shadow-floating">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-green-700">Atendimento rápido no WhatsApp</p>
              <p className="mt-1 text-xs text-muted-foreground">Preencha seus dados e abra a conversa já identificada em poucos segundos.</p>
            </div>
            <button
              type="button"
              aria-label="Fechar formulário"
              className="rounded-md p-1 text-muted-foreground hover:bg-muted"
              onClick={() => setOpen(false)}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <Form {...form}>
            <form className="space-y-3" onSubmit={form.handleSubmit(onSubmit)} noValidate>
              <input type="text" autoComplete="off" tabIndex={-1} className="hidden" {...form.register("website")} />

              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Seu nome" autoComplete="name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="telefone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="(00) 00000-0000"
                        inputMode="tel"
                        autoComplete="tel"
                        {...field}
                        onChange={(event) => field.onChange(formatPartnerPublicLeadPhone(event.target.value))}
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
                    <FormLabel>Email opcional</FormLabel>
                    <FormControl>
                      <Input placeholder="seuemail@exemplo.com" autoComplete="email" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Enviando..." : "Chamar no WhatsApp"}
              </Button>
            </form>
          </Form>
        </div>
      ) : (
        <Button
          onClick={() => setOpen(true)}
          className="h-14 rounded-full bg-green-500 px-5 text-white shadow-floating hover:bg-green-600"
        >
          <MessageCircle className="mr-2 h-5 w-5" />
          Atendimento via WhatsApp
        </Button>
      )}
    </div>
  );
}