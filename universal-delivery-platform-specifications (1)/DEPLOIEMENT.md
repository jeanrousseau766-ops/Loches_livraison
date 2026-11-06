# 🟢 Mettre WawanPost en ligne — GRATUITEMENT, pas à pas

> **Budget requis : 0 €.** Ni carte bancaire, ni ligne de commande, ni connaissance
> technique. Vous allez cliquer dans des sites web, c'est tout. Comptez ~15 minutes.

**Ce que vous aurez à la fin** : une vraie adresse internet du type
`https://locho-xxxx.vercel.app`, accessible 24 h/24 depuis n'importe quel téléphone,
avec votre base de données gratuite. Le site **s'installe tout seul** au premier
lancement (tables + données) : aucune manipulation technique à faire.

---

## 🔧 Déploiement Vercel échoué après « added … packages » ?

Les avertissements `npm warn deprecated …` et `Unknown env config "cache-dir"`
ne sont pas, à eux seuls, une erreur bloquante. Il faut regarder la fin de
**Build Logs**, après l'installation des outils.

**Un défaut de cette version a été reproduit puis corrigé :** sans
`DATABASE_URL`, le message `DATABASE_URL is required` pouvait arrêter le build.
La connexion est désormais créée uniquement au lancement d'une requête, pas
pendant la compilation. `/api/health` indique clairement si la base manque.

### La manipulation à faire dans votre compte Vercel

1. Ouvrez votre projet → **Settings** → **Environment Variables**.
2. Cherchez `DATABASE_URL`. Si cette ligne n'existe pas, ajoutez-la.
3. Dans **Value**, collez la chaîne **Pooled connection** copiée depuis Neon :
   elle commence par `postgresql://` et contient le mot de passe de la base.
   Ce n'est ni l'adresse du site, ni seulement le mot de passe Neon.
4. Active cette variable pour **Production** et **Preview**, puis **Save**.
5. Vérifiez aussi `ADMIN_PSEUDO`, `ADMIN_PASSWORD` et `DEMO_PASSWORD`.
6. Ouvrez **Deployments**, choisissez le déploiement le plus récent, puis
   **… → Redeploy**. Laissez **Use existing Build Cache** décoché si proposé.

⚠️ Enregistrer une variable ne modifie pas un déploiement déjà fabriqué :
**il faut redéployer**. Ne collez jamais la valeur de `DATABASE_URL` dans
GitHub, dans une capture d'écran ou dans une conversation publique.

Dans **Settings → Build and Deployment**, gardez **Framework Preset: Next.js**,
**Root Directory: ./ (racine)** et la commande de build par défaut. Si une
version Node incompatible est signalée, choisissez **22.x**, testée pour ce projet.

Si le journal contient une autre erreur, cherchez la première ligne rouge
`Error:` et les lignes juste avant `Command … exited with 1`. Les avertissements
jaunes du début ne suffisent pas à identifier la panne.

---

## Les 3 comptes gratuits à créer

Trois services, gratuits, sans carte bancaire — chacun a besoin de **votre e-mail**,
c'est impossible de les créer à votre place.

| Service | Rôle | Tarif | Carte bancaire |
|---|---|---|---|
| **GitHub** | range vos fichiers (comme un Google Drive) | gratuit, illimité | ❌ |
| **Neon** | votre base de données (1 Go) | gratuit | ❌ |
| **Vercel** | héberge le site, donne l'URL, HTTPS compris | gratuit | ❌ |

> ⚠️ **Deux règles de sécurité à retenir** — tout le reste suit :
> 1. Ne **montrez jamais** à personne les mots de passe de l'étape 4.
> 2. Ne modifiez jamais (et ne partagez jamais) le fichier `.env` du projet.

---

## Étape 1 — GitHub (2 min)

1. Allez sur **github.com** → **Sign up** (e-mail, mot de passe, pseudo).
2. Une fois connecté → bouton vert **New repository** (nouveau dépôt).
3. *Repository name* : `locho` → cochez **Public** → **Create repository**.
   (Public = nécessaire pour que Vercel puisse le récupérer gratuitement.)

## Étape 2 — Déposer les fichiers du projet (3 min)

1. Sur la page de votre nouveau dépôt : **Add file** → **Upload files**.
2. Ouvrez sur votre ordinateur le dossier qui contient `src`, `drizzle`,
   `package`, `Dockerfile`, etc.
3. **Sélectionnez tout le contenu avec Ctrl+A, puis envoyez tout.**
   Gardez les dossiers **`src` et `drizzle`**, ainsi que les petits fichiers
   `.gitignore` et `.dockerignore`. Ne les renommez pas.
