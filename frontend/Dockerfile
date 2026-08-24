FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# O Vite por padrão usa a porta 5173
EXPOSE 5173

# Comando para rodar o Vite no modo desenvolvimento exposto para a rede
CMD ["npm", "run", "dev", "--", "--host"]