// Vercel Serverless Function entry point
// Exports Node.js http.Server with Express app and Socket.IO attached
const server = require('../server/server');

module.exports = server;
module.exports.default = server;
