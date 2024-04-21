FROM node:14
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN apt-get update && apt-get install -y rpm
RUN npm run dist -- --linux