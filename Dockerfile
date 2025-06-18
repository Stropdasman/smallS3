FROM node:18-slim
WORKDIR /app
COPY package.json ./
COPY package-lock.json* ./
RUN npm install --production
COPY index.js ./
EXPOSE 2999
CMD ["npm", "start"]
