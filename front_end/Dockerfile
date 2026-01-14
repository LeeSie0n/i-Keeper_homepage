FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
RUN if [ -f package-lock.json ]; then npm ci --include=dev; elif [ -f pnpm-lock.yaml ]; then corepack enable && pnpm i --frozen-lockfile; elif [ -f yarn.lock ]; then yarn --frozen-lockfile; else npm i; fi

COPY . .

RUN npm pkg set scripts.build="vite build"
RUN npm run build

FROM nginx:1.27-alpine
WORKDIR /
COPY ./nginx.conf.template /etc/nginx/conf.d/default.conf.template
COPY --from=build --chown=101:101 /app/dist /usr/share/nginx/html
RUN find /usr/share/nginx/html -type d -exec chmod 755 {} \; && find /usr/share/nginx/html -type f -exec chmod 644 {} \;
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s CMD wget -qO- http://127.0.0.1/ >/dev/null 2>&1 || exit 1
COPY ./entrypoint.sh /etc/nginx/entrypoint.sh
RUN chmod +x etc/nginx/entrypoint.sh
ENTRYPOINT [ "/bin/sh", "/etc/nginx/entrypoint.sh" ]