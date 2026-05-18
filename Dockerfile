## To be used for DEVELOPMENT purposes only
FROM node:22-alpine

RUN apk add --no-cache make gcc g++ python3 git

WORKDIR /app

COPY package*.json ./
RUN npm ci --build-from-source

COPY . .

EXPOSE 8080 9229

CMD ["sh", "-c", "npm run migration:run && npm run start:dev"]