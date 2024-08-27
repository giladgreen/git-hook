const db = require('./db');
const {
  isOffTime,
  getName,
  getTags,
  getRepo,
  getPRNumber,
  getTagName,
  getDescription,
  getSlackMessageForNewPR,
  HOUR, CLIENT_REPO,
} = require("./helpers");
const {
  sendSlackMessage,
  deleteSlackMessage,
  replayToSlackMessage,
  updateSlackMessage,
  removeReactToSlackMessage,
  reactToSlackMessage } = require("./slack.util");

const neggingHandlers = {};

async function startNegging(repo, prNumber) {
  const pr = await db.getPR(repo, prNumber);
  if (pr) {
    const id = pr.id;
    const messageId = pr.slack_message_id;
    const slackMessage = 'This PR is still waiting for a review..';
    replayToSlackMessage(messageId, slackMessage);
    neggingHandlers[id] = setInterval(() => {
      replayToSlackMessage(messageId, slackMessage);
    }, 15 * 60 * 1000);
  }
}
async function stopNegging(repo, prNumber) {
  const pr = await db.getPR(repo, prNumber);
  if (pr) {
    const id = pr.id;
    if (neggingHandlers[id]){
      clearInterval(neggingHandlers[id]);
      neggingHandlers[id] = null;
    }
  }
}
async function processReadyToReviewLabelAdded(title, repo, prNumber, creator, desc, extra) {
  const tags = getTags(repo, creator);
  const description = getDescription(desc);
  const prCreator = getName(creator);
  const prUrl = `https://git.autodesk.com/BIM360/${repo}/pull/${prNumber}`;
  const slackMessage = getSlackMessageForNewPR(tags, prCreator, prUrl, title, description, extra);
  const messageId = await sendSlackMessage(slackMessage);
  await db.createPR(title, creator, repo, prNumber, tags, messageId);
}


async function processContinuousLocalizationLabelAdded(prNumber) {
  const tags = getTags(CLIENT_REPO, 'LocalizationsTeam');
  const prUrl = `https://git.autodesk.com/BIM360/acs-schedule/pull/${prNumber}`;
  const slackMessage = getSlackMessageForNewPR(tags, 'LocalizationsTeam', prUrl, 'New Localizations');
  const messageId = await sendSlackMessage(slackMessage);
  await db.createPR('New Localizations', 'Localization Team', CLIENT_REPO, prNumber, tags, messageId);
}



