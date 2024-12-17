# syntax=docker/dockerfile:1
FROM node:20

EXPOSE 7072
WORKDIR /app
RUN npm install i npm@latest -g
RUN npm install dotenv-cli -g
COPY package.json package-lock*.json ./
RUN npm install
COPY . .   
CMD ["npm","run" , "dockerStart"]