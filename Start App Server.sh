#!/usr/bin/env bash

set -u

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)" || {
  printf '\nERROR: Could not open the folder containing this launcher.\n\n' >&2
  exit 1
}

cd -- "$SCRIPT_DIR" || exit 1

if [[ ! -f package.json ]]; then
  printf '\nERROR: package.json was not found beside this launcher.\n'
  printf 'Keep this SH file in the Parenting Bakes project root.\n\n'
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  printf '\nERROR: npm was not found.\n'
  printf 'Install Node.js 22 or newer, then try again.\n\n'
  exit 1
fi

APP_URL="http://localhost:5173/"

open_browser() {
  if [[ -n "${PARENTING_BAKES_SKIP_BROWSER:-}" ]]; then
    return
  fi

  if command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$APP_URL" >/dev/null 2>&1 &
  elif command -v gio >/dev/null 2>&1; then
    gio open "$APP_URL" >/dev/null 2>&1 &
  fi
}

if command -v curl >/dev/null 2>&1 \
  && curl --fail --silent --show-error --max-time 2 "$APP_URL" 2>/dev/null \
    | grep -q 'Gaya Parenting Kamu'; then
  printf '\nParenting Bakes is already running at:\n%s\n\n' "$APP_URL"
  printf 'Opening it in your default browser now.\n\n'
  open_browser
  exit 0
fi

printf '\n Parenting Bakes app server\n'
printf ' ===========================\n\n'
printf ' Starting on port 5173...\n'
printf ' This terminal must stay open while you check the app.\n'
printf ' Press Ctrl+C here when you want to stop the server.\n\n'

if [[ -z "${PARENTING_BAKES_SKIP_BROWSER:-}" ]]; then
  (
    sleep 2
    open_browser
  ) &
fi

npm run dev -- --port 5173 --strictPort
APP_EXIT_CODE=$?

printf '\n'
if [[ $APP_EXIT_CODE -eq 0 ]]; then
  printf 'The app server has stopped.\n'
else
  printf 'The app server could not start or stopped with an error.\n' >&2
  printf 'Review the message above for details.\n' >&2
fi
printf '\n'

exit "$APP_EXIT_CODE"
