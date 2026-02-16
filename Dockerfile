# Use official Node.js LTS image
FROM node:22-slim

# Install xvfb, mysql-client, and mysql-server
RUN apt-get update && \
    apt-get install -y xvfb ca-certificates fonts-liberation libappindicator3-1 libasound2 libatk-bridge2.0-0 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgbm1 libgcc1 libglib2.0-0 libgtk-3-0 libnspr4 libnss3 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 lsb-release wget xdg-utils && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /usr/src/app

# Copy the rest of the application code
COPY . .

# Install dependencies
RUN rm -rf node_modules package-lock.json && \
    npm cache clear --force && \
    npm install --production && \
    npx puppeteer browsers install chrome

# Expose the port (change if your app uses a different port)
EXPOSE 3001

# Set environment variables (override as needed)
ENV NODE_ENV=prod
ENV IS_DOCKER=1

# Start the application
ENTRYPOINT xvfb-run --server-args="-screen 0 1280x800x24" --auto-servernum node server.mjs
