FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY .env ./

COPY src/ ./src/

EXPOSE 5000

CMD ["node", "src/app.js"]
