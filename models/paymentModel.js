const Sequelize = require("sequelize");
const Partner = require('../partnerModel');
const db = require("../../config/database");

const Payment = db.define("Payment", {
name: Sequelize.STRING,
image: Sequelize.STRING,
url: Sequelize.STRING,
category: {
  type: Sequelize.STRING,
  defaultValue: "Payment",
},
description: {
  type: Sequelize.TEXT,
},
price: {
  type: Sequelize.FLOAT,
},
duration: {
  type: Sequelize.INTEGER,
},
mainFacilities: {
  type: Sequelize.STRING,
},
features: {
  type: Sequelize.STRING,
},
soldQuantity: {
  type: Sequelize.INTEGER,
  defaultValue: 0,
},
totalRatings: {
  type: Sequelize.INTEGER,
  defaultValue: 0,
},
averageRating: {
  type: Sequelize.FLOAT,
  defaultValue: 0,
},
totalLikes: {
    type: Sequelize.INTEGER,
    defaultValue: 0,
},
wishlists: {
    type: Sequelize.INTEGER,
    defaultValue: 0,
},
partnerId: {
  type: Sequelize.INTEGER, 
  allowNull: false,
},},
{
  freezeTableName: true,
})

Payment.belongsTo(Partner, { foreignKey: 'partnerId' });


module.exports = Payment;

(async()=>{
  await db.sync()
})

// Payment.sync().then((data)=>{
// console.log("Table success create");
// }).catch((err)=>{
//   console.log("Table Error when create")
// });