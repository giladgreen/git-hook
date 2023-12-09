const express = require('express');
const router = express.Router();
const slack = require('../services/slack.util');

router.post('/', async function(req, res, next) {
  try {
    res.json(await slack.processSlackRequest(req.body));
  } catch (err) {
    console.error(`Error while processing request`, err.message);
    next(err);
  }
});



module.exports = router;
