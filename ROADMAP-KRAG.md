# Roadmapa Kręgu — od dziś do pełnego Kręgu

Stan: 2026-07-28. Ten dokument spina **całą** drogę realizacji do działającego, publicznego Kręgu. Konsoliduje `PLAN-DZIALANIA.md`, `ARCHITEKTURA-K27.md`, `AUDYT-WIEDZY.md` i dziennik decyzji w jeden fazowy plan.

## Zasada nadrzędna (nie zmienia się)

**Wąskim gardłem nie jest kod — jest podpis lekarza, mandat środowiska i dokumenty prawne.** Dlatego tory ludzkie (Faza 1) startują natychmiast i lecą przez cały czas, a kod (Fazy 2–3) biegnie równolegle, ale **nic medycznego nie publikuje się bez [L], a społeczność nie rusza bez mandatu [Ś] i moderacji [O-08]**. „Pełny Krąg" to moment, w którym wszystkie bramki są zielone jednocześnie.

Legenda właściciela: **[W]** właściciel · **[C]** kod/ja · **[L]** lekarz/prawnik · **[Ś]** środowisko/organizacja · **[T]** tłumacz.

## Dwa tory, jedno źródło prawdy

- **ProjektKrag (prototyp + biblioteka wiedzy)** — pokazuje możliwości i **jest źródłem treści**. Pipeline: seed → `entries/` → walidacja → weryfikacja ([L]) → `dist/` → `knowledge.json`. Zostaje żywy jako poligon UX i redakcji.
- **Krag-app (prawdziwa aplikacja, PWA)** — produkcyjny klient (K-27/K-30). **Konsumuje `knowledge.json`** z biblioteki. Tu dochodzi backend, konta, rozmowy E2E.

Reguła: treść i UX dojrzewają w prototypie → sprawdzone rzeczy lądują w Krag-app. Biblioteka jest wspólna; nie duplikujemy wiedzy.

---

## FAZA 0 — Stan obecny (zrobione)

| Obszar | Stan |
|---|---|
| Prototyp (ProjektKrag) | v22: Ida prowadzi (3 poziomy, K-28), mapa 81 placówek, Trener wiedzy, wyszukiwarka 56 marek ARV + interakcje, rozmowy 1:1 (demo, K-26), kafelek „Współtwórz Krąg" (K-29). Na Vercelu. |
| Biblioteka | Pipeline działa, **223 wpisy DRAFT**, `dist/` pusty do podpisu. Audyt wierności 110/112. |
| Architektura | K-27 (hybryda) + K-30 (stos) rozpisane; checklista prawna §9. |
| Krag-app | **Szkielet PWA opublikowany**: konto na kluczu lokalnym + kod zaproszenia, pseudonim, fraza odzyskiwania, dziennik w IndexedDB, offline. Backend/E2E/moderacja = TODO. |
| Marka | Ikona **enso** (C-1), nazwa „Krąg" (robocza, do oddania środowisku). |
| Hosting | Rekomendacja **Scaleway WAW** (O-09, do akceptacji). |

---

## FAZA 1 — Fundamenty ludzkie i prawne  ⟵ **KRYTYCZNA ŚCIEŻKA, start teraz**

Najdłuższy czas realizacji, dlatego rusza pierwsza i trwa równolegle do całego kodu.

1. **[Ś/W] Mandat środowiska (GIPA).** Pierwszy telefon: Buddy Polska (`czesc@buddy-polska.pl`). Trzy pytania: czy jest potrzeba, czy są osoby gotowe współtworzyć, kto firmuje treść. **Blokuje uruchomienie społeczności.**
2. **[L] Podpis lekarza zakaźnika.** 215 wpisów medycznych + 8 modułów (pierwsze-dni, długoterminowo) czeka na DRAFT→PUBLISHED. **To bramka całego projektu** — bez tego `dist/` pusty i apka mówi „nie mamy tego jeszcze". Arkusz recenzencki gotowy (`review/`).
3. **[L] 9 luk konsultanta** (`AUDYT-WIEDZY §3A`): okienka serologiczne, skład PEP, choroby wskaźnikowe AIDS, zawody, ubezpieczenia, Stigma Index, prawa NGO, EACS/INR.
4. **[L] Prawnik — pakiet RODO/DSA** (`ARCHITEKTURA-K27 §9`): DPIA (art. 35), rejestr czynności (art. 30), **wyraźna zgoda art. 9 ust. 2 lit. a**, DPA z hostingiem, analiza IOD (art. 37), notice-and-action (art. 16 DSA), ocena MDR. Bloki `prawo`/`granice`/`leczenie-pl` do podpisu prawnego.
5. **[Ś] Mandat języka.** Blok `stygma` (5 wpisów) — o języku nie orzeka lekarz, tylko środowisko.

**Definicja done Fazy 1:** `dist/` niepusty (treść podpisana), komplet dokumentów prawnych, „tak" od organizacji pacjenckiej, kto moderuje (O-08).

