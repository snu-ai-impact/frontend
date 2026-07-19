# Development image for the Next.js frontend.
# App code is bind-mounted by docker-compose for hot reload; only deps are baked in.
FROM node:20-alpine

# Next.js/SWC needs libc6-compat on Alpine.
RUN apk add --no-cache libc6-compat

ENV NEXT_TELEMETRY_DISABLED=1

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

EXPOSE 3000

CMD ["npm", "run", "dev", "--", "-H", "0.0.0.0"]
