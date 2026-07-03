FROM node:20-alpine
WORKDIR /app
COPY family-calendar/package*.json ./
RUN npm install
COPY family-calendar/ .
EXPOSE 3000
CMD ["node", "server.js"]
