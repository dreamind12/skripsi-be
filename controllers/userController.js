const user = require('../models/userModel');
const asyncHandler = require('express-async-handler');
const { generateToken } = require("../configs/jwtToken");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const path = require('path');
const cookie = require("cookie");
const {Sequelize, Op} = require('sequelize');

const createUser = asyncHandler(async (req, res) => {
  const { username, email, mobile, password } = req.body;
try {
    const createUser = await user.create({
        username,
        email,
        mobile,
        password,
      });
      res.json({
        message: 'User Account Has Been Created',
        createUser,
      });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});

const loginUser = async (req, res) => {
  const { email, password } = req.body;
  const findUser = await user.findOne({ where: { email } });
  if (findUser && (await findUser.isPasswordMatched(password))) {
    const Token = await generateToken(findUser.id);
    res.setHeader(
      "Set-Cookie",
      cookie.serialize("Token", Token, {
        httpOnly: true,
        maxAge: 72 * 60 * 60 * 1000,
      })
    );
    const jwtPayload = {
      id: findUser.id, 
    };
    const token = jwt.sign(jwtPayload, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({
      _id: findUser.id,
      email: findUser.email,
      username: findUser.username,
      mobile: findUser.mobile,
      token: token,
    });
  } else {
    throw new Error('Invalid Credentials');
  }
};

const getUser = asyncHandler(async (req, res) => {
  const { id } = req.params
  try {
    const getusers = await user.findOne({ where: { id } })
    res.json({
      message: 'User berhasil di ambil',
      getusers
    })
  } catch (error) {
    throw new Error(error);
  }
});

const getAllUser = asyncHandler(async (req, res) => {
  try {
    const getAll = await user.findAll();
    res.json({
      message: 'Semua User Berhasil Diambil',
      getAll
    })
  } catch (error) {
    throw new Error(error);
  }
});

const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { username, email, mobile, password} = req.body;  

  try {    
    const userToUpdate = await user.findByPk(id);
    if (userToUpdate) {      
      if (username) userToUpdate.username = username;
      if (email) userToUpdate.email = email;
      if (mobile) userToUpdate.mobile = mobile;

      if (password) {
        const saltRounds = 10;
        const salt = await bcrypt.genSalt(saltRounds);
        const hashedPassword = await bcrypt.hash(password, salt);
        userToUpdate.password = hashedPassword;
      }      
      
      await userToUpdate.save();
      res.json({ message: 'User data updated successfully', user: userToUpdate });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Geocoding error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

const logoutUser = asyncHandler(async(req,res)=>{
  try {
    // Clear the cookie
    res.setHeader(
      "Set-Cookie",
      cookie.serialize("Token", "", {
        httpOnly: true,
        maxAge: 0,
      })
    );

    // Clear the token from the response
    delete req.token;

    // Send a success message
    res.json({ message: "Successfully logged out" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error logging out" });
  }
});

module.exports = {
  createUser,
  loginUser,
  getUser,
  getAllUser,
  updateUser,  
  logoutUser,  
}