#!/usr/bin/env bash
# Build web/, push it to GitHub and verify the Vercel production deployment.
#
# Usage:
#   scripts/deploy-web.sh ["commit message"]
#
# Overrides:
#   REPO_DIR    git clone that is pushed    (default: this script's repository)
#   SOURCE_DIR  folder holding the app code (default: nearest ancestor above the
#               clone that has web/package.json, else the clone itself)
#   BRANCH      branch to push              (default: main)
#   LIVE_URL    production URL to check     (default: https://yashu-malnad-xi.vercel.app)
#   TIMEOUT     seconds to wait for Vercel  (default: 240)

set -euo pipefail

script_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
repo_dir=${REPO_DIR:-$(cd "$script_dir/.." && pwd)}
branch=${BRANCH:-main}
live_url=${LIVE_URL:-https://yashu-malnad-xi.vercel.app}
timeout_s=${TIMEOUT:-240}
message=${1:-"chore(web): sync local changes and deploy"}

# A working copy can live above the clone (e.g. clone in .scratch/); prefer it.
find_source() {
  local dir
  dir=$(dirname "$repo_dir")
  while [ "$dir" != "$(dirname "$dir")" ]; do
    if [ -f "$dir/web/package.json" ]; then printf '%s\n' "$dir"; return 0; fi
    dir=$(dirname "$dir")
  done
  return 1
}

if [ -z "${SOURCE_DIR:-}" ]; then
  if ! SOURCE_DIR=$(find_source); then
    SOURCE_DIR=$repo_dir
  fi
fi
source_dir=$SOURCE_DIR
app_dir=$source_dir/web

echo "repo:   $repo_dir"
echo "source: $app_dir"
echo "live:   $live_url"
echo "branch: $branch"

[ -f "$app_dir/package.json" ] || { echo "error: no package.json in $app_dir" >&2; exit 1; }

# A bundled Node is not always on PATH.
if ! command -v node >/dev/null 2>&1; then
  for candidate in "$source_dir"/.tools/node-*/; do
    if [ -x "${candidate}node" ] || [ -x "${candidate}node.exe" ]; then
      PATH="${candidate%/}:$PATH"; export PATH; break
    fi
  done
fi
command -v node >/dev/null 2>&1 || { echo "error: node not on PATH" >&2; exit 1; }

echo "==> Building"
(cd "$app_dir" && npm run build)

bundle=$(ls "$app_dir/dist/assets" 2>/dev/null | grep '^index-.*\.js$' | head -n 1 || true)
[ -n "$bundle" ] || { echo "error: build produced no dist/assets/index-*.js" >&2; exit 1; }
echo "==> Built $bundle"

if [ "$source_dir" != "$repo_dir" ]; then
  echo "==> Syncing web/ into the clone"
  for item in src public index.html package.json package-lock.json vite.config.ts tsconfig.json; do
    [ -e "$app_dir/$item" ] && cp -R "$app_dir/$item" "$repo_dir/web/"
  done
fi

cd "$repo_dir"
if [ -n "$(git status --porcelain -- web)" ]; then
  echo "==> Committing"
  git add -A -- web
  git commit -m "$message"
else
  echo "==> No changes under web/"
fi

git fetch --quiet origin "$branch"
if [ "$(git rev-parse HEAD)" != "$(git rev-parse FETCH_HEAD)" ]; then
  echo "==> Pushing to origin/$branch"
  GIT_TERMINAL_PROMPT=0 git push origin "$branch"
else
  echo "==> Nothing to push"
fi

echo "==> Waiting for $live_url to serve $bundle"
deadline=$(( $(date +%s) + timeout_s ))
while [ "$(date +%s)" -le "$deadline" ]; do
  live=$(curl -fsS --max-time 20 -H 'Cache-Control: no-cache' "$live_url/?deploy=$(date +%s)-$RANDOM" 2>/dev/null \
    | grep -o 'assets/index-[A-Za-z0-9_-]*\.js' | head -n 1 || true)
  if [ "${live##*/}" = "$bundle" ]; then
    echo
    echo "OK: production serves $bundle from commit $(git rev-parse --short HEAD)"
    exit 0
  fi
  printf '.'
  sleep 5
done

echo
echo "error: $live_url still serves '${live:-nothing}' after ${timeout_s}s (expected $bundle)." >&2
echo "Check the deployment on Vercel, then reload with a hard refresh (Ctrl+Shift+R)." >&2
exit 1
