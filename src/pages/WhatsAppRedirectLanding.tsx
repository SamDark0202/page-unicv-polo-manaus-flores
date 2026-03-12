import { useEffect, useMemo, useState } from "react";
import { Loader2, MessageCircle } from "lucide-react";
import { trackRedirectPageAccess, trackWhatsAppClick } from "@/lib/tracker";

type WhatsAppRedirectLandingProps = {
  campaignKey: "qr_panfleto" | "palestrante_tania";
  campaignLabel: string;
};

const REDIRECT_DELAY_MS = 2200;
const REDIRECT_SECONDS = Math.ceil(REDIRECT_DELAY_MS / 1000);
const WHATSAPP_URL = "https://wa.me/559220201260";

export default function WhatsAppRedirectLanding({
  campaignKey,
  campaignLabel,
}: WhatsAppRedirectLandingProps) {
  const [secondsLeft, setSecondsLeft] = useState(REDIRECT_SECONDS);

  const progressWidth = useMemo(() => {
    const elapsed = REDIRECT_SECONDS - secondsLeft;
    const ratio = Math.min(100, Math.max(0, (elapsed / REDIRECT_SECONDS) * 100));
    return `${ratio}%`;
  }, [secondsLeft]);

  useEffect(() => {
    const originalTitle = document.title;
    document.title = "Redirecionando para WhatsApp";

    let robotsMeta = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    const hadMetaTag = Boolean(robotsMeta);
    const originalMetaContent = robotsMeta?.content ?? "";

    if (!robotsMeta) {
      robotsMeta = document.createElement("meta");
      robotsMeta.name = "robots";
      document.head.appendChild(robotsMeta);
    }

    robotsMeta.content = "noindex, nofollow, noarchive";

    trackRedirectPageAccess(campaignKey, campaignLabel);

    trackWhatsAppClick("secret_redirect", {
      campaign: campaignKey,
      campaign_label: campaignLabel,
      destination: WHATSAPP_URL,
    });

    const secondTicker = window.setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    const redirectTimer = window.setTimeout(() => {
      window.location.assign(WHATSAPP_URL);
    }, REDIRECT_DELAY_MS);

    return () => {
      window.clearTimeout(redirectTimer);
      window.clearInterval(secondTicker);
      document.title = originalTitle;

      if (robotsMeta) {
        if (hadMetaTag) {
          robotsMeta.content = originalMetaContent;
        } else {
          robotsMeta.remove();
        }
      }
    };
  }, [campaignKey, campaignLabel]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-emerald-50 via-white to-emerald-100 px-4 py-8 dark:from-emerald-950/40 dark:via-background dark:to-emerald-900/30">
      <div className="pointer-events-none absolute inset-0 opacity-25">
        <div className="absolute -left-24 top-12 h-72 w-72 rounded-full bg-emerald-300 blur-3xl dark:bg-emerald-600" />
        <div className="absolute -right-20 bottom-10 h-72 w-72 rounded-full bg-lime-300 blur-3xl dark:bg-lime-700" />
      </div>

      <div className="relative z-10 w-full max-w-md rounded-3xl border border-emerald-200/70 bg-white/90 p-7 shadow-2xl backdrop-blur dark:border-emerald-500/30 dark:bg-background/80">
        <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
          <MessageCircle className="h-7 w-7" />
        </div>

        <h1 className="text-xl font-bold text-foreground">Abrindo seu atendimento no WhatsApp</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Origem registrada: <span className="font-semibold text-foreground">{campaignLabel}</span>
        </p>

        <div className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50/70 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/10">
          <div className="flex items-center gap-2 text-sm font-medium text-emerald-800 dark:text-emerald-300">
            <Loader2 className="h-4 w-4 animate-spin" />
            Redirecionando em {secondsLeft}s
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-emerald-200/70 dark:bg-emerald-950/70">
            <div
              className="h-full rounded-full bg-emerald-600 transition-all duration-500 dark:bg-emerald-400"
              style={{ width: progressWidth }}
            />
          </div>
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          Se o redirecionamento nao acontecer automaticamente, use este link:
        </p>
        <a
          href={WHATSAPP_URL}
          className="mt-2 block text-sm font-semibold text-emerald-700 underline underline-offset-2 transition-colors hover:text-emerald-600 dark:text-emerald-300 dark:hover:text-emerald-200"
        >
          {WHATSAPP_URL}
        </a>
      </div>
    </div>
  );
}
