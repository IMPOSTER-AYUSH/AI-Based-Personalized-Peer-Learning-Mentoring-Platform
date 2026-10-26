const router = require('express').Router();
const { updateProfile, getProfile, changePassword, searchUsers } = require('../controllers/profileController');
const { auth } = require('../middleware/auth');

router.get('/search', auth, searchUsers);
router.put('/', auth, updateProfile);
router.post('/change-password', auth, changePassword);
router.get('/:id', auth, getProfile);

module.exports = router;
