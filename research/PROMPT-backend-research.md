# Prompt pod deep-research: backend i hosting dla „prawdziwego" Kręgu (architektura hybrydowa)

## Kontekst dla modelu
Krąg to **niekomercyjna** aplikacja wsparcia rówieśniczego dla osób żyjących z HIV w Polsce. Zapada decyzja o architekturze **hybrydowej (K-27)**:
- **Warstwa społeczności** (wspólny pokój, rozmowy 1:1, profile) — na backendzie, ale **wyłącznie pseudonimy, zero danych osobowych** (brak imienia, e-maila, telefonu, lokalizacji).
- **Dane zdrowotne** (dzienniczek wyników, leki, przypomnienia) — **zostają na urządzeniu i nigdy go nie opuszczają** (K-04, D.5).
- Rejestracja przez **kod zaproszenia**, nie e-mail. „Logowanie" = klucz na urządzeniu + kod dostępu.
- Rozmowy 1:1 najlepiej **szyfrowane end-to-end**.

## Twarde ograniczenia (nie preferencje)
1. **RODO art. 9** — sam fakt korzystania powiązany ze statusem HIV to szczególna kategoria danych. Architektura ma **nie tworzyć** po stronie serwera zbioru, który ujawnia, że ktoś jest osobą z HIV. Preferowane: serwer nie wie nic poza pseudonimem i zaszyfrowaną treścią.
2. **Rezydencja danych w UE** (nie USA — Schrems II, brak transferu do krajów bez adekwatności).
3. **Niski budżet, brak etatu DevOps** — utrzymywalne przez jedną osobę + granty.
4. **Anonimowość jako obrona** — aplikacja nie może wydać użytkownika ani osobie, która weźmie mu telefon, ani twórcom.
5. **Moderacja** — musi istnieć kolejka zgłoszeń (blokuj/zgłoś) z człowiekiem po drugiej stronie.

## Pytania badawcze
1. **Stos backendu.** Porównaj pod kątem powyższych ograniczeń: własny hosting (PostgreSQL + minimalne API) vs BaaS open-source samohostowalny (Supabase, Appwrite, PocketBase, Nhost) vs komercyjny (Firebase). Dla każdego: region UE, model cenowy przy ~1000–5000 użytkowników, ile pracy utrzymaniowej, czy da się nie przechowywać danych identyfikujących.
2. **Szyfrowanie rozmów E2E.** Realne biblioteki/protokoły do 1:1 i małych grup: Signal Protocol (libsignal), MLS (RFC 9420), Matrix/Olm. Która jest wdrażalna przez mały zespół w aplikacji mobilnej/PWA, z zarządzaniem kluczami bez konta e-mail?
3. **Model kont bez tożsamości.** Wzorce „account = klucz na urządzeniu": passkeys/WebAuthn bez e-maila, klucze lokalne + kod zaproszenia, odzyskiwanie konta bez danych osobowych (seed phrase? kod na papierze?). Kompromisy między odzyskiwalnością a anonimowością.
4. **Rejestracja przez zaproszenie.** Wzorce invite-only bez zbierania danych zapraszającego/zapraszanego; ograniczanie nadużyć (spam/abuse) bez identyfikacji.
5. **RODO w praktyce.** Minimalny zestaw: podstawa przetwarzania, DPIA dla danych szczególnej kategorii, prawa do usunięcia/eksportu przy danych na urządzeniu, umowa powierzenia z hostingiem UE. Co jest bezwzględnie wymagane przed publiczną rejestracją.
6. **Moderacja przy treści zaszyfrowanej.** Jak pogodzić E2E z moderacją: zgłoszenia inicjowane przez użytkownika (ujawnia wybrany wątek), listy blokad lokalne, brak skanowania treści. Wzorce z aplikacji dla grup wrażliwych.
7. **PWA vs natywna.** Czy Progressive Web App wystarcza (offline, powiadomienia, dane lokalne) czy potrzebna aplikacja natywna — pod kątem prywatności (brak sklepu = brak metadanych?) i dostępności.

## Format odpowiedzi
Rekomendacja jednego stosu + uzasadnienie względem 5 ograniczeń, tabela porównawcza opcji, lista „must-have przed publiczną rejestracją", oraz jawne ryzyka i czego NIE wiadomo. Źródła z datami.
