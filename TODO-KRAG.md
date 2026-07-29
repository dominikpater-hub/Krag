# Krąg — rzeczy do zrobienia

Stan: 2026-07-28. Lista otwartych zadań całego projektu (kod + decyzje + prawo). Kolejność oddaje bramki z `ROADMAP-KRAG.md` i decyzje z `DECYZJE-2026-07-27.md`. Znaczniki: ⏳ czeka, 🔴 blokada/decyzja właściciela, 🟢 gotowe (dla kontekstu).

## Zrobione (kontekst)

- 🟢 Backend rdzeń: konta, zaproszenia, logowanie kluczem (challenge-response), PreKeys, koperty E2E, zgłoszenia. Testy przechodzą.
- 🟢 Klient E2E interim (`lib/e2e.js`): ECDH→HKDF→AES-GCM; serwer nie ma klucza.
- 🟢 Spięcie klient↔backend (`lib/api.js`, `lib/identity.js`) + test integracyjny na prawdziwym serwerze (5/5).
- 🟢 UI aplikacji spięte z backendem — wejście z zaproszenia, logowanie kluczem, rozmowy 1:1 (ten commit).

## Rozmowy 1:1 — domknięcie do pilotażu

1. ⏳ **Zabezpieczenia K-26 w kliencie**: blokuj/zgłoś w wątku, warstwa kryzysowa (wykrycie fraz → kontakt do pomocy), znacznik „↻ przetłumaczone z…". Częściowo jest zgłoszenie; reszta do dodania.
2. 🔴 **Deploy (O-09)** — wymaga akceptacji hostingu (rekomendacja: Scaleway, UE/RODO). Bez tego aplikacja nie ma serwera produkcyjnego; dziś działa lokalnie (dev-server na pamięci).
3. ⏳ **Wymiana interim-crypto na libsignal** (`libsignal-client`) — forward secrecy + post-compromise security. Interfejs `lib/e2e.js` celowo wąski, żeby podmiana nie ruszała UI.
4. ⏳ **Rate-limiting i nadużycia** na endpointach (zaproszenia, wysyłka) — twardsze limity + obserwowalność.
5. ⏳ **Powiadomienia push** o nowej wiadomości (Web Push) — dziś klient odpytuje skrzynkę.

## Moderacja (O-08)

6. 🔴 **Człowiek do moderacji** — etat/dyżur, nie tylko kolejka. Decyzja organizacyjna + budżet.
7. ⏳ **Panel moderacji** — konsumpcja kolejki `reports`, akcje (ostrzeżenie, blokada, eskalacja).
8. ⏳ **Ścieżki eskalacji** i zasady (regulamin społeczności) — treść + proces.

## Grupy (K-31) — po 1:1

9. ⏳ **Budowa grup wg `PROJEKT-GRUPY-MLS.md`** — biblioteka MLS, model danych, cykl życia, moderacja grupowa. Bramki: 1:1 działa + moderacja + mandat środowiska.
10. 🔴 **Decyzje otwarte grup** (sekcja 9 projektu): wybór biblioteki MLS, kto tworzy grupy, widoczność członkostwa, limit rozmiaru, retencja.

## Prawo i zaufanie

11. 🔴 **RODO/DPIA** — ocena skutków dla ochrony danych (dane wrażliwe: status HIV). Wymóg przed publicznym pilotażem.
12. ⏳ **Polityka prywatności + regulamin** napisane pod realny model danych (pseudonim, brak treści na serwerze, metadane).
13. ⏳ **Audyt bezpieczeństwa** — przegląd krypto (libsignal/MLS), przegląd serwera, pen-test przed skalą.
14. 🔴 **Mandat środowiska** — konsultacja z organizacjami pacjenckimi/HIV zanim ruszą grupy tematyczne.

## Produkt / treść

15. ⏳ **Baza wiedzy** (`facts-hiv-2026-07.json`, KRAG) — integracja z aplikacją (Ida odpowiada z bazy), aktualizacja i weryfikacja źródeł.
16. ⏳ **Onboarding Idy** — dopracowanie tonu i ścieżki pierwszego wejścia.
17. ⏳ **Dostępność (a11y)** i pełna wersja PL + plan tłumaczeń.

## Techniczne długi

18. ⏳ **Pełna lista BIP-39** (2048 słów) zamiast skróconej listy demonstracyjnej w kliencie.
19. ⏳ **Backup/odtwarzanie konta** z frazy odzyskiwania (dziś fraza jest pokazana, ale odtwarzanie klucza z niej nie jest jeszcze zaimplementowane).
20. ⏳ **CI** (testy serwera + klienta na każdy push).
