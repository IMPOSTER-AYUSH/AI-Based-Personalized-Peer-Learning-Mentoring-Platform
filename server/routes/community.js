const router = require('express').Router();
const {
  getCommunities,
  getCommunity,
  joinCommunity,
  leaveCommunity,
  getPosts,
  createPost,
  reactToPost,
  deletePost,
  getComments,
  createComment,
  getEvents,
  rsvpEvent,
  getChallenges,
  joinChallenge,
  getLeaderboard,
} = require('../controllers/communityController');
const { auth } = require('../middleware/auth');

router.get('/', auth, getCommunities);
router.get('/leaderboard', auth, getLeaderboard);
router.get('/posts', auth, getPosts);
router.post('/posts', auth, createPost);
router.post('/posts/:id/react', auth, reactToPost);
router.delete('/posts/:id', auth, deletePost);
router.get('/posts/:postId/comments', auth, getComments);
router.post('/posts/:postId/comments', auth, createComment);

router.get('/events', auth, getEvents);
router.post('/events/:id/rsvp', auth, rsvpEvent);

router.get('/challenges', auth, getChallenges);
router.post('/challenges/:id/join', auth, joinChallenge);

router.get('/:id', auth, getCommunity);
router.post('/:id/join', auth, joinCommunity);
router.post('/:id/leave', auth, leaveCommunity);

module.exports = router;
