# Plan napraw — z trzech audytów (2026-07-29)

Źródła: `AUDYT` (techniczny), `AUDYT-TRESCI` (treść), `RECENZJA-IDA` (komunikacja Idy). Commit audytowany: `b43a460`. Dotyczy **ProjektKrag** (baza wiedzy + Ida w `index.html`), nie komunikatora `Krag-app`.

Właściciele: **🤖** robię w kodzie teraz (jednoznaczne, bez osądu medycznego) · **🧑** wymaga człowieka/konsultanta/decyzji (nie robię sam) · **⏸️** odłożone świadomie.

Zasada nadrzędna (z audytów): nie dopisuję ani nie „poprawiam" faktów medycznych tak, by uchodziły za zweryfikowane — bo to jest dokładnie ta patologia, przed którą broni się projekt. Mogę **wycofać** błędne brzmienie i **przeredagować nadinterpretację** na ostrożniejszą prawdę; nowej treści autorytatywnej i podpisów nie tworzę.

## Faza 1 — Życie i ścieżka ratunkowa (🤖, najpierw)

| Id | Co | Działanie |
|---|---|---|
| R-1 | Ida na „nie chcę żyć" mówi „nie ma w bazie" | `risky()` przed `findFacts()` w `answerFromBase`; własna odpowiedź kryzysowa, nie wraca do bazy |
| kryzys | detekcja tylko 4 fraz PL, bez diakrytyków, brak de/cs/sk | normalizacja przez `norm()` + rozszerzona lista fraz; osobna lista dla cyrylicy; frazy de/cs/sk (🧑 do sprawdzenia przez native speakera) |
| R-2 | po ryzyku Ida idzie w U=U zamiast PEP | reguła czasowa „marker świeżości + marker ekspozycji → `pep`" ponad punktacją; rozbudowa `ALIAS.pep` |
| R-3 | blok `prawo` dopełnia karami więzienia | `pack()` nie dopełnia faktami o wyniku 0; fakty karne nigdy nie wchodzą, jeśli nie trafione |
| R-4 | próg 4 pkt daje pewne odpowiedzi z złej szuflady | ramka „nie jestem pewna, czy dobrze rozumiem" przy wyniku 4–6 |
| R-5 | „chcę przestać brać leki" → wykład o klasach leków | osobna reakcja kierująca do rozmowy i poradni |
| W-6 | brak escapowania w `bubble()` (XSS) | `bubble('me',…)` przez `escapeHtml`; twarde dla przyszłych rozmów |
| T-2 | „PEP nieskuteczny po 72h" zamyka drzwi | przeredagować: „nie jest zalecany, ale zgłoś się" |
| T-1 | błąd: PEP pozazawodowy „bezpłatny" | **wycofać** fałszywe brzmienie (koszt bywa po stronie pacjenta; zapytaj na miejscu); poprawny rozbił na dwa fakty ze źródłem → 🧑 |
| W-4/N-4 | 116 111 na liście kryzysowej | usunąć (decyzja z GENESIS) |
| M-1 | Świętokrzyskie: pusty wynik dyżuru PEP | komunikat „brak dyżuru w województwie, najbliższy: …" zamiast pustki (jeśli runway; inaczej Faza 3) |

## Faza 2 — Prawda o zaufaniu (🤖)

| Id | Co | Działanie |
|---|---|---|
| K-3 | odznaka „oficjalne" na treści niepodpisanej | `confBadge` wg drabiny z `policy.json`: `ver==null` → T3; T1 tylko przy komplecie |
| R-7 | plakietka „Zweryfikowane" za istnienie tłumaczenia | usunąć — tłumaczenie ≠ weryfikacja |
| R-8 | „nie zweryfikowane w tym języku" myli tłumaczenie z weryfikacją | „zweryfikowane" → „przetłumaczone" w komunikatach pokrycia |
| R-9 | zdanie „nie zgaduję" znika w de/cs/sk | dopisać do `IDA_HELLO` |
| R-6 | granica CD4/wyrób medyczny działa tylko po polsku, na 13 frazach | reguła semantyczna (zaimek dzierżawczy + marker wyniku / czasownik decyzyjny) w obsługiwanych językach + testy |

## Faza 3 — Integralność eksportu i buildu (🤖)

| Id | Co |
|---|---|
| K-1 | wspólny `scripts/gate.js` wołany z `export-to-app.js` **i** `paths-export.js`; fakt bez podpisu wychodzi bez treści (flaga demo świadoma i domyślnie wyłączona) |
| W-1 | `validate.js` przelicza i porównuje checksum (twardy błąd) |
| W-4 | krok w `build.sh` wstrzykujący `dist/knowledge.json` do `index.html` (znaczniki), koniec dryfu 89 faktów |
| W-5 | `validate.js`: brak `locator` = twardy błąd |
| K-5 | `verify.js`: `--by` vs `requiredVerifier`, `--confirm N` przy `--block`, append-only `signatures.jsonl` |
| W-2 | `watch.yml`: `library/state/` poza `.gitignore`, PR zamiast push, akcje po SHA |
| S-4/S-5 | EPIPE w `build.sh`, limit przekierowań w `watch.js` |
| S-7 | trzy testy bramek + `LICENSE`, `SECURITY.md`, `package.json` |

## Faza 4 — Wymaga człowieka (🧑, nie robię sam)

- **T-1** poprawne fakty o finansowaniu PEP (dwie kategorie prawne) — źródło urzędowe + podpis.
- **T-3** ramka PL w bloku `ciaza` (wytyczne US ≠ praktyka PL) + źródło PTN AIDS + podpis.
- **T-4** fakt o relacji U=U ↔ art. 161 KK — prawnik.
- **L-1…L-4** luki treściowe: działania niepożądane ARV, pominięta dawka, ujawnianie statusu, okno serologiczne — konsultanci.
- **Z-1…Z-5** jakość źródeł: „Ustawodawca RP" → konkretne przepisy; 16 brakujących lokalizatorów; prawa 5 źródeł UNKNOWN; PKD z aids.gov.pl („wszystkie prawa zastrzeżone").
- Kolejność bloków do podpisu (wg audytu): `pep`+`ekspozycja` → `prawo`+`leczenie-pl` → `ciaza` → `uu`+`transmisja` → reszta.
- **O-08** człowiek do moderacji, **O-14** administrator danych — decyzje organizacyjno-prawne.

## ⏸️ Odłożone świadomie

- **K-2 / I-1…I-4** checker interakcji lekowych — decyzja właściciela: **bez zmian na razie** (wracamy osobno; do czasu decyzji ryzyko wyrobu medycznego pozostaje otwarte).

## Kolejność wykonania

Faza 1 → weryfikacja (harness pytań do Idy) → Faza 2 → Faza 3. Fazy 1–2 dotykają tego, co widzi człowiek w kryzysie i po ryzyku, więc idą pierwsze. Faza 3 to integralność pipeline'u. Faza 4 czeka na ludzi.
