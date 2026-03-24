/**
 * STAGO - Centralny Form Handler
 * Wersja: 1.0 | Kompatybilny ze wszystkimi 17 stronami
 * 
 * Funkcje:
 * - Honeypot anti-bot
 * - Rate limiting 30s
 * - Walidacja + sanityzacja
 * - RODO consent checkbox
 * - INSERT do Supabase (tabela leads)
 * - Opcjonalne powiadomienie email (Edge Function)
 * - Fallback: console.log gdy Supabase niedostępne
 */

const CONFIG = {
  SUPABASE_URL: 'https://zrdlyhizxkqxpzqdogyr.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpyZGx5aGl6eGtxeHB6cWRvZ3lyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5NTgzNjIsImV4cCI6MjA4NTUzNDM2Mn0.sUyVFPgSKv5N0j3PuXcQkRmoLWyseKGY1Lk8IU65h9k',
  LEADS_TABLE: 'leads',
  NOTIFY_ENDPOINT: 'https://zrdlyhizxkqxpzqdogyr.supabase.co/functions/v1/send-contact-email',
  RATE_LIMIT_MS: 30000,
  MAX_FIELD_LENGTH: 2000,
};

// ===================== SANITYZACJA =====================

function sanitize(str, maxLen) {
  if (!str) return '';
  return str
    .replace(/<[^>]*>/g, '')        // strip HTML
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim()
    .slice(0, maxLen || CONFIG.MAX_FIELD_LENGTH);
}

function sanitizePhone(phone) {
  if (!phone) return '';
  return phone.replace(/[^\d\s+\-()]/g, '').trim().slice(0, 30);
}

