import { supabase } from "./supabaseClient";
import { getPartnerOrigin } from "./partnerOrigin";

// ---------------------------------------------------------------------------
// Identificação anônima do visitante/sessão
// ---------------------------------------------------------------------------

function getOrCreateId(key: string): string {
  try {
    let id = sessionStorage.getItem(key) ?? localStorage.getItem(key);
    if (!id) {
      id = crypto.randomUUID();
      if (key === "unicv_visitor_id") {
        localStorage.setItem(key, id);
      } else {
        sessionStorage.setItem(key, id);
      }
    }
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

function visitorId() {
  return getOrCreateId("unicv_visitor_id");
}

function sessionId() {
  return getOrCreateId("unicv_session_id");
}

// ---------------------------------------------------------------------------
// Envio de eventos (fire-and-forget, nunca bloqueia UI)
// ---------------------------------------------------------------------------

export type EventType =
  | "page_view"
  | "card_click"
  | "form_submit"
  | "session_end"
  | "whatsapp_click"
  | "redirect_page_access";

interface TrackEventPayload {
  event_type: EventType;
  page_path?: string;
  referrer?: string;
  metadata?: Record<string, unknown>;
}

async function sendEvent(payload: TrackEventPayload) {
  try {
    await supabase.from("site_events").insert({
      event_type: payload.event_type,
      page_path: payload.page_path ?? window.location.pathname,
      referrer: payload.referrer ?? (document.referrer || null),
      metadata: payload.metadata ?? {},
      visitor_id: visitorId(),
      session_id: sessionId(),
      user_agent: navigator.userAgent,
    });
  } catch {
    // silently fail — analytics should never break the site
  }
}

function buildPartnerTrackingContext() {
  try {
    const origin = getPartnerOrigin();
    if (!origin?.slug) return {};

    return {
      partner_origin_slug: origin.slug,
      partner_origin_path: origin.path,
    };
  } catch {
    return {};
  }
}

// ---------------------------------------------------------------------------
// Funções públicas de tracking
// ---------------------------------------------------------------------------

/** Pageview — chamado automaticamente pelo PageTracker */
export function trackPageView(path?: string) {
  const pagePath = path ?? window.location.pathname;
  
  // Não rastreia a página de Controle
  if (pagePath.toLowerCase().includes("/controle")) {
    return;
  }
  
  sendEvent({ event_type: "page_view", page_path: pagePath });
}

/** Clique em card de curso / blog etc. */
export function trackCardClick(cardName: string, extra?: Record<string, unknown>) {
  sendEvent({
    event_type: "card_click",
    metadata: { card_name: cardName, ...extra },
  });
}

/** Envio de formulário */
export function trackFormSubmit(formName: string, extra?: Record<string, unknown>) {
  sendEvent({
    event_type: "form_submit",
    metadata: { form_name: formName, ...buildPartnerTrackingContext(), ...extra },
  });
}

/** Clique em botão que leva ao WhatsApp */
export function trackWhatsAppClick(source: string, extra?: Record<string, unknown>) {
  sendEvent({
    event_type: "whatsapp_click",
    metadata: { source, ...buildPartnerTrackingContext(), ...extra },
  });
}

/** Acesso dedicado das landing pages secretas de redirecionamento */
export function trackRedirectPageAccess(
  campaign: "qr_panfleto" | "palestrante_tania" | "folder_vire_pagina",
  campaignLabel: string,
  path?: string,
) {
  sendEvent({
    event_type: "redirect_page_access",
    page_path: path ?? window.location.pathname,
    metadata: {
      source: "secret_redirect_page",
      campaign,
      campaign_label: campaignLabel,
    },
  });
}

/** Fim de sessão (tempo de permanência) — registrado no beforeunload */
export function trackSessionEnd() {
  const startRaw = sessionStorage.getItem("unicv_session_start");
  const start = startRaw ? parseInt(startRaw, 10) : Date.now();
  const durationMs = Date.now() - start;
  sendEvent({
    event_type: "session_end",
    metadata: { session_duration_ms: durationMs },
  });
}

// ---------------------------------------------------------------------------
// Inicialização (chamada 1x na raiz do app)
// ---------------------------------------------------------------------------

let initialized = false;

export function initTracker() {
  if (initialized) return;
  initialized = true;

  // Marca início da sessão
  if (!sessionStorage.getItem("unicv_session_start")) {
    sessionStorage.setItem("unicv_session_start", String(Date.now()));
  }

  // Registra fim de sessão no beforeunload
  window.addEventListener("beforeunload", () => {
    trackSessionEnd();
  });
}
