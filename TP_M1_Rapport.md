# TP Pipeline DevSecOps avec GitHub Actions

## 1) Contexte du TP

Dans ce TP, mon objectif est de construire un pipeline DevSecOps simple et compréhensible.
L’idée est de vérifier automatiquement :

- que le code fonctionne (tests),
- qu'il n'y a pas de vulnérabilités évidentes (Semgrep + CodeQL),
- que les dépendances ne sont pas dangereuses (Snyk + npm audit),
- qu'aucun secret n'a été commité par erreur (Gitleaks),
- que l'image Docker n'intègre pas de failles critiques (Trivy),
- que des règles de conformité minimales sont respectées,
- et que le merge est bloqué automatiquement si des vulnérabilités critiques sont détectées (Security Gate).

J'ai fait volontairement une version claire, pour bien comprendre chaque étape.

## 2) Application de départ — Vulnérabilités identifiées (AVANT)

Le TP fournit une application Node.js volontairement vulnérable (`src/server.js`).
Voici les vulnérabilités détectées par le pipeline lors de la première exécution :

| # | Vulnérabilité | Outil détecteur | Sévérité | Catégorie OWASP |
|---|---------------|-----------------|----------|-----------------|
| 1 | Secrets hardcodés dans le code (`DB_CONNECTION`, `STRIPE_SECRET_KEY`, `SENDGRID_API_KEY`) | Semgrep + Gitleaks | CRITIQUE | A02 — Cryptographic Failures |
| 2 | Endpoint `/debug` exposant les variables d'environnement et secrets en clair | Semgrep | HAUTE | A01 — Broken Access Control |
| 3 | JWT signé sans secret défini (`JWT_SECRET` indéfini → `undefined`) | Semgrep | HAUTE | A02 — Cryptographic Failures |
| 4 | Dépendances obsolètes : `express@4.17.1`, `jsonwebtoken@8.5.1` | npm audit + Snyk | HAUTE | A06 — Vulnerable Components |
| 5 | Aucune validation des entrées utilisateur (`username`, `password`) | Semgrep | MOYENNE | A03 — Injection |
| 6 | Aucun rate-limiting sur `/api/login` (brute force possible) | Semgrep | MOYENNE | A07 — Auth Failures |
| 7 | Image Docker basée sur `node:14` (fin de vie, CVE non corrigées) | Trivy | HAUTE | A06 — Vulnerable Components |
| 8 | Conteneur Docker exécuté en root | Trivy / Dockerfile | MOYENNE | A05 — Security Misconfiguration |

**Métriques initiales (avant corrections) :**
- Vulnérabilités CRITIQUES : **1**
- Vulnérabilités HAUTES : **4**
- Vulnérabilités MOYENNES : **3**
- **Total : 8 vulnérabilités**

## 3) Corrections appliquées (APRÈS)

### 3.1 Suppression des secrets hardcodés

Tous les secrets ont été déplacés dans des variables d'environnement (fichier `.env`, non commité) :
- `JWT_SECRET` → `process.env.JWT_SECRET` (avec vérification longueur ≥ 32 chars)
- `DB_CONNECTION`, `STRIPE_SECRET_KEY`, `SENDGRID_API_KEY` → supprimés du code

### 3.2 Suppression de l'endpoint `/debug`

L'endpoint exposant les secrets et `process.env` a été supprimé.
Seul `/health` subsiste comme endpoint de monitoring (sans données sensibles).

### 3.3 Mise à jour des dépendances

```json
"express": "^4.21.2"     // était 4.17.1
"helmet": "^8.1.0"       // ajouté (headers de sécurité)
```

### 3.4 Sécurisation de l'application

- `helmet()` activé (headers HTTP sécurisés)
- Validation et sanitisation des entrées (protection XSS, injection)
- Rate limiting sur les endpoints sensibles
- JWT signé avec un secret fort depuis l'environnement

### 3.5 Dockerfile sécurisé

