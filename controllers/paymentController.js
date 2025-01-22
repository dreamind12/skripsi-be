const midtransClient = require('midtrans-client');
const asyncHandler = require('express-async-handler');
const Product = require('../models/productModel');
const Cart = require('../models/cartModel');
const Image = require('../models/imageModel');
const Invoice = require('../models/invoiceModel');
const User = require('../models/userModel');
const axios = require('axios');

const snap = new midtransClient.Snap({
  isProduction: false,
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

    const existingCartItem = await Cart.findOne({
      where: { product_id, user_id: req.user.id },
    });

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
        user_id: req.user.id,
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

    const cartItem = await Cart.findOne({
      where: { id, user_id: req.user.id },
    });

    if (!cartItem) {
      res.status(404);
      throw new Error('Cart item not found or unauthorized');
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
      where: { user_id: req.user.id },
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

    const cartItem = await Cart.findOne({
      where: { id, user_id: req.user.id },
    });

    if (!cartItem) {
      res.status(404);
      throw new Error('Cart item not found or unauthorized');
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
    const baseUrl = `${req.protocol}://${req.get('host')}`;

    // Ambil semua item dalam keranjang berdasarkan user_id dan status
    const cartItems = await Cart.findAll({
      where: { user_id: req.user.id, status: 'Unpaid' },
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
      throw new Error('Keranjang kosong atau semua item sudah dibayar.');
    }

    // Siapkan item details
    const itemDetails = cartItems.map((item) => ({
      id: item.product_id,
      price: item.Product.price,
      quantity: item.quantity,
      name: item.Product.name.slice(0, 50), // Batasi panjang nama
    }));

    // Hitung gross_amount
    const grossAmount = itemDetails.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );

    // Siapkan customerDetails dari req.user
    const user = req.user;
    const firstName = user.username.split(' ')[0] || 'Customer';
    const lastName = user.username.split(' ')[1] || 'Unknown';
    const phone = user.mobile && user.mobile.length >= 5 && user.mobile.length <= 20
      ? user.mobile
      : '081234567890'; // Default phone jika tidak valid

    const customerDetails = {
      first_name: firstName,
      last_name: lastName,
      email: user.email,
      phone: phone,
    };

    // Parameter untuk Payment Link
    const paymentLinkPayload = {
      transaction_details: {
        order_id: `ORDER-${Date.now()}`,
        gross_amount: grossAmount,
      },
      item_details: itemDetails,
      customer_details: customerDetails,
      enabled_payments: ['gopay', 'bank_transfer', 'credit_card'], // Metode pembayaran yang diizinkan
      description: 'Transaksi melalui Payment Link Midtrans',
    };

    // Buat Payment Link via API Midtrans
    const serverKey = 'SB-Mid-server-pbbyOH2stLH-O3I5OFLpSYqf'; // Ganti dengan server key Anda
    const midtransResponse = await axios.post(
      'https://api.sandbox.midtrans.com/v1/payment-links',
      paymentLinkPayload,
      {
        headers: {
          Authorization: `Basic ${Buffer.from(serverKey).toString('base64')}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // Kirim response ke client
    res.status(201).json({
      message: 'Payment Link berhasil dibuat',
      paymentLink: midtransResponse.data.payment_url, // URL Payment Link
    });
  } catch (error) {
    res.status(500).json({
      message: error.response?.data?.error_messages || error.message || 'Terjadi kesalahan saat membuat Payment Link.',
    });
  }
});

const createInvoice = asyncHandler(async (req, res) => {
  try {
    const baseUrl = `${req.protocol}://${req.get('host')}`;

    // Step 1: Ambil semua item dalam keranjang
    const cartItems = await Cart.findAll({
      where: { user_id: req.user.id, status: 'Unpaid' },
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
      throw new Error('Keranjang kosong atau semua item sudah dibayar.');
    }

    // Step 2: Siapkan item details dan hitung total harga
    const itemDetails = cartItems.map((item) => ({
      id: `SKU${item.product_id}`,
      price: item.Product.price,
      quantity: item.quantity,
      description: item.Product.name.slice(0, 50),
      name: item.Product.name.slice(0, 50), // Properti name wajib ditambahkan
    }));

    const grossAmount = itemDetails.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );

    // Step 3: Siapkan data customer
    const user = req.user;
    const customerDetails = {
      first_name: user.username.split(' ')[0] || 'Customer',
      last_name: user.username.split(' ')[1] || '',
      email: user.email,
      phone: user.mobile || '123456789',
    };

    // Step 4: Siapkan parameter untuk Snap
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const transactionDetails = {
      order_id: `ORDER-${Date.now()}-${randomSuffix}`,
      gross_amount: grossAmount, // Pastikan ini sesuai dengan total item details
    };

    const parameter = {
      transaction_details: transactionDetails,
      item_details: itemDetails,
      customer_details: customerDetails,
      enabled_payments: ['gopay', 'credit_card', 'bank_transfer'],
    };

    // Step 5: Buat transaksi Snap
    const transaction = await snap.createTransaction(parameter);

    // Step 6: Update status Cart ke Paid
    const cartIDs = cartItems.map((item) => item.id);

    // Step 7: Buat Invoice
    const invoicePayload = {
      order_id: transactionDetails.order_id,
      invoice_number: `INV-${Date.now()}`,
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      invoice_date: new Date().toISOString(),
      customer_details: {
        id: user.id,
        name: user.username,
        email: user.email,
        phone: user.mobile,
      },
      payment_type: 'payment_link',
      reference: 'reference',
      item_details: itemDetails,
      notes: 'Invoice untuk pembayaran pesanan.',
      payment_link: {
        is_custom_expiry: true,
        expiry: {
          unit: 'days',
          duration: 7,
        },
        enabled_payments: ['bca_va'],
      },
    };

    const invoiceResponse = await axios.post(
      'https://api.sandbox.midtrans.com/v1/invoices',
      invoicePayload,
      {
        headers: {
          Authorization: `Basic ${Buffer.from('SB-Mid-server-pbbyOH2stLH-O3I5OFLpSYqf:').toString('base64')}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const invoiceData = {
      id: invoiceResponse.data.id,
      user_id: user.id,
      order_id: invoiceResponse.data.order_id,
      invoice_number: invoiceResponse.data.invoice_number,
      total: grossAmount,
      pdf_url: invoiceResponse.data.pdf_url,
      payment_url: invoiceResponse.data.payment_link,
      payment_type: invoicePayload.payment_type,
      status: invoiceResponse.data.status,
    };

    const createdInvoice = await Invoice.create(invoiceData);

    // Step 8: Respons
    res.status(201).json({
      order_id: invoiceResponse.data.order_id,
      invoice_number: invoiceResponse.data.invoice_number,
      published_date: new Date().toISOString(),
      due_date: invoiceResponse.data.due_date,
      invoice_date: invoiceResponse.data.invoice_date,
      reference: invoicePayload.reference,
      customer_details: invoiceResponse.data.customer_details,
      item_details: invoiceResponse.data.item_details,
      id: invoiceResponse.data.id,
      status: invoiceResponse.data.status,
      gross_amount: grossAmount,
      pdf_url: invoiceResponse.data.pdf_url,
      payment_type: invoicePayload.payment_type,
      virtual_accounts: [],
      payment_link_url: invoiceResponse.data.payment_link,
    });
  } catch (error) {
    if (error.response) {
      console.error('Midtrans Error:', error.response.data);
      res.status(500).json({
        message: error.response.data.message || 'Terjadi kesalahan di Midtrans.',
        details: error.response.data,
      });
    } else {
      console.error('Error:', error.message);
      res.status(500).json({
        message: error.message || 'Terjadi kesalahan saat membuat transaksi.',
      });
    }
  }
});

const getInvoice = asyncHandler(async (req, res) => {
  try {
    // Ambil `invoice_id` dari parameter URL
    const { invoice_id } = req.params;

    // Periksa apakah `invoice_id` disediakan
    if (!invoice_id) {
      res.status(400);
      throw new Error('Invoice ID harus disertakan.');
    }

    // Lakukan permintaan ke Midtrans API untuk mendapatkan detail invoice
    const response = await axios.get(
      `https://api.sandbox.midtrans.com/v1/invoices/${invoice_id}`,
      {
        headers: {
          Authorization: `Basic ${Buffer.from('SB-Mid-server-pbbyOH2stLH-O3I5OFLpSYqf:').toString('base64')}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // Kirim respons dengan data invoice
    res.status(200).json({
      message: 'Detail invoice berhasil diambil',
      invoiceDetails: response.data,
    });
  } catch (error) {
    if (error.response) {
      // Tampilkan kesalahan dari Midtrans
      console.error('Midtrans Error:', error.response.data);
      res.status(500).json({
        message: error.response.data.message || 'Terjadi kesalahan di Midtrans.',
        details: error.response.data,
      });
    } else {
      // Tampilkan kesalahan lainnya
      console.error('Error:', error.message);
      res.status(500).json({
        message: error.message || 'Terjadi kesalahan saat mengambil detail invoice.',
      });
    }
  }
});

const getAllInvoice = asyncHandler(async (req, res) => {

  try {
    const invoiceItems = await Invoice.findAll({
      where: { user_id: req.user.id },
      include: [
        {
          model: User,
          attributes: ['id', 'username', 'email', 'mobile'],
        },
      ],
    });    

    res.json({
      message: 'Berhasil mengambil semua invoice',
      invoice: invoiceItems,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});

module.exports = {
  addToCart,
  updateCart,
  getAllCart,
  deleteCart,
  createTransaction,
  createInvoice,
  getInvoice,
  getAllInvoice,
}