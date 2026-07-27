# Krąg — status wykonania planu

**Sesje 2026-07-26/27.** Prototyp: v22. Wykonane wszystko, co da się dokończyć kodem bez zmyślania. Dwie ostatnie pozycje mają twardą granicę opisaną niżej.

## Bilans: 6 kroków w pełni (w zakresie kodu) · 2 wymagają człowieka

| KROK | Stan | Szczegół |
|---|---|---|
| **0 — eksport dla lekarza** | ✅ | Arkusz recenzencki (215 pozycji). |
| **1 — treść z danych** | ✅ | Cała treść i fakty w bazie. |
| **4 — ścieżki i moduły** | ✅ | 9 ścieżek + Trener wiedzy jako przepływ powtórek. |
| **5 — dane zewnętrzne** | ✅ | Mapa poradni + **wyszukiwarka 56 marek ARV z RPL** (interakcje działają na realnych markach). |
| **6 — braki funkcjonalne** | ✅ | Rozmowy 1:1 + mapa. |
| **7 — watch.js produkcyjnie** | ✅ | Zawężenie `citesAtc` + **gotowy harmonogram**: GitHub Action i crontab (`/.github/workflows/watch.yml`, `/cron/`). Uruchomienie na Twojej infrastrukturze. |
| **2 — Zdrowie domknięte** | 🟡 | Przepływ, stany, PDF, dostępność — gotowe. **27 języków interfejsu: architektura gotowa, brakuje tłumaczeń długiego ogona** (patrz niżej). |
| **3 — dług tłumaczeniowy** | 🟡 | Wymaga ręcznego przeglądu na kanonicznym pliku (patrz niżej). |

---

## Co dowiozłem w tej turze (przetestowane w Chromium)

**Wyszukiwarka leków — 56 marek z RPL.** Rejestr przefiltrowany allowlistą D2 (76→56), łacińskie substancje zmapowane na tagi interakcji, 42 nowe marki dodane do wyszukiwarki. Test: realna marka **Edurant** znaleziona, po dodaniu z Omeprazolem interakcja **rylpiwiryna + PPI = „nie łączyć"** poprawnie się zapala. Zero błędów. KROK 5 domknięty.

**Harmonogram watch.js.** GitHub Action (codziennie 05:17 + ręcznie, commit kolejki do repo) oraz `crontab` na własny serwer, z README. Cron nie publikuje — bramka weryfikacji stoi dalej.

---

## Dwie pozycje, których nie „zrealizuję" zmyślaniem — i dlaczego

**KROK 2 — 27 języków interfejsu.** Architektura jest gotowa (oś językowa, `coverage()`, fallback do EN). Faktyczne pokrycie tekstu:

- PL, EN — 100%
- UK, RU — ~77%
- DE, CS, SK — ~74%
- FR, ES, IT — ~38%
- pozostałe 16 (NL, PT, SV, DA, FI, RO, HU, BG, EL, HR, SL, LT, LV, ET, GA, MT, RM) — ~20% (tylko nawigacja)

Domknięcie to **praca tłumacza-człowieka**, nie moja. Nie wygeneruję poprawnych etykiet po maltańsku, irlandzku czy estońsku w aplikacji medycznej — zmyślone tłumaczenie interfejsu zdrowotnego to nie oszczędność (to duch K-09 i „nie zmyślaj"). Aplikacja już dziś działa w tych językach z fallbackiem i uczciwie pokazuje procent pokrycia.

**KROK 3 — dług tłumaczeniowy.** Pozostałe zaszyte zdania są **splecione ze słownikiem 27 języków**, więc automatyczny skan nie odróżnia ich od wartości innych języków. Bezpieczne przeniesienie wymaga ręcznego przeglądu z testem po każdej zmianie — a operacja na oślep na kanonicznym pliku medycznym może go rozłożyć dla kosmetyki. Treści, które sam dodawałem (rozmowy, mapa, trener), są od razu dwujęzyczne (pl/en), więc nowego długu nie dołożyłem.

---

## Poza kodem (po Twojej stronie)
- **Tłumacze** dla długiego ogona języków (KROK 2) i ręczny przegląd słownika (KROK 3).
- **Podpis lekarza** — 215 wpisów DRAFT, `dist/` pusty do podpisu; arkusz gotowy.
- **21 placówek** do telefonicznego potwierdzenia; uruchomienie crona na infrastrukturze.

## Pliki
- `krag-v22.html` — prototyp: rozmowy, mapa, Trener wiedzy (powtórki), wyszukiwarka 56 marek ARV. Zweryfikowany.
- `krag-library-full.zip` — repo: 215 wpisów, `arv.json`, baza interakcji, harmonogram watch (Action + cron), pełny pipeline.
