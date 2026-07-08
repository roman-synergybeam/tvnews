#!/usr/bin/env bash
# Auto commit + push the News Control Center working tree to GitHub (tvnews).
# Run by the tvnews-autosync systemd timer. Safe to run by hand too.
set -uo pipefail

cd /opt/news || exit 1
export GIT_SSH_COMMAND="ssh -i /root/.ssh/id_ed25519_tvnews -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new"

# Integrate any remote changes first so pushes fast-forward.
git pull --rebase --autostash origin main >/dev/null 2>&1 || true

git add -A
if ! git diff --cached --quiet; then
  git commit -q -m "auto-sync: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
fi

# Push (no-op when there is nothing new).
git push -q origin main
