const Sequelize = require("sequelize");
const db = require('../configs/database');

const Product = db.define("Product", {
  name: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  category: {
    type: Sequelize.STRING,
    defaultValue: "Hijab Modern",
  },
  description: {
    type: Sequelize.TEXT,
    allowNull: true,
  },
  price: {
    type: Sequelize.FLOAT,
    allowNull: false,
  },
  created_at: {
    type: Sequelize.DATE,
    defaultValue: Sequelize.NOW
  },
  updated_at: {
    type: Sequelize.DATE,
    allowNull: true,
  },
  deleted_at: {
    type: Sequelize.DATE,
    allowNull: true,
  }
},
  {
    freezeTableName: true,
  })

module.exports = Product;

(async () => {
  await db.sync()
})

// Product.sync().then((data) => {
//   console.log("Table product success create");
// }).catch((err) => {
//   console.log("Table Error when create")
// });