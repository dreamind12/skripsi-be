const midtransClient = require('midtrans-client');
const asyncHandler = require('express-async-handler');
const Product = require('../models/productModel');
const Cart = require('../models/cartModel');
const Image = require('../models/imageModel');
const { Sequelize } = require('sequelize');

const snap = new midtransClient.Snap({
    isProduction: false, // Set to true for production
    serverKey: 'SB-Mid-server-pbbyOH2stLH-O3I5OFLpSYqf',
    clientKey: 'SB-Mid-client-elUlswgTJmEwELW-',
  });

const addToCart = asyncHandler(async (req, res) => {
    try {
        const { product_id, quantity } = req.body;

        if (!product_id || !quantity) {
            res.status(400);
            throw new Error('Product ID and quantity are required');
        }
        
        const product = await Product.findByPk(product_id);
        if (!product) {
            res.status(404);
            throw new Error('Product not found');
        }

        const existingCartItem = await Cart.findOne({ where: { product_id } });

        if (existingCartItem) {
            existingCartItem.quantity += quantity;
            await existingCartItem.save();

            res.status(200).json({
                message: 'Product quantity updated successfully',
                cartItem: existingCartItem,
            });
        } else {            
            const newCartItem = await Cart.create({
                product_id,
                quantity,
            });

            res.status(201).json({
                message: 'Product added to cart successfully',
                cartItem: newCartItem,
            });
        }
    } catch (error) {
        res.status(500).json({
            message: error.message || 'An error occurred while adding product to cart',
        });
    }
});

const updateCart = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        const { quantity } = req.body;

        if (!id || quantity === undefined) {
            res.status(400);
            throw new Error('Product ID and quantity are required');
        }
        
        const cartItem = await Cart.findOne({ where: { id } });

        if (!cartItem) {
            res.status(404);
            throw new Error('Cart item not found');
        }

        cartItem.quantity = quantity;
        await cartItem.save();

        res.status(200).json({
            message: 'Cart item updated successfully',
            cartItem,
        });
    } catch (error) {
        res.status(500).json({
            message: error.message || 'An error occurred while updating cart item',
        });
    }
});

const getAllCart = asyncHandler(async (req, res) => {
    const baseUrl = `${req.protocol}://${req.get('host')}`;

    try {        
        const cartItems = await Cart.findAll({
            include: [
                {
                    model: Product,
                    attributes: ['id', 'name', 'category', 'description', 'price'],
                    include: [
                        {
                            model: Image,
                            attributes: ['id', 'productId', 'name', 'url', 'created_at'],
                        },
                    ],
                },
            ],
        });

        const modifiedCartItems = cartItems.map((cartItem) => {
            if (cartItem.Product && cartItem.Product.Images) {
                cartItem.Product.Images = cartItem.Product.Images.map((image) => {
                    image.url = `${baseUrl}/public/${image.url}`;
                    return image;
                });
            }
            return cartItem;
        });

        res.json({
            message: 'Semua item di keranjang berhasil diambil',
            cartItems: modifiedCartItems,
        });
    } catch (error) {
        res.status(500).json({
            status: 500,
            message: error.message,
        });
    }
});

const deleteCart = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            res.status(400);
            throw new Error('Cart ID is required');
        }
        
        const cartItem = await Cart.findByPk(id);

        if (!cartItem) {
            res.status(404);
            throw new Error('Cart item not found');
        }

        await cartItem.destroy();

        res.status(200).json({
            message: 'Cart item deleted successfully',
        });
    } catch (error) {
        res.status(500).json({
            message: error.message || 'An error occurred while deleting cart item',
        });
    }
});

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
        first_name: req.body.first_name || 'Faris',
        last_name: req.body.last_name || '',
        email: req.body.email || 'farraya07@gmail.com',
        phone: req.body.phone || '081931554095',
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

module.exports = {
    addToCart,
    updateCart,
    getAllCart,
    deleteCart,
    createTransaction,
}