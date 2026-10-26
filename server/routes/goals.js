const router = require('express').Router();
const {
  getGoals,
  createGoal,
  updateGoal,
  deleteGoal,
  getProgress,
} = require('../controllers/goalController');
const { auth } = require('../middleware/auth');

router.get('/', auth, getGoals);
router.post('/', auth, createGoal);
router.put('/:id', auth, updateGoal);
router.delete('/:id', auth, deleteGoal);
router.get('/overview/stats', auth, getProgress);

module.exports = router;
