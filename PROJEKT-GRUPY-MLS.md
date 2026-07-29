# Projekt grup — zamknięte grupy tematyczne na MLS (K-31)

Stan: 2026-07-28. Pełny projekt funkcji grup, na życzenie właściciela („zaplanuj pełne grupy MLS teraz"). **To projekt, nie budowa** — grupy wchodzą po uruchomieniu 1:1 (Signal), moderacji (O-08) i mandacie środowiska. Dokument ma dać komplet obrazu przed kodowaniem.

Kształt produktu wg **K-31**: **zamknięte, moderowane grupy tematyczne** (np. „świeża diagnoza", „rodzice", „PrEP"), mały rozmiar, wejście przez kwalifikację/zaproszenie — **nie** otwarte pokoje.

## 1. Zasada bezpieczeństwa (rozszerza K-04, K-26)

Grupa to większa powierzchnia ryzyka niż 1:1 — projekt musi to tnąć u podstaw:

- **Tylko pseudonimy.** W grupie widać pseudonimy i nic więcej (spójne z K-04). Żadnych danych osobowych.
- **Treść niewidoczna dla serwera.** Backend jest **Delivery Service** — przenosi zaszyfrowane wiadomości i komunikaty protokołu, nie potrafi ich odczytać.
- **Metadane to realny koszt grup.** Serwer **widzi członkostwo** (które pseudonimy są w której grupie) i wzorce ruchu — inaczej niż w 1:1. To nieusuwalne przy grupach; minimalizujemy (sekcja 8) i mówimy o tym wprost użytkownikowi.
- **Mały, zamknięty rozmiar** (proponowany limit np. 8–12 osób) — im mniejsza grupa, tym mniejsze ryzyko korelacji i „grupy-pułapki".

## 2. Kryptografia — MLS (RFC 9420), nie Signal

Signal (podwójny ratchet) jest zaprojektowany do 1:1. Dla 2..N osób standardem jest **MLS (Messaging Layer Security, RFC 9420)**:

- **TreeKEM** — drzewo kluczy dające **forward secrecy (FS)** i **post-compromise security (PCS)** dla całej grupy przy koszcie logarytmicznym względem liczby członków.
- **Epoki** — każda zmiana członkostwa (dodanie/usunięcie) tworzy nową epokę z nowym kluczem grupy. Usunięty członek **traci dostęp** do dalszych wiadomości (kluczowe dla moderacji — patrz sekcja 6).
- **KeyPackage** — odpowiednik PreKeys: klient publikuje pakiet publiczny, z którego inni budują zaproszenie (Welcome) do grupy.

**Biblioteka (do wyboru, sekcja 10):** `ts-mls` (TypeScript, działa w przeglądarce/Node — naturalne dla PWA), `OpenMLS` (Rust, przez WASM), AWS `mls-rs` (Rust; uwaga z A2: „not yet received a full 3rd-party security audit"). **Każdą trzeba przejść audytem i śledzić CVE.**

**Role MLS u nas:**
- **Delivery Service (DS)** = nasz backend. Przenosi `Welcome`, `Commit`/handshake i `Application` messages. Nie czyta treści.
- **Authentication Service (AS)** = tożsamość konta. Credential MLS wiążemy z **kluczem publicznym konta** (tym samym, którym się logujesz — self-signed na pseudonimie). Bez centralnego CA, bez PII.

## 3. Model danych backendu (rozszerzenie `schema.sql`)

Minimalny rekord, jak w K-04 — serwer trzyma strukturę i szyfrogramy, nie treść:

```sql
create table groups (
  id          uuid primary key,
  topic       text not null,            -- temat (np. 'swieza-diagnoza')
  title       text not null,
  created_by  uuid references accounts(id),   -- założyciel = pierwszy moderator
  max_members int  not null default 10,
  epoch       bigint not null default 0,      -- bieżąca epoka MLS
  status      text not null default 'open',   -- open | closed
  created_at  timestamptz not null default now()
);

create table group_members (
  group_id    uuid references groups(id) on delete cascade,
  account_id  uuid references accounts(id) on delete cascade,
  role        text not null default 'member',  -- member | moderator
  joined_epoch bigint not null,
  primary key (group_id, account_id)
);

-- KeyPackages (jak PreKeys, ale dla MLS) — tylko materiał publiczny.
create table key_packages (
  account_id  uuid references accounts(id) on delete cascade,
  key_package text not null,            -- base64, publiczny
  used        boolean not null default false,
  created_at  timestamptz not null default now()
);

-- Komunikaty MLS: handshake (Commit/Welcome) i application (zaszyfrowana treść).
create table group_messages (
  id          uuid primary key,
  group_id    uuid references groups(id) on delete cascade,
  epoch       bigint not null,
  kind        text not null,            -- 'welcome' | 'commit' | 'application'
  sender_pseudonym text,               -- null dla welcome kierowanego
  target_account_id uuid,              -- dla welcome: do kogo
  payload     text not null,           -- base64, nieczytelne dla serwera
  created_at  timestamptz not null default now()
);
```

Uwaga: `group_members` to metadana, którą serwer z natury widzi (musi wiedzieć, komu dostarczyć). To jest ten „koszt grup" z sekcji 1.

## 4. Cykl życia grupy

1. **Utworzenie** — moderator (założyciel) tworzy grupę MLS lokalnie (epoka 0), zakłada rekord `groups`, staje się `moderator`.
2. **Publikacja KeyPackage** — każdy potencjalny członek ma opublikowany `key_package` (jak PreKeys).
3. **Dodanie członka** — moderator robi MLS `Add` + `Commit`, generuje `Welcome` dla nowego; DS dostarcza `Welcome` nowemu i `Commit` reszcie; epoka++. Wejście **tylko przez kwalifikację/zaproszenie** (K-31), nie samoobsługowo.
4. **Wiadomości** — `Application` messages szyfrowane kluczem epoki; DS przenosi koperty; klienci odszyfrowują lokalnie.
5. **Usunięcie / opuszczenie** — MLS `Remove` + `Commit` → nowa epoka; usunięty **nie odszyfruje** dalszych wiadomości (PCS). To jest mechanizm egzekwowania moderacji.
6. **Zamknięcie grupy** — status `closed`, brak nowych wiadomości; historia zostaje tylko lokalnie u członków (serwer kasuje koperty po dostarczeniu).

## 5. Klient (Krag-app)

- **`lib/group.js`** — analog `lib/e2e.js` (1:1), ale na MLS: `createGroup`, `publishKeyPackage`, `processWelcome`, `processCommit`, `encryptApp`, `decryptApp`. Styk celowo wąski, jak przy 1:1.
- **Stan grupy** (drzewo TreeKEM, sekrety epoki) w **IndexedDB**, objęty backupem klucza (fraza odzyskiwania). Utrata = utrata dostępu do grup (jak w 1:1).
- **UI**: lista moich grup, ekran grupy (pseudonimy, wiadomości, „opuść"), panel moderatora (usuń/wycisz/zamknij), wejście przez zaproszenie/kwalifikację.

## 6. Moderacja grupowa (O-08 rozszerzone)

- **Moderator to rola w grupie** (`group_members.role='moderator'`) z uprawnieniami: dodaj/usuń członka, wycisz, zamknij grupę. Usunięcie = MLS `Remove` → rotacja klucza (PCS), więc technicznie egzekwowalne, nie tylko „grzecznościowe".
- **Zgłoszenia** — message franking działa też w grupie (zgłaszający ujawnia konkretną wiadomość do kolejki `reports`), ale w grupie dochodzi kontekst „kto był świadkiem". Kolejka trafia do **człowieka** (etat, jak w O-08).
- **Zasady tematów** — jakie grupy istnieją i na jakich zasadach, ustala **mandat środowiska**, nie kod.

## 7. Sekwencja i bramki (K-31)

Bez zmian względem decyzji: **(1) 1:1 działa pierwsze** (Signal, Faza 3) → **(2) moderacja z człowiekiem** (O-08) → **(3) mandat środowiska** co do tematów → dopiero **(4) grupy (MLS)** jako odrębny moduł (Faza 5→6). Grupy nie wyprzedzają rozmów jeden-na-jeden.

## 8. Ryzyka i granice (uczciwie)

- **Deanonimizacja przez członkostwo.** Serwer i moderator widzą, kto jest w grupie tematycznej — a sama przynależność do „grupy HIV+" jest wrażliwa. Minimalizacja: mały rozmiar, brak listy grup „na wierzchu", rozważyć nieprzechowywanie pełnej listy członków dłużej niż potrzeba do dostarczenia, rozdział tematu od treści.
- **„Grupa-pułapka".** Zamknięcie + kwalifikacja + moderator ograniczają, nie zerują. Stąd nacisk na wejście przez zaufanie.
- **Moderator widzi członków** — to cena egzekwowalnej moderacji; trzeba to powiedzieć wprost.
- **Dojrzałość SDK MLS** (2025–26) niższa niż Signala; `mls-rs` bez pełnego audytu 3rd-party (A2). **Wymóg: audyt wybranej biblioteki przed produkcją.**
- **Metadane ruchu** — DS widzi wzorce „kto pisze w grupie i kiedy". Minimalizacja retencji, kasowanie kopert po dostarczeniu.

## 9. Otwarte decyzje (do rozstrzygnięcia przed budową)

1. **Biblioteka MLS**: `ts-mls` (najbliżej PWA) vs `OpenMLS`/`mls-rs` przez WASM. Rekomendacja wstępna: `ts-mls`, z audytem.
2. **Kto tworzy grupy**: tylko przeszkoleni moderatorzy? buddy (C-2)? każdy z kwalifikacją? Rekomendacja: **moderatorzy/organizacja**, nie każdy — spójne z K-31.
3. **Widoczność członkostwa**: ile serwer trzyma i jak długo; czy ukrywać liczność/skład.
4. **Limit rozmiaru** grupy (proponowane 8–12).
5. **Retencja** kopert i historii (RODO art. 17/20 w kontekście grup).

## 10. Co to zmienia w istniejącym projekcie

- **Backend**: +4 tabele (sekcja 3), +endpointy grup (`POST /groups`, `POST /groups/:id/members`, `POST /keypackages`, `GET /keypackages/:pseudonym`, `POST /groups/:id/messages`, `GET /groups/:id/messages`). Analogiczne do 1:1, ale z epokami MLS.
- **Klient**: `lib/group.js` (MLS) obok `lib/e2e.js` (1:1); UI grup i panel moderatora.
- **Roadmapa**: grupy jako odrębny moduł Fazy 5→6, po 1:1 + moderacji + mandacie.
- **Decyzje**: realizuje K-31; decyzje z sekcji 9 do zapisania, gdy ruszy budowa.
