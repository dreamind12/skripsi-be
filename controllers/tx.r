const createTransaction = asyncHandler(async (req, res) => {
    try {
      // Fetch cart items for the user
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const cartItems = await Cart.findAll({
        include: [
          {
            model: Product,
            attributes: ['id', 'name', 'price'],
            include: [
              {
                model: Image,
                attributes: ['url'],
              },
            ],
          },
        ],
      });
  
      if (!cartItems || cartItems.length === 0) {
        res.status(400);
        throw new Error('Keranjang kosong. Tidak ada item untuk diproses.');
      }
  
      // Prepare transaction details
      const transactionDetails = {
        order_id: `ORDER-${Date.now()}`, // Generate unique order ID
        gross_amount: cartItems.reduce(
          (total, item) => total + item.Product.price * item.quantity,
          0
        ),
      };
  
      // Prepare item details for Midtrans
      const itemDetails = cartItems.map((item) => ({
        id: item.product_id,
        price: item.Product.price,
        quantity: item.quantity,
        name: item.Product.name.slice(0, 50),
      }));
  
      // Prepare customer details (this is an example, customize as needed)
      const customerDetails = {
        first_name: req.body.first_name || 'Customer',
        last_name: req.body.last_name || '',
        email: req.body.email || 'customer@example.com',
        phone: req.body.phone || '08123456789',
      };
  
      // Snap API parameters
      const parameter = {
        transaction_details: transactionDetails,
        item_details: itemDetails,
        customer_details: customerDetails,
      };
  
      // Create transaction in Midtrans
      const transaction = await snap.createTransaction(parameter);
  
      // Send response to client
      res.status(201).json({
        message: 'Transaksi berhasil dibuat',
        transactionToken: transaction.token,
        redirectUrl: transaction.redirect_url,
      });
    } catch (error) {
      res.status(500).json({
        message: error.message || 'Terjadi kesalahan saat membuat transaksi.',
      });
    }
  });

  ini adlah model cart
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
    status: {
    type: Sequelize.STRING,
    defaultValue: "Unpaid",
    },
    created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
    }
},{
    freezeTableName: true,
  });

  ini adlaah model Invoice 
  const Sequelize = require("sequelize");
const db = require('../configs/database');
const Cart = require('./cartModel');

const Invoice = db.define("Invoice", {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    customer: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    cartID: {
        type: Sequelize.INTEGER,
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

  saya ingin di controller createTransaction dapat mengupdate cart status menjadi paid ketika sudah melakukan transaksi di midtrans dan berhasil dan sudah terbayar baru di update jika belum maka jangan dan juga di insert ke Invoice ketika sudah terbayarkan lalu untuk cartID adalah id dari Cart jadi digabung menjadi array json seperti ["1","2"] jika ada 2 cart id yang ada di createTransaction
