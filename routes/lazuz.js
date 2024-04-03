const express = require('express');
const router = express.Router();
const lazuz = require('../services/lazuz.util');
const config = require("../config");

router.post('/request-sms', async function(req, res, next) {
  try {
    console.log('## got sms request',req.body)
    res.json(await lazuz.sendSms(req.body));
  } catch (err) {
    console.error(`Error while processing request`, err.message);
    next(err);
  }
});

router.post('/search', async function(req, res, next) {
  try {
    res.json(await lazuz.search(req.body));
  } catch (err) {
    console.error(`Error while processing request`, err.message);
    next(err);
  }
});



module.exports = router;
