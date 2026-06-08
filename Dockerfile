# build
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . .

ARG VITE_BASE_API_URL=https://api.example.com
ARG VITE_AUTHORIZATION_API_CONTEXT_PATH=
ARG VITE_OAUTH_REDIRECT_URI=https://app.example.com/oauth/callback

ENV VITE_BASE_API_URL=$VITE_BASE_API_URL \
    VITE_AUTHORIZATION_API_CONTEXT_PATH=$VITE_AUTHORIZATION_API_CONTEXT_PATH \
    VITE_OAUTH_REDIRECT_URI=$VITE_OAUTH_REDIRECT_URI

RUN yarn build

# run
FROM nginx:1.27-alpine
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
