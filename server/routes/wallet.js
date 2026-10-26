const router = require('express').Router();
const { getWallet } = require('../controllers/walletController');
const { auth } = require('../middleware/auth');

router.get('/', auth, getWallet);

module.exports = router;
