const express = require('express');
const router = express.Router();
const git = require('../services/git');

router.post('/', async function(req, res, next) {
  try {
    console.log(`got req.body ${ typeof req.body === 'string' ? `string of length: ${req.body.length}` : 'not a string'}`);

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
