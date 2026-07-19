FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src

# Uploads land here. A volume is mounted over it at runtime; creating it up
# front with the right owner means the non-root user can write to it.
RUN mkdir -p /app/public && chown -R node:node /app/public

ENV NODE_ENV=production

USER node

EXPOSE ${PORT}

CMD ["npm", "start"]
