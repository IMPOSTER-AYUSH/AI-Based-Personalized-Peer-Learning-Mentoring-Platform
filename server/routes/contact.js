const router = require('express').Router();
const { submitContact } = require('../controllers/contactController');
const Blog = require('../models/Blog');

router.post('/', submitContact);
router.get('/blogs', async (req, res, next) => {
  try {
    const blogs = await Blog.find().sort('-createdAt').limit(6);
    res.json({ blogs });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
