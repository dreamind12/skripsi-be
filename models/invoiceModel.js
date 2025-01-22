const Sequelize = require("sequelize");
const db = require('../configs/database');
const User = require('./userModel');

const Invoice = db.define("Invoice", {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
    },
    user_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
    },
    order_id: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    invoice_number: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    total: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    pdf_url: {
        type: Sequelize.TEXT,    
    },
    payment_url: {
        type: Sequelize.TEXT,
        allowNull: true,
    },
    payment_type: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    status: {
    type: Sequelize.TEXT,    
    },
    created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
    }
},{
    freezeTableName: true,
  });

User.hasMany(Invoice, { foreignKey: 'user_id'});
Invoice.belongsTo(User, { foreignKey: 'user_id' });

module.exports = Invoice;

// (async()=>{
//     await db.sync()
//   })
  
//   Invoice.sync().then((data)=>{
//   console.log("Table cart success create");
//   }).catch((err)=>{
//     console.log("Table Error when create")
//   });