FROM node:10.16.0-alpine

# create destination directory
RUN mkdir -p /usr/src/chat-server
WORKDIR /usr/src/chat-server

# install and cache app dependencies
COPY package.json /usr/src/chat-server/package.json
COPY package-lock.json /usr/src/chat-server/package-lock.json

RUN npm i

# copy the app, note .dockerignore
COPY . /usr/src/chat-server/

# expose 4000 on container
EXPOSE 4000

# start the app
CMD [ "npm", "run", "start" ]
