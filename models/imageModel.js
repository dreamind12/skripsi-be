const Sequelize = require("sequelize");
const db = require('../configs/database');
const Product = require('./productModel');

const Image = db.define("Image", {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    productId: {
        type: Sequelize.INTEGER,
        allowNull: true,
    },
    name: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    url: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
    }
});

Product.hasMany(Image, { foreignKey: 'productId'});
Image.belongsTo(Product, { foreignKey: 'productId' });

module.exports = Image;

// (async () => {
//     await db.sync();
// })();

// Image.sync().then((data) => {
//   console.log("Table image success create");
// }).catch((err) => {
//   console.log("Table Error when create")
// });