# ---- Stage 1: build ----
# Compila o React/Vite para ficheiros estáticos (dist/). Esta imagem
# intermédia (com o Node inteiro, node_modules, etc.) não vai para produção
# — só o resultado do build passa para o stage seguinte.
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# URL da API é compilada dentro do bundle (import.meta.env.VITE_API_URL,
# ver src/api/axios.js) — por isso tem de ser um build ARG, não uma env var
# de runtime. Sem isto, mantém o fallback já existente no código
# (http://localhost:5000/api), igual ao comportamento anterior.
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

RUN npm run build

# ---- Stage 2: produção ----
# Nginx puro a servir ficheiros estáticos — sem Node, sem dev server, sem
# HMR. É isto que reduz o consumo de RAM em produção.
FROM nginx:1.27-alpine AS production

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
