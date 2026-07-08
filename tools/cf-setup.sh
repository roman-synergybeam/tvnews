#!/usr/bin/env bash
# Run AFTER `cloudflared tunnel login` has produced cert.pem.
# Creates the tunnel, writes ingress config, and routes DNS for each brand host.
# Re-runnable (idempotent). Add more brand hostnames to HOSTS below as you grow.
set -euo pipefail

CFDIR=/opt/news/.cloudflared
CF=/opt/news/tools/cloudflared
TUNNEL=newsctl
export TUNNEL_ORIGIN_CERT="$CFDIR/cert.pem"

HOSTS=(news.go4rex.com news.intermagnum.com)   # <-- add future brand hosts here
LOCAL=http://localhost:3100

if [ ! -f "$CFDIR/cert.pem" ]; then
  echo "ERROR: $CFDIR/cert.pem not found. Run the login step first (see instructions)." >&2
  exit 1
fi

# Create the tunnel if it doesn't already exist.
if ! "$CF" tunnel list 2>/dev/null | awk '{print $2}' | grep -qx "$TUNNEL"; then
  echo "Creating tunnel '$TUNNEL'..."
  "$CF" tunnel create --credentials-file "$CFDIR/$TUNNEL.json" "$TUNNEL"
else
  echo "Tunnel '$TUNNEL' already exists."
fi

TID="$("$CF" tunnel list | awk -v n="$TUNNEL" '$2==n{print $1}')"
echo "Tunnel id: $TID"

# Write the ingress config: every brand host -> the local News app.
{
  echo "tunnel: $TID"
  echo "credentials-file: $CFDIR/$TUNNEL.json"
  echo "ingress:"
  for h in "${HOSTS[@]}"; do
    echo "  - hostname: $h"
    echo "    service: $LOCAL"
  done
  echo "  - service: http_status:404"
} > "$CFDIR/config.yml"
echo "Wrote $CFDIR/config.yml"

# Point DNS (CNAME) for each host at the tunnel.
for h in "${HOSTS[@]}"; do
  echo "Routing DNS: $h"
  "$CF" tunnel route dns "$TUNNEL" "$h" || echo "  (route for $h may already exist — continuing)"
done

echo
echo "Setup complete. Start the tunnel with:"
echo "  /opt/news/tools/cf-run.sh"
