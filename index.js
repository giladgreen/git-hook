const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = process.env.PORT || 3000;
const gitRouter = require('./routes/git');
const slackRouter = require('./routes/slack');

//https://git-hook-6aeb02160f71.herokuapp.com/git
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb'}));
app.get('/', (req, res) => {
  res.json({'message': 'Gilad: server is up'});
})

app.use('/git', gitRouter);
app.use('/slack', slackRouter);

/* Error handler middleware */
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  console.error(err.message, err.stack);
  res.status(statusCode).json({'message': err.message});

  return;
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Example app listening at http://localhost:${port}`)
});
