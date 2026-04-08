# Stage 1: Build the Vite app
FROM node:20-alpine AS builder
WORKDIR /app
ENV CI=true
ENV NODE_OPTIONS=--max-old-space-size=1024
COPY package*.json ./
# Clean install dependencies
RUN npm ci --no-audit --no-fund
COPY . .
# Build the static files
RUN npm run build

# Stage 2: Serve the app with a lightweight Nginx web server
FROM nginx:alpine
# Configure SPA fallback for BrowserRouter routes.
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
# Copy the built files from the previous stage to Nginx
COPY --from=builder /app/dist /usr/share/nginx/html
# Expose port 80 for Traefik to route traffic to
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
