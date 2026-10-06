FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY .env ./

COPY src/ ./src/

CMD ["node", "src/app.js"]
