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
# Usage: bash scripts/deploy.sh
set -euo pipefail

SRC="$(cd "$(dirname "$0")/.." && pwd)"
DST=/tmp/ailmanac_deploy
REMOTE="https://github.com/derob98/ailmanac.git"
NAME="Gianluca De Robertis"
EMAIL="69207376+derob98@users.noreply.github.com"

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
