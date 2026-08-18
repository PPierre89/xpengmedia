# syntax=docker/dockerfile:1

###############################################################################
# XPENG Media Hub — image Docker tout-en-un (app + proxy CORS)
# Conçue pour tourner sur un NAS UGREEN (UGOS Pro), Synology, QNAP, Raspberry Pi...
###############################################################################

# ---------- Étape 1 : compilation de l'application React ----------
FROM node:22-alpine AS builder

WORKDIR /app

# Les dépendances sont installées séparément pour profiter du cache Docker
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

COPY . .

# Servi à la racine du domaine (et non sous /xpengmedia/ comme sur GitHub Pages)
ENV BASE_PATH=/
ENV NODE_OPTIONS=--max-old-space-size=4096
RUN npm run build

# ---------- Étape 2 : image finale, minimale ----------
FROM node:22-alpine AS runtime

LABEL org.opencontainers.image.title="XPENG Media Hub" \
      org.opencontainers.image.description="Portail multimédia XPENG auto-hébergé, avec proxy IPTV intégré" \
      org.opencontainers.image.source="https://github.com/PPierre89/xpengmedia" \
      org.opencontainers.image.licenses="MIT"

WORKDIR /app

# Le serveur n'a aucune dépendance npm : on ne copie que le strict nécessaire
COPY --from=builder /app/dist ./dist
COPY server ./server

ENV NODE_ENV=production \
    PORT=8080 \
    HOST=0.0.0.0 \
    STATIC_DIR=/app/dist

EXPOSE 8080

# Pas de root inutile
USER node

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||8080)+'/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server/server.js"]
