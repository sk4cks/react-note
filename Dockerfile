# build
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . .

ARG VITE_BASE_API_URL=https://api.example.com
ARG VITE_AUTHORIZATION_API_CONTEXT_PATH=
ARG VITE_AUTH_SERVER_URL=https://auth.example.com
ARG VITE_OAUTH_CLIENT_ID=react-note
ARG VITE_OAUTH_REDIRECT_URI=https://app.example.com/oauth/callback
ARG VITE_OAUTH_SCOPE=openid profile read write photo

ENV VITE_BASE_API_URL=$VITE_BASE_API_URL \
    VITE_AUTHORIZATION_API_CONTEXT_PATH=$VITE_AUTHORIZATION_API_CONTEXT_PATH \
    VITE_AUTH_SERVER_URL=$VITE_AUTH_SERVER_URL \
    VITE_OAUTH_CLIENT_ID=$VITE_OAUTH_CLIENT_ID \
    VITE_OAUTH_REDIRECT_URI=$VITE_OAUTH_REDIRECT_URI \
    VITE_OAUTH_SCOPE=$VITE_OAUTH_SCOPE

RUN yarn build

# run
FROM nginx:1.27-alpine
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
