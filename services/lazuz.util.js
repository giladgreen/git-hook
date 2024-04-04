const axios = require('axios');
const { sendSlackNotification } = require("./slack.util");

let token;
let tokenTime;
const NAME = "anony mus";
const options = {
    headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Node/12.14.1'
    }
}
const PREFERED_HOURS = ["19:00:00", "20:00:00"];
const CLUBS ={
    "54": "C.DEKEL",
    "139": "ROKAH 67",
}
async function sendSms(body) {
    if (!body.phone){
        throw new Error ('phone is required');
    }

    try {
        const axiosUrl = 'https://server.lazuz.co.il/users/signup-sms';
        const axiosData = {
            phone: body.phone,
            name: NAME,
            policyApprove: true,
            android: 1
        };

        await axios.post(axiosUrl, axiosData, options);
        const resultString = `SMS sent to ${body.phone}`;
        sendSlackNotification(resultString);
        return resultString;
    } catch (e) {
        console.error('## error sending sms:', e.message);
        sendSlackNotification(`error: ${e.message}`);
        throw e;
    }
}

async function getToken(phone, code){
    const data = {
        phone: phone,
        "vCode": code,
        "user": {
            phone: phone,
            name: NAME,
            policyApprove: true,
            android: 1
        }
    }
    try {
        const tokenResponse = await axios.post('https://server.lazuz.co.il/users/verification-sms/', data, options);
        return tokenResponse.data.user.token;
    } catch(e){
        console.log('## error getting token:', e.message);
        throw e;
    }
}
async function search(body) {
    if (!body.phone || !body.dates){
        throw new Error ('phone nad dates are required');
    }

    if (!token || (((new Date()).getTime() - tokenTime) > 1000*60*20)){
        if (!body.code){
            throw new Error ('code is required');
        }

        token = await getToken(body.phone, body.code);
        tokenTime = (new Date()).getTime();
        sendSlackNotification(`got new token`);

    }

    // sendSlackNotification(`sending search request for this dates: ${body.dates}`);
    const results = {};
    for (let i=0; i< body.dates.length; i++){
        const date = body.dates[i];
        results[date] = [];
        try {
            const response = await axios.get(`https://server.lazuz.co.il/client-app/clubs-by-ids/?clubIds=139,54&duration=60&date=${date}&court_type=3&category=null`, {
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
                        results[date].push({ club: CLUBS[club.club_id], hour });
                    }
                })
            })
        } catch(e) {
            console.log('## error getting results:', e.message);
            throw e;
        }
    }

    const resultString = `search result:
${JSON.stringify(results, null, 2)}
    
    ` ;


    sendSlackNotification(resultString);

    return resultString;

}
module.exports = {
    sendSms,
    search
}
