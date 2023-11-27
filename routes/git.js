const express = require('express');
const router = express.Router();
const git = require('../services/git');

router.post('/', async function(req, res, next) {
  try {
    res.json(await git.processPREvent(req.body));
  } catch (err) {
    console.error(`Error while processing request`, err.message);
    next(err);
  }
});

module.exports = router;