---

## FAZA 2 — Backend i tożsamość (kod, równolegle; deploy dopiero po O-09)

Stos wybrany (K-30). Buduję kod niezależnie od bramek, ale na produkcję wchodzi po Fazie 1 + akceptacji hostingu.

1. **[W] Akceptacja O-09** — Scaleway WAW vs Hetzner. Odblokowuje staging.
2. **[C] ✅ Schemat PostgreSQL — minimalny rekord** (K-04): `pseudonim`, `klucz_publiczny`, `koperty` (zaszyfrowane), `znacznik_czasu`, graf zaproszeń na kluczach. Zero PII. → `Krag-app/server/schema.sql`.
3. **[C] ✅ Cienkie API (TypeScript/Fastify):** rejestracja kodem zaproszenia, logowanie challenge-response (ECDSA P-256), publikacja/pobranie PreKeys, skrzynka kopert (kasowana po odbiorze), endpoint zgłoszeń. Testy integracyjne na pg-mem: **3/3 zielone**. → `Krag-app/server/`.
4. **[C] E2E rozmów — Signal Protocol** (`libsignal-client`, PreKeys) — po stronie klientów. API już przenosi PreKeys i koperty; właściwe szyfrowanie = następny krok. Audyt biblioteki (CVE).
5. **[C] ~częściowo~ Anty-abuse:** jednorazowe kody zaproszeń + limit 5 aktywnych — **gotowe**. Privacy Pass / proof-of-work — TODO.
6. **[C/W] ~szkielet gotowy~ Moderacja — message franking** (po O-08): endpoint `/reports` + kolejka są; człowiek po drugiej stronie = decyzja O-08.
7. **[C] Utwardzenie przed produkcją:** hash kodów/tokenów w bazie, minimalizacja metadanych kopert; **staging na Scaleway WAW** + backupy + DPA — po O-09 i checklistcie prawnej.

**Definicja done Fazy 2:** działający, przetestowany backend na stagingu; serwer widzi tylko pseudonim + koperty; rozmowy szyfrowane end-to-end; zgłoszenia trafiają do kolejki. **Stan: rdzeń API gotowy i przetestowany lokalnie; zostaje E2E po stronie klienta, utwardzenie i deploy.**

---

## FAZA 3 — Prawdziwy klient (Krag-app dorasta z prototypu)

