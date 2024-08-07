
FROM docker.io/node:20.15.1-alpine3.20

ARG APP_ROOT=/opt/app-root/src
ENV APP_PORT=8080 \
    NO_UPDATE_NOTIFIER=true
WORKDIR ${APP_ROOT}

# NPM Permission Fix
RUN mkdir -p /.npm
RUN chown -R 1001:0 /.npm
ENV npm_config_cache /.npm

# Install Application
COPY . ${APP_ROOT}
RUN chown -R 1001:0 ${APP_ROOT}
USER 1001
WORKDIR ${APP_ROOT}/app
RUN npm ci --omit=dev

EXPOSE ${APP_PORT}
CMD ["node", "./bin/www"]
