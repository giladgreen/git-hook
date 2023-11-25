const db = require('./db');
const helper = require('../helper');
const config = require('../config');

async function processReadyToReviewLabelAdded(pr) {
  console.log('## processReadyToReviewLabelAdded:', pr);

  const url = pr?.html_url;
  const repo = url.includes('acs-schedule') ? 'acs-schedule':'schedule-service';
  const parts = url.split('/');
  const pr_number = Number(parts[parts.length-1]);
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
    return message;
  } else {
    const message = 'NO new rows added to DB!';
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
