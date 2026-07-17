#!/usr/bin/env bash
#
# Reliable deploy for AILmanac.
#
# WHY THIS EXISTS: the repo lives under an iCloud-synced ~/Desktop. iCloud
# duplicates files mid-build ("* 2", "* 3" conflict copies) and stalls reads of
# the 4.3 GB node_modules, which corrupts or hangs in-place `docusaurus build`.
# The cure is to build ENTIRELY OUTSIDE iCloud: copy the source (NOT node_modules)
# to /tmp, install deps there once, build there, and force-push build/ to gh-pages.
# A cold run is ~3-4 min (npm ci); warm runs reuse /tmp deps and finish in <1 min.
#
# CONCURRENCY: scheduled AILmanac tasks can overlap, and two runs sharing $DST
# will destroy each other -- both `rsync --delete` and `rm -rf build` into the
# same tree, so one run deletes the other's build mid-flight (symptoms: ENOENT on
# package.json or build/<locale>/__server/server.bundle.js, or "unable to read
# <sha>" on push). We serialize on an atomic mkdir lock rather than giving each
# run its own dir, because a unique dir means a cold `npm ci` over 4.3 GB of deps
# (3-4 min) on every run instead of reusing warm deps (<1 min).
#
# Usage: bash scripts/deploy.sh
set -euo pipefail

SRC="$(cd "$(dirname "$0")/.." && pwd)"
DST="${AILMANAC_DEPLOY_DIR:-/tmp/ailmanac_deploy}"
LOCK="$DST.lock"
LOCK_WAIT_SECS="${AILMANAC_LOCK_WAIT_SECS:-900}"
REMOTE="https://github.com/derob98/ailmanac.git"
NAME="Gianluca De Robertis"
EMAIL="69207376+derob98@users.noreply.github.com"

# --- Acquire the deploy lock (mkdir is atomic: exactly one caller wins) -------
acquire_lock() {
  local waited=0
  while ! mkdir "$LOCK" 2>/dev/null; do
    local holder
    holder="$(cat "$LOCK/pid" 2>/dev/null || echo '')"
    # Reclaim a lock whose owner died, so one crashed run can't wedge all future ones.
    if [ -n "$holder" ] && ! kill -0 "$holder" 2>/dev/null; then
      echo "==> removing stale lock from dead pid $holder"
      rm -rf "$LOCK"
      continue
    fi
    if [ "$waited" -ge "$LOCK_WAIT_SECS" ]; then
      echo "ERROR: another deploy (pid ${holder:-unknown}) has held $LOCK for ${LOCK_WAIT_SECS}s. Aborting." >&2
      exit 1
    fi
    if [ "$waited" -eq 0 ]; then
      echo "==> another deploy (pid ${holder:-unknown}) is running; waiting for the lock"
    fi
    sleep 10
    waited=$((waited + 10))
  done
  echo $$ > "$LOCK/pid"
  trap 'rm -rf "$LOCK"' EXIT
  if [ "$waited" -gt 0 ]; then
    echo "==> lock acquired after ${waited}s"
  fi
  # Explicit: a bare `[ ... ] && echo` tail would return 1 on the common path and
  # trip `set -e` in the caller, killing the deploy silently.
  return 0
}
acquire_lock

echo "==> syncing source to $DST (outside iCloud)"
mkdir -p "$DST"
rsync -a --delete \
  --exclude node_modules --exclude .git --exclude build \
  --exclude '* 2' --exclude '* 3' --exclude '* 2.*' --exclude '* 3.*' \
  "$SRC/" "$DST/"

cd "$DST"
# Strip any iCloud conflict copies that slipped through.
find . -path ./node_modules -prune -o \
  \( -name '* 2' -o -name '* 3' -o -name '* 2.*' -o -name '* 3.*' \) \
  -exec rm -rf {} + 2>/dev/null || true

if [ ! -x node_modules/.bin/docusaurus ]; then
  echo "==> installing dependencies in /tmp (one-time, cold start)"
  npm ci || npm install
fi

echo "==> building all locales"
rm -rf build
npm run build

echo "==> publishing build/ to gh-pages"
touch build/.nojekyll
cd build
rm -rf .git
git init -q
git checkout -q -b gh-pages
git -c user.name="$NAME" -c user.email="$EMAIL" add -A
git -c user.name="$NAME" -c user.email="$EMAIL" commit -q -m "deploy: $(date -u +%Y-%m-%dT%H-%M-%SZ)"
git push -f "$REMOTE" gh-pages
rm -rf .git

echo "==> deployed: https://derob98.github.io/ailmanac/"
