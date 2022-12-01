# syntax=docker/dockerfile:1

# Create an image for production
FROM node:16-alpine

COPY . /tmp/builder

RUN cd /tmp/builder && \
    npm ci && \
    npm run build && \
    mkdir -p /var/www/node_modules && \
    chown -R node:node /var/www && \
    cp -a /tmp/builder/build /var/www/build && \
    cd /var/www

WORKDIR /var/www

# COPY package*.json .env ./
COPY package*.json ./
COPY .env.example .env

RUN npm install --production && rm -rf /tmp/builder/

CMD ["node", "build/app.js"]
