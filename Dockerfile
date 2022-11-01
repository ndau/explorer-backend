FROM node:12.22-alpine3.15

WORKDIR /opt/app

COPY . .

RUN npm i

# Fix: bcrypt modules is not compatible. The solution is to remove and reinstall it.
#      Error loading shared library /opt/app/node_modules/bcrypt/lib/binding/napi-v3/bcrypt_lib.node: Exec format error
RUN npm uninstall bcrypt
RUN npm install bcrypt

EXPOSE 3001

CMD [ "npm", "start" ]
