FROM node:20

WORKDIR /app

COPY frontend/package*.json ./
RUN npm install

COPY frontend ./

RUN npm run build

RUN npm install -g serve

CMD ["serve", "-s", "build", "-l", "3000"]