const asyncHandler = require('express-async-handler');
const Product = require('../models/productModel');
const Image = require('../models/imageModel');
const path = require('path');
const fs = require('fs');
const { Sequelize } = require('sequelize');

const addProduct = asyncHandler(async (req, res) => {
    const file = req.files.file;
    const ext = path.extname(file.name);
    const fileName = `${file.md5}${ext}`;
    const fileDestination = `public/${fileName}`;
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const fileUrl = `${baseUrl}/public/${fileName}`;

    try {
        const product = await Product.create({
            name: req.body.name,
            category: req.body.category,
            description: req.body.description,
            price: req.body.price,
        });

        await file.mv(fileDestination);

        const imageData = await Image.create({
            productId: product.id,
            name: file.name,
            url: fileName,
        });

        res.json({
            message: 'Product berhasil dibuat',
            product,
            imageData: {
                ...imageData.toJSON(),
                fileUrl,
            },
        });
    } catch (error) {
        res.status(500).json({
            status: 500,
            message: error.message,
        });
    }
});

const updateProduct = asyncHandler(async (req, res) => {
    const product = await Product.findByPk(req.params.id);
    const file = req.files?.file;
    const baseUrl = `${req.protocol}://${req.get('host')}`;

    if (!product) {
        return res.status(404).json({
            status: 404,
            message: 'Product not found'
        });
    }

    let imageData; 

    try {

        if (file) {
            const ext = path.extname(file.name);
            const fileName = `${file.md5}${ext}`;
            const fileDestination = `public/${fileName}`;
            const fileUrl = `${baseUrl}/public/${fileName}`;
    
            imageData = await Image.findOne({ where: { productId: product.id } });

            if (imageData) {
                const oldFilePath = path.join('public', path.basename(imageData.url));
                const trashPath = path.join('public/trash', path.basename(imageData.url));
                if (fs.existsSync(oldFilePath)) {
                    fs.renameSync(oldFilePath, trashPath)
                }

                imageData.name = file.name;
                imageData.url = fileName;
                await imageData.save();
            } else {
                imageData = await Image.create({
                    productId: product.id,
                    name: file.name,
                    url: fileName,
                });
            }

            await file.mv(fileDestination);
        } else {
            imageData = await Image.findOne({ where: { productId: product.id } });
        }

        product.name = req.body.name || product.name;
        product.category = req.body.category || product.category;
        product.description = req.body.description || product.description;
        product.price = req.body.price || product.price;
        product.updated_at = new Date();
        await product.save();

        res.json({
            message: 'Product dan Image berhasil diperbarui',
            product,
            imageData: {
                ...imageData.toJSON(),
                fileUrl: `${baseUrl}/public/${imageData.url}`,
            },
        });
    } catch (error) {
        res.status(500).json({
            status: 500,
            message: error.message
        });
    }
});

const getProductById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    try {
        const product = await Product.findOne({ where: { id } });
        if (!product) {
            return res.status(404).json({
                status: 404,
                message: 'Product not found'
            });
        }

        const imageData = await Image.findOne({ where: { productId: product.id } });
        const fileUrl = imageData.fileUrl = `${baseUrl}/public/${imageData.url}`;

        res.json({
            message: 'Product berhasil di ambil',
            product,
            imageData: {
                ...imageData.toJSON(),
                fileUrl,
            },
        });
    } catch (error) {
        res.status(500).json({
            status: 500,
            message: error.message
        });
    }
});

const getAllProduct = asyncHandler(async (req, res) => {
    const baseUrl = `${req.protocol}://${req.get('host')}`;

    try {
        const products = await Product.findAll({
            where: { deleted_at: null },
            include: [
                {
                    model: Image,
                    attributes: ['id', 'productId', 'name', 'url', 'created_at'],
                },
            ],
        });

        const modifiedProducts = products.map(product => {
            
            if (product.Images && product.Images.length > 0) {
                product.Images = product.Images.map(image => {
                    
                    image.url = `${baseUrl}/public/${image.url}`;
                    return image;
                });
            }
            return product;
        });

        res.json({
            message: 'Semua produk berhasil diambil',
            products: modifiedProducts,
        });
    } catch (error) {
        res.status(500).json({
            status: 500,
            message: error.message,
        });
    }
});

const deleteProduct = asyncHandler(async (req, res) => {
    const productId = req.params.id;
    const baseUrl = `${req.protocol}://${req.get('host')}`;

    try {    
        const product = await Product.findByPk(productId);
        if (!product) {
            return res.status(404).json({
                status: 404,
                message: 'Product not found'
            });
        }

        product.deleted_at = new Date();
        await product.save();

        const images = await Image.findAll({ where: { productId } });

        const trashDir = path.join('public', 'trash');
        if (!fs.existsSync(trashDir)) {
            fs.mkdirSync(trashDir);
        }

        for (const image of images) {
            const oldFilePath = path.join('public', image.url);
            const trashPath = path.join('public', 'trash', path.basename(image.url));

            if (fs.existsSync(oldFilePath)) {
                fs.renameSync(oldFilePath, trashPath);
            }

            image.url = `${baseUrl}/public/trash/${path.basename(image.url)}`;
            await image.save();
        }

        res.json({
            message: 'Product berhasil dihapus (soft delete) dan gambar terkait telah dipindahkan ke trash',
            product,
            images
        });
    } catch (error) {
        res.status(500).json({
            status: 500,
            message: error.message
        });
    }
});

module.exports = {
    addProduct,
    updateProduct,
    getProductById,
    getAllProduct,
    deleteProduct
}