FROM node:18 AS build

WORKDIR /build

# Install Quasar CLI
RUN yarn global add @quasar/cli

# Copy files required for building the final dists
COPY ./public ./public
COPY ./src ./src
COPY ./src-pwa ./src-pwa
COPY ./babel.config.js .
COPY ./index.html .
COPY ./LICENSE .
COPY ./package.json .
COPY ./quasar.config.js .
COPY ./quasar.extensions.json .
COPY ./server.js .
COPY ./tsconfig.json .

# Install dependencies
RUN yarn

# Build the app
RUN yarn build

# Starting the production / final image
FROM node:18-slim AS final

WORKDIR /app

# Copy the files we need from the build stage
COPY --from=build /build/dist ./dist
COPY --from=build /build/server.js .
COPY --from=build /build/index.html .
COPY --from=build /build/LICENSE .

# Install production dependencies
RUN yarn add express connect-history-api-fallback

# Expose the production port
EXPOSE 5000

# Run the server by default
CMD ["node", "server.js"]
