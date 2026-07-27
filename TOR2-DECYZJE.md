# Tor 2 — karta decyzji właściciela

Co musisz rozstrzygnąć, żeby odblokować resztę. Dla każdej: pytanie, opcje, co odblokowuje / co się psuje, rekomendacja. **[W]** = decyzja Twoja.

Dwa nowe zadania (konta/rejestracja + utrzymanie demo) czynią decyzje A1–A3 pilnymi — bez nich „prawdziwego" Kręgu nie da się zbudować.

---

## A. Architektura — wymuszona przez „logowanie + rejestracja"

### A1. Model kont vs zasada K-04 (zero danych osobowych) — NAJWAŻNIEJSZA
Konstytucja (K-04) mówi: brak imienia, e-maila, telefonu, lokalizacji; konto żyje na urządzeniu; „nikt się nie dowie, że tu jesteś". Twoje zadanie („zaloguj się, wprowadź dane, wyślij komuś, kto się zarejestruje") wymaga kont i wieloosobowości. Trzeba wybrać JAK to pogodzić:

- **Opcja 1 — tylko urządzenie + kod zaproszenia.** Konto = klucz na telefonie, „logowanie" = 4-cyfrowy kod (już w prototypie). Zaproszenie = kod, backend tylko przekazuje wiadomości, niczego o zdrowiu nie trzyma; rozmowy szyfrowane end-to-end. **Najbliżej K-04.** Trudniejsze technicznie, brak synchronizacji między urządzeniami.
- **Opcja 2 — konta na backendzie (anonimowe).** Pseudonim zamiast e-maila, dane zdrowotne szyfrowane po stronie serwera. Łatwiejsze (sync, wielourządzeniowość), ale **backend trzyma dane powiązane ze statusem HIV** — to szczególna kategoria RODO i częściowe odwrócenie K-04. Wymaga prawnika i moderacji.
- **Opcja 3 — HYBRYDA (rekomendacja).** Warstwa społeczności (Krąg, rozmowy) na backendzie z **pseudonimami, bez danych osobowych**; **dzienniczek zdrowia zostaje na urządzeniu i nigdy go nie opuszcza** (zgodnie z D.5 i K-04). Zaproszenie rejestruje pseudonim, nie tożsamość. Rdzeń = społeczność (backend), zdrowie = prywatne (telefon). Spójne z całą architekturą.

*Co się psuje, jeśli źle:* wybór Opcji 2 bez prawnika i moderacji = ryzyko deanonimizacji, czyli dokładnie to ryzyko (utrata pracy/związku), przed którym stoi cały projekt.

### A2. Backend i hosting (O-09)
Jeśli A1 = Opcja 1 lub 3 → potrzebny minimalny backend (przekaz wiadomości / pseudonimy). Do wyboru: własny serwer vs usługa (np. Supabase/Firebase — ale uwaga na to, gdzie fizycznie leżą dane; UE, nie USA). **Decyzja:** kto hostuje, w jakim kraju, kto płaci.

### A3. RODO — retencja i eksport danych (O-10)
Prawo do usunięcia i eksportu (art. 15, 17, 20). Gdzie leżą dane zdrowotne (telefon vs serwer z A1), jak długo, jak je skasować. **Wymaga prawnika** przed jakąkolwiek publiczną rejestracją.

---

## B. Bezpieczeństwo społeczności — pilne od włączenia rozmów (K-26)

### B1. Model moderacji (O-08)
Rozmowy 1:1 i wspólny pokój przy wrażliwej grupie wymagają człowieka odbierającego zgłoszenia. **Decyzja:** kto moderuje, ile godzin, opłacany z czego. To etat/rola, nie funkcja w kodzie — i **warunek bezpiecznego uruchomienia społeczności**. Bez tego rozmowy zostają w wersji demo, nie produkcyjnej.

---

## C. Produkt

### C1. Nazwa i ikona (D3 / O-01)
„Krąg" to nazwa robocza. GENESIS oddaje ją środowisku/osobom, które będą to miały na telefonie. **Decyzja:** zostaje „Krąg" czy rozstrzyga to organizacja partnerska.

### C2. Linia 116 111 na ekranie kryzysowym (D4 / O-06)
Linia dla dzieci i młodzieży w apce dla dorosłych: potrzebna pozycja czy szum na ekranie oglądanym w kryzysie. **Decyzja:** zostaje / schodzi.

### C3. Ida — zakładka czy asystent z każdego ekranu (O-05)
Dziś Ida jest zakładką; przycisk „z każdego ekranu" zniknął. **Decyzja:** która forma.

---

## D. Treść

### D1. Licencja Liverpool HIV Drug Interactions (O-03)
Obecna baza interakcji to `AI_DRAFT`. Liverpool jest kanoniczny (100k+ par), bezpłatny w użyciu, ale redystrybucja w apce wymaga zgody. **Decyzja:** wystąpić o licencję czy zostać na poziomie klas (bezpieczne, uboższe).

### D2. Weryfikator `prep-pl`
Kod ustawiłem na zakaźnika (wg C.2). **Decyzja:** potwierdzić czy zmienić.

---

## Kolejność, którą proponuję
1. **A1** (model kont) — bo od tego zależy backend, RODO i cała reszta „prawdziwego" Kręgu.
2. **B1** (moderacja) + **A3** (RODO) — bo bez nich nie wolno wpuścić prawdziwych ludzi.
3. **C1–C3, D1–D2** — lekkie, można rozstrzygnąć w każdej chwili, odblokowują drobny kod.
