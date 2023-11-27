const db = require('./db');
const helper = require('../helper');
const config = require('../config');
const { getName, getTags, getRepo, getPRNumber } = require("./helpers");
const { sendSlackMessage, deleteSlackMessage, replayToSlackMessage } = require("./slack.util");
const HOUR = (60 * 60 * 1000);
async function processReadyToReviewLabelAdded(title, repo, prNumber, creator) {
  const tags = getTags(repo, creator);
  const prData = {
    name:title,
    creator,
    repo,
    pr_number: prNumber,
    tags,
    last_reminder: new Date()
  }

  console.log('## received "ReadyToReview" Label Added event:', prData);

  const prCreator = getName(prData.creator);
  const prUrl = `https://git.autodesk.com/BIM360/${prData.repo}/pull/${prData.pr_number}`;

  const slackMessage = `
${tags}
${prCreator} Has requested your review for this PR: 
${prUrl} 

pr title: *${title}*

:pray:
`;

  const messageId = await sendSlackMessage(slackMessage);

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

async function processPREvent(body){
  console.log('## body?.payload type : ', typeof body?.payload)
  console.log('## body?.payload: ', body?.payload)
  const { action, label, pull_request} = JSON.parse(body?.payload);
  const url = pull_request?.html_url;
  const repo = getRepo(url);
  const prNumber = getPRNumber(url);
  const creator = pull_request?.user?.login;
  const title = pull_request?.title;
  console.log('## action:', action, ' repo:', url,'  creator:', getName(creator));

  if (action === 'labeled' && label?.name === 'Ready to review'){
    return await processReadyToReviewLabelAdded(title, repo, prNumber, creator);
  } else if (action === 'closed' || (action === 'unlabeled' && label?.name === 'Ready to review')){
    return await processReadyToReviewLabelRemoved(repo, prNumber)
  }


  return 'other event';
}

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
  const time = new Date(now.getTime() - HOUR);

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

setInterval(checkForPendingPRs, 5 * 60 * 1000);

module.exports = {
  processPREvent
}
