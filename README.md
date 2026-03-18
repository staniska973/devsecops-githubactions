# TP DevSecOps - GitHub Actions (niveau débutant)

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

## Résultat attendu

À chaque push / pull request, le pipeline lance :

1. les tests,
2. le scan Semgrep,
3. le scan Snyk,
4. l'audit npm,
5. le build Docker (toutes branches) + scan Trivy sur `main`,
6. les vérifications de conformité.