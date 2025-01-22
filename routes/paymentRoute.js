const express = require('express');
const { addToCart, getAllCart, updateCart, deleteCart, createTransaction, createInvoice, getInvoice, getAllInvoice } = require('../controllers/paymentController');
const { authMiddleware } = require('../middlewares/authMiddleware');
const router = express.Router();

router.post('/addToCart', authMiddleware, addToCart);
router.post('/createTransaction', authMiddleware, createTransaction);
router.post('/createInvoice', authMiddleware, createInvoice);
router.put('/updateCart/:id', authMiddleware, updateCart);
router.get('/getAllCart', authMiddleware, getAllCart);
router.get('/getInvoice/:invoice_id', authMiddleware, getInvoice);
router.get('/getAllInvoice', authMiddleware, getAllInvoice);
router.delete('/deleteCart/:id', authMiddleware, deleteCart);

module.exports = router;