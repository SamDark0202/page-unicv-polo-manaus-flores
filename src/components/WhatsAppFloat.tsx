import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trackWhatsAppClick } from "@/lib/tracker";

const WhatsAppFloat = () => {
  const handleWhatsAppClick = () => {
    trackWhatsAppClick("float_button");
    if (typeof window.fbq === "function") {
      window.fbq('track', 'Contact');
    }
    const message = "Olá! Vim pelo site da UniCV e gostaria de saber mais sobre os cursos e como garatir uma bolsa de desconto!";
    const whatsappUrl = `https://wa.me/559220201260?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <Button
      onClick={handleWhatsAppClick}
      className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-green-500 hover:bg-green-600 shadow-floating animate-float"
      size="sm"
    >
      <MessageCircle className="h-6 w-6 text-white" />
    </Button>
  );
};

export default WhatsAppFloat;