const db = require('./db');
const helper = require('../helper');
const config = require('../config');
const { getName, getTags, getRepo, getPRNumber } = require("./helpers");

async function processReadyToReviewLabelAdded(pr) {
  console.log('## processReadyToReviewLabelAdded:', pr);

  const url = pr?.html_url;
  const repo = getRepo(url);
  const pr_number = getPRNumber(url);
  const prData = {
    name: pr?.title,
    creator: pr?.user?.login,
    status: 'READY_TO_REVIEW',
    repo,
    pr_number
  }

  console.log('## received "ReadyToReview" Label Added event:', prData);

  const result = await db.query(
      `INSERT INTO prs
    (name, creator, status, repo, pr_number)
    VALUES
    (?, ?, ?, ?, ?)`,
      [
        prData.name, prData.creator, prData.status, prData.repo, prData.pr_number   ]
  );

  if (result.affectedRows) {
    const message = 'new row added to DB';
    console.log(message);
    const prCreator = getName(prData.creator);
    const prUrl = `https://git.autodesk.com/BIM360/${prData.repo}/pull/${prData.pr_number}`;
    const tags = getTags(prData.repo, prData.creator);
    const slackMessage = `
${tags}
${prCreator} Has requested your review for this PR: 
${prUrl} 

:pray:
`
    //TODO: send message to slack channel:
    console.log('slack message:', slackMessage);

    return message;
  } else {
    const message = 'NO new rows added to DB!';
    console.log(message);
    return message;
  }
}

async function processReadyToReviewLabelRemoved(pr) {
  const url = pr?.html_url;
  const repo = getRepo(url);
  const pr_number = getPRNumber(url);

  const result = await db.query(
      `DELETE from prs WHERE repo=? AND pr_number=?`,
      [repo, pr_number]
  );

  if (result.affectedRows) {
    const message = 'row removed';
    console.log(message);
    return message;
  } else {
    const message = 'no rows removed';
    console.log(message);
    return message;
  }
}

async function processPREvent(body){
  const { action, label, pull_request} = JSON.parse(body?.payload);
  //let message = 'Error in process';
  if (action === 'labeled' && label?.name === 'Ready to review'){
    return await processReadyToReviewLabelAdded(pull_request);
  }

  console.log('## action:', action);
  console.log('## label:', label);
  console.log('## pull_request:', pull_request);

  return 'other event';
}

module.exports = {
  processPREvent
}
