const express = require('express');
const router = express.Router();
const git = require('../services/git');

router.post('/', async function(req, res, next) {
  try {
    if (new Date() > new Date('2025-03-28')) {
      return;
    }
    res.json(await git.processPREvent(req.body));
  } catch (err) {
    console.error(`Error while processing request`, err.message);
    next(err);
  }
});

router.get('/', async function(req, res, next) {
  try {
    res.json(await git.returnAllPRs());
  } catch (err) {
    console.error(`Error while processing request`, err.message);
    next(err);
  }
});

module.exports = router;
