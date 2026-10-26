const router = require('express').Router();
const { createReview, getReviews } = require('../controllers/reviewController');
const { auth } = require('../middleware/auth');

router.post('/', auth, createReview);
router.get('/user/:userId', auth, getReviews);

module.exports = router;
