const Sequelize = require("sequelize");
const db = require('../configs/database');
const Product = require('./productModel');

const Cart = db.define("Cart", {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    product_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
    },
    quantity: {
      type: Sequelize.INTEGER,
      allowNull: true,
  },
    created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
    }
},{
    freezeTableName: true,
  });

Product.hasMany(Cart, { foreignKey: 'product_id'});
Cart.belongsTo(Product, { foreignKey: 'product_id' });

module.exports = Cart;

// (async()=>{
//     await db.sync()
//   })
  
  // Cart.sync().then((data)=>{
  // console.log("Table cart success create");
  // }).catch((err)=>{
  //   console.log("Table Error when create")
  // });