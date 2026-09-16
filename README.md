# Miliöh Sublime — Reconstruction fonctionnelle

## Démarrage

```bash
npm install
cp .env.example .env.local   # puis renseigner tes clés Supabase
npm run dev
```

Sans les variables Supabase, l'application démarre quand même en **mode démo**
(bandeau rouge automatique, données en localStorage uniquement).

## Base de données

Exécute `supabase/migrations/0001_init.sql` dans l'éditeur SQL de ton projet
Supabase (ou `supabase db push`). Ce fichier crée toutes les tables, les
policies RLS (lecture publique / écriture gestionnaire uniquement / une
cliente ne modifie que ses propres commandes) et les index nécessaires.

Pour créer ta première gestionnaire :
1. Crée un compte normal via `/inscription` (ou Supabase Auth → Add user).
2. Récupère son `user_id` dans Supabase Auth.
3. `insert into gestionnaires (user_id) values ('<uuid>');`

Elle pourra ensuite se connecter sur `/gestion-milioh/connexion`.

## Variables d'environnement (`.env.local`)

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — depuis Supabase → Project Settings → API
- `NEXT_PUBLIC_WHATSAPP_NUMBER` — numéro WhatsApp de la boutique (format international sans le +)
- `NEXT_PUBLIC_MOBILE_MONEY_NUMBER` — numéro affiché aux clientes pour le paiement Mobile Money

## Logo

Dépose le logo définitif dans `public/logo.png`. En son absence, l'icône du
projet (`public/icon.svg`) s'affiche à la place partout où le logo apparaît.

## Ce qui est fait

- Routage multi-pages réel (App Router) : chaque page a une URL directe et
  partageable, avec découpage de code automatique par route.
- Mode démo fiable : toute perte de connexion à Supabase déclenche
  immédiatement le bandeau, plus jamais de comportement silencieux.
- PWA installable avec service worker (cache des pages déjà visitées pour un
  usage hors-ligne partiel).
- Boutique complète : accueil (diapo + catégories + promos), catalogue
  (recherche, filtres macro/sous-catégories, tri), fiche produit (détail/gros,
  avis, WhatsApp), panier, tunnel de commande en 4 étapes (coordonnées,
  livraison Abidjan/intérieur/international avec géolocalisation, paiement
  espèces ou Mobile Money avec le flux exact demandé), suivi de commande,
  retours, contact, favoris, compte (thème + notifications).
- Espace de gestion `/gestion-milioh` (jamais lié depuis le menu client) :
  connexion protégée par vérification réelle de la table `gestionnaires`,
  Dashboard, Stocks (formulaire + édition en ligne), Catégories (CRUD relié
  en direct au catalogue), Diapo, Commandes (changement de statut, annulation
  **toujours** avec motif obligatoire via modale, validation Mobile Money,
  impression de ticket), Statistiques, Retours (branché en direct, plus de
  données fictives), Réglages (thème partagé).
- Sécurité : policies RLS Supabase (lecture publique du catalogue, écriture
  réservée à la table `gestionnaires`, une cliente ne peut modifier que ses
  propres commandes/retours — appliqué aussi côté base via un trigger, pas
  seulement côté interface).

## Ce qui reste à brancher pour la mise en production

- **Logo réel** (voir ci-dessus).
- **Notifications push réelles** : la permission navigateur fonctionne déjà,
  mais l'envoi effectif nécessite une clé VAPID et une fonction serveur
  (Supabase Edge Function) — non incluses ici pour éviter de donner
  l'illusion qu'elles sont opérationnelles sans configuration.
- **Upload d'images** : actuellement en base64 direct (fonctionne, mais pour
  de meilleures performances, brancher Supabase Storage serait préférable
  à terme).
- Déploiement recommandé via Git (Vercel ou Netlify connecté au repo) plutôt
  qu'un drag-and-drop manuel, pour éviter que le déployé se désynchronise du
  code source.
