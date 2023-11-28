const SERVER_REPO = 'schedule-service';
const CLIENT_REPO = 'acs-schedule';
const HOUR = (60 * 60 * 1000);
const DAY = 24 * HOUR;

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
}
const date = new Date();
const targetDate = new Date(2023,11,30);
const lironIsInTheTeam = date <= targetDate;
const serverDevelopers = ['greeng','zlufl','tchizid','levin'].filter(name => {
    return name !== 'zlufl' || lironIsInTheTeam;
});
const clientDevelopers = ['greeng','maltzmb','erlicho','zlufl','tchizid'].filter(name => {
    return name !== 'zlufl' || lironIsInTheTeam;
});

function getRepo(url){
    return url.includes(CLIENT_REPO) ? CLIENT_REPO:SERVER_REPO;
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
    if (repo === SERVER_REPO){
        return serverDevelopers.filter(item => item !== creator).map(item => getTagName(item)).join(', ');
    }
    if (repo === CLIENT_REPO){
        return clientDevelopers.filter(item => item !== creator).map(item => getTagName(item)).join(', ');
    }
    return '@acs-schedule-fullstack-eng';
}

function hasCustomDescription(description) {
    return !description.includes('<!--- Provide a general summary of your changes in the Title above. Prefix this with JIRA ticket id  -->');
}

function getDescription(fullDescription){
    if (!fullDescription) {
        return null;
    }
    const description = fullDescription.split('## Risk and Impact Analysis')[0].trim();

    return hasCustomDescription(description) ? `*PR Description:*
${description}` : null;
}


function getSlackMessageForNewPR(tags, prCreator, prUrl, title, description) {
    return `
${tags}
*${prCreator}* Has requested your review for this PR: 
${prUrl} 

*PR Title:* 
${title}

${description ? description : ''}

`;
}


module.exports = {
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
