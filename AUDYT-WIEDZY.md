# Audyt wiedzy — research a baza aplikacji

Pierwszy przebieg: 2026-07-27. Źródła: `library/research/kompendium-hiv-2026-07.md` (112 faktów atomowych) i `library/research/odbudowa-odpornosci.md` (badania pod odbudowę/psychikę). Pełny audyt = zadanie otwarte (checklista na końcu).

## 1. Czy wszystko wykorzystane? — w większości tak

| Research | W bazie | Pokrycie |
|---|---|---|
| Kompendium — 112 faktów atomowych | `hiv-0001..0112` | **100%** — jeden do jednego |
| Odbudowa odporności — kluczowe tezy | `odbudowa` 0201–0211, `bezpieczenstwo` 0212–0218, `psyche` 0219–0222 | **główne tezy pokryte** (22 fakty) |

Rzeczy z researchu „Odbudowa", które wyglądały na brakujące, a są — tylko sparafrazowane:
- CD4/CD8 → `hiv-0206`; IRIS → `hiv-0215` („zespół rekonstytucji immunologicznej”, bez akronimu); INR → `hiv-0204` („brak odpowiedzi immunologicznej”); peer navigation / LINK LA 49% vs 30% → `hiv-0221`; progi profilaktyki OI (PCP<200, tokso<100, MAC<50) → `hiv-0212..0214`.

## 2. Czy wykorzystane z głową? — tak, i to świadomie

To jest mocna strona, nie przypadek:
- **Liczby o samobójstwach** z researchu (myśli 22,8%, ryzyko ~100× w pierwszych 3 mies., 40% zgonów w kohorcie) **celowo NIE trafiły do treści** — uzasadniają istnienie przesiewu nastroju i warstwy kryzysowej, nie są treścią pokazywaną człowiekowi w kryzysie. Zgodne z decyzją **K-13**.
- **Tablice długości życia** (różnica ~20 lat przy CD4<50) — pominięte jako straszące; `hiv-0211` mówi uczciwie „różnica istotna, dane po 2015 wyraźnie lepsze”.
- **Mit „pozytywne myślenie = wyższe CD4”** — jawnie obalony (`hiv-0222`), dokładnie jak każe research (badanie MBSR: poprawia nastrój, nie CD4).
- **Ruch i suplementy** — uczciwie „nie podnosi CD4” (`hiv-0209`, `hiv-0210`), zamiast marketingu odporności.
- **Sufit zaufania** zadziałał: 3 fakty prasowe o refundacji PrEP obniżone VERIFIED→COMMUNITY.

Wniosek: baza nie jest zrzutem researchu — jest jego **redakcją pod zasadę „nie straszyć tam, gdzie człowiek szuka pomocy”**.

## 3. Czego brakuje / jakie jeszcze researche

### A. Luki wymagające KONSULTANTA (nie web-researchu) — z Caveats obu dokumentów
Research sam je wypisał i świadomie nie zgadywał (K-22):
- [ ] Dokładne polskie okienka serologiczne per typ testu (PTN AIDS 2025, rozdz. 1 — algorytm przesunięty na HIV-RNA).
- [ ] Dokładny skład schematu **PEP** wg PTN AIDS 2025 (rozdz. 6) — dziś baza mówi tylko „28 dni”, bez leków.
- [ ] Finansowanie PEP pozazawodowego 2026 — kto dokładnie płaci przy przemocy seksualnej vs innej ekspozycji.
- [ ] Pełna lista chorób wskaźnikowych AIDS wg definicji stosowanej w Polsce.
- [ ] Zawody z ograniczeniami związanymi z HIV w polskim prawie (i czy uzasadnione).
- [ ] Ubezpieczenia na życie/zdrowotne i kredyty jako bariery — brak twardego źródła.
- [ ] Polskie dane **Stigma Index** (Sieć Plus / KC AIDS) — konkretne liczby.
- [ ] Status praw autorskich per materiał NGO (9 wpisów na źródłach UNKNOWN).
- [ ] Dosłowne brzmienie EACS dot. postępowania w INR (dziś zasada pochodzi z DHHS).

### B. Research jest, treści w aplikacji brak (do napisania + podpis)
- [ ] **Moduł 1 Trenera odporności** — „Co się teraz dzieje” (pierwsze dni). Research pokrywa (Odbudowa, rozdz. 7–10 + rokowanie), moduł nienapisany.
- [ ] **Moduł 6** — „Życie długoterminowe” (rokowanie, starzenie z HIV, choroby non-AIDS). j.w.

### C. Nowe researche warte zlecenia
- [ ] **Ścieżka uchodźcy UK/RU** po wygaszeniu specustawy (5.03.2026) — dostęp do NFZ/ARV. Priorytet wg Kompendium/Recommendations (O-04).
- [ ] **Interakcje lekowe** — obecna baza to `AI_DRAFT`; docelowo licencja Liverpool HIV Drug Interactions (O-03).
- [ ] **Refundacja PrEP** — fakt wygasający, przegląd kwartalny; watch.js obserwuje obwieszczenie.

### D. Świeżość (już pod obserwacją watch.js)
Program ARV (koniec 2026), art. 161 KK (nowelizacja), PTN AIDS 2026 / EACS v14 (cała warstwa leczenia), lista PKD/poradni (co pół roku, telefonicznie).

## Checklista audytu (zadanie otwarte)
- [ ] Zdanie po zdaniu: 112 faktów Kompendium vs `entries/` — czy parafraza wierna źródłu i czy przypis trafia w to samo miejsce co w researchu.
- [ ] Odbudowa: zdecydować, które szczegóły liczbowe (INR %, tablice życia) świadomie zostają poza treścią (K-13), a które warto dodać jako fakt z podpisem.
- [ ] Luki A → agenda pierwszej konsultacji z zakaźnikiem (te same 82 wpisy czekają na podpis).
- [ ] Luki C → decyzja, czy zlecać nowy deep-research.
