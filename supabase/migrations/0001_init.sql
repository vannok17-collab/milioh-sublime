-- Miliöh Sublime — schéma complet (reset + création)
-- À exécuter dans l'éditeur SQL de Supabase (ou via `supabase db push`).
-- Ce script est idempotent : il repart toujours de zéro, donc tu peux le
-- relancer autant de fois que nécessaire sans erreur de type "déjà existant"
-- ni policy en double.

-- ============================================================
-- 0. RESET COMPLET — supprime tout ce que ce script a pu créer
--    lors d'une exécution précédente, avant de tout recréer proprement.
-- ============================================================

-- Trigger + fonction
drop trigger if exists trg_enforce_client_order_update on commandes;
drop function if exists enforce_client_order_update();
drop function if exists add_gestionnaire_by_email(text);
drop function if exists remove_gestionnaire_by_email(text);
drop function if exists list_gestionnaires();

-- Stockage (policies du bucket "images"). Supabase interdit la suppression
-- directe de storage.objects / storage.buckets en SQL (protection contre la
-- perte accidentelle de fichiers) — seules les policies peuvent être reset
-- ici. Le bucket lui-même est recréé plus bas avec "on conflict do nothing",
-- donc rien à faire s'il existe déjà. Pour vraiment vider les images
-- uploadées, utilise Storage > images > tout sélectionner > Supprimer dans
-- le dashboard Supabase.
drop policy if exists "images: lecture publique" on storage.objects;
drop policy if exists "images: upload gestionnaire" on storage.objects;
drop policy if exists "images: suppression gestionnaire" on storage.objects;

-- Tables (cascade supprime automatiquement leurs policies, index et contraintes)
drop table if exists retours cascade;
drop table if exists commandes cascade;
drop table if exists avis cascade;
drop table if exists diapo cascade;
drop table if exists produits cascade;
drop table if exists categories cascade;
drop table if exists macro_categories cascade;
drop table if exists communes_livraison cascade;
drop table if exists gestionnaires cascade;

