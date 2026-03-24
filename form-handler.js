/**
 * STAGO Form Handler
 *
 * Obsługuje formularze kontaktowe i konfiguratora.
 * Wysyła dane do Supabase ERP + Resend (email notification).
 *
 * KONFIGURACJA — uzupełnij przed deploy:
 */
const CONFIG = {
  // Supabase ERP — endpoint do zapisu leadów
  SUPABASE_URL: '',       // np. 'https://xxxx.supabase.co'
  SUPABASE_ANON_KEY: '',  // publiczny anon key
  LEADS_TABLE: 'leads',   // nazwa tabeli w ERP

  // Resend — email notification (opcjonalnie, przez edge function)
  // Jeśli używasz Supabase Edge Function do emaili, zostaw puste
  NOTIFY_ENDPOINT: '',    // np. 'https://xxxx.supabase.co/functions/v1/notify-lead'

  // Bezpieczeństwo
  RATE_LIMIT_MS: 30000,   // 30s cooldown między wysłaniami
  MAX_MESSAGE_LENGTH: 2000,
};

// ── Stan ──
let lastSubmitTime = 0;

// ── Walidacja ──
function validateForm(data) {
  const errors = [];

  if (!data.name || data.name.trim().length < 2) {
    errors.push('Podaj imię i nazwisko');
  }
  if (!data.phone || !/^[\d\s\+\-]{9,15}$/.test(data.phone.trim())) {
    errors.push('Podaj prawidłowy numer telefonu');
  }
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Podaj prawidłowy adres email');
  }
  if (data.message && data.message.length > CONFIG.MAX_MESSAGE_LENGTH) {
    errors.push('Wiadomość jest za długa');
  }
  if (!data.consent) {
    errors.push('Wymagana zgoda na przetwarzanie danych');
  }

  return errors;
}

// ── Sanityzacja ──
function sanitize(str) {
  if (!str) return '';
  return str.replace(/[<>]/g, '').trim().substring(0, CONFIG.MAX_MESSAGE_LENGTH);
}

// ── Honeypot check ──
function isBot(formData) {
  return formData.get('website') && formData.get('website').length > 0;
}

// ── Rate limiting ──
function isRateLimited() {
  const now = Date.now();
  if (now - lastSubmitTime < CONFIG.RATE_LIMIT_MS) {
    return true;
  }
  lastSubmitTime = now;
  return false;
}

// ── Wysyłka do Supabase ERP ──
async function sendToERP(leadData) {
  if (!CONFIG.SUPABASE_URL || !CONFIG.SUPABASE_ANON_KEY) {
    console.warn('[STAGO Forms] Supabase nie skonfigurowany — lead zapisany w konsoli:', leadData);
    return { ok: true, fallback: true };
  }

  const res = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/${CONFIG.LEADS_TABLE}`, {
    method: 'POST',
    headers: {
      'apikey': CONFIG.SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify(leadData),
  });

  if (!res.ok) {
    throw new Error(`ERP error: ${res.status}`);
  }

  return { ok: true };
}

// ── Email notification (przez edge function) ──
async function sendNotification(leadData) {
  if (!CONFIG.NOTIFY_ENDPOINT) return;

  try {
    await fetch(CONFIG.NOTIFY_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(leadData),
    });
  } catch (e) {
    // Email notification jest best-effort — nie blokujemy UI
    console.warn('[STAGO Forms] Notification failed:', e);
  }
}

// ── Główna funkcja submit ──
async function handleFormSubmit(form, source = 'contact') {
  const formData = new FormData(form);
  const submitBtn = form.querySelector('[type="submit"]');
  const successEl = form.querySelector('.form-success') || document.getElementById(`${form.id}-success`);
  const errorEl = form.querySelector('.form-error') || document.getElementById(`${form.id}-error`);

  // Reset
  if (successEl) successEl.style.display = 'none';
  if (errorEl) errorEl.style.display = 'none';

  // Honeypot
  if (isBot(formData)) {
    // Udajemy sukces dla bota
    if (successEl) { successEl.style.display = 'block'; }
    return;
  }

  // Rate limit
  if (isRateLimited()) {
    if (errorEl) {
      errorEl.textContent = 'Poczekaj 30 sekund przed ponownym wysłaniem.';
      errorEl.style.display = 'block';
    }
    return;
  }

  // Zbierz dane
  const data = {
    name: sanitize(formData.get('name')),
    phone: sanitize(formData.get('phone')),
    email: sanitize(formData.get('email')),
    type: sanitize(formData.get('type')),
    message: sanitize(formData.get('message')),
  };

  // Walidacja
  const errors = validateForm({ ...data, consent: formData.get('consent') });
  if (errors.length > 0) {
    if (errorEl) {
      errorEl.textContent = errors[0];
      errorEl.style.display = 'block';
    }
    return;
  }

  // Lead data
  const leadData = {
    ...data,
    source: source,
    page_url: window.location.href,
    created_at: new Date().toISOString(),
    user_agent: navigator.userAgent.substring(0, 200),
  };

  // Disable button
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Wysyłanie...';
  }

  try {
    // Wyślij do ERP
    const result = await sendToERP(leadData);

    // Email notification (best-effort)
    sendNotification(leadData);

    // Sukces
    if (successEl) successEl.style.display = 'block';
    form.reset();

    if (result.fallback) {
      console.log('[STAGO Forms] Lead (fallback — bez ERP):', leadData);
    }

  } catch (err) {
    console.error('[STAGO Forms] Error:', err);
    if (errorEl) {
      errorEl.textContent = 'Coś poszło nie tak. Zadzwoń: 509 508 210';
      errorEl.style.display = 'block';
    }
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Wyślij zapytanie';
    }
  }
}

// ── Init — podpinamy formularze ──
document.addEventListener('DOMContentLoaded', () => {
  // Formularz kontaktowy (strona główna)
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handleFormSubmit(contactForm, 'contact-page');
    });
  }

  // Formularz konfiguratora
  const cfgForm = document.getElementById('cfgForm');
  if (cfgForm) {
    // Konfigurator ma własny submit — nadpisujemy
    cfgForm.removeAttribute('onsubmit');
    cfgForm.addEventListener('submit', (e) => {
      e.preventDefault();
      // Dodaj config state do form data
      const stateInput = document.createElement('input');
      stateInput.type = 'hidden';
      stateInput.name = 'message';
      stateInput.value = JSON.stringify(
        typeof state !== 'undefined' ? state : {},
        null, 2
      );
      cfgForm.appendChild(stateInput);
      handleFormSubmit(cfgForm, 'configurator');
      stateInput.remove();
    });
  }

  // Formularze na stronach produktowych
  const productForm = document.getElementById('product-form');
  if (productForm) {
    productForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handleFormSubmit(productForm, 'product-page');
    });
  }
});
