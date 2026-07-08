#!/usr/bin/env bash
# Runs the Cloudflare tunnel for the News Control Center.
set -euo pipefail
CFDIR=/opt/news/.cloudflared
export TUNNEL_ORIGIN_CERT="$CFDIR/cert.pem"
exec /opt/news/tools/cloudflared tunnel --config "$CFDIR/config.yml" run newsctl
