const express = require('express');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require("dotenv").config();
const PORT = 8000;
const bodyParser = require('body-parser');
const productRouter = require('./routes/productRoute');
const paymentRouter = require('./routes/paymentRoute');
const userRouter = require('./routes/userRoute');
const rateLimit = require('express-rate-limit');

const app = express();
app.use(express.json());

const corsOptions = {
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, 
    optionsSuccessStatus: 204, 
  };
app.use(cors(corsOptions));

app.use(fileUpload());
app.use(cookieParser());
app.use('/public', express.static("public"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

// Rate limiter: maksimal 10 request per menit
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 menit
  max: 10, // Maksimum 10 request per IP
  message: {
    status: 429,
    message: 'Terlalu banyak permintaan dari IP ini. Silakan coba lagi dalam 1 menit.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// no rate limit
app.use('/product', productRouter);
app.use('/payment', paymentRouter);
app.use('/user', userRouter);

// with rate limit
app.use('/product/ratelimit', limiter, productRouter);
app.use('/payment/ratelimit', limiter, paymentRouter);
app.use('/user/ratelimit', limiter, userRouter);

app.listen(process.env.PORT || PORT, ()=>{
    console.log(`Server Listening on ${PORT}`);
})