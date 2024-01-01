const SERVER_REPO = 'schedule-service';
const CLIENT_REPO = 'acs-schedule';
const PLAN_REPO = 'plan-classic-web';
const HOUR = (60 * 60 * 1000);
const DAY = 24 * HOUR;
const BOT_ID = 'U03JV4K3M';

const userNameToName = {
    greeng: 'Gilad Green',
    maltzmb: 'Bar Maltzman',
    zlufl: 'Liron Zluf',
    erlicho: 'Odiya Erlichster',
    tchizid:  'Dor Tchizik',
    levin: 'Nir Levi',
    nadivr:'Raviv Nadiv',
    renovate: 'Renovate Bot'
}

const userNameToId = {
    greeng: 'U93GVQANN',// 'Gilad Green',
    maltzmb: 'U04QT8537HA',//'Bar Maltzman',
    zlufl: 'UA33JGJLA',//'Liron Zluf',
    erlicho: 'U0275G55QQ0',//'Odiya Erlichster',
    tchizid: 'U011A594ARZ',// 'Dor Tchizik',
    levin: 'U41CXMEAG'//'Nir Levi',
    //TODO: micha
}

const serverDevelopers = ['greeng','tchizid','levin'];
const clientDevelopers = ['greeng','maltzmb'];

function getRepo(url){
    return url.includes(CLIENT_REPO) ? CLIENT_REPO: (url.includes(SERVER_REPO) ? SERVER_REPO : PLAN_REPO);
}


function getPRNumber(url){
    const parts = url.split('/');
    return Number(parts[parts.length-1]);
}


function getName(username){
    return userNameToName[username];
}

function getTagName(username){
    return `<@${userNameToId[username]}>` ;
}

function getTags(repo, creator){
    if (repo === SERVER_REPO || repo === PLAN_REPO){
        return serverDevelopers.filter(item => item !== creator).map(item => getTagName(item)).join(', ');
    }
    if (repo === CLIENT_REPO){
        return clientDevelopers.filter(item => item !== creator).map(item => getTagName(item)).join(', ');
    }
    return '<@acs-schedule-fullstack-eng>';
}

function hasCustomDescription(description) {
    return !description.includes('<!--- Provide a general summary of your changes in the Title above. Prefix this with JIRA ticket id  -->');
}

function getDescription(fullDescription){
    if (!fullDescription) {
        return null;
    }
    const description = fullDescription.split('## Risk and Impact Analysis')[0].trim();

    const result =  hasCustomDescription(description) ? `*PR Description:*
${description}` : null;

    return result;
}


function getSlackMessageForNewPR(tags, prCreator, prUrl, title, description, extra) {
    return `
${tags}
*${prCreator}* Has requested your review for this PR: 
${prUrl} 

*PR Title:* 
${title}

${extra ? ` *Changed files*:${extra.changedFiles}` : ''}
${extra ? ` *Lines added*: +${extra.additions}` : ''}
${extra ? ` *Lines removed*: -${extra.deletions}` : ''}

${description && description.length > 0 ? description : ''}

`;
}

function isOffTime(){
    const now = new Date();
    const currentDay = now.getDay();

    if (currentDay >= 5) {
        return true;
    }
    const currentTime = now.getHours() + 4;
    if (currentTime < 8 || currentTime > 17) {
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
    hasCustomDescription,
    getSlackMessageForNewPR,
    HOUR,
    DAY
}
