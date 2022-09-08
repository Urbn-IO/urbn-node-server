FROM node:18.5.0

# Install pnpm
RUN npm install -g pnpm

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY ["package.json", "pnpm-lock.yaml", "./"]

RUN pnpm install
# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
COPY . .
# COPY .env.production .env

RUN pnpm build

# ENV NODE_ENV production

EXPOSE 8000

CMD [ "pnpm", "start" ]



# FROM nginx:latest as nginx-proxy