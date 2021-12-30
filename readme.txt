
npx sequelize init
npm init
npm i express helmet colors esm sequelize sqlite3
npm i -D nodemon sequelize-cli
npm run dev // après modification du package.json = > script

// Pour générer un SECRET pour jwt : require('crypto').randomBytes(64).toString('hex')

npx sequelize model:create --name Product --attributes name:string,price:double,picture:string
npx sequelize db:migrate
npx sequelize seed:create --name product
npx sequelize db:seed:all

npx sequelize model:create --name User --attributes login:string,password:string,avatar:string,role:string
npx sequelize db:migrate  
npx sequelize seed:create --name user     
npx sequelize db:seed --seed 20211217100814-product.js

npx sequelize-cli db:migrate:undo:all --to 20211219164857-create-user.js


npx sequelize-cli db:migrate:undo:all --to 20211221184623-create-produit.js

npx sequelize model:create --name User --attributes pseudo:string,login:string,password:string,avatar:string,role:string --force
npx sequelize db:migrate


npx sequelize-cli db:migrate:undo:all --to 20211217100647-create-product.js

npx sequelize model:create --name Produit --attributes nom:string,prix:double,img:string,desc:string,stock:integer --force

