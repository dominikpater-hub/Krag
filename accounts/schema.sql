-- Krąg — konta i synchronizacja. Minimalny model: konto (e-mail/Google/anon),
-- sesja (token), i jeden dokument danych na konto (dziennik + ustawienia).

create table accounts (
  id         uuid primary key,
  email      text unique,                 -- null dla anon
  pass_hash  text,                         -- null dla google/anon
  pseudonym  text not null,
  provider   text not null default 'email', -- email | google | anon
  created_at timestamptz not null default now()
);

create table sessions (
  token      text primary key,
  account_id uuid not null references accounts(id) on delete cascade,
  expires_at timestamptz not null
);

-- Synchronizacja: dane klienta (JSON) trzymane w całości, last-write-wins po updated_at.
-- Treść jest nieprzezroczysta dla serwera pod względem znaczenia — po prostu dokument konta.
create table sync_docs (
  account_id uuid primary key references accounts(id) on delete cascade,
  data       text not null default '{}',
  updated_at timestamptz not null default now()
);
