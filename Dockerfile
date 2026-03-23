# Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy the built application from the build stage to the nginx container
COPY --from=build /app/dist /usr/share/nginx/html

# Copy a custom nginx configuration to handle React Router (optional but recommended)
# RUN echo 'server { \
#     listen 80; \
#     location / { \
#         root /usr/share/nginx/html; \
#         index index.html index.htm; \
#         try_files $uri $uri/ /index.html; \
#     } \
# }' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
