#!/bin/sh
# SessionStart hook: prints the ready-made briefing for the running model's
# training cutoff (briefings/<cutoff>.json). Claude Code leaves the model out
# of some sessions (headless runs, after /clear): those get default.json,
# which holds for every Claude model. A model it does not recognise may be
# newer than the data, so it gets nothing. POSIX sh and sed only: no Node, no jq.

dir="$(dirname "$0")/../briefings"

raw=$(sed -n -E 's/.*"model"[[:space:]]*:[[:space:]]*"([^"]*)".*/\1/p' | head -n 1)
if [ -z "$raw" ]; then
  cat "$dir/default.json"
  exit 0
fi
# "claude-opus-5-5[1m]" -> "opus-5-5"; "claude-haiku-4-5-20251001" -> "haiku-4-5"
model=$(printf '%s\n' "$raw" | tr 'A-Z' 'a-z' |
  sed -n -E 's/.*(fable|mythos|opus|sonnet|haiku)-([0-9]+)(-[0-9]{1,2})?([^0-9].*)?$/\1-\2\3/p')
[ -n "$model" ] || exit 0

while read -r name cutoff; do
  if [ "$name" = "$model" ] && [ -f "$dir/$cutoff.json" ]; then
    cat "$dir/$cutoff.json"
    exit 0
  fi
done < "$dir/models.txt"
exit 0
