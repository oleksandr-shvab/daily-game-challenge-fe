# The production image is Caddy with the built app inside (same origin, see deploy/Caddyfile).
# One image for every environment: no VITE_* values are baked in.

# node:24-slim (glibc), not Alpine: npm has a gap with platform-specific optional packages on musl.
FROM node:24-slim@sha256:32e57b5784e8875d2cc0112dcaf13f9100f2d0d9446187808738e99aee29a5a2 AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci
COPY . .
# Not `npm run build`: CI's build job already type-checks, and tsc -b would also check e2e/.
RUN npx vite build

FROM caddy:2-alpine@sha256:003a97808e781aa9f7e75cc2f43d34d461099031faf5e20faefb9f61126836f0
# The official binary carries a file capability (cap_net_bind_service). With cap_drop: ALL a
# non-root process cannot execute such a binary ("operation not permitted"), so it is removed.
# Compose sets net.ipv4.ip_unprivileged_port_start=0 so Caddy can still bind 80 and 443.
RUN setcap -r /usr/bin/caddy \
    && adduser -D -u 10001 caddy \
    && chown -R caddy:caddy /data /config
COPY --from=build /app/dist /srv
COPY deploy/Caddyfile /etc/caddy/Caddyfile
# A broken Caddyfile fails the build. The data directory goes to /tmp so nothing root-owned
# lands in /data.
RUN XDG_DATA_HOME=/tmp XDG_CONFIG_HOME=/tmp SITE_ADDRESS=localhost \
    caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
USER caddy
EXPOSE 80 443 443/udp
