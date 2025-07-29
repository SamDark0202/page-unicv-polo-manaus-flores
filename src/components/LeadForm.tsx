import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Phone, Mail, User, MessageCircle } from "lucide-react";
import { GoogleReCaptchaProvider, useGoogleReCaptcha } from "react-google-recaptcha-v3";

const SITE_KEY = "6Lch1ZIrAAAAAOR6s3Q1JP9OmhepIBFTdZpE9LI2";

interface LeadFormProps {
  title?: string;
  description?: string;
  variant?: "default" | "compact" | "hero";
}

const LeadFormContent = ({
  title,
  description,
  variant,
}: LeadFormProps) => {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { executeRecaptcha } = useGoogleReCaptcha();
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!executeRecaptcha) {
      toast({
        title: "Verificação indisponível!",
        description: "Não foi possível validar o reCAPTCHA.",
        variant: "destructive",
      });
      return;
    }

    const token = await executeRecaptcha("lead_form");
    setRecaptchaToken(token);

    if (!token) {
      toast({
        title: "Verificação necessária!",
        description: "Por favor, tente novamente.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await fetch("https://hook.us2.make.com/myxuyjhu632m7hzt5lpqhoik7v4es1sp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...formData, recaptchaToken: token }),
      });
    } catch (error) {
      toast({
        title: "Erro ao enviar dados!",
        description: "Tente novamente em instantes.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    toast({
      title: "Dados enviados com sucesso!",
      description: "Em breve nossa equipe entrará em contato com você.",
    });

    setFormData({ name: "", phone: "", email: "" });
    setRecaptchaToken(null);
    setIsSubmitting(false);
  };

  const handleWhatsApp = () => {
    const message = `Olá! Vi o site da UniCV Polo Manaus Flores e gostaria de saber mais sobre a bolsa de 30% de desconto. Meu nome é ${formData.name || "[Nome]"}.`;
    const phone = "559220201260";
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  if (variant === "compact") {
    return (
      <div className="bg-gradient-subtle p-6 rounded-xl border border-border">
        <h3 className="text-lg font-semibold mb-4 text-center">{title}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Input
                placeholder="Seu nome completo"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="h-12"
              />
            </div>
            <div>
              <Input
                type="tel"
                placeholder="Seu WhatsApp"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
                className="h-12"
              />
            </div>
            <div>
              <Input
                type="email"
                placeholder="Seu e-mail"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="h-12"
              />
            </div>
          </div>
          <Button 
            type="submit" 
            variant="hero" 
            className="w-full h-12"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Enviando..." : "Garantir Minha Bolsa!"}
          </Button>
        </form>
      </div>
    );
  }

  return (
    <Card className="shadow-elevated bg-gradient-subtle">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-primary">{title}</CardTitle>
        <CardDescription className="text-base">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="name" className="flex items-center gap-2 mb-2">
                <User className="h-4 w-4" />
                Nome Completo
              </Label>
              <Input
                id="name"
                placeholder="Digite seu nome completo"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="h-12"
              />
            </div>
            <div>
              <Label htmlFor="phone" className="flex items-center gap-2 mb-2">
                <Phone className="h-4 w-4" />
                WhatsApp
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(00) 00000-0000"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
                className="h-12"
              />
            </div>
            <div>
              <Label htmlFor="email" className="flex items-center gap-2 mb-2">
                <Mail className="h-4 w-4" />
                E-mail
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="h-12"
              />
            </div>
          </div>
          <div className="space-y-3">
            <Button 
              type="submit" 
              variant="hero" 
              className="w-full h-12"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Enviando..." : "Garantir Minha Bolsa de 30%!"}
            </Button>
            
            <Button 
              type="button" 
              variant="whatsapp" 
              className="w-full h-12"
              onClick={handleWhatsApp}
            >
              <MessageCircle className="h-5 w-5 mr-2" />
              Falar no WhatsApp Agora
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Seus dados estão seguros conosco. Não enviamos spam.
          </p>
        </form>
      </CardContent>
    </Card>
  );
};

const LeadForm = (props: LeadFormProps) => (
  <GoogleReCaptchaProvider reCaptchaKey={SITE_KEY}>
    <LeadFormContent {...props} />
  </GoogleReCaptchaProvider>
);

export default LeadForm;