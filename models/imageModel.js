const Sequalize = require('sequelize');
const db = require('../config/database');
const Product = require('./productModel');

const Image = db.define("Image", {
    id: Sequalize.INTEGER,
    productId: {
        type: Sequelize.INTEGER,
        allowNull: true,
    },
    name: Sequalize.STRING,
    url: Sequalize.STRING,
    created_at: Sequalize.DATE
});

Image.belongsTo(Product, { foreignKey: 'productId' });

module.exports = Image;

(async () => {
    await db.sync()
})

// Image.sync().then((data)=>{
// console.log("Table success create");
// }).catch((err)=>{
//   console.log("Table Error when create")
// });