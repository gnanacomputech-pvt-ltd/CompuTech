#!/usr/bin/env bash
# First-time Let's Encrypt bootstrap for docker/docker-compose.yml.
#
# nginx.conf references /etc/letsencrypt/live/gnanacomputech.com/*.pem, so nginx
# refuses to start until a certificate exists. This script:
#   1. creates a short-lived self-signed placeholder cert,
#   2. starts nginx so the ACME HTTP-01 challenge can be served,
#   3. requests the real certificate from Let's Encrypt and reloads nginx.
#
# Usage (from gcs_erp/docker/):  LE_EMAIL=you@example.com ./init-letsencrypt.sh
# Set LE_STAGING=1 to test against Let's Encrypt's staging CA first.
set -euo pipefail

DOMAIN="${LE_DOMAIN:-gnanacomputech.com}"
EXTRA_DOMAINS="${LE_EXTRA_DOMAINS:-api.gnanacomputech.com verify.gnanacomputech.com}"
EMAIL="${LE_EMAIL:?Set LE_EMAIL to your contact email}"
STAGING_ARG=""
[ "${LE_STAGING:-0}" = "1" ] && STAGING_ARG="--staging"

LIVE="/etc/letsencrypt/live/${DOMAIN}"

echo ">> Creating placeholder certificate for ${DOMAIN}"
docker compose run --rm --entrypoint "sh -c 'mkdir -p ${LIVE} && openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
  -keyout ${LIVE}/privkey.pem -out ${LIVE}/fullchain.pem -subj /CN=localhost'" certbot

echo ">> Starting nginx"
docker compose up -d nginx

echo ">> Removing placeholder certificate"
docker compose run --rm --entrypoint "sh -c 'rm -rf /etc/letsencrypt/live/${DOMAIN} /etc/letsencrypt/archive/${DOMAIN} /etc/letsencrypt/renewal/${DOMAIN}.conf'" certbot

DOMAIN_ARGS="-d ${DOMAIN}"
for d in ${EXTRA_DOMAINS}; do DOMAIN_ARGS="${DOMAIN_ARGS} -d ${d}"; done

echo ">> Requesting real certificate"
docker compose run --rm --entrypoint "certbot certonly --webroot -w /var/www/certbot ${STAGING_ARG} \
  --email ${EMAIL} --agree-tos --no-eff-email ${DOMAIN_ARGS}" certbot

echo ">> Reloading nginx"
docker compose exec nginx nginx -s reload
echo "Done. Certificates will be renewed automatically by the certbot service."
