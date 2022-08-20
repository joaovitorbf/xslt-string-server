FROM node:16-alpine
WORKDIR /usr/src/xslt-string-server
COPY index.js .
COPY package.json .
RUN npm install
EXPOSE 8080
CMD ["node", "index.js"]