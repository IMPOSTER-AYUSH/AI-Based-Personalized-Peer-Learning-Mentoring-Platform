const router = require('express').Router();
const {
  createSession,
  getSessions,
  updateSession,
  getSessionById,
} = require('../controllers/sessionController');
const { auth } = require('../middleware/auth');

router.post('/', auth, createSession);
router.get('/', auth, getSessions);
router.get('/:id', auth, getSessionById);
router.put('/:id', auth, updateSession);

module.exports = router;
