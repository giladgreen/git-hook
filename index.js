const express = require('express');
const bodyParser = require('body-parser');
const { sendSlackMessage,  replayToSlackMessage,  reactToSlackMessage } = require('./services/slack.util');
const app = express();
const port = process.env.PORT || 3000;
const gitRouter = require('./routes/git');

app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

async function test(){
  const messageId = await sendSlackMessage('message body');
  await replayToSlackMessage(messageId, 'reply')
  await reactToSlackMessage(messageId, 'thumbsup')
}

app.get('/', (req, res) => {
  test()
  res.json({'message': 'Gilad: server is up'});
})

app.use('/git', gitRouter);

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
