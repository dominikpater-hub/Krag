# Bezpieczeństwo — ProjektKrag

## Zgłaszanie podatności

Znalazłeś problem bezpieczeństwa (wyciek danych, obejście bramki publikacji, XSS,
podatność w pipeline)? Nie otwieraj publicznego issue. Napisz prywatnie do właściciela
repozytorium (kontakt w profilu GitHub) z opisem i, jeśli możesz, krokami odtworzenia.
Odpowiadamy najszybciej, jak się da.

## Zakres wrażliwy

Ten projekt dotyczy danych o zdrowiu (status HIV) — szczególnej kategorii wg RODO.
Szczególnie interesują nas zgłoszenia dotyczące:

- obejścia bramek publikacji (`library/scripts/gate.js`, `validate.js`, `verify.js`) —
  treść medyczna, która wychodzi bez podpisu człowieka lub bez prawa do redystrybucji,
- wstrzyknięć w warstwie renderu (XSS) — zwłaszcza tam, gdzie renderowany jest tekst
  napisany przez człowieka (rozmowy, wpisy),
- deanonimizacji użytkowników z metadanych,
- podatności w łańcuchu dostaw buildu.

## Zasady projektu (skrót)

- Zero zasobów zewnętrznych w aplikacji (brak CDN, fontów, analityki, `fetch` do obcych hostów).
- Treść medyczna nie jest „wiedzą", dopóki nie podpisze jej człowiek (`verify.js`).
- Sekrety nie trafiają do repo. Build i watcher nie wymagają danych osobowych.
