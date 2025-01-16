const Sequelize = require("sequelize");
const db = require('../configs/database');
const Cart = require('./cartModel');

const Invoice = db.define("Invoice", {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    user_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
    },
    cart_id: {
        type: Sequelize.TEXT,
        allowNull: true,
    },    
    quantity: {
      type: Sequelize.INTEGER,
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

Cart.hasMany(Invoice, { foreignKey: 'cartID'});
Invoice.belongsTo(Cart, { foreignKey: 'cartID' });

module.exports = Invoice;

// (async()=>{
//     await db.sync()
//   })
  
  Invoice.sync().then((data)=>{
  console.log("Table cart success create");
  }).catch((err)=>{
    console.log("Table Error when create")
  });