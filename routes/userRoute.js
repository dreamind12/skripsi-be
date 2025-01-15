const express = require('express');
const { createUser, loginUser, logoutUser, getUser, getAllUser, updateUser} = require('../controllers/userController');
const { authMiddleware, isUser } = require('../middlewares/authMiddleware');
const router = express.Router();

router.post('/register', createUser);
router.post('/login', loginUser);
router.get('/get/:id', getUser);
router.get('/getAll', getAllUser);
router.put('/update/:id', authMiddleware, updateUser);
router.post('/logout', authMiddleware, logoutUser);

module.exports = router;