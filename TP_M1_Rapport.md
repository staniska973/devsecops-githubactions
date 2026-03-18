# TP Pipeline DevSecOps avec GitHub Actions

## 1) Contexte du TP

Dans ce TP, mon objectif est de construire un pipeline DevSecOps simple et compréhensible.
L’idée est de vérifier automatiquement :

- que le code fonctionne (tests),
- qu’il n’y a pas de vulnérabilités évidentes (Semgrep),
- que les dépendances ne sont pas dangereuses (Snyk + npm audit),
- que l’image Docker n’intègre pas de failles critiques,
- et que des règles de conformité minimales sont respectées.

J’ai fait volontairement une version claire, pour bien comprendre chaque étape.

## 2) Configuration GitHub Actions (base)

Le workflow principal est dans `.github/workflows/devsecops.yml`.

Il se lance sur :

- `push` (sur les branches),
- `pull_request` vers `main`,
- `workflow_dispatch` (déclenchement manuel).

Cela permet de tester très tôt les changements et de détecter les problèmes avant fusion.

## 3) Intégration des scans sécurité (Semgrep + Snyk)

### Semgrep

- J’ai ajouté un scan SAST avec `semgrep`.
- Le scan utilise `p/owasp-top-ten` + mes règles locales dans `.semgrep/rules.yml`.
- Le résultat est exporté au format SARIF puis envoyé dans l’onglet Security de GitHub.

### Snyk

- J’ai ajouté l’action `snyk/actions/node`.
- Le scan vérifie les vulnérabilités des dépendances NPM.
- Il faut définir le secret `SNYK_TOKEN` dans les secrets du repo.
- Un rapport SARIF est aussi remonté dans Security.

## 4) Tests OWASP automatisés

J’ai mis en place deux niveaux simples :

1. Des tests applicatifs (`tests/app.test.js`) pour valider les routes de base.
2. Des tests sécurité (`tests/security.test.js`) pour vérifier qu’une entrée de type XSS est neutralisée.

En complément, `npm audit --audit-level=high` permet de détecter des dépendances à risque élevé.

## 5) Build et publication d’artefacts sécurisés

- Le projet contient un `Dockerfile` minimal.
- L’image est construite dans GitHub Actions.
- Sur la branche `main`, l’image peut être poussée vers GHCR (`ghcr.io`).
- Un scan Trivy est exécuté sur l’image pour bloquer en cas de failles HIGH/CRITICAL.

## 6) Vérifications de conformité

J’ai ajouté un script `scripts/compliance-check.sh` qui vérifie :

- pas de push direct sur `main` (forcer un flux PR),
- présence du fichier `.github/CODEOWNERS`,
- présence du token Snyk (sinon message d’alerte).

Le but n’est pas de tout couvrir, mais de montrer une logique de conformité simple.

## 7) Rapports de sécurité

Les rapports Semgrep et Snyk sont envoyés en SARIF dans GitHub Security.
Le workflow écrit aussi un résumé global dans `GITHUB_STEP_SUMMARY`.

Résultat : on a une vue centralisée des contrôles de sécurité directement dans GitHub.

## 8) Comment exécuter localement (facultatif)

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

## 9) Limites et améliorations possibles

Cette version est volontairement simple pour l’apprentissage.
Améliorations possibles :

- ajouter des environnements séparés (dev/staging/prod),
- ajouter un vrai scan DAST (ex: OWASP ZAP sur une app déployée),
- renforcer les branch protections côté GitHub,
- ajouter une gestion de secrets plus avancée (vault, rotation).

## 10) Conclusion personnelle

Ce TP m’a permis de comprendre le principe DevSecOps :
la sécurité n’est pas ajoutée à la fin, elle est intégrée dans le pipeline dès le début.

Même avec un petit projet, on voit déjà un vrai gain :
les erreurs et vulnérabilités remontent automatiquement, plus tôt, et de façon traçable.
