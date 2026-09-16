FROM node:20-alpine AS builder

WORKDIR /app
RUN apk add --no-cache openssl libc6-compat

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

RUN npx prisma generate
RUN npm run build

FROM node:20-alpine

WORKDIR /app
RUN apk add --no-cache openssl libc6-compat

COPY package*.json ./

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
# Reuse the builder dependencies.  This avoids a second concurrent npm install
# during the image build, which can stall on slow package registries.
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 5000

CMD ["node", "dist/server.js"]
