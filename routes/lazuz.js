const express = require('express');
const router = express.Router();
const lazuz = require('../services/lazuz');

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
    const localHost =req.rawHeaders.includes('localhost:3000');
    res.send(await lazuz.search(localHost, req?.query?.include));
  } catch (err) {
    console.error(`Error while processing request`, err.message);
    next(err);
  }
});


router.get('/make', async function(req, res, next) {
  try {
    await lazuz.makeReservation(req?.query?.club, req?.query?.date, req?.query?.hour);
    res.send(await lazuz.search(false));
  } catch (err) {
    console.error(`Error while processing request`, err.message);
    next(err);
  }
});

router.get('/cancel', async function(req, res, next) {
  try {
    await lazuz.cancelReservation(req?.query?.reservation);
    res.send(await lazuz.search(false));
  } catch (err) {
    console.error(`Error while processing request`, err.message);
    next(err);
  }
});



module.exports = router;
