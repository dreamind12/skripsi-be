const express = require('express');
const { addToCart, getAllCart, updateCart, deleteCart, createTransaction } = require('../controllers/paymentController');
const router = express.Router();

router.post('/addToCart', addToCart);
router.post('/createTransaction', createTransaction);
router.put('/updateCart/:id', updateCart);
router.get('/getAllCart', getAllCart);
router.delete('/deleteCart/:id', deleteCart);

module.exports = router;