# Deps stage — shared base
FROM node:22-alpine AS deps

WORKDIR /app

COPY package*.json ./
RUN npm ci

# Dev stage — used by docker-compose.dev.yml
FROM deps AS dev

COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

# Build stage — compiles the static assets
FROM deps AS builder

COPY . .

ARG VITE_STATION_MANAGEMENT_URL=http://localhost:4000
ARG VITE_ALERTING_URL=http://localhost:4001
ENV VITE_STATION_MANAGEMENT_URL=$VITE_STATION_MANAGEMENT_URL
ENV VITE_ALERTING_URL=$VITE_ALERTING_URL

RUN npm run build

# Serve stage — production nginx
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
