const db = require('./db');
const helper = require('../helper');
const config = require('../config');

async function process(body){
  const { action, label, pull_request} = JSON.parse(body?.payload);
  let message = 'Error in process';
  if (action === 'labeled' && label?.name === 'Ready to review'){
    message = 'started processing'
    const url = pull_request?.html_url;
    const repo = url.includes('acs-schedule') ? 'acs-schedule':'schedule-service';
    const parts = url.split('/');
    const pr_number = Number(parts[parts.length-1]);
    const prData = {
      name: pull_request?.title,
      creator: pull_request?.user?.login,
      status: 'READY_TO_REVIEW' ,
      // reviewer,
      // review_status,
      // review_last_updated,
      repo,
      pr_number
    }


    console.log('## got process:', prData);

    const result = await db.query(
        `INSERT INTO prs
    (name, creator, status, repo, pr_number)
    VALUES
    (?, ?, ?, ?, ?)`,
        [
          prData.name, prData.creator, prData.status, prData.repo, prData.pr_number   ]
    );

    if (result.affectedRows) {
      message = 'successfully added '+result.affectedRows+' new rows';
    }
  }

  console.log('## message:', message);

  return message;
}

module.exports = {
  process
}
