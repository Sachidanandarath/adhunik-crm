// Vercel serverless entry point - waits for the async DB init (ready gate),
// then hands every request to the Express app.
const app = require('../server');

module.exports = async (req, res) => {
  try {
    await app.ensureReady();
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Database initialization failed: ' + err.message }));
    return;
  }
  app(req, res);
};
