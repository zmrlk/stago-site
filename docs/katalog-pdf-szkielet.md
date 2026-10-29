# Katalog PDF STAGO — szkielet (uwagi Denisa 29.10.2026, 🟠4)

Szkielet 16–20 stron. To nie jest gotowy katalog: tylko układ, źródło każdej strony i braki.
Strony `/katalog` nie odtwarzamy (usunięta decyzją Karola 28.10, 301 → `/modele`). Katalog powstaje jako plik PDF do wysyłki i pobrania.

Zasada: dane bez źródła = `[do uzupełnienia]` + pytanie w `rada/SEO-STAGO-PYTANIA-KAROL.md`.

| Str. | Treść | Źródło na dziś | Brakuje |
|---|---|---|---|
| 1 | Okładka: hasło, zdjęcie realizacji | `assets/gallery/realizacje/*` (ERP) | wybór zdjęcia okładki |
| 2 | Kim jesteśmy: zakład w Jasionce pod Jędrzejowem, produkcja u siebie | `technologia.html` (hero), `llms.txt` | zdjęcie zakładu, liczby (lata, liczba realizacji) — tylko potwierdzone |
| 3 | „Dwa pawilony mogą wyglądać identycznie…” — porównanie konstrukcji | `technologia.html#porownanie` | — |
| 4–5 | Jak produkujemy: 7 etapów + „Dla Ciebie” | `technologia.html#jak-produkujemy` | zdjęcia z każdego etapu (🟡6), warstwy podłogi (pyt. 12) |
| 6 | Standard techniczny: rama, PIR 100/160, stolarka PVC/ALU, przekrój | uwagi Denisa 29.10, karty wymiarów | rysunek przekroju, potwierdzenie standardu dla modeli (pyt. 13) |
| 7–12 | 12 modeli, po 2 na stronę: render, opis, cena „od” | `content/modele/*.json`, cennik 28.10 | opis dopłaty za model (`wCenie._todo`, PR #3) |
| 13 | Elewacje i kolory: profile płyty, kolory RAL, lamele | `content/konfigurator.json` (krok 3) | zdjęcia próbek |
| 14 | Wyposażenie: w cenie podstawy / w dopłacie / osobno | „Co jest w cenie” (PR #3), karty wymiarów | ceny wyposażenia — tylko jeśli STAGO je poda |
| 15 | Przykładowe konfiguracje cenowe: 4×3, 6×3, 8×3, 10×3 | `content/cennik-pawilonow.json` (generować, nie przepisywać ręcznie) | — |
| 16–17 | Realizacje jako historie (np. Naprzód Jędrzejów 8×3 VIP) | szkielet `realizacja-naprzod-jedrzejow.html` | treść, zdjęcia, zgody klientów (pyt. 14) |
| 18 | Transport, montaż, terminy, formalności (do 35 m² zgłoszenie) | `llms.txt`, `jak-kupic.html` | masa pawilonu (pyt. 11) |
| 19 | Jak kupić: 5 kroków | `jak-kupic.html` | — |
| 20 | Kontakt, konfigurator (QR), OWZ | stopka strony | kod QR do `/konfigurator` |

Karty techniczne modeli (1 strona): szkielet `karta-techniczna-nord.html` (noindex). Docelowo generowane w `build.js` dla 12 modeli z tych samych danych co strony modeli i cennik, z wersją do druku.
