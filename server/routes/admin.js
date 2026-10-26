const router = require('express').Router();
const {
  getStats,
  getUsers,
  updateUserRole,
  banUser,
  getSkills,
  createSkill,
  updateSkill,
  deleteSkill,
  getReports,
  updateReport,
  getContacts,
  getSessions,
  getBlogs,
  createBlog,
} = require('../controllers/adminController');
const { auth, roleGuard } = require('../middleware/auth');

router.use(auth, roleGuard('admin'));

router.get('/stats', getStats);
router.get('/users', getUsers);
router.put('/users/:id/role', updateUserRole);
router.put('/users/:id/ban', banUser);

router.get('/skills', getSkills);
router.post('/skills', createSkill);
router.put('/skills/:id', updateSkill);
router.delete('/skills/:id', deleteSkill);

router.get('/reports', getReports);
router.put('/reports/:id', updateReport);

router.get('/contacts', getContacts);
router.get('/sessions', getSessions);

router.get('/blogs', getBlogs);
router.post('/blogs', createBlog);

module.exports = router;
