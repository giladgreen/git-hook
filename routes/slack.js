const express = require('express');
const router = express.Router();
const slack = require('../services/slack.util');

router.post('/', async function(req, res, next) {
  try {
    res.json(await slack.processSlackDeleteRequest(req.body));
  } catch (err) {
    console.error(`Error while processing request`, err.message);
    next(err);
  }
});


router.get('/123', async function(req, res, next) {
  try {
    res.json(await slack.sendSlackNotification('123 test'));
  } catch (err) {
    console.error(`Error while processing request`, err.message);
    next(err);
  }
});



router.get('/', async function(req, res, next) {
  try {
    res.json(await slack.processSlackGetRequest());
  } catch (err) {
    console.error(`Error while processing request`, err.message);
    next(err);
  }
});



module.exports = router;
