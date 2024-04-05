const axios = require('axios');
const { sendSlackNotification } = require("./slack.util");
const { createTokens, getTokens, updateToken } = require("./db");
const DEBUG_MODE = false;
let token;
let refreshToken;

(async ()=>{
    const tokens = await getTokens();
    const t = tokens.find(t => t.token_type === 'token');
    const rt = tokens.find(t => t.token_type === 'refreshToken');
    token = rt.token;
    refreshToken = t.token;
    console.log('## got tokens')
    console.log('## token:',token)
    console.log('## refreshToken:',refreshToken)
})();

const options = {
    headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Node/12.14.1'
    }
}

const PREFERED_HOURS = ["19:00:00", "20:00:00", "21:00:00"];

const CLUBS = {
    "54": "TLV - COUNTRY DEKEL",
    "139": "TLV - ROKAH 67",
    "106": "RAMAT-GAN, ROKAH 121",
    "66": "TLV - ROKAH 4",
}
const CLUB_IDS='139,54,106,66'
const backgroundColorByClub = {
    "54": "aquamarine",
    "139": "blanchedalmond",
    "106": "coral",
    "66": "gainsboro",
}
async function sendSms(body) {
    if (!body.phone || !body.name){
        throw new Error ('phone & name are required');
    }

    try {
        const axiosUrl = 'https://server.lazuz.co.il/users/signup-sms';
        const axiosData = {
            phone: body.phone,
            name: body.name,
            policyApprove: true,
            android: 1
        };

        await axios.post(axiosUrl, axiosData, options);
        const resultString = `SMS sent to ${body.phone}`;
        DEBUG_MODE && sendSlackNotification(resultString);
        return resultString;
    } catch (e) {
        console.error('## error sending sms:', e.message);
        DEBUG_MODE && sendSlackNotification(`error: ${e.message}`);
        throw e;
    }
}

async function setupToken(body) {
    if (!body.phone || !body.code || !body.name){
        throw new Error ('phone, name & code are required');
    }
    const data = {
        phone: body.phone,
        vCode: body.code,
        user: {
            phone: body.phone,
            name: body.name,
            policyApprove: true,
            android: 1
        }
    }
    try {
        const tokenResponse = await axios.post('https://server.lazuz.co.il/users/verification-sms/', data, options);
        token = tokenResponse.data.user.token;
        refreshToken = tokenResponse.data.user.refreshToken;

        await createTokens(token, refreshToken);
        tokenTime = (new Date()).getTime();
        DEBUG_MODE && sendSlackNotification(`got new token`);
    } catch(e){
        console.log('## error getting token:', e.message);
        DEBUG_MODE && sendSlackNotification(`error getting token: ${e.message}`);
        throw e;
    }
}

async function refreshAccessToken(){
    try {
        const tokenResponse = await axios.get('https://server.lazuz.co.il/users/token', {
            headers: {
                Authorization: `Bearer ${refreshToken}`,
                'User-Agent': 'Node/12.14.1'
            }
        });
        token = tokenResponse.data.result.accessToken;
        await updateToken(token);
    } catch(e){
        console.log('## error getting token:', e.message);
        DEBUG_MODE && sendSlackNotification(`error refreshing token: ${e.message}`);
        //throw new Error ('error refreshing token');
    }
}

const DAYS = {
    1: 'ראשון',
    2: 'שני',
    3: 'שלישי',
    4: 'רביעי',
    5: 'חמישי',
    6: 'שישי',
    7: 'שבת'
}
const daysMapping = {
    "1": 6,
    "2": 5,
    "3": 7,
    "4": 8,
    "5": 8,
    "6": 8,
    "7": 7,
}
function getDates(){
    const today = new Date();
    const todayDayOfTheWeek = today.getDay() + 1; //1 - 7
    const datesCount = daysMapping[todayDayOfTheWeek];
    const dates = [];
    for (let i=0; i < datesCount; i++) {
        const date = new Date(today);
        if (i > 0){
            date.setDate(today.getDate() + i);
        }
        if (date.getDay() === 6){
            continue;
        }
        const year = date.getFullYear();
        let month = date.getMonth() + 1;
        month = `${month < 10 ? '0' : ''}${month}`;
        let day = date.getDate();
        day = `${day < 10 ? '0' : ''}${day}`;
        const dateAsString = `${year}-${month}-${day}`;
        dates.push(dateAsString);
    }
    return dates;

}

function getDateCell(date){
    const dateParts = date.split('-');
    const day = dateParts[2];
    const month = dateParts[1];
    const year = dateParts[0];
    const dayOfTheWeek = new Date(`${month}/${day}/${year}`).getDay() + 1;
    return `<div><div>${DAYS[dayOfTheWeek]} </div><div>${day}/${month}</div></div>`;

}
const tempResults =  {
    '2024-04-05': [],
    '2024-04-07': [
        { club: '106', hour: '21:00:00' },
        { club: '139', hour: '21:00:00' }
    ],
    '2024-04-08': [ { club: '139', hour: '21:00:00' } ],
    '2024-04-09': [ { club: '139', hour: '21:00:00' } ],
    '2024-04-10': [
        { club: '54', hour: '19:00:00' },
        { club: '106', hour: '21:00:00' },
        { club: '139', hour: '21:00:00' }
    ],
    '2024-04-11': [
        { club: '54', hour: '19:00:00' },
        { club: '54', hour: '20:00:00' },
        { club: '54', hour: '21:00:00' },
        { club: '66', hour: '21:00:00' },
        { club: '106', hour: '19:00:00' },
        { club: '106', hour: '20:00:00' },
        { club: '106', hour: '21:00:00' },
        { club: '139', hour: '21:00:00' }
    ],
    '2024-04-12': []
}

function wrapWithHtml(results){

    console.log('## results', results)

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Tennis court search</title>
</head>
<style>

    th, td {
      border:1px solid black;
      text-align: left;
      vertical-align: top;
      padding: 8px;
    }

</style>
<body>
<h1><u>Search Results:</u></h1>
<table>
  <tr>
    <th>Date</th>
    <th>Club</th>
    <th>Free Hours</th>
  </tr>
  ${Object.keys(results).map(date => {
      const dateItems = results[date];
      const clubs = Array.from(new Set(dateItems.map(data => data.club)));
      const clubHoursCount = {};
      dateItems.forEach(data =>{
          if (!clubHoursCount[data.club]){
              clubHoursCount[data.club] = 0;
          }
          clubHoursCount[data.club]++;
      })
        //backgroundColorByClub
      const clubsData = clubs.map(club => {
            const clubRosToOccupy = clubHoursCount[club];
            const newLines = Array(clubRosToOccupy).fill('<div style="color: transparent">.</div>').join('');
            return `<div style="background-color: ${backgroundColorByClub[club]}">${CLUBS[club]}${newLines}</div>`;
      }).join('');
      
      const hoursData = clubs.map(club => {
          const clubHours = dateItems.filter(data => data.club === club).map(data => data.hour);
          return clubHours.map(hour => `<div style="background-color: ${backgroundColorByClub[club]}">${hour}</div>`).join('');
      }).join('<br>')
     
      
     return `<tr>
        <th>${getDateCell(date)}</th>
        <th>${clubsData}</th>
        <th>${hoursData}</th>
      </tr>`;
      
    }).join('')}
</table>
</body>
</html>
`
}

async function search() {
   await refreshAccessToken();
   const dates = getDates();
   const results = [];// tempResults;
   for (let i=0; i< dates.length; i++){
        const date = dates[i];
        results[date] = [];
        try {
            const response = await axios.get(`https://server.lazuz.co.il/client-app/clubs-by-ids/?clubIds=${CLUB_IDS}&duration=60&date=${date}&court_type=3&category=null`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'User-Agent': 'Node/12.14.1'
                }
            });

            const clubs = response?.data?.clubs;
            if (!clubs){
                continue;
            }
            clubs.forEach(club => {
                if (!club?.availableSlots || !Array.isArray(club.availableSlots)){
                    return;
                }
                PREFERED_HOURS.forEach(hour => {
                    if (club.availableSlots.includes(hour)){
                        results[date].push({ club: club.club_id, hour });
                    }
                })
            })
        } catch(e) {
            await refreshAccessToken();
            console.log('## error getting results:', e.message);
            throw e;
        }
    }

    const html = wrapWithHtml(results);
    console.log('## html', html)
    return html;
}
module.exports = {
    sendSms,
    setupToken,
    search
}