4. Avec Chrome ou Edge, **glissez ensemble les fichiers et les dossiers**
   dans la zone de dépôt de GitHub. Attendez que la liste des fichiers soit
   chargée, puis cliquez sur **Commit changes**.
5. À la fin, `package.json`, `src` et `drizzle` doivent apparaître directement
   à la racine du dépôt GitHub, et non à l'intérieur d'un dossier supplémentaire.

### Vous ne voyez pas `node_modules`, `.next` ou `.env` ? C'est normal !

**S'ils sont absents de votre téléchargement, vous n'avez rien à retirer et
rien à créer : envoyez simplement tous les fichiers que vous avez.**

- `node_modules` contient les outils que l'hébergeur installera automatiquement.
- `.next` est la version fabriquée du site : Vercel la fabriquera lui-même.
- `.env` contient les réglages secrets locaux : sur Vercel, vous les saisirez
  directement dans **Environment Variables** à l'étape 4.

Ne cherchez pas à fabriquer ces éléments et ne mettez aucun mot de passe dans
les fichiers envoyés à GitHub.

**Extensions masquées sous Windows :** le fichier peut s'afficher `package`
avec le type « Fichier source JSON » au lieu de `package.json`. C'est le bon
fichier ; n'ajoutez pas `.json` vous-même. Même principe pour `DEPLOIEMENT`,
`next.config`, etc.

**Illustration d'accueil :** si votre téléchargement contient aussi un dossier
`public`, envoyez-le avec le reste. S'il est absent, vous pouvez continuer :
seule l'illustration d'accueil sera manquante dans cette copie ; les commerces,
commandes, comptes et autres fonctionnalités sont bien dans `src`.

✅ Une fois **Commit changes** terminé, passez à Neon. Aucun terminal ni
aucune installation sur votre ordinateur ne sont nécessaires.

## Étape 3 — Neon : votre base de données gratuite (3 min)

1. Allez sur **neon.tech** → **Sign up → Continue with GitHub** (un clic, même compte).
2. Choisissez la région **Frankfurt (eu-central-1)** (la plus proche de la France).
3. Projet créé → en haut à gauche, onglet **Connection details** (Détails de connexion).
4. Choisissez : *Environment* = **Production**, *Protocol* = **PostgreSQL**,
   *SSL mode* = **Require**, *Database* = `neondb`.
