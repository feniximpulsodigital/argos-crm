# ===== Stage 1: Build =====
FROM --platform=linux/amd64 node:20-alpine AS builder

WORKDIR /app

# Copia manifests e instala dependências (inclui opcionais por plataforma)
COPY package.json package-lock.json ./
RUN npm ci --include=optional

# Copia o restante do código e gera build de produção
COPY . .
RUN npm run build

# ===== Stage 2: Runtime =====
FROM --platform=linux/amd64 node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Instala apenas o servidor estático
RUN npm install -g serve@14.2.6

# Copia o build da etapa anterior
COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["sh", "-c", "serve -s dist -l ${PORT:-3000}"]
