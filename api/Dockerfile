FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

CMD ["sh", "-c", "npx prisma migrate deploy && npx tsx src/scripts/seed.ts && npx tsx src/scripts/ingest.ts && npx tsx src/index.ts"]
