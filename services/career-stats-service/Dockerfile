FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

# Use npm install
RUN npm install

COPY . .

EXPOSE 5004

CMD ["npm", "start"]
