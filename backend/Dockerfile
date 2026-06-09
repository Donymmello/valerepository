FROM node:20

WORKDIR /app

# Copia os arquivos de dependências
COPY package*.json ./

# Instala as dependências
RUN npm install

# Copia o resto do código do backend
COPY . .

# Porta que o Express usa (mude se o seu usar outra)
EXPOSE 5000

# Comando para rodar o servidor
CMD ["node", "server.js"]