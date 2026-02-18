# Use official Node.js LTS image
FROM node:22-slim

# Install xvfb and chrome dependencies
RUN apt-get update && \
    apt-get install -y xvfb ca-certificates fonts-liberation libappindicator3-1 libasound2 libatk-bridge2.0-0 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgbm1 libgcc1 libglib2.0-0 libgtk-3-0 libnspr4 libnss3 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 lsb-release wget xdg-utils && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /usr/src/app

# Copy the rest of the application code
COPY . .

# Install dependencies and set rights for startup script
RUN rm -rf node_modules package-lock.json && \
    npm cache clear --force && \
    npm install --production && \
    npx puppeteer browsers install chrome && \
    chmod +x docker-startup.sh

# Expose the port
EXPOSE 3001

# Set an environment variable to skip .env file since env variables are set 
# by docker-compose.yml
ENV IS_DOCKER=1
RUN chmod +x docker-startup.sh

# Start the application
ENTRYPOINT [ "./docker-startup.sh" ]