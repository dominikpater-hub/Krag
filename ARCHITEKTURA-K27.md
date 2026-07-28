# Architektura „prawdziwego" Kręgu (K-27, hybryda)

Stan: 2026-07-27. Rozrysowanie decyzji **K-27** (hybryda) na konkret: **co żyje na telefonie, co na backendzie, jak działa zaproszenie i klucze.** To jest projekt, nie kod produkcyjny — kod czeka na decyzje TOR 2 (O-08 moderacja, O-09/O-10 backend/RODO) i podpis lekarza. Dokument ma jedną nadrzędną zasadę, z której wszystko wynika:

> **K-04: zero danych osobowych.** Backend nigdy nie może poznać, kim jesteś. Wszystko, co pozwala Cię zidentyfikować albo powiązać z Twoim zdrowiem, zostaje na Twoim telefonie. Backend widzi wyłącznie pseudonimy i zaszyfrowane paczki, których sam nie potrafi odczytać.

---

## 1. Linia podziału: telefon vs backend

Zasada cięcia: **jeśli dane są o Twoim zdrowiu albo o Tobie — nie opuszczają telefonu.** Backend istnieje tylko po to, żeby dwie osoby mogły się nawzajem znaleźć i wymienić zaszyfrowane wiadomości, oraz żeby dostarczyć podpisaną wiedzę i mapę. Nic więcej.

| Warstwa | Gdzie żyje | Dlaczego |
|---|---|---|
| **Dziennik zdrowia** (CD4, VL, leki, nastrój, notatki, daty) | **tylko telefon**, szyfrowany at-rest | To dane wrażliwe RODO art. 9. Backend ich nie widzi — więc nie ma czego wyciec ani czego wydać na żądanie. |
| **Stan Trenera wiedzy** (powtórki, postęp ścieżek) | **tylko telefon** | Ujawnia, czego się uczysz → pośrednio status. Zostaje lokalnie. |
| **Baza wiedzy** (`knowledge.json`, fakty, ścieżki) | **wbudowana w apkę + aktualizacje z backendu** (pobierana, nie wysyłana) | Wiedza jest publiczna i jednakowa dla wszystkich. Płynie tylko w dół: serwer → telefon. |
| **Mapa poradni** (`places`) | **wbudowana + aktualizacje z backendu** | Jak wyżej — publiczna, tylko pobierana. |
| **Twój profil w apce** (pseudonim, rola plhiv/partner/bliska, język) | **telefon** (źródło prawdy) + na backendzie **tylko pseudonim + klucz publiczny** | Rola i język sterują apką lokalnie; backend nie musi ich znać. |
| **Rozmowy 1:1 (K-26)** | **treść szyfrowana E2E** — backend przenosi tylko „koperty", których nie umie otworzyć | Kanał prywatny wrażliwej grupy. Serwer to skrzynka pocztowa, nie czytelnik. |
| **Zaproszenia / rejestracja** | backend: pula kodów + graf „kto kogo zaprosił" **na kluczach publicznych**, bez tożsamości | Trzeba wpuścić nowego, nie wiedząc kim jest. |
| **Kolejka zgłoszeń (moderacja O-08)** | backend: minimum — zgłoszony fragment + pseudonim zgłaszanego | Bezpieczeństwo grupy wymaga człowieka po drugiej stronie; ale przechowujemy najmniej, jak się da. |

Reguła kciuka do każdej przyszłej funkcji: **„czy backend musi to widzieć, żeby dwie osoby się połączyły?"** Jeśli nie — zostaje na telefonie.

---

## 2. Konto bez tożsamości: klucze zamiast loginu

Nie ma e-maila, nie ma numeru telefonu, nie ma hasła na serwerze. **Twoje konto to para kluczy kryptograficznych wygenerowana na telefonie.**