function sanitizeEmail(email) {
  if (!email) return '';
  return email.replace(/[<>'"\\]/g, '').trim().toLowerCase().slice(0, 255);
}

// ===================== WALIDACJA =====================

function validateForm(data) {
  const errors = [];

  if (!data.name || data.name.length < 2) {
    errors.push('Imię musi mieć co najmniej 2 znaki');
  }
  if (data.name && data.name.length > 100) {
    errors.push('Imię nie może przekraczać 100 znaków');
  }

  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Nieprawidłowy adres email');
  }

  if (data.phone && data.phone.length < 9) {
    errors.push('Numer telefonu musi mieć co najmniej 9 znaków');
  }
  if (data.phone && !/^[\d\s+\-()]+$/.test(data.phone)) {
    errors.push('Nieprawidłowy format telefonu');
  }

  if (data.message && data.message.length < 10) {
    errors.push('Wiadomość musi mieć co najmniej 10 znaków');
  }

  return errors;
}

// ===================== RATE LIMITING =====================

const lastSubmitTimes = {};

function isRateLimited(formId) {
  const now = Date.now();
  const last = lastSubmitTimes[formId] || 0;
  if (now - last < CONFIG.RATE_LIMIT_MS) {
    return true;
  }
  lastSubmitTimes[formId] = now;
  return false;
}

// ===================== SUPABASE INSERT =====================

async function insertLead(leadData) {
  const url = `${CONFIG.SUPABASE_URL}/rest/v1/${CONFIG.LEADS_TABLE}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': CONFIG.SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`,
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify(leadData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Supabase error ${response.status}: ${errorText}`);
  }

  return true;
}

// ===================== POWIADOMIENIE EMAIL =====================

async function notifyNewLead(leadData) {
  if (!CONFIG.NOTIFY_ENDPOINT) return;

  try {
    await fetch(CONFIG.NOTIFY_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        name: leadData.name,
        email: leadData.email || '',
        phone: leadData.phone || '',
        containerType: leadData.container_type || null,
        message: leadData.description || '',
        language: document.documentElement.lang || 'pl',
      }),
    });
  } catch (err) {
    console.warn('[STAGO] Powiadomienie email nie wysłane:', err.message);
  }
}

// ===================== UI HELPERS =====================

function showMessage(form, type, text) {
  // Usuń poprzednie komunikaty
  const existing = form.querySelectorAll('.form-message');
  existing.forEach(el => el.remove());

  const msg = document.createElement('div');
  msg.className = `form-message form-message--${type}`;
  msg.setAttribute('role', 'alert');
  msg.textContent = text;

  // Style inline (fallback jeśli brak CSS)
  msg.style.cssText = type === 'success'
    ? 'padding:16px;margin-top:16px;background:#059669;color:#fff;border-radius:8px;font-weight:600;text-align:center;'
    : 'padding:16px;margin-top:16px;background:#dc2626;color:#fff;border-radius:8px;font-weight:600;text-align:center;';

  form.appendChild(msg);

  // Auto-ukryj po 8s
  setTimeout(() => msg.remove(), 8000);
}

function setSubmitting(form, isSubmitting) {
  const btn = form.querySelector('button[type="submit"], input[type="submit"]');
  if (btn) {
    btn.disabled = isSubmitting;
    if (isSubmitting) {
      btn.dataset.originalText = btn.textContent;
      btn.textContent = 'Wysyłanie...';
    } else {
      btn.textContent = btn.dataset.originalText || 'Wyślij';
    }
  }
}

// ===================== GŁÓWNA LOGIKA =====================

function extractFormData(form) {
  const formData = new FormData(form);
  const data = {};

  // Mapowanie pól formularza → kolumny w tabeli leads
  const fieldMap = {
    'name': 'name',
    'imie': 'name',
    'nazwisko': 'name',       // jeśli osobne pole
    'email': 'email',
    'e-mail': 'email',
    'phone': 'phone',
    'telefon': 'phone',
    'tel': 'phone',
    'company': 'company',
    'firma': 'company',
    'container_type': 'container_type',
    'typ': 'container_type',
    'typ-kontenera': 'container_type',
    'message': 'description',
    'wiadomosc': 'description',
    'tresc': 'description',
    'opis': 'description',
  };

  for (const [key, value] of formData.entries()) {
    const normalizedKey = key.toLowerCase().replace(/[\s_-]+/g, '-');
    const mappedField = fieldMap[normalizedKey] || fieldMap[key.toLowerCase()];

    if (mappedField && typeof value === 'string' && value.trim()) {
      if (mappedField === 'email') {
        data[mappedField] = sanitizeEmail(value);
      } else if (mappedField === 'phone') {
        data[mappedField] = sanitizePhone(value);
      } else {
        data[mappedField] = sanitize(value, mappedField === 'description' ? 5000 : 100);
      }
    }
  }

  return data;
}

async function handleFormSubmit(event) {
  event.preventDefault();
  const form = event.target;
  const formId = form.id || form.action || 'default';

  // 1. Honeypot check
  const honeypot = form.querySelector('[name="website"], [name="url"], [name="hp_field"]');
  if (honeypot && honeypot.value) {
    // Bot detected — fake success
    showMessage(form, 'success', 'Dziękujemy! Skontaktujemy się wkrótce.');
    return;
  }

  // 2. RODO consent check
  const consent = form.querySelector('[name="gdpr"], [name="consent"], [name="rodo"], [id*="gdpr"], [id*="consent"], [id*="rodo"]');
  if (consent && !consent.checked) {
    showMessage(form, 'error', 'Proszę zaakceptować zgodę na przetwarzanie danych osobowych.');
    return;
  }

  // 3. Rate limiting
  if (isRateLimited(formId)) {
    showMessage(form, 'error', 'Proszę poczekać 30 sekund przed ponownym wysłaniem.');
    return;
  }

  // 4. Extract & sanitize
  const data = extractFormData(form);

  // 5. Validate
  const errors = validateForm(data);
  if (errors.length > 0) {
    showMessage(form, 'error', errors[0]);
    return;
  }

  // 6. Build lead object
  const leadData = {
    name: data.name,
    email: data.email || null,
    phone: data.phone || null,
    company: data.company || null,
    container_type: data.container_type || null,
    description: data.description || null,
    source: 'website',
    // Pola z defaults w bazie:
    // id, created_at, updated_at, priority, is_archived — automatyczne
    // status_id — NULL, zostanie ustawiony ręcznie w CRM
  };

  setSubmitting(form, true);

  try {
    // 7. Insert do Supabase
    await insertLead(leadData);

    // 8. Powiadomienie email (fire & forget)
    notifyNewLead(leadData);

    // 9. Success
    showMessage(form, 'success', 'Dziękujemy! Skontaktujemy się z Tobą w ciągu 24 godzin.');
    form.reset();

  } catch (err) {
    console.error('[STAGO] Form submit error:', err);

    // 10. Fallback — loguj dane (nie giną)
    console.warn('[STAGO] Fallback — dane formularza:', JSON.stringify(leadData));

    // Pokaż error ale z numerem telefonu
    showMessage(form, 'error', 
      'Wystąpił błąd. Spróbuj ponownie lub zadzwoń: +48 509 508 210');

  } finally {
    setSubmitting(form, false);
  }
}

// ===================== AUTO-INIT =====================

document.addEventListener('DOMContentLoaded', function() {
  // Znajdź wszystkie formularze z atrybutem data-stago-form lub klasą .stago-form
  const forms = document.querySelectorAll('[data-stago-form], .stago-form, form[action*="stago"]');

  forms.forEach(function(form) {
    form.addEventListener('submit', handleFormSubmit);

    // Dodaj honeypot (ukryte pole)
    if (!form.querySelector('[name="hp_field"]')) {
      const hp = document.createElement('input');
      hp.type = 'text';
      hp.name = 'hp_field';
      hp.tabIndex = -1;
      hp.autocomplete = 'off';
      hp.style.cssText = 'position:absolute;left:-9999px;opacity:0;height:0;width:0;';
      hp.setAttribute('aria-hidden', 'true');
      form.insertBefore(hp, form.firstChild);
    }
  });

  if (forms.length > 0) {
    console.log(`[STAGO] Form handler aktywny na ${forms.length} formularzach`);
  }
});

// Eksport dla modułów ES
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { handleFormSubmit, insertLead, CONFIG };
}
