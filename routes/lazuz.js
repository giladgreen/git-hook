const express = require('express');
const router = express.Router();
const lazuz = require('../services/lazuz.util');

router.post('/request-sms', async function(req, res, next) {
  try {
    console.log('## got sms request',req.body)
    res.json(await lazuz.sendSms(req.body));
  } catch (err) {
    console.error(`Error while processing request`, err.message);
    next(err);
  }
});

router.post('/setup-token', async function(req, res, next) {
  try {
    res.json(await lazuz.setupToken(req.body));
  } catch (err) {
    console.error(`Error while processing request`, err.message);
    next(err);
  }
});


router.get('/search', async function(req, res, next) {
  try {
    res.send(await lazuz.search(req?.query?.include));
  } catch (err) {
    console.error(`Error while processing request`, err.message);
    next(err);
  }
});



module.exports = router;
