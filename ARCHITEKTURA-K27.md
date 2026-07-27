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

## 7. Co to znaczy dla wyboru technologii (wejście do promptu A2)

Ten podział to zarazem **kryteria** do deep-researchu backendu (`research/PROMPT-backend-research.md`):
- Serwer, który **nie musi** rozumieć treści → można iść w kierunku minimalnego relaya + storage, nie ciężkiego backendu aplikacyjnego.
- Konta bez PII → uwierzytelnianie kluczem publicznym, nie klasyczny auth z e-mailem (to zawęża wybór Supabase/Appwrite/PocketBase — czy dają auth „bring-your-own-key").
- E2E + minimalizacja metadanych + rezydencja UE → to twarde wymaganie RODO art. 9, nie „nice to have".
- PWA vs natywna: E2E i bezpieczne trzymanie klucza prywatnego łatwiej domknąć natywnie (Keystore/Keychain) niż w przeglądarce — **to jedno z pytań promptu**.

---

## 8. Granice tego dokumentu

To jest **architektura docelowa**, świadomie narysowana przed kodem, żeby prompt researchu miał kryteria, a właściciel — mapę decyzji. **Nie buduję jej teraz**, bo zależy od:
- **O-08** (kto moderuje) — bez tego rozmowy nie ruszają produkcyjnie,
- **O-09/O-10** (backend, hosting, retencja, eksport RODO art. 20) — decyzja infrastrukturalna po researchu A2,
- **podpisu lekarza** — bo bez `dist/` apka i tak nie ma co pokazać.

Kolejność bez zmian: **prototyp** pokazuje możliwości (osobne repo/gałąź), **prawdziwy Krąg** czeka na te trzy rzeczy. Rekomendacja repo — niżej w rozmowie.
