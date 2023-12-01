const db = require('./db');
const helper = require('../helper');
const config = require('../config');
const {
  getName,
  getTags,
  getRepo,
  getPRNumber,
  getTagName,
  getDescription,
  getSlackMessageForNewPR,
  HOUR } = require("./helpers");
const {
  sendSlackMessage,
  deleteSlackMessage,
  replayToSlackMessage,
  updateSlackMessage,
  removeReactToSlackMessage,
  reactToSlackMessage } = require("./slack.util");

async function processReadyToReviewLabelAdded(title, repo, prNumber, creator, desc) {
  const tags = getTags(repo, creator);
  const description = getDescription(desc);
  const prCreator = getName(creator);
  const prUrl = `https://git.autodesk.com/BIM360/${repo}/pull/${prNumber}`;
  const slackMessage = getSlackMessageForNewPR(tags, prCreator, prUrl, title, description);
  const messageId = await sendSlackMessage(slackMessage);
  await db.createPR(title, creator, repo, prNumber, tags, new Date(), messageId);
}

async function processReadyToReviewLabelRemoved(repo, prNumber) {
  const pr = await db.getPR(repo, prNumber);
  if (pr) {
    const id = pr.id;
    const messageId = pr.slack_message_id;
    await deleteSlackMessage(messageId);
    await db.deletePR(id);
  }
}

async function processPRClosedRemoved(repo, prNumber) {
  const pr = await db.getPR(repo, prNumber);
  if (pr) {
    const id = pr.id;
    const messageId = pr.slack_message_id;
    await replayToSlackMessage(messageId, 'PR Closed.');
    await db.deletePR(id);   //TODO: maybe keep the row in the DB but dont fetch it anymore
  }
}

const reactions = {
  approved: 'white_check_mark',
  changes_requested: 'x',
  commented: 'eye2'
}
function getReactionMessage(creator, approveUser, reactionType){
  if (reactionType === 'approved') {
    return `PR Approved by ${getName(approveUser)}`;
  }

  if (reactionType === 'changes_requested') {
    return `${getTagName(creator)},  ${getTagName(approveUser)} has requested changes`;
  }

  if (reactionType === 'commented') {
    return `${getTagName(creator)},  ${getTagName(approveUser)} has left you comments`;
  }

  return '';
}

async function processPRReacted(repo, prNumber, reactedUser, reactionBody, prDesc, reactionType) {
  const pr = await db.getPR(repo, prNumber);
  if (pr) {
    const creator = pr.creator;
    const tags = getTagName(creator);
    const description = getDescription(prDesc);
    const prCreator = getName(creator);
    const prUrl = `https://git.autodesk.com/BIM360/${repo}/pull/${prNumber}`;
    const slackMessageWithoutNewTags = getSlackMessageForNewPR(tags, prCreator, prUrl, pr.name, description);
    const id = pr.id;
    const messageId = pr.slack_message_id;
    await updateSlackMessage(messageId, slackMessageWithoutNewTags);
    await reactToSlackMessage(messageId, reactions[reactionType]);
    const message = getReactionMessage(creator, reactedUser, reactionType);
    await replayToSlackMessage(messageId, message);
    if (reactionBody && reactionBody.length > 0){
      await replayToSlackMessage(messageId,`*${getName(reactedUser)}:* ${reactionBody}`);
    }
    if (reactionType === 'approved') {
      await removeReactToSlackMessage(messageId, 'x');
      await db.deletePR(id);
    }
  }
}

async function processPREvent(body) {
  const { action, label, review, pull_request } = JSON.parse(body?.payload);
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
    return await processReadyToReviewLabelRemoved(repo, prNumber);
  }

  if (action === 'closed') {
    return await processPRClosedRemoved(repo, prNumber);
  }

  if (action === 'submitted') {
    return await processPRReacted(repo, prNumber, review?.user?.login, review?.body, desc, review.state);
  }

  return 'other event';
}

async function returnAllPRs(){
  return await db.getAllPRs();
}
///////////////////////////////////

async function updateRow(id) {
   await db.updatePrLastReminder(id);
}

async function handleReminder({ id, tags, slack_message_id }) {
  const slackMessage = `
${tags}
This PR is still waiting for a review..
`;

  await replayToSlackMessage(slack_message_id, slackMessage);

  return await updateRow(id);
}

async function checkForPendingPRs() {
  const now = new Date();
  const currentDay = now.getDay();

  if (currentDay >= 5) {
    return; // weekend
  }
  const currentTime = now.getHours() + 4; //server timezone
  if (currentTime < 8 || currentTime > 17) {
    return; // non working hours
  }

  const prs = (await db.getOldPRs()) ?? [];
  if ( prs.length > 0) {
    console.log('## checkForPendingPRs found', prs.length, 'rows');
  }

  await Promise.all(prs.map(prData => {
    return handleReminder(prData);
  }))
}

checkForPendingPRs();

setInterval(checkForPendingPRs, 2 * HOUR);

module.exports = {
  processPREvent,
  returnAllPRs
}
