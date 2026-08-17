/* STAGO — kalkulator wynajem vs własny pawilon (pawilon-vs-najem, finansowanie).
   Wzór zgodny z notą pod kalkulatorem: rata = (cena × 1,2) ÷ liczba miesięcy.
   Skrypt wychodzi po cichu na stronach bez kalkulatora. */
(function () {
  var rent = document.getElementById('calcRent');
  var price = document.getElementById('calcPrice');
  var months = document.getElementById('calcMonths');
  if (!rent || !price || !months) return;

  var rentSlider = document.getElementById('calcRentSlider');
  var priceSlider = document.getElementById('calcPriceSlider');
  var monthsSlider = document.getElementById('calcMonthsSlider');

  var resRent = document.getElementById('resRent');
  var resLease = document.getElementById('resLease');
  var resLeaseTotal = document.getElementById('resLeaseTotal');
  var resSavings = document.getElementById('resSavings');

  var LEASE_FACTOR = 1.2;

  // Jednostka i format liczb idą za wersją językową strony (PL "zł", DE/IT/ES "€").
  var unitEl = document.querySelector('.calc-unit');
  var unit = unitEl ? unitEl.textContent.trim().split(/\s+/)[0] : 'zł';
  var locale = document.documentElement.lang || 'pl';
  // useGrouping:'always' — bez tego polski Intl zostawia "1167 zł" zamiast "1 167 zł"
  // (czterocyfrowe liczby domyślnie bez separatora), co gryzie się z resztą wyników.
  var nf;
  try {
    nf = new Intl.NumberFormat(locale, { maximumFractionDigits: 0, useGrouping: 'always' });
  } catch (e) {
    try {
      nf = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
    } catch (e2) {
      nf = new Intl.NumberFormat('pl', { maximumFractionDigits: 0 });
    }
  }

  function money(value) {
    return nf.format(Math.round(value)) + ' ' + unit;
  }

  function num(el) {
    var value = parseFloat(el.value);
    if (!isFinite(value)) value = parseFloat(el.min) || 0;
    return value;
  }

  function clampToInput(el) {
    var value = num(el);
    var min = parseFloat(el.min);
    var max = parseFloat(el.max);
    if (isFinite(min) && value < min) value = min;
    if (isFinite(max) && value > max) value = max;
    el.value = String(value);
    return value;
  }

  // Suwak ma węższy zakres niż pole liczbowe — przy wartości spoza zakresu
  // dojeżdża do końca skali, a wpisana liczba zostaje nietknięta.
  function syncSlider(slider, value) {
    if (!slider) return;
    var min = parseFloat(slider.min);
    var max = parseFloat(slider.max);
    var v = value;
    if (isFinite(min) && v < min) v = min;
    if (isFinite(max) && v > max) v = max;
    slider.value = String(v);
  }

  function render() {
    var rentValue = Math.max(0, num(rent));
    var priceValue = Math.max(0, num(price));
    var monthsValue = Math.max(1, num(months));

    var rentTotal = rentValue * monthsValue;
    var leaseTotal = priceValue * LEASE_FACTOR;
    var leaseMonthly = leaseTotal / monthsValue;

    if (resRent) resRent.textContent = money(rentTotal);
    if (resLease) resLease.textContent = '~' + money(leaseMonthly);
    if (resLeaseTotal) resLeaseTotal.textContent = money(leaseTotal);
    if (resSavings) resSavings.textContent = money(rentTotal - leaseTotal);
  }

  function bind(input, slider) {
    input.addEventListener('input', function () {
      syncSlider(slider, num(input));
      render();
    });
    input.addEventListener('change', function () {
      var value = clampToInput(input);
      syncSlider(slider, value);
      render();
    });
    if (!slider) return;
    slider.addEventListener('input', function () {
      input.value = slider.value;
      render();
    });
  }

  bind(rent, rentSlider);
  bind(price, priceSlider);
  bind(months, monthsSlider);

  render();
})();
