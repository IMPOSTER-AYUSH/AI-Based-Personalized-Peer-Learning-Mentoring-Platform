const router = require('express').Router();
const {
  getMatches,
  sendRequest,
  respondToRequest,
  getConnections,
  getPendingRequests,
} = require('../controllers/matchController');
const { auth } = require('../middleware/auth');

router.get('/', auth, getMatches);
router.post('/request', auth, sendRequest);
router.post('/respond', auth, respondToRequest);
router.get('/connections', auth, getConnections);
router.get('/pending', auth, getPendingRequests);

module.exports = router;