**Przy pierwszym uruchomieniu (po wpisaniu kodu zaproszenia):**
1. Telefon generuje **parę kluczy** (prywatny + publiczny). Klucz prywatny **nigdy** nie opuszcza urządzenia.
2. Pseudonim (np. „ktoś z kręgu #A7F3") wywodzi się z klucza publicznego — jest stały, ale nic nie znaczy.
3. Backend zapisuje tylko: `klucz_publiczny → pseudonim → „zaproszony przez klucz X"`. Koniec. Zero pola na imię, e-mail, cokolwiek.

**Logowanie** = posiadanie klucza prywatnego na urządzeniu. Nie „wpisuję hasło", tylko „to urządzenie ma klucz".

**Konsekwencje, które trzeba świadomie przyjąć (do decyzji O-10):**
- **Nowy telefon = nowe konto**, chyba że zrobimy eksport/przeniesienie klucza (backup zaszyfrowany frazą odzyskiwania — użytkownik zapisuje 12 słów; my ich nie znamy).
- **Reset niemożliwy przez nas.** Nie ma „przypomnij hasło", bo nie mamy do czego. To cena anonimowości — trzeba ją opisać uczciwie przy onboardingu (rola Idy, K-28).
- **Dziennik zdrowia** też szyfrowany kluczem urządzenia → jego backup idzie razem z frazą odzyskiwania, lokalnie/na własny dysk użytkownika, nie na nasz serwer.

---

## 3. Zaproszenie: jak wpuścić nowego, nie wiedząc kim jest

Krąg jest **na zaproszenie** (spójne z „progiem wejścia" i ekranem „Zanim się zgłosisz"). Model:

1. Osoba w kręgu generuje **jednorazowy kod zaproszenia** (backend wydaje losowy token, wiąże go z kluczem publicznym zapraszającego, ustawia limit ważności i „na 1 użycie").
2. Kod przekazywany **poza apką** (SMS, komunikator, kartka) — my nie wysyłamy e-maili/SMS, więc nie zbieramy kontaktów.
3. Nowa osoba wpisuje kod → apka generuje jej klucze (sekcja 2) → backend „spala" kod i zapisuje krawędź grafu `zapraszający → zaproszony` na kluczach publicznych.

**Po co graf zaproszeń (na kluczach, nie na ludziach):**
- **Moderacja (O-08):** przy poważnym nadużyciu można unieważnić poddrzewo („kto wpuścił trolla") bez znania czyjejkolwiek tożsamości.
- **Ochrona przed zalewem:** limit zaproszeń na konto trzyma wzrost organiczny i utrudnia masowe zakładanie kont.
- Graf **nie** służy do rekomendacji ani „znajomych" — to wyłącznie narzędzie bezpieczeństwa. Do rozważenia (O-10), czy w ogóle go trzymać, czy tylko licznik.

---

## 4. Rozmowy 1:1 (K-26) — serwer jako ślepa skrzynka

K-26 włączył rozmowy; K-04 mówi „serwer nie wie kim jesteś". Godzi to **szyfrowanie end-to-end**:

- Każda wiadomość szyfrowana **kluczem publicznym odbiorcy** na telefonie nadawcy. Backend przenosi „kopertę", której **nie umie otworzyć**.
- Zabezpieczenia z DECYZJA-K26 działają **na telefonie, przed zaszyfrowaniem/po odszyfrowaniu**: skan kryzysowy `risky()` (numer 800 70 2222), pasek „↻ przetłumaczone z…", Blokuj/Zgłoś na górze.
- **Zgłoszenie (O-08)** to jedyny moment, gdy treść opuszcza parę: zgłaszający **świadomie odszyfrowuje** konkretny fragment i wysyła go do kolejki moderacji z pseudonimem zgłaszanego. Bez zgłoszenia — serwer nie ma jak przeczytać nic.
- **Metadane to realne ryzyko:** serwer widzi „pseudonim A pisał do pseudonima B o 14:03". Do decyzji O-10: minimalizacja i retencja metadanych (kasowanie po dostarczeniu, brak logów historii).

To jest granica, której prototyp **nie** realizuje: dziś rozmowa siedzi lokalnie, bez sieci. Prawdziwy komunikator = ten rozdział + backend + etat moderacji.

---

## 5. Kolejka moderacji (O-08) — minimum wiedzy, człowiek na końcu

Kanał prywatny wrażliwej grupy **nie może** istnieć bez ścieżki zgłoszeń z człowiekiem (DECYZJA-K26). Model minimalny:
- Zgłoszenie zawiera **tylko** odszyfrowany fragment + pseudonim + znacznik czasu. Bez historii rozmowy, bez tożsamości.
- Moderator (człowiek — to **etat**, nie funkcja) może: ostrzec, wyciszyć pseudonim, unieważnić konto/poddrzewo zaproszeń.
- Wszystko na pseudonimach i kluczach — moderator też nie poznaje tożsamości.
- **To jest decyzja O-08 i warunek uruchomienia rozmów** — nie odblokowuję rozmów produkcyjnie, dopóki właściciel nie zdecyduje, kto moderuje.

---

## 6. Dwa światy danych — podsumowanie jednym obrazem

```
  TELEFON (prywatne, szyfrowane at-rest)          BACKEND (widzi tylko pseudonimy + koperty)
  ┌─────────────────────────────┐                 ┌──────────────────────────────┐
  │ • dziennik zdrowia CD4/VL    │                 │ • klucz_publiczny → pseudonim │
  │ • leki, nastrój, notatki     │                 │ • graf zaproszeń (na kluczach)│
  │ • stan Trenera wiedzy        │  —— nigdy ——►   │ • koperty E2E (nieczytelne)   │
  │ • klucz PRYWATNY             │   nie wysyła    │ • kolejka zgłoszeń (minimum)  │
  │ • profil: rola, język        │                 │ • dystrybucja knowledge.json  │
  │ • baza wiedzy (kopia)        │  ◄—— pobiera —— │   i places (tylko w dół)      │
  └─────────────────────────────┘                 └──────────────────────────────┘
        źródło prawdy o Tobie                          skrzynka + tablica ogłoszeń
```

---

## 7. Stos technologiczny — rekomendacja z researchu A2 (rozstrzygnięte)

Deep-research backendu wrócił (`research/A2-backend-hosting-rekomendacja.md`) i potwierdził ten podział. Konkretny stos:

| Warstwa | Wybór | Dlaczego |
|---|---|---|
| **Backend** | **własny minimalny stos: PostgreSQL + cienkie API** (Node/TS lub Go) na jednym VPS w UE | Pełna kontrola nad tym, jakie dane w ogóle powstają na serwerze (RODO art. 9). Bez zależności od dostawcy z jurysdykcją USA. Alternatywa niskiego nakładu: **PocketBase** (1 binarka, <30 MB RAM), ale wciąż przed 1.0. |
| **Hosting** | **Hetzner (DE/FI, ~4,50 €/mies.)** albo **OVHcloud / Scaleway — region Warszawa** | Wszystkie trzy: UE, ISO 27001, DPA, poza jurysdykcją USA (Schrems II OK). **Wybór lokalizacji = jedyna otwarta decyzja właściciela (O-09).** Warszawa, jeśli priorytetem są dane fizycznie w Polsce; Hetzner, jeśli najniższy koszt/prostota. |
| **E2E rozmów 1:1** | **Signal Protocol** (`libsignal-client`, oficjalne, typowane TS; model PreKeys) | Najdojrzalszy dla 1:1, PreKeys pasują idealnie do kont bez tożsamości (klient publikuje tylko klucze publiczne). MLS (RFC 9420) dopiero powyżej ~50 tys. użytkowników / większych grup. |
| **Konto** | **lokalny klucz kryptograficzny + kod zaproszenia**, backup przez **frazę odzyskiwania BIP-39** | Passkeys odrzucone jako *główny* mechanizm: synchronizują się przez iCloud/Google → wprowadzają pośrednika chmurowego, sprzeczne z „zero tożsamości". Passkeys tylko opcjonalnie, do odblokowania. |
| **Dane zdrowotne** | **tylko urządzenie: IndexedDB + Web Crypto**, `navigator.storage.persist()` | Zgodne z §1. Ryzyko eviction realne → stąd obowiązkowy backup klucza i eksport dziennika. |
| **Klient** | **PWA wystarcza** (nie natywna) | Web Crypto + IndexedDB + service worker + push (iOS 16.4+ tylko po „dodaj do ekranu"). Zaleta prywatnościowa: brak sklepu = brak deklaracji „Health App" Google/Apple i metadanych konta dewelopera. |
| **Moderacja (O-08)** | **message franking** + kolejka zgłoszeń z człowiekiem | Godzi E2E z moderacją: zgłoszenie ujawnia wybraną wiadomość weryfikowalnie, bez skanowania całości. |
| **Anty-abuse** | jednorazowe kody zaproszeń + opcjonalnie **Privacy Pass / blinded tokens**, proof-of-work | Rate-limiting i atestacja bez PII. |

**Progi zmieniające decyzję:** >50 tys. użytkowników lub etat DevOps → rozważyć MLS i architekturę wielousługową; wejście CSAR z obowiązkowym skanowaniem → ponowna analiza legalności E2E (na lipiec 2026 trilog bez porozumienia, skanowania nie ma).

---

## 8. Granice tego dokumentu

To jest **architektura docelowa**, teraz uzupełniona o rozstrzygnięty stos (A2). Co nadal blokuje budowę produkcyjną:
- **O-09 lokalizacja hostingu** — jedyna otwarta poddecyzja infrastrukturalna (Hetzner DE/FI vs Warszawa OVH/Scaleway); reszta stosu wybrana.
- **O-08** (kto moderuje) — bez człowieka po drugiej stronie rozmowy nie ruszają produkcyjnie.
- **Checklista prawna przed rejestracją** (§9) — DPIA, rejestr czynności, wyraźna zgoda, DPA, IOD, notice-and-action DSA.
- **Podpis lekarza** — bez `dist/` apka i tak nie ma co pokazać.

Kolejność bez zmian: **prototyp** pokazuje możliwości (obecne repo), **prawdziwy Krąg** = osobne repo `krag-app` (PWA), które zakładam po wyborze hostingu (O-09).

## 9. Checklista „must-have" przed publiczną rejestracją (z A2)

Nic z tego nie jest kodem — to warunki prawne wejścia na produkcję, do zrobienia z prawnikiem (TOR 1.3):
1. **DPIA** dla danych szczególnej kategorii (art. 35 ust. 2 lit. b) — szablon EDPB 2026 lub WP248.
2. **Rejestr czynności przetwarzania** (art. 30).
3. **Podstawa prawna: wyraźna zgoda** — art. 9 ust. 2 lit. a + art. 6 ust. 1 lit. a. Granularna, dobrowolna, udokumentowana, łatwa do wycofania; poprzedzona obowiązkiem informacyjnym (art. 13). **Uwaga: NIE art. 9 ust. 2 lit. d** — jego katalog obejmuje tylko cele polityczne/światopoglądowe/religijne/związkowe, nie zdrowotne.
4. **DPA (umowa powierzenia)** z hostingiem UE.
5. **Notice-and-action** (art. 16 DSA) + punkty kontaktowe (art. 11–12) + regulamin (art. 14). Non-profit mikro/mały podmiot ma zwolnienia z art. 20–24, ale art. 11–17 zostają.
6. **Backup klucza E2E** (fraza BIP-39) + `navigator.storage.persist()`.
7. **Analiza wyznaczenia IOD** (prawdopodobnie wymagany, art. 37).
8. **Polityka prywatności** + procedura praw (usunięcie/eksport — lokalnie dla danych zdrowotnych).
