FROM node:20-alpine AS deps
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
RUN if [ -f package-lock.json ]; then \
        npm ci; \
    elif [ -f pnpm-lock.yaml ]; then \
        corepack enable && pnpm i --frozen-lockfile; \
    elif [ -f yarn.lock ]; then \
        yarn --frozen-lockfile; \
    else \
        npm i; \
    fi

FROM deps AS builder
WORKDIR /app

COPY prisma ./prisma
RUN npx prisma generate

COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

RUN apk add --no-cache mariadb-client

COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/prisma ./prisma
COPY entrypoint.sh ./entrypoint.sh

RUN chmod +x /app/entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["/app/entrypoint.sh"]

ARG RESEND_API_KEY
ENV RESEND_API_KEY=${RESEND_API_KEY}
