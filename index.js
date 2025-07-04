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

app.use('/product', productRouter);
app.use('/payment', paymentRouter);
app.use('/user', userRouter);

app.listen(process.env.PORT || PORT, ()=>{
    console.log(`Server Listening on ${PORT}`);
})