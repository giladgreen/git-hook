const db = require('./db');
const helper = require('../helper');
const config = require('../config');
const { getName, getTags, getRepo, getPRNumber, getTagName } = require("./helpers");
const { sendSlackMessage, deleteSlackMessage, replayToSlackMessage, reactToSlackMessage } = require("./slack.util");
const HOUR = (60 * 60 * 1000);
const DAY = 24 * HOUR;
async function processReadyToReviewLabelAdded(title, repo, prNumber, creator, desc) {
  const tags = getTags(repo, creator);
  const prData = {
    name:title,
    creator,
    repo,
    pr_number: prNumber,
    tags,
    last_reminder: new Date()
  }
  const description = desc.split('## Risk and Impact Analysis')[0];

  console.log('## received "ReadyToReview" Label Added event:', prData);
//    "body": "<!--- Provide a general summary of your changes in the Title above. Prefix this with JIRA ticket id  -->\r\n\r\n## Risk and Impact Analysis\r\nnone\r\n\r\n## Overview\r\n<!--- Summarize your changes, including the motivation behind making it. Describe changes expected \r\n      to be seen by end users -->\r\nJIRA issue: [SCPJM-####](https://jira.autodesk.com/browse/SCPJM-####)\r\n\r\n### What's Changed\r\n<!--- What types of changes does your code introduce? Put an `x` in all the boxes that apply: -->\r\nSelect all applicable (at least one):\r\n- [ ] Monthly Patch (updating based on new base images developed by hardening team, or external entity)\r\n- [ ] Bug fix (non-breaking change which fixes an issue)\r\n- [ ] New feature/API (non-breaking change which adds functionality)\r\n- [ ] API change (API that changes compatibility)\r\n- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)\r\n- [ ] Documentation change\r\n- [ ] Configuration change\r\n- [ ] Other, explain here:\r\n\r\n### Features\r\n<!-- List all feature changes here -->\r\n\r\n#### Bug Fixes\r\n<!-- List all defects resolved here -->\r\n\r\n### Reviewer Notes\r\n<!--- Any additional notes for the reviewer/team to consider? -->\r\n\r\n## Checklist:\r\n<!--- Go over all the following points, and put an `x` in all the boxes that apply. -->\r\n<!--- If you're unsure about any of these, don't hesitate to ask. We're here to help! -->\r\n- [ ] **Next version** - I have added my task description to the NEXT_VERSION file.\r\n- [ ] **Cross browser** - I checked that my code works on: Firefox, Safari & Chrome.\r\n- [ ] **Up to date with master** - My branch is up to date with master and I checked that I'm using the latest pieces in the code and everything still works.\r\n- [ ] **Unit Tests** - I covered and updated the unit tests according to this commit changes (if necessary).\r\n- [ ] **Cypress UI Tests** - I covered and updated the Cypress UI tests according to this commit changes (if necessary).\r\n- [ ] **Pull requests change limit** - Pull requests have a soft limit of 500 lines of changes. This PR is under that limit. If you don't mark this, please elaborate below on why.\r\n\r\n## Release Agreement\r\n <!--- Please read before continuing. Do not delete -->\r\n**DO NOT DELETE THIS SECTION**\r\n\r\nI understand the following implications of merging this Pull Request into the main branch\r\n- this Pull Request is approved by at least one CODEOWNER who is not me, and other appropriate approvers (see Change Categorization section)\r\n- a deployment pipeline will be triggered with the potential of reaching Production\r\n- in the event of a defective deployment, the [rollback plan](https://wiki.autodesk.com/display/PCC/%5BSchedule%5D+Web+Release+Process) must be followed, and also a fix or revert of this merge commit performed.\r\n\r\nDeployment progress (on commit) is available [here](https://master-7.jenkins.autodesk.com/job/BIM360/job/acs-schedule/)\r\n",
  const prCreator = getName(prData.creator);
  const prUrl = `https://git.autodesk.com/BIM360/${prData.repo}/pull/${prData.pr_number}`;

  const slackMessage = `
${tags}
*${prCreator}* Has requested your review for this PR: 
${prUrl} 

PR title: *${title}*


:pray:
`;

  const messageId = await sendSlackMessage(slackMessage);
  if (!description.includes('<!--- Provide a general summary of your changes in the Title above. Prefix this with JIRA ticket id  -->')){
    await replayToSlackMessage(messageId, `description:
${description}`)
  }

  const result = await db.query(
      `INSERT INTO prs
    (name, creator, repo, pr_number, tags, last_reminder, slack_message_id)
    VALUES
    (?, ?, ?, ?, ?, ?, ?)`,
      [prData.name, prData.creator, prData.repo, prData.pr_number, prData.tags,  prData.last_reminder, messageId]
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

async function processReadyToReviewLabelRemoved(repo, prNumber) {
  const rows = await db.query(
      `SELECT id, slack_message_id FROM prs WHERE repo = ? AND pr_number = ?`,
      [repo, prNumber]
  ) ?? [];
  if (rows.length > 0){
    const row = rows[0];
    const id = row.id;
    const messageId = row.slack_message_id;
    await deleteSlackMessage(messageId);
    const result = await db.query(
        `DELETE from prs WHERE id=?`,
        [id]
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
  const message = 'no rows removed';
  console.log(message);
  return message;
}

async function processPRClosedRemoved(repo, prNumber) {
  const rows = await db.query(
      `SELECT id, slack_message_id FROM prs WHERE repo = ? AND pr_number = ?`,
      [repo, prNumber]
  ) ?? [];
  if (rows.length > 0){
    const row = rows[0];
    const id = row.id;
    const messageId = row.slack_message_id;
    await replayToSlackMessage(messageId, 'PR Closed.');
    const result = await db.query(
        `DELETE from prs WHERE id=?`,
        [id]
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
  const message = 'no rows removed';
  console.log(message);
  return message;
}

async function processPRApproved(repo, prNumber, approveUser){
  console.log('## processPRApproved' );
  const rows = await db.query(
      `SELECT id, slack_message_id FROM prs WHERE repo = ? AND pr_number = ?`,
      [repo, prNumber]
  ) ?? [];
  if (rows.length > 0) {
    const id = rows[0].id;
    const messageId = rows[0].slack_message_id;
    await reactToSlackMessage(messageId, 'white_check_mark');
    await replayToSlackMessage(messageId, 'PR Approved by ' + getName(approveUser));
    await db.query(
        `DELETE from prs WHERE id=?`,
        [id]
    );

  }
}

async function processPRChangeRequested(repo, prNumber, approveUser){
  console.log('## processPRChangeRequested' );
  const rows = await db.query(
      `SELECT id, slack_message_id, creator FROM prs WHERE repo = ? AND pr_number = ?`,
      [repo, prNumber]
  ) ?? [];
  if (rows.length > 0) {
    const messageId = rows[0].slack_message_id;
    const creator = rows[0].creator;
    await reactToSlackMessage(messageId, 'x');
    await replayToSlackMessage(messageId, getTagName(creator) +',  ' + getTagName(approveUser) + ' has left you comments');
  }
}

async function processPREvent(body){
  const { action, label, pull_request, review} = JSON.parse(body?.payload);
  const url = pull_request?.html_url;
  const repo = getRepo(url);
  const prNumber = getPRNumber(url);
  const creator = pull_request?.user?.login;
  const title = pull_request?.title;
  const desc = pull_request?.body;
  console.log('## action:', action, ' repo:', url,'  creator:', getName(creator));

  if (action === 'labeled' && label?.name === 'Ready to review') {
    return await processReadyToReviewLabelAdded(title, repo, prNumber, creator, desc);
  }

  if (action === 'unlabeled' && label?.name === 'Ready to review') {
    return await processReadyToReviewLabelRemoved(repo, prNumber)
  }

  if (action === 'closed') {
    return await processPRClosedRemoved(repo, prNumber)
  }

  if (action === 'submitted') {
    if (review.state === 'approved') {
      return await processPRApproved(repo, prNumber, review.user.login)
    }
    if (review.state === 'changes_requested') {
      return await processPRChangeRequested(repo, prNumber, review.user.login)
    }

  }


  return 'other event';
}

///////////////////////////////////

async function updateRow(id){
  const result = await db.query(
      `UPDATE prs SET last_reminder=? WHERE id = ?`,
      [
          new Date(),
        id
      ]
  );


  if (result.affectedRows) {
    const message = 'rows updated';
    console.log(message);
    return message;
  } else {
    const message = 'no rows updated';
    console.log(message);
    return message;
  }

}

async function handleReminder({ id, tags, slack_message_id }){
  //send a replay to the slack thread

  const slackMessage = `
${tags}
Still waiting for a review on this PR..
`;

  await replayToSlackMessage(slack_message_id, slackMessage)

  console.log(id,' ## sending replay in thread ', slackMessage)
  return await updateRow(id);

}

async function checkForPendingPRs(){
  //get all prs from DB, where the last_reminder is more then 1 hour ago,
  //- remind about it again (maybe same tags in a thread)
  const now = new Date();

  const currentDay = now.getDay();
  if (currentDay >= 5) {
    return; //weekend
  }
  const currentTime = now.getHours() + 4;
  if (currentTime < 8 || currentTime > 17) {
    return;//non working hours
  }

  const time = new Date(now.getTime() - DAY);

  const rows = await db.query(
      `SELECT id, tags, slack_message_id FROM prs WHERE last_reminder < ?`,
      [time]
  );
  const data = rows ?? [];
  console.log('## checkForPendingPRs found', rows.length, 'rows  ,time:', time);

  await Promise.all(data.map(prData =>{
    return handleReminder(prData);
  }))
}

checkForPendingPRs();

setInterval(checkForPendingPRs, 2 * HOUR);

module.exports = {
  processPREvent
}
