FROM node:20

WORKDIR /app


COPY package*.json ./
RUN npm install


COPY . .


WORKDIR /app/frontend
RUN npm install
RUN npm run build

RUN npm install -g serve

CMD ["serve", "-s", "build", "-l", "3000"]