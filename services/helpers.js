const SERVER_REPO = 'schedule-service';
const CLIENT_REPO = 'acs-schedule';

const userNameToNameMapping = {
    greeng: 'Gilad Green',
    maltzmb: 'Bar Maltzman',
    zlufl: 'Liron Zluf',
    erlicho: 'Odiya Erlichster',
    tchizid: 'Dor Tchizik',
    levin: 'Nir Levi',
    nadivr:'Raviv Nadiv',
    renovate: 'Renovate Bot'
}

const serverDevelopers = ['greeng','zlufl','tchizid','levin'];
const clientDevelopers = ['greeng','maltzmb','erlicho','zlufl','tchizid'];

function getRepo(url){
    return url.includes(CLIENT_REPO) ? CLIENT_REPO:SERVER_REPO;
}


function getPRNumber(url){
    const parts = url.split('/');
    return Number(parts[parts.length-1]);
}


function getName(username){
    return userNameToNameMapping[username];
}


function getTags(repo, creator){
    if (repo === SERVER_REPO){
        return serverDevelopers.filter(item => item !== creator).map(item => `@${getName(item)}`).join(', ');
    }
    if (repo === CLIENT_REPO){
        return clientDevelopers.filter(item => item !== creator).map(item => `@${getName(item)}`).join(', ');
    }
    return '@acs-schedule-fullstack-eng';
}

module.exports = {
    getName,
    getRepo,
    getPRNumber,
    getTags
}
