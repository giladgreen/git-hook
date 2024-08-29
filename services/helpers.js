const SERVER_REPO = 'schedule-service';
const CLIENT_REPO = 'acs-schedule';
const CLIENT2_REPO = 'acc-schedule-web-lib';
const PLAN_REPO = 'plan-classic-web';
const EXTRATOR_REPO = 'schedule-extractor';
const HOUR = (60 * 60 * 1000);
const DAY = 24 * HOUR;
const BOT_ID = 'U03JV4K3M';

const userNameToName = {
    greeng: 'Gilad Green',
    zlatinj: 'Jonathan Zlatin',
    erlicho: 'Odiya Erlichster',
    levin: 'Nir Levi',
    shermam1: 'Micha Sherman',
    nadivr: 'Raviv Nadiv',
    hochmar: 'Rotem Hochman',
    renovate: 'Renovate Bot',
    LocalizationsTeam: 'Localizations Team'
}

const userNameToId = {
    greeng: 'U93GVQANN',// 'Gilad Green',
    erlicho: 'U0275G55QQ0',//'Odiya Erlichster',
    levin: 'U41CXMEAG',//'Nir Levi',
    shermam1: 'U06BZ11J8P7',//'Micha Sherman',
    zlatinj: 'U075J4Z3K4H',//'Jonathan Zlatin',
    nadivr: 'U03FTQS4GM9',//'Raviv Nadiv',
    hochmar: 'U06J1STR33Q',//'Rotem Hochman',
}

const serverDevelopers = ['greeng','levin'];
const clientDevelopers = ['greeng','erlicho','shermam1','zlatinj'];

function getRepo(url){
    if (url.includes(EXTRATOR_REPO)){
        return EXTRATOR_REPO;
    }
    if (url.includes(CLIENT_REPO)){
        return CLIENT_REPO;
    }
    if (url.includes(CLIENT2_REPO)){
        return CLIENT2_REPO;
    }
    if (url.includes(SERVER_REPO)){
        return SERVER_REPO;
    }
    if (url.includes(PLAN_REPO)){
        return PLAN_REPO;
    }
    return 'unknown repo';
}


function getPRNumber(url){
    const parts = url.split('/');
    return Number(parts[parts.length-1]);
}


function getName(username){
    return userNameToName[username];
}

function getTagName(username){
    return userNameToId[username] ? `<@${userNameToId[username]}>` : username;
}

function getTags(repo, creator){
    if (repo === SERVER_REPO || repo === PLAN_REPO || repo === EXTRATOR_REPO){
        return serverDevelopers.filter(item => item !== creator).map(item => getTagName(item)).join(', ');
    }
    if (repo === CLIENT_REPO || repo === CLIENT2_REPO){
        return clientDevelopers.filter(item => item !== creator).map(item => getTagName(item)).join(', ');
    }
    return '<@acs-schedule-fullstack-eng>';
}

function hasCustomDescription(description) {
    return !description.includes('<!--- Provide a general summary of your changes in the Title above. Prefix this with JIRA ticket id  -->');
}

function getDescription(fullDescription){
    if (!fullDescription ) {
        return null;
    }
    const description = fullDescription.split('## Risk and Impact Analysis')[0].trim();

    const result = description && description.length > 0 && hasCustomDescription(description) ? `*PR Description:*
${description}` : null;

    return result;
}


function getSlackMessageForNewPR(tags, prCreator, prUrl, title, description, extra) {

    const extraInfo = `
${extra ? ` * *Changed files*:${extra.changedFiles}` : ''}
${extra ? ` * *Lines added*: +${extra.additions}` : ''}
${extra ? ` * *Lines removed*: -${extra.deletions}` : ''}
`
    return `
${tags}
*${prCreator}* Has requested your review for this PR: 
${prUrl} 

*PR Title:* 
${title}
${extra ? extraInfo : ''}

${description ? description : ''}
`;
}

function isOffTime(){
    const now = new Date();
    const currentDay = now.getDay();

    if (currentDay >= 5) {
        return true;
    }
    const currentTime = now.getHours() + 4;
    if (currentTime < 8 || currentTime > 20) {
        return true;
    }

    return false;
}
module.exports = {
    isOffTime,
    getName,
    getRepo,
    getPRNumber,
    getTags,
    getTagName,
    getDescription,
    getSlackMessageForNewPR,
    HOUR,
    DAY,
    CLIENT_REPO,
    CLIENT2_REPO
}