1. **[C] Wiedza w Krag-app:** wczytanie `knowledge.json` (z podpisanego `dist/`), ścieżki, Trener wiedzy, mapa poradni, wyszukiwarka ARV + interakcje — port z prototypu.
2. **[C] Ida prowadzi (3 poziomy)** w PWA — jak w prototypie (wejście, odprawa, przewodnik kontekstowy z twardą granicą „nie interpretuję Twoich wyników").
3. **[C] Dziennik zdrowia** — już lokalny; dopiąć **eksport/usunięcie (RODO art. 20)**, pełną frazę **BIP-39**, `navigator.storage.persist()`, wyraźne ostrzeżenie o backupie.
4. **[C] Warstwa E2E po stronie klienta (Signal Protocol)** — NOWY, wydzielony krok:
   a. integracja `libsignal-client` w PWA (generacja identity key + signed prekey + one-time prekeys **lokalnie**, publikacja tylko kluczy publicznych przez `POST /keys`);
   b. nawiązanie sesji (pobranie paczki odbiorcy `GET /keys/:pseudonym`, model PreKeys);
   c. szyfrowanie/odszyfrowanie wiadomości; backend przenosi tylko koperty (`/envelopes`);
   d. przechowanie stanu sesji Signal lokalnie (IndexedDB), objęte backupem klucza;
   e. audyt biblioteki + śledzenie CVE (dotyczy też Signala).
5. **[C] ✅ Działające rozmowy 1:1:** aplikacja spięta z backendem — wejście z zaproszenia → logowanie kluczem → ekran rozmów (lista/wątek/kompozytor) → wiadomości szyfrowane E2E przez prawdziwy serwer. Zweryfikowane: 5/5 testów serwera + **test E2E w przeglądarce** (dwie sesje wymieniają zaszyfrowaną wiadomość). Zostaje do pilotażu: zabezpieczenia K-26 (warstwa kryzysowa, „↻ przetłumaczone z…"), wymiana interim-crypto na libsignal, **deploy (O-09)**. Pełna lista: `TODO-KRAG.md`.
6. **[C] PWA dopięte:** manifest, service worker, push (iOS 16.4+ „dodaj do ekranu"), ikona enso (zrobione).
7. **[C] Profil: rola i status** — rola (plhiv/partner/bliska) + **tik „jestem wprowadzającym" (buddy)** dodany w prototypie; do przeniesienia do Krag-app.
8. **[T] Długi ogon języków** (KROK 2) i ręczny przegląd słownika (KROK 3) — praca tłumacza-człowieka, nie generuję zmyślonych tłumaczeń medycznych.

**Zamknięte grupy tematyczne (K-31) — zdecydowane, w Fazie 5→6.** Właściciel wybrał **zamknięte, moderowane grupy tematyczne** (np. „świeża diagnoza", „rodzice"), nie otwarte pokoje. Wchodzą **po** uruchomieniu 1:1 i moderacji, bo wymagają: **MLS (RFC 9420)** jako grupowego E2E (osobny od Signala, model grup/członkostwa/kluczy w backendzie), **moderatora-człowieka** w kontekście grupowym (O-08+), oraz **mandatu środowiska** co do zakresu tematów. Przed budową: osobny **projekt grup** (model danych, MLS, moderacja grupowa, ryzyka deanonimizacji). Sekwencja bez zmian: **1:1 najpierw**, grupy nie wyprzedzają rozmów jeden-na-jeden.

**Definicja done Fazy 3:** Krag-app pokazuje **podpisaną** wiedzę, prowadzi dziennik lokalnie z backupem/eksportem, umożliwia szyfrowane rozmowy 1:1 — wszystko na anonimowym koncie.

---

## FAZA 4 — Dane, świeżość, weryfikacja terenowa (równolegle do 2–3)

1. **[W/L] Licencja Liverpool** (interakcje ponad poziom klas) — kontakt `interactions@liverpool.ac.uk`, ustalić API vs zrzut; do czasu zgody zostajemy na klasach (K-15).
2. **[Ś/W] Telefoniczne potwierdzenie 21 placówek** (w tym 4 realne konflikty źródeł).
3. **[W] watch.js produkcyjnie** — włączyć GitHub Actions; kwartalny przegląd faktów wygasających (PrEP, program ARV, art. 161 KK, PTN AIDS/EACS).
4. **[C/W] Nowy research:** ścieżka uchodźcy UK/RU po specustawie (dostęp do NFZ/ARV).

---

## FAZA 5 — Pilotaż zamknięty

1. **[Ś/W] Mała grupa na zaproszenia** z mandatem środowiska; moderator (etat lub przeszkolony wolontariusz) realnie dyżuruje.
2. **[C] Audyt bezpieczeństwa** wybranej biblioteki E2E; podstawowy test penetracyjny backendu; weryfikacja backupów.
3. **[W/Ś] Pętla feedbacku** (kafelek „Współtwórz Krąg") → kolejka treści i UX.
4. **[L] Ostatni przegląd** treści i granic Idy na realnych pytaniach pilotażu.

**Definicja done Fazy 5:** pilotaż bez incydentów bezpieczeństwa; moderacja działa z człowiekiem; treść i granice potwierdzone w praktyce.

---

## FAZA 6 — Pełny Krąg (launch publiczny)

Wchodzi, gdy **wszystkie bramki są zielone naraz**:

- ✅ treść medyczna **podpisana** (`dist/` pełny), utrzymywana przez watch.js;
- ✅ komplet dokumentów prawnych (DPIA, zgoda art. 9(2)(a), DPA, IOD, DSA);
- ✅ **mandat środowiska** i osoba/organizacja firmująca;
- ✅ **moderacja z człowiekiem** (O-08) na produkcji;
- ✅ backend na Scaleway WAW, rozmowy E2E, konta anonimowe;
- ✅ nazwa i ikona zaakceptowane (docelowo oddane środowisku).

**Definicja „pełnego Kręgu":** osoba dostaje zaproszenie → zakłada anonimowe konto (klucz lokalny, bez PII) → czyta **zweryfikowaną** wiedzę i chodzi ścieżkami z Idą → prowadzi dziennik zdrowia **lokalnie** (z backupem i eksportem) → rozmawia 1:1 z **szyfrowaniem E2E** → może zablokować/zgłosić do **człowieka** → a cała treść medyczna jest podpisana i na bieżąco odświeżana. Rejestracja publiczna, ale zawsze na zaproszenia — wzrost organiczny.

---

## Ścieżka krytyczna w jednym zdaniu

Kod (Fazy 2–3) skończę szybciej, niż dojrzeją **podpis lekarza, dokumenty prawne i mandat środowiska** (Faza 1) — więc **to one wyznaczają datę** pełnego Kręgu. Najlepsze, co możemy zrobić dziś: [W] wysyła pytanie do Buddy Polska i szuka zakaźnika/prawnika; [C] buduje backend i dorasta Krag-app, żeby w dniu podpisu wszystko było gotowe do włączenia.

## Co robić w tym tygodniu

- **[W]** telefon/mail do Buddy Polska (Faza 1.1); akceptacja hostingu O-09; szukanie zakaźnika do podpisu.
- **[C]** schemat Postgres + szkielet API TS (Faza 2.2–2.3), bez deployu — żeby czekało gotowe.
- **[W/Ś]** decyzja O-08 (kto moderuje) — odblokowuje rozmowy i Fazę 5.
