# Krąg

Niekomercyjna aplikacja wsparcia rówieśniczego dla osób żyjących z HIV w Polsce.
Rdzeniem jest społeczność; wiedza, dzienniczek i przypomnienia ją obsługują, nie odwrotnie.

> **Zasada założycielska:** niezweryfikowana treść medyczna jest groźniejsza niż jej brak.
> Paczka `dist/` jest pusta i taka zostaje, dopóki pod treścią nie stanie nazwisko lekarza.

## Struktura

```
index.html               prototyp UI (serwowany przez Vercel z korzenia); sieć tylko przy logowaniu/synchronizacji i Google (na klik)
accounts/                backend kont i synchronizacji (Fastify + Postgres; e-mail, Google, anon)
library/                 biblioteka wiedzy — warstwy 1 (fakty) i 4 (źródła)
  seed/                  ziarna: 142 fakty (112+8+22) + 81 miejsc → 223 wpisy w bibliotece (provenance: AI_RESEARCH / OFFICIAL_LIST)
  library/               sources.json, arv.json (56 ARV z RPL), baza interakcji, allowlista ATC
  scripts/               migrate · validate · verify · export · currency · watch · paths · places · atc-narrow
  policy.json            sufity zaufania, bramki, progi przeglądu, kto co podpisuje
  build.sh               ziarna → wpisy → walidacja → paczki → arkusz → kolejka
  cron/                  harmonogram watch.js (crontab + README)
.github/workflows/       watch.yml — codzienna obserwacja źródeł
PROGRESS.md              stan budowy wg planu (aktualizowany)
```

## Build

```bash
cd library && ./build.sh
# podpis po konsultacji z lekarzem (jedyna droga DRAFT → PUBLISHED):
node scripts/verify.js --block pep --by "dr n. med. X, zakaźnik" --note "wg PTN AIDS 2025"
```

`entries/`, `dist/`, `state/`, `review/` są generowane (w `.gitignore`) — powstają z `build.sh`.

## Stan

Patrz **PROGRESS.md**. W skrócie: 6/8 kroków planu domknięte kodem; podpis lekarza,
tłumaczenia długiego ogona języków i telefoniczne potwierdzenie placówek — po stronie ludzi.
