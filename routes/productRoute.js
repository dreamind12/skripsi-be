const express = require('express');
const { addProduct, updateProduct, getProductById, getAllProduct, deleteProduct } = require('../controllers/productController');
const router = express.Router();

router.post('/createProduct', addProduct);
router.put('/updateProduct/:id', updateProduct);
router.get('/getProduct/:id', getProductById);
router.get('/getAllProduct', getAllProduct);
router.delete('/deleteProduct/:id', deleteProduct);

module.exports = router;