#!/usr/bin/env bash
set -euo pipefail

echo "[Conformité] Démarrage des contrôles..."

if [[ "${GITHUB_EVENT_NAME:-}" == "push" && "${GITHUB_REF:-}" == "refs/heads/main" ]]; then
  echo "[Conformité] Push direct sur main interdit. Utiliser une Pull Request."
  exit 1
fi

if [[ ! -f ".github/CODEOWNERS" ]]; then
  echo "[Conformité] Fichier .github/CODEOWNERS manquant."
  exit 1
fi

if [[ -z "${SNYK_TOKEN:-}" ]]; then
  echo "[Conformité] SNYK_TOKEN absent (le scan Snyk ne sera pas complet)."
else
  echo "[Conformité] SNYK_TOKEN présent."
fi

echo "[Conformité] Contrôles terminés."
