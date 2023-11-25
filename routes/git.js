const express = require('express');
const router = express.Router();
const git = require('../services/git');

/* GET . */
// router.get('/', async function(req, res, next) {
//   try {
//     res.json(await git.getMultiple(req.query.page));
//   } catch (err) {
//     console.error(`Error while getting programming languages`, err.message);
//     next(err);
//   }
// });

/* POST programming language */
router.post('/', async function(req, res, next) {
  try {
    res.json(await git.process(req.body));
  } catch (err) {
    console.error(`Error while creating programming language`, err.message);
    next(err);
  }
});

module.exports = router;
