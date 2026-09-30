# Serves the static NewCONet site from site/ on nginx:alpine, listening on 8080.
# nginx:alpine (a C server) is used instead of caddy: the box's edge already
# terminates TLS and reverse-proxies to this container, so the app is a plain
# static origin — and caddy's Go binary carries HIGH Go-stdlib CVEs that the
# managed-CI trivy gate (correctly) blocks. nginx:alpine's own base packages
# (c-ares, libexpat, ...) still drift dirty as new CVEs land against the
# pinned tag, so apk upgrade runs at build time to pull Alpine's patched
# packages — keeping every consumer build passing the managed-CI Trivy
# HIGH/CRITICAL gate regardless of upstream drift.
FROM nginx:alpine
RUN apk upgrade --no-cache
COPY site/ /usr/share/nginx/html/
# Test files live beside their source but must never be served, whatever the
# build context: a stdin build ignores .dockerignore.
RUN find /usr/share/nginx/html \( -name '*.test.js' -o -name '*.spec.js' \) -type f -delete
COPY default.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
