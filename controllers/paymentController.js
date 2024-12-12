const asyncHandler = require('express-async-handler');
const Product = require('../models/productModel');
const Cart = require('../models/cartModel');
const Image = require('../models/imageModel');
const { Sequelize } = require('sequelize');

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

module.exports = {
    addToCart,
    updateCart,
    getAllCart,
    deleteCart,
}