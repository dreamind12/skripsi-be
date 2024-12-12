const express = require('express');
const { addToCart, getAllCart, updateCart, deleteCart } = require('../controllers/paymentController');
const router = express.Router();

router.post('/addToCart', addToCart);
router.put('/updateCart/:id', updateCart);
router.get('/getAllCart', getAllCart);
router.delete('/deleteCart/:id', deleteCart);

module.exports = router;