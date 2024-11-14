const Sequalize = require('sequelize');

const db = new Sequalize('root','','midtrans',{
host: 'localhost',
dialect: 'mysql',
});

db.authenticate().then(()=>{
    console.log("Connection Successful");
}).catch((error)=>{
    console.log("Error connnecting to database");
});

module.exports = db;