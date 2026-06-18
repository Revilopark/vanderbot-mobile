FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install express cors eventsource
COPY . .
EXPOSE 8080
CMD ["node", "mcp-client.js"]
