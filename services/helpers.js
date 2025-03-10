const SERVER_REPO = 'schedule-service';
const SERVER2_REPO = 'schedule-serverless';
const CLIENT_REPO = 'acs-schedule';
const CLIENT2_REPO = 'acc-schedule-web-lib';
const PLAN_REPO = 'plan-classic-web';
const EXTRACTOR_REPO = 'schedule-extractor';
const HOUR = (60 * 60 * 1000);
const DAY = 24 * HOUR;
const BOT_ID = 'U03JV4K3M';

const userNameToName = {
    falkowp: 'Piotr falkowski',
    koronsm: 'Marek Koronski',
    horojam: 'Michael Horojanski',
    greeng: 'Gilad Green',
    zlatinj: 'Jonathan Zlatin',
    erlicho: 'Odiya Erlichster',
    levin: 'Nir Levi',
    shermam1: 'Micha Sherman',
    nadivr: 'Raviv Nadiv',
    hochmar: 'Rotem Hochman',
    renovate: 'Renovate Bot',
    LocalizationsTeam: 'Localizations Team',
    'svc-p-hmy-git': 'svc-p-hmy-git',//'svc-p-hmy-git',
}

const userNameToId = {
    falkowp: 'U08BUDD2UKT',// 'Piotr falkowski',
    koronsm: 'U08CC19GL22',// 'Marek Koronski',
    horojam: 'U080A6ZN4TW',// 'Michael Horojanski',
    greeng: 'U93GVQANN',// 'Gilad Green',
    erlicho: 'U0275G55QQ0',//'Odiya Erlichster',
    levin: 'U41CXMEAG',//'Nir Levi',
    shermam1: 'U06BZ11J8P7',//'Micha Sherman',
    zlatinj: 'U075J4Z3K4H',//'Jonathan Zlatin',
    nadivr: 'U03FTQS4GM9',//'Raviv Nadiv',
    hochmar: 'U06J1STR33Q',//'Rotem Hochman',
    'svc-p-hmy-git': 'svc-p-hmy-git',//'svc-p-hmy-git',
}

const serverDevelopers = ['levin','horojam','erlicho','svc-p-hmy-git' ];
const clientDevelopers = ['erlicho','shermam1','zlatinj','falkowp','koronsm'];

function getRepo(url){
    if (url.includes(EXTRACTOR_REPO)){
        return EXTRACTOR_REPO;
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
    if (url.includes(SERVER2_REPO)){
        return SERVER2_REPO;
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

function isServer(repo){
    return (repo === SERVER_REPO || repo === SERVER2_REPO || repo === PLAN_REPO || repo === EXTRACTOR_REPO);
}

function getTags(repo, creator){
    if (isServer(repo)){
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
const daysLeftTillMarch28 = Math.ceil((new Date('2021-03-28') - new Date()) / DAY);
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

----------------------------------------------
*Notice:*
this bot would stop its activity in *${daysLeftTillMarch28}* days*.
----------------------------------------------
`;
}

function isOffTime(){
    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = now.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
    console.log('## isOffTime,  currentTime:', currentTime);
   const currentHour = Number(currentTime.substring(0,2)) + 2;
    console.log('## isOffTime,  currentHour:', currentHour);
    if (currentDay >= 6) {
        console.log('## isOffTime: true - weekend.');
        return true;
    }

    if (currentHour < 8 || currentHour > 18) {
        console.log('## isOffTime: true - non working hours.');

        return true;
    }

    return false;
}
module.exports = {
    isServer,
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
    SERVER_REPO,
    SERVER2_REPO,
    CLIENT2_REPO
}