5. ⭐ Cliquez sur **Pooled connection string** (ou l'icône de copiage) → **Copiez-le**.
6. Collez-le tout de suite dans un **bloc-notes** : vous allez en avoir besoin.

> C'est tout pour Neon. Ne touchez à rien d'autre — le site créera ses tables
> automatiquement au premier lancement.

## Étape 4 — Vercel : l'hébergeur qui donne l'URL (5 min)

1. Allez sur **vercel.com** → **Sign up → Continue with GitHub**.
2. **Add New… → Project** → trouvez le dépôt `locho` → **Import**.
3. ⛔ **N'appuyez PAS encore sur Deploy.** Un peu plus bas, il y a la section
   **Environment Variables** (variables d'environnement) : cliquez **Add** et
   ajoutez ces 4 lignes — remplacez les valeurs « à définir » par les vôtres,
   et notez-les bien sur un papier. Activez ces variables pour
   **Production** et **Preview** :

   | Name (clé) | Value (valeur) |
   |---|---|
   | `DATABASE_URL` | **collez le lien de l'étape 3** (celui du bloc-notes) |
   | `ADMIN_PSEUDO` | votre pseudo admin, ex. `direction` |
   | `ADMIN_PASSWORD` | **inventez un mot de passe admin solide (8+ caractères)** |
   | `DEMO_PASSWORD` | **inventez un second mot de passe** (comptes de démo) |

4. Cliquez **Deploy** → patientez 1 à 2 minutes : le texte passe en vert
   **Congratulations! Your project has been deployed** 🎉
5. Votre adresse internet s'affiche en haut : **`https://…vercel.app`**
   → **cliquez dessus : WawanPost est en ligne !**

## Étape 5 — Vérifier (1 min)

- Ouvrez votre URL : vous retrouvez la **version B** (6 commerces, 33 produits).
- **Première visite un peu lente (2–5 s) ?** C'est normal : Neon est en veille et
  se réveille. Ensuite tout est rapide.
- L'administration est **privée** : `/admin` redirige vers la connexion si vous n'êtes pas
  administrateur actif. Aucun raccourci admin n'apparaît dans la navigation publique,
  et aucun bouton de connexion démo n'est proposé. Connectez-vous avec
  `ADMIN_PSEUDO` / `ADMIN_PASSWORD` depuis `/connexion`.
- Les espaces livreur et commerçant ne s'activent qu'après validation du dossier ;
  l'espace client suppose un compte créé.
- Les boutons **Se connecter** et **Créer un compte** sont visibles sur mobile et
  déclenchent une redirection immédiate après succès.
- L'admin dispose d'un onglet **Messages & sondages** : message à tous, à une catégorie
  (clients, livreurs, commerçants) ou à un compte précis ; sondages par catégorie ou globaux.
  Les utilisateurs retrouvent messages et sondages dans **/messagerie**.
- Teste aussi : `https://VOTRE-URL/api/health` doit afficher `{"ok":true}`.

---

## Vos mots de passe — à conserver précieusement

| Usage | Où l'entrer | Vous avez choisi |
|---|---|---|
| Admin (réglages, validations, finances) | votre URL | `ADMIN_PSEUDO` + `ADMIN_PASSWORD` |
| Démo : `camille`, `marcel`, `yanis` | votre URL | mot de passe = `DEMO_PASSWORD` |
| Base de données | secret, gardé dans Vercel | récupérable sur Neon si besoin |

> **Mot de passe admin oublié :** ne supprimez pas la base et ne réinitialisez
> pas tout le dépôt. Les variables `ADMIN_PSEUDO` et `ADMIN_PASSWORD` servent à
> créer le compte lors de la première installation : les modifier dans Vercel
> ne change pas le mot de passe d'un compte déjà créé.
>
> Une récupération doit être effectuée par le responsable du projet avec un
> accès sécurisé à Neon et une nouvelle empreinte de mot de passe temporaire.
> N'utilisez pas de mot de passe de secours publié dans un dépôt ou un guide.
> Ne communiquez jamais le lien complet de la base pour demander de l'aide.

## Choisir entre « version complète » et « base vide »

Par défaut votre site contient les données de démo (version B). Si vous préférez
**une base entièrement vierge** (vous seul, admin) : ajoutez une 5ᵉ variable dans
**Vercel → Settings → Environment Variables** : `SEED_DEMO` = `0`, puis
**Deployments → … → Redeploy**.

## Mettre le site à jour plus tard (2 min)

Vous avez modifié des fichiers ? → **GitHub → Add file → Upload files** (remplacez
les fichiers concernés) → Vercel **redéploie automatiquement** en ~1 minute.

---

## Honnêteté sur l'offre gratuite (important pour la suite)

- **Vercel Hobby (gratuit)** = usage **personnel / non commercial**. Tant que le site
  est une démo ou un projet d'étude : parfait. Le jour où WawanPost encaissera
  réellement des clients → il faudra **Vercel Pro (20 $/mois)**, ou héberger sur un
  serveur : les fichiers `Dockerfile`, `docker-compose.yml`, `Caddyfile` sont déjà
  dans le projet (voir « Option B » plus bas).
- **Neon (gratuit)** : 1 Go de stockage + 100 h de calcul/mois — largement assez pour
  des centaines de commandes. Il se met en veille après 5 min d'inactivité
  (d'où les 2–5 s de réveil).
- **Paiement, e-mails, SMS** : la V1 simule le prestataire de paiement et
  l'envoi d'e-mails (les notifications s'affichent dans l'application). À brancher
  avant une vraie ouverture (cf. checklist de l'ancien guide, § Paiements).
- **Surveillance** : `https://VOTRE-URL/api/health` → vous pouvez en faire votre
  page « le site est-il vivant ».

## 🩹 Dépannage

| Symptom | Cause | Solution |
|---|---|---|
| *Build failed* pendant le déploiement | variable manquante | Vercel → Settings → Environment Variables : vérifiez les 4 lignes → redeploy |
| Page d'erreur 500 | `DATABASE_URL` mal collé | recopiez-le depuis Neon (Pooled + SSL Require) → redeploy |
| *does not exist* en base | installation pas encore déclenchée | rechargez simplement la page |
| Connexion Neon refusée | mauvaise URL | prenez bien **Pooled connection string**, avec `?sslmode=require` |
| Vous avez cliqué Deploy trop tôt | vars ajoutées après le build | ça arrive ! Ajoutez les vars → **Deployments → Redeploy** |

---

## Option B — Plus tard : son propre serveur (fichiers déjà fournis)

Quand (et si) vous voudrez un domaine `.fr` chez OVH et un contrôle total : les
fichiers `Dockerfile`, `docker-compose.yml` et `Caddyfile` sont dans le projet —
sur un serveur Ubuntu : `docker compose up -d --build` suffit à lancer l'application,
PostgreSQL et le HTTPS automatique. Détails dans l'historique du projet.