-- ============================================================
-- 1. CRÉATION DU SCHÉMA
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- Gestionnaires ----------
-- Un compte Supabase Auth devient "gestionnaire" uniquement s'il est référencé ici.
create table if not exists gestionnaires (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table gestionnaires enable row level security;

-- Un utilisateur peut vérifier son propre statut (nécessaire pour la garde d'accès admin).
create policy "gestionnaires: lecture de son propre statut"
  on gestionnaires for select
  using (auth.uid() = user_id);

-- Permet à une gestionnaire déjà en poste de donner ou retirer l'accès à
-- quelqu'un d'autre (ex. une employée qui gère la boutique en son absence)
-- sans jamais avoir besoin de passer par le développeur. Le compte cible
-- doit déjà exister (créé via la page d'inscription) — ces fonctions ne
-- créent jamais de compte, elles accordent seulement l'accès gestion à un
-- compte existant. `security definer` est nécessaire pour lire auth.users,
-- normalement inaccessible au rôle authenticated ; chaque fonction vérifie
-- elle-même que l'appelant est déjà gestionnaire avant d'agir.
create or replace function add_gestionnaire_by_email(p_email text)
returns void as $$
declare
  target_id uuid;
begin
  if not exists (select 1 from gestionnaires g where g.user_id = auth.uid()) then
    raise exception 'Seule une gestionnaire déjà en poste peut accorder cet accès.';
  end if;
  select id into target_id from auth.users where email = p_email;
  if target_id is null then
    raise exception 'Aucun compte trouvé avec cet email. La personne doit d''abord créer un compte.';
  end if;
  insert into gestionnaires (user_id) values (target_id) on conflict do nothing;
end;
$$ language plpgsql security definer set search_path = public;

create or replace function remove_gestionnaire_by_email(p_email text)
returns void as $$
declare
  target_id uuid;
begin
  if not exists (select 1 from gestionnaires g where g.user_id = auth.uid()) then
    raise exception 'Seule une gestionnaire déjà en poste peut retirer cet accès.';
  end if;
  select id into target_id from auth.users where email = p_email;
  if target_id is null then
    raise exception 'Aucun compte trouvé avec cet email.';
  end if;
  if target_id = auth.uid() then
    raise exception 'Impossible de retirer ton propre accès depuis cet écran.';
  end if;
  delete from gestionnaires where user_id = target_id;
end;
$$ language plpgsql security definer set search_path = public;

create or replace function list_gestionnaires()
returns table(email text, ajoute_le timestamptz) as $$
begin
  if not exists (select 1 from gestionnaires g where g.user_id = auth.uid()) then
    raise exception 'Accès réservé aux gestionnaires.';
  end if;
  return query
    select u.email, g.created_at
    from gestionnaires g
    join auth.users u on u.id = g.user_id
    order by g.created_at;
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function add_gestionnaire_by_email(text) to authenticated;
grant execute on function remove_gestionnaire_by_email(text) to authenticated;
grant execute on function list_gestionnaires() to authenticated;

-- ---------- Macro-catégories ----------
-- Autrefois figées dans le code (Bijoux/Femme/Homme/Bébé/Maison/Promos),
-- elles sont maintenant gérées par la gestionnaire comme les
-- sous-catégories. `nom` sert de clé naturelle : la renommer met à jour
-- automatiquement tous les articles concernés (on update cascade) ; la
-- supprimer est refusé tant qu'un article l'utilise encore (on delete
-- restrict), pour ne jamais laisser un article sans catégorie valide.
create table if not exists macro_categories (
  nom text primary key,
  ordre integer not null default 0,
  created_at timestamptz not null default now()
);

alter table macro_categories enable row level security;

create policy "macro_categories: lecture publique"
  on macro_categories for select
  using (true);

create policy "macro_categories: écriture gestionnaire uniquement"
  on macro_categories for all
  using (exists (select 1 from gestionnaires g where g.user_id = auth.uid()))
  with check (exists (select 1 from gestionnaires g where g.user_id = auth.uid()));

insert into macro_categories (nom, ordre) values
  ('Bijoux', 0), ('Femme', 1), ('Homme', 2), ('Bébé', 3), ('Maison', 4), ('Promos', 5)
on conflict (nom) do nothing;

-- ---------- Catégories (sous-catégories dynamiques) ----------
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  created_at timestamptz not null default now()
);

alter table categories enable row level security;

create policy "categories: lecture publique"
  on categories for select
  using (true);

create policy "categories: écriture gestionnaire uniquement"
  on categories for all
  using (exists (select 1 from gestionnaires g where g.user_id = auth.uid()))
  with check (exists (select 1 from gestionnaires g where g.user_id = auth.uid()));

-- ---------- Produits ----------
create table if not exists produits (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  description text not null default '',
  prix_detail integer not null,
  prix_gros integer,
  quantite_min_gros integer not null default 5,
  stock integer not null default 0,
  macro_categorie text not null references macro_categories(nom) on update cascade on delete restrict,
  sous_categorie_id uuid references categories(id) on delete set null,
  image_url text,
  en_promo boolean not null default false,
  prix_promo integer,
  created_at timestamptz not null default now()
);

alter table produits enable row level security;

create policy "produits: lecture publique"
  on produits for select
  using (true);

create policy "produits: écriture gestionnaire uniquement"
  on produits for all
  using (exists (select 1 from gestionnaires g where g.user_id = auth.uid()))
  with check (exists (select 1 from gestionnaires g where g.user_id = auth.uid()));

-- ---------- Diapo (bandeau d'accueil) ----------
create table if not exists diapo (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  ordre integer not null default 0,
  produit_id uuid references produits(id) on delete set null
);

alter table diapo enable row level security;

create policy "diapo: lecture publique"
  on diapo for select
  using (true);

create policy "diapo: écriture gestionnaire uniquement"
  on diapo for all
  using (exists (select 1 from gestionnaires g where g.user_id = auth.uid()))
  with check (exists (select 1 from gestionnaires g where g.user_id = auth.uid()));

-- ---------- Avis (avis clients, sans compte requis) ----------
create table if not exists avis (
  id uuid primary key default gen_random_uuid(),
  produit_id uuid not null references produits(id) on delete cascade,
  auteur text not null,
  note integer not null check (note between 1 and 5),
  commentaire text not null default '',
  created_at timestamptz not null default now()
);

alter table avis enable row level security;

create policy "avis: lecture publique"
  on avis for select
  using (true);

-- Poster un avis ne nécessite pas de compte, mais reste modéré côté écriture uniquement (pas de update/delete public).
create policy "avis: création publique"
  on avis for insert
  with check (true);

create policy "avis: gestion gestionnaire"
  on avis for update using (exists (select 1 from gestionnaires g where g.user_id = auth.uid()));

create policy "avis: suppression gestionnaire"
  on avis for delete using (exists (select 1 from gestionnaires g where g.user_id = auth.uid()));

-- ---------- Commandes ----------
create table if not exists commandes (
  id uuid primary key default gen_random_uuid(),
  numero text not null unique,
  client_nom text not null,
  client_telephone text not null,
  client_email text,
  client_user_id uuid references auth.users(id) on delete set null,
  articles jsonb not null default '[]',
  total_articles integer not null default 0,
  frais_livraison integer not null default 0,
  total integer not null default 0,
  livraison jsonb not null default '{}',
  paiement jsonb not null default '{}',
  statut text not null default 'nouvelle' check (statut in ('en_attente_paiement','nouvelle','confirmee','expediee','livree','annulee')),
  motif_annulation text,
  tracking_numero text,
  instructions_retrait text,
  created_at timestamptz not null default now()
);

alter table commandes enable row level security;

-- Lecture publique nécessaire pour le suivi de commande sans compte (recherche par numéro).
create policy "commandes: lecture publique par numéro"
  on commandes for select
  using (true);

-- Toute personne (avec ou sans compte) peut créer une commande au moment du checkout.
create policy "commandes: création publique"
  on commandes for insert
  with check (true);

-- Une cliente connectée ne peut modifier (annuler) que ses propres commandes ; la gestionnaire peut tout modifier.
create policy "commandes: mise à jour restreinte"
  on commandes for update
  using (
    (client_user_id is not null and client_user_id = auth.uid())
    or exists (select 1 from gestionnaires g where g.user_id = auth.uid())
  )
  with check (
    (client_user_id is not null and client_user_id = auth.uid())
    or exists (select 1 from gestionnaires g where g.user_id = auth.uid())
  );

-- Une cliente ne doit pouvoir que s'auto-annuler (pas modifier le reste de sa commande),
-- et seulement si la commande n'est pas déjà expédiée/livrée/annulée. La gestionnaire n'est pas limitée.
create or replace function enforce_client_order_update()
returns trigger as $$
begin
  if exists (select 1 from gestionnaires g where g.user_id = auth.uid()) then
    return new;
  end if;
  if old.statut in ('expediee', 'livree', 'annulee') then
    raise exception 'Cette commande ne peut plus être annulée.';
  end if;
  if new.statut <> 'annulee' then
    raise exception 'Une cliente ne peut que annuler sa propre commande.';
  end if;
  new.numero := old.numero;
  new.client_nom := old.client_nom;
  new.client_telephone := old.client_telephone;
  new.client_email := old.client_email;
  new.client_user_id := old.client_user_id;
  new.articles := old.articles;
  new.total := old.total;
  new.livraison := old.livraison;
  new.paiement := old.paiement;
  new.tracking_numero := old.tracking_numero;
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_enforce_client_order_update
  before update on commandes
  for each row execute function enforce_client_order_update();

-- ---------- Retours ----------
create table if not exists retours (
  id uuid primary key default gen_random_uuid(),
  commande_numero text not null,
  client_user_id uuid references auth.users(id) on delete set null,
  motif text not null check (motif in ('article_defectueux','taille_incorrecte','article_non_conforme','colis_endommage','erreur_commande','autre')),
  description text not null default '',
  statut text not null default 'en_cours' check (statut in ('en_cours','acceptee','refusee','remboursee')),
  created_at timestamptz not null default now()
);

alter table retours enable row level security;

create policy "retours: lecture propre + gestionnaire"
  on retours for select
  using (
    (client_user_id is not null and client_user_id = auth.uid())
    or exists (select 1 from gestionnaires g where g.user_id = auth.uid())
  );

create policy "retours: création publique"
  on retours for insert
  with check (true);

create policy "retours: mise à jour gestionnaire uniquement"
  on retours for update
  using (exists (select 1 from gestionnaires g where g.user_id = auth.uid()))
  with check (exists (select 1 from gestionnaires g where g.user_id = auth.uid()));

-- ---------- Index utiles ----------
create index if not exists idx_produits_macro on produits(macro_categorie);
create index if not exists idx_produits_sous_categorie on produits(sous_categorie_id);
create index if not exists idx_commandes_numero on commandes(numero);
create index if not exists idx_commandes_client on commandes(client_user_id);
create index if not exists idx_avis_produit on avis(produit_id);

-- Index trigram : indispensable pour que la recherche texte (ilike) reste
-- rapide avec plusieurs milliers d'articles plutôt que de scanner la table entière.
create extension if not exists pg_trgm;
create index if not exists idx_produits_nom_trgm on produits using gin (nom gin_trgm_ops);
create index if not exists idx_produits_description_trgm on produits using gin (description gin_trgm_ops);

-- ---------- Stockage des images (bucket public "images") ----------
-- Les photos sont compressées côté navigateur avant l'envoi (voir
-- lib/image-compress.ts) puis stockées ici plutôt qu'en base64 dans les
-- lignes produits/diapo — indispensable pour rester rapide quelle que soit
-- l'affluence, une ligne produit ne pesant alors que quelques centaines
-- d'octets au lieu de plusieurs mégaoctets.
insert into storage.buckets (id, name, public)
values ('images', 'images', true)
on conflict (id) do nothing;

create policy "images: lecture publique"
  on storage.objects for select
  using (bucket_id = 'images');

create policy "images: upload gestionnaire"
  on storage.objects for insert
  with check (bucket_id = 'images' and exists (select 1 from gestionnaires g where g.user_id = auth.uid()));

create policy "images: suppression gestionnaire"
  on storage.objects for delete
  using (bucket_id = 'images' and exists (select 1 from gestionnaires g where g.user_id = auth.uid()));

-- ---------- Frais de livraison (communes d'Abidjan) ----------
-- Autrefois codés en dur, modifiables désormais par la gestionnaire dans
-- Réglages et utilisés directement dans le tunnel de commande.
create table if not exists communes_livraison (
  nom text primary key,
  frais integer not null default 0,
  ordre integer not null default 0,
  created_at timestamptz not null default now()
);

alter table communes_livraison enable row level security;

create policy "communes_livraison: lecture publique"
  on communes_livraison for select
  using (true);

create policy "communes_livraison: écriture gestionnaire uniquement"
  on communes_livraison for all
  using (exists (select 1 from gestionnaires g where g.user_id = auth.uid()))
  with check (exists (select 1 from gestionnaires g where g.user_id = auth.uid()));

insert into communes_livraison (nom, frais, ordre) values
  ('Bingerville', 1000, 0),
  ('Cocody', 1500, 1),
  ('Plateau', 1500, 2),
  ('Marcory', 2000, 3),
  ('Treichville', 2000, 4),
  ('Koumassi', 2500, 5),
  ('Adjamé', 2500, 6),
  ('Yopougon', 3500, 7),
  ('Abobo', 3500, 8),
  ('Port-Bouët', 3000, 9),
  ('Attécoubé', 3000, 10),
  ('Songon', 5000, 11),
  ('Anyama', 5000, 12)
on conflict (nom) do nothing;

-- ---------- Pour créer la première gestionnaire ----------
-- Ce script vient de repartir de zéro : la table gestionnaires est vide,
-- même si le compte existait déjà côté Auth (auth.users n'est pas touché
-- par ce reset — seul le lien vers gestionnaires a été supprimé).
-- 1. Le compte existe probablement déjà (créé via /inscription ou Auth > Add user) :
--    récupère son user_id avec : select id, email from auth.users where email = '...';
--    Sinon, crée-le d'abord.
-- 2. Puis exécute :
--    insert into gestionnaires (user_id) values ('<uuid-du-compte>');
