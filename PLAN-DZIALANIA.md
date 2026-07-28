# Plan działania — Krąg

Stan na 2026-07-27. Konsoliduje wszystkie otwarte zadania. **Zasada kolejności:** wąskim gardłem jest podpis lekarza i mandat środowiska, nie kod — dlatego tory ludzkie (1, 2) startują od razu, bo mają najdłuższy czas realizacji; kod (tor 3) leci równolegle.

Legenda właściciela: **[W]** właściciel · **[C]** ja/kod · **[L]** lekarz/konsultant · **[Ś]** środowisko/organizacja · **[T]** tłumacz.

---

## Zrobione (kod, 6/8 kroków planu)
KROK 0 (arkusz recenzencki 215 poz.) · KROK 1 (treść z danych) · KROK 4 (9 ścieżek + Trener wiedzy jako przepływ) · KROK 5 (mapa poradni + 56 leków ARV z RPL + interakcje) · KROK 6 (rozmowy 1:1 + mapa) · KROK 7 (zawężenie `citesAtc` + harmonogram watch). Repo: `github.com/dominikpater-hub/Krag`.

---

## TOR 1 — Ludzie i mandat (zacząć TERAZ, najdłuższy czas)

1. **[Ś] Mandat środowiska (GIPA).** Pierwszy telefon: Buddy Polska (`czesc@buddy-polska.pl`). Trzy pytania z GENESIS/G: czy jest potrzeba, czy są osoby gotowe współtworzyć, kto firmuje treść medyczną. **Blokuje uruchomienie społeczności.** Bez odpowiedzi „tak” — projekt się nie rozwija dalej społecznościowo.
2. **[L] Podpis lekarza zakaźnika.** Arkusz gotowy (`review/`), 82 wpisy medyczne + 22 z odbudowy czekają. Bez tego `dist/` jest pusty i aplikacja pokazuje „nie mamy tego jeszcze”. **To jest wąskie gardło całego projektu.**
3. **[L] Prawnik.** Bloki `prawo` (10), `granice` (3), `leczenie-pl` (3) + ocena kwalifikacji wyrobu medycznego (MDR) i RODO.
4. **[Ś] Osoba z mandatem środowiska.** Blok `stygma` (5) — o języku nie orzeka lekarz.

## TOR 2 — Decyzje właściciela (szybkie, odblokowują kod)

- **[W] O-08 model moderacji — PILNE.** K-26 włączył rozmowy 1:1; kanał prywatny przy wrażliwej grupie wymaga ścieżki zgłoszeń z człowiekiem. To warunek bezpiecznego uruchomienia rozmów.
- **[W] D3 — nazwa i ikona (O-01).** „Krąg” to nazwa robocza, do oddania środowisku.
- **[W] D4 — czy 116 111 zostaje (O-06).** Linia dla dzieci na ekranie kryzysowym dla dorosłych.
- **[W] O-03 — licencja Liverpool.** Odblokowuje interakcje ponad poziom klas (dziś baza to `AI_DRAFT`).
- ~~**O-05 — Ida: zakładka vs asystent z każdego ekranu.**~~ **Rozstrzygnięte (K-28): Ida prowadzi** — obecna w całej apce, 3 poziomy, wdrożone w prototypie.
- **[W] O-09 — lokalizacja hostingu.** Rekomendacja robocza [C]: **Scaleway Warszawa (WAW)** — dane fizycznie w PL (argument zaufania dla środowiska/mandatu GIPA), firma UE, poza CLOUD Act, ~4,99 €/mies. Plan B: **Hetzner DE/FI** (~4,50 €, najprościej). Do akceptacji właściciela — zmiana to jedna linijka w infrze.
- **[C] Szkielet `krag-app` gotowy** (dostarczony jako zip): PWA — klucz lokalny + kod zaproszenia, pseudonim, fraza odzyskiwania, dziennik w IndexedDB, offline SW. Backend/Signal/moderacja jako TODO. **Do opublikowania jako osobne repo** (ta sesja jest związana z `ProjektKrag`, więc nowego repo nie utworzę zdalnie — właściciel tworzy `krag-app` i pushuje).
- **[W] O-10 — retencja i eksport (RODO art. 20).** Do domknięcia w checklistcie prawnej (`ARCHITEKTURA-K27.md §9`) przy DPIA.
- **[W] Potwierdzić weryfikatora `prep-pl`** (kod ustawiłem na zakaźnika wg C.2 — do akceptacji).

## TOR 3 — Kod (moje, bez blokerów zewnętrznych)

- **[C] Audyt wiedzy — 112 faktów zdanie po zdaniu vs research** (`AUDYT-WIEDZY.md`, zadanie 19): wierność parafrazy i trafność przypisu.
- **[C] Moduły 1 i 6 Trenera odporności** (zadanie 21): draft treści z gotowego researchu „Odbudowa” → do kolejki podpisu (nie publikuję bez [L]).
- **[C] KROK 3 — dług słownikowy:** ostrożny, ręczny przegląd z testem po każdej zmianie (ryzyko na kanonicznym pliku).
- **[C] KROK 2 — długi ogon 27 języków:** architektura gotowa; wypełnienie to **[T]** (nie zmyślam tłumaczeń medycznych).

## TOR 4 — Dane, świeżość, weryfikacja terenowa

- **[W] Włączyć GitHub Actions** (zakładka Actions w repo) → `watch.js` rusza codziennie.
- **[Ś/W] Telefoniczne potwierdzenie 21 placówek** oznaczonych w `places-2026-07.json` (w tym 4 realne konflikty źródeł: pep-0008, pep-0016, pep-0021, wsp-0001).
- **[L] 9 luk dla konsultanta** (`AUDYT-WIEDZY` §3A): okienka serologiczne, skład PEP, lista chorób wskaźnikowych AIDS, zawody, ubezpieczenia, Stigma Index, prawa NGO, EACS/INR.
- **[C/W] Nowe researche** (zadanie 22): ścieżka uchodźcy UK/RU po specustawie; dane/licencja Liverpool.

## TOR 5 — Poza zakresem do czasu podpisu (najdroższe, najpóźniej)

Backend i konta · moderacja jako etat · szyfrowanie i transport rozmów · prawdziwe tłumaczenie maszynowe wpisów · licencja Liverpool · ocena prawna MDR i RODO · umowa z organizacją pacjencką. Każde zależy od podpisu/mandatu i kosztuje więcej niż cała reszta razem.

---

## Co proponuję robić TERAZ

- **Ty [W]:** wyślij pytanie do Buddy Polska (tor 1.1) i włącz Actions (tor 4). To dwie rzeczy o najdłuższym czelu, które ruszają dziś.
- **Ja [C]:** biorę moduły 1 i 6 z researchu (tor 3) — draft do kolejki podpisu — oraz audyt 112 faktów zdanie po zdaniu. Nic z tego nie publikuję bez [L], ale przygotowuję tak, żeby lekarz dostał gotowe do podpisania.
- **Decyzje [W]:** D3, D4, O-03, O-05, O-08 — im szybciej, tym mniej kodu czeka.

Aktualny szczegółowy stan techniczny: `PROGRESS.md`. Audyt wiedzy: `AUDYT-WIEDZY.md`.