async function processRenovateLabelAdded(prNumber) {
  const tags = getTags(CLIENT_REPO, 'renovate');
  const prUrl = `https://git.autodesk.com/BIM360/acs-schedule/pull/${prNumber}`;
  const slackMessage = getSlackMessageForNewPR(tags, 'renovate', prUrl, 'New Renovate');
  const messageId = await sendSlackMessage(slackMessage);
  await db.createPR('New Localizations', 'Localization Team', CLIENT_REPO, prNumber, tags, messageId);
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

async function processPRClosed(repo, prNumber) {
  const pr = await db.getPR(repo, prNumber);
  if (pr) {
    const id = pr.id;
    const messageId = pr.slack_message_id;
    if (pr.is_deleted) {
      await replayToSlackMessage(messageId, 'PR Merged.');
      await reactToSlackMessage(messageId, 'white_check_mark');
      setTimeout(() => {
        replayToSlackMessage(messageId, 'It is now (probably) in QA.');
        reactToSlackMessage(messageId, 'done-stamp');
      }, HOUR);
    } else{
      await replayToSlackMessage(messageId, 'PR Closed.');
    }

    await db.deletePR(id);
  }
}

const reactions = {
  approved: 'approved_stamp',
  changes_requested: 'x',
  commented: 'eye2'
}
function getReactionMessage(creator, approveUser, reactionType){
  if (reactionType === 'approved') {
    return `${getTagName(creator)}, ${getName(approveUser)} has approved your PR`;
  }

  if (reactionType === 'changes_requested') {
    return `${getTagName(creator)},  ${getName(approveUser)} has requested changes`;
  }

  if (reactionType === 'commented') {
    if (creator !== approveUser) {
      return `${getTagName(creator)},  ${getName(approveUser)} has left you comments`;
    }
    return `${getName(approveUser)} has added comments`;
  }

  return '';
}

async function processPRReacted(repo, prNumber, reactedUser, reactionBody, prDesc, reactionType, extra) {
  const pr = await db.getPR(repo, prNumber);
  if (pr) {
    const creator = pr.creator;
    const isLocalizationsTeam = creator === 'LocalizationsTeam'
    const description = isLocalizationsTeam ? '' : getDescription(prDesc);
    const prCreator = getName(creator);
    const prUrl = `https://git.autodesk.com/BIM360/${repo}/pull/${prNumber}`;
    const slackMessageWithoutNewTags = getSlackMessageForNewPR('', prCreator, prUrl, pr.name, description, isLocalizationsTeam ? null : extra);
    const id = pr.id;
    const messageId = pr.slack_message_id;
    await updateSlackMessage(messageId, slackMessageWithoutNewTags);
    if (reactionType !== 'commented' || creator !== reactedUser){
      // dont add eyes emoji because of a comment added by PR creator
      await reactToSlackMessage(messageId, reactions[reactionType]);
    }

    const message = getReactionMessage(creator, reactedUser, reactionType);
    await replayToSlackMessage(messageId, message);
    if (reactionBody && reactionBody.length > 0){
      await replayToSlackMessage(messageId,`*${getName(reactedUser)}:* ${reactionBody}`);
    }
    if (reactionType === 'approved') {
      await removeReactToSlackMessage(messageId, 'x');
      await db.markPRasDelete(id);
    }
  }else{
    console.log('## processPRReacted: PR not found:', repo, prNumber);
  }
}

async function processPREvent(body) {
  console.log('####### processPREvent')

  const { action, label, review, pull_request } = JSON.parse(body?.payload);
  console.log('####### action',action)
  console.log('####### label',label)
  console.log('####### review',review)
  console.log('####### pull_request',pull_request)
  const url = pull_request?.html_url ?? ' ';
  const repo = getRepo(url);
  const prNumber = getPRNumber(url);
  const creator = pull_request?.user?.login;
  const title = pull_request?.title;
  const desc = pull_request?.body;

  const extra = pull_request?.changed_files ? {
     additions: pull_request.additions,
     deletions: pull_request.deletions,
     changedFiles: pull_request.changed_files
  } : null;

  console.log('## action:', action, ' repo:', url,'  creator:', getName(creator));

  if (action === 'labeled' && label?.name === 'Ready to review') {
    return await processReadyToReviewLabelAdded(title, repo, prNumber, creator, desc, extra);
  }
  if (action === 'labeled' && label?.name === 'ContinuousLocalization') {
    return await processContinuousLocalizationLabelAdded(prNumber);
  }

  if (action === 'labeled' && label?.name === 'renovate') {
    return await processRenovateLabelAdded(prNumber);
  }

  if (action === 'unlabeled' && label?.name === 'Ready to review') {
    return await processReadyToReviewLabelRemoved(repo, prNumber);
  }

  if (action === 'labeled' && label?.name === 'neg') {
    return await startNegging(repo, prNumber);
  }

  if (action === 'unlabeled' && label?.name === 'neg') {
    return await stopNegging(repo, prNumber);
  }

  if (action === 'closed') {
    return await processPRClosed(repo, prNumber);
  }

  if (action === 'submitted') {
    return await processPRReacted(repo, prNumber, review?.user?.login, review?.body, desc, review.state, extra);
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
  if (isOffTime()){
    return;
  }

  const prs = (await db.getOldPRs()) ?? [];
  if ( prs.length > 0) {
    console.log('## checkForPendingPRs found', prs.length, 'rows');
  }

  await Promise.all(prs.map(prData => {
    return handleReminder(prData);
  }))
}

console.log('## env', process.env.NODE_ENV);
if (process.env.NODE_ENV === 'PROD' || process.env.NODE_ENV === 'production'){
  console.log('## starting checkForPendingPRs');
  checkForPendingPRs();
}

setInterval(checkForPendingPRs, 2 * HOUR);

module.exports = {
  processPREvent,
  returnAllPRs
}
