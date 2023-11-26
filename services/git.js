const db = require('./db');
const helper = require('../helper');
const config = require('../config');
const { getName, getTags, getRepo, getPRNumber } = require("./helpers");
const { sendSlackMessage } = require("./slack.util");

async function processReadyToReviewLabelAdded(repo, prNumber, creator) {

  const prData = {
    name: pr?.title,
    creator,
    status: 'READY_TO_REVIEW',
    repo,
    pr_number: prNumber
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
    await sendSlackMessage(slackMessage);


    return message;
  } else {
    const message = 'NO new rows added to DB!';
    console.log(message);
    return message;
  }
}

async function processReadyToReviewLabelRemoved(repo, prNumber) {
  const result = await db.query(
      `DELETE from prs WHERE repo=? AND pr_number=?`,
      [repo, prNumber]
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
  const url = pull_request?.html_url;
  const repo = getRepo(url);
  const prNumber = getPRNumber(url);
  const creator = pull_request?.user?.login;

  console.log('## action:', action, ' repo:', url,'  creator:', getName(creator));

  if (action === 'labeled' && label?.name === 'Ready to review'){
    return await processReadyToReviewLabelAdded(repo, prNumber, creator);
  } else if (action === 'closed' || (action === 'unlabeled' && label?.name === 'Ready to review')){
    return await processReadyToReviewLabelRemoved(repo, prNumber)
  }


  return 'other event';
}

async function checkForPendingPRs(){
  console.log('## checkForPendingPRs');

}

setInterval(checkForPendingPRs, 60 * 1000)
module.exports = {
  processPREvent
}
