FROM node:lts
WORKDIR /app
COPY package.json ./
COPY pnpm-lock.yaml ./

RUN npm install -g pnpm && \
    pnpm install
COPY . .

EXPOSE 7778
CMD ["pnpm", "serve"]
