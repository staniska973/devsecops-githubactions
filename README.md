# TP DevSecOps - GitHub Actions

![Pipeline DevSecOps](https://github.com/staniska973/devsecops-githubactions/workflows/Pipeline%20DevSecOps/badge.svg)

Ce dépôt contient un exemple de pipeline DevSecOps simple pour un TP de Mastère 1 Cybersécurité & IA.

## Contenu principal

- Workflow CI/CD sécurité : `.github/workflows/devsecops.yml`
- Règles Semgrep : `.semgrep/rules.yml`
- Contrôles de conformité : `scripts/compliance-check.sh`
- Mini application Node.js : `src/`
- Tests fonctionnels + sécurité : `tests/`
- Rapport TP vulgarisé : `TP_M1_Rapport.md`

## Lancer en local

```bash
npm install
npm test
npm run test:security
npm start
```

## Secrets GitHub à configurer

- `SNYK_TOKEN` : token API Snyk (obligatoire pour un scan Snyk complet)

> Voir `.env.example` pour les variables d'environnement locales (ne jamais committer `.env`).

## Résultat attendu

À chaque push / pull request, le pipeline lance :

1. **Tests** — fonctionnels + sécurité
2. **SAST (Semgrep)** — OWASP Top 10, security-audit, secrets, règles custom
3. **SCA (npm audit)** — CVE dans les dépendances
4. **Snyk** — scan approfondi des dépendances
5. **Gitleaks** — détection de secrets dans l'historique Git
6. **Build Docker** — image sauvegardée en artifact (toutes branches)
7. **Trivy** — scan de l'image Docker sur toutes les branches
8. **CodeQL** — second outil SAST par GitHub
9. **Security Gate** — bloque le merge si vulnérabilités critiques
10. **Conformité + rapport JSON** — artifact téléchargeable depuis l'onglet Actions