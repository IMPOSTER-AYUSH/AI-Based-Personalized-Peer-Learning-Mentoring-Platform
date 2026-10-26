const router = require('express').Router();
const {
  getConversations,
  getOrCreateConversation,
  getMessages,
  sendMessage,
  markRead,
  deleteConversation,
} = require('../controllers/chatController');
const { auth } = require('../middleware/auth');

router.get('/conversations', auth, getConversations);
router.post('/conversations', auth, getOrCreateConversation);
router.delete('/conversations/:conversationId', auth, deleteConversation);
router.get('/messages/:conversationId', auth, getMessages);
router.post('/messages', auth, sendMessage);
router.put('/read/:conversationId', auth, markRead);

module.exports = router;