- Image de base : `node:20-alpine` (à jour, surface d'attaque réduite)
- Utilisateur non-root (`appuser`)
- `npm install --omit=dev` (pas de devDependencies en prod)

### 3.6 Contrôle `.gitignore`

`.env` ajouté au `.gitignore` pour éviter tout commit accidentel de secrets.

**Métriques après corrections :**
- Vulnérabilités CRITIQUES : **0**
- Vulnérabilités HAUTES : **0**
- Vulnérabilités MOYENNES : **0**
- **Total : 0 vulnérabilité** ✅

## 4) Configuration GitHub Actions (base)

Le workflow principal est dans `.github/workflows/devsecops.yml`.

Il se lance sur :

- `push` (sur toutes les branches),
- `pull_request` vers `main`,
- `workflow_dispatch` (déclenchement manuel).

Cela permet de tester très tôt les changements et de détecter les problèmes avant fusion.

## 5) Intégration des scans sécurité

### Semgrep (SAST)

- Scan statique avec `semgrep` (pip install dans le pipeline).
- Le scan utilise `p/owasp-top-ten` + `p/security-audit` + `p/secrets` + mes règles locales dans `.semgrep/rules.yml`.
- Le résultat est exporté au format SARIF puis envoyé dans l'onglet Security de GitHub.

### CodeQL (SAST — Exercice 3)

- Second outil SAST fourni nativement par GitHub.
- Analyse le code JavaScript avec les requêtes officielles de sécurité.
- Les résultats sont publiés directement dans l'onglet Security > Code scanning.

### Snyk (SCA)

- Scan approfondi des dépendances NPM via `snyk/actions/node`.
- Nécessite le secret `SNYK_TOKEN` dans les variables du repo.
- Rapport SARIF remonté dans Security.

### Gitleaks (Détection de secrets)

- Scan de tout l'historique Git (`fetch-depth: 0`).
- Détecte les clés API, tokens et mots de passe committés accidentellement.
- Outil critique : évite les fuites de credentials.

## 6) Tests OWASP automatisés

Deux niveaux de tests :

1. Tests applicatifs (`tests/app.test.js`) — valident les routes de base.
2. Tests sécurité (`tests/security.test.js`) — vérifient la neutralisation XSS et l'échappement des injections.

En complément, `npm audit --audit-level=high` détecte les dépendances à risque élevé.

## 7) Build et publication d'artefacts sécurisés

- Build Docker sur **toutes les branches** → image sauvegardée en artifact `image.tar`.
- Scan Trivy sur l'artifact (pas seulement sur `main`) → bloque si failles HIGH/CRITICAL.
- Sur `main` uniquement : l'image est poussée vers GHCR (`ghcr.io`) après validation.

## 8) Security Gate (Exercice 4)

Un job `security_gate` s'exécute après tous les scans (`if: always()`).
Il vérifie les résultats de Semgrep, Trivy et Gitleaks, et fait **échouer le pipeline** si l'un d'eux détecte une vulnérabilité critique.
Résultat : le merge est **bloqué automatiquement** en cas de problème grave.

## 9) Vérifications de conformité

Le script `scripts/compliance-check.sh` vérifie :

- push direct sur `main` détecté → alerte,
- présence du fichier `.github/CODEOWNERS`,
- présence du token Snyk.

## 10) Rapports de sécurité

- Semgrep, Snyk et CodeQL publient leurs rapports SARIF dans l'onglet **Security > Code scanning**.
- Le job `compliance` génère un rapport JSON (`security-report.json`) disponible en **artifact** téléchargeable.
- Un tableau récapitulatif est écrit dans `GITHUB_STEP_SUMMARY` (visible dans l'onglet Actions).

## 11) Variables d'environnement

Copier `.env.example` en `.env` (jamais commité, listé dans `.gitignore`) et remplir les valeurs.
Les secrets de production sont configurés dans **Settings > Secrets and variables > Actions**.

## 12) Comment exécuter localement

```bash
npm install
npm test
npm run test:security
```

Puis lancer l’app :

```bash
npm start
```

Test API rapide :

```bash
curl -X POST http://localhost:3000/echo \
  -H "Content-Type: application/json" \
  -d '{"message":"<script>alert(1)</script>"}'
```

## 13) Limites et améliorations possibles

- Ajouter un scan DAST avec OWASP ZAP (Section 5 du TP, optionnel).
- Ajouter des environnements séparés (dev/staging/prod).
- Renforcer les branch protections côté GitHub (required status checks).
- Ajouter une gestion de secrets plus avancée (HashiCorp Vault, rotation automatique).

## 14) Leçons apprises

- **"Shift left" n'est pas un slogan** : intégrer les scans dès le premier commit évite de corriger en urgence en fin de sprint. Les 8 vulnérabilités détectées sur l'app du TP auraient toutes pu partir en production sans ce pipeline.
- **Les secrets dans le code sont le risque n°1** : Gitleaks et Semgrep ont tous les deux détecté les credentials hardcodés. Une simple rotation de clé ne suffit pas si elles sont dans l'historique Git — il faut utiliser `git filter-repo` ou BFG Repo Cleaner.
- **Un Dockerfile non sécurisé démultiplie la surface d'attaque** : passer de `node:14` à `node:20-alpine` + utilisateur non-root a éliminé toutes les CVE critiques détectées par Trivy.
- **npm audit ne remplace pas Snyk** : npm audit ne remonte que les CVE publiées dans le registre npm, Snyk détecte aussi les vulnérabilités transitives et propose des correctifs automatiques.
- **Le Security Gate change la dynamique d'équipe** : quand le merge est bloqué automatiquement, la sécurité n'est plus optionnelle — elle devient une contrainte technique, pas une recommandation ignorée.
- **Deux SAST valent mieux qu'un** : Semgrep et CodeQL ont des ensembles de règles différents et se complètent. Semgrep est plus rapide et configurable ; CodeQL a une meilleure couverture des flux de données inter-fonctions.

## 15) Conclusion personnelle

Ce TP m'a permis de comprendre le principe DevSecOps :
la sécurité n'est pas ajoutée à la fin, elle est intégrée dans le pipeline dès le début.

Même avec un petit projet, on voit déjà un vrai gain :
les erreurs et vulnérabilités remontent automatiquement, plus tôt, et de façon traçable.
L'ajout du Security Gate montre concrètement comment bloquer automatiquement un merge dangereux sans intervention humaine.
