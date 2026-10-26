const router = require('express').Router();
const { getDailyTip, getWeeklySummary, chatWithAI } = require('../controllers/aiController');
const { auth } = require('../middleware/auth');

router.get('/tip', auth, getDailyTip);
router.get('/summary', auth, getWeeklySummary);
router.post('/chat', auth, chatWithAI);

module.exports = router;
