const axios = require('axios');
var fetchUrl = require("fetch").fetchUrl;

const { sendSlackNotification } = require("./slack.util");
let token;
const NAME = "anony mus";
const options = {
    headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Node/12.14.1'
    }
}

const CLUBS ={
    "54": "C.DEKEL",
    "139": "ROKAH 67",
}
async function sendSms(body) {
    if (body.phone){
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

    throw new Error ('phone is required');
}
async function search(body) {
    if (body.code && body.phone && body.dates){

        const data = {
            phone: body.phone,
            "vCode": body.code,
            "user": {
                phone: body.phone,
                name: NAME,
                policyApprove: true,
                android: 1
            }
        }
        try {
            const tokenResponse = await axios.post('https://server.lazuz.co.il/users/verification-sms/', data, options);
            token = tokenResponse.data.user.token;
        }catch(e){
            console.log('## error getting token:', e.message);
            if (!token){
                throw e;
            }
        }

        sendSlackNotification(`got token, sending search request for this dates: ${body.dates}`);
        const results = {};
        for (let i=0; i< body.dates.length; i++){
            const date = body.dates[i];
            try {
                const response = await axios.get(`https://server.lazuz.co.il/client-app/clubs-by-ids/?clubIds=139,54&duration=60&date=${date}&court_type=3&category=null`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'User-Agent': 'Node/12.14.1'
                    }
                });
            }catch(e){
                console.log('## error getting results:', e.message);
                throw e;
            }
            results[date] = [];
            const clubs = response.data.clubs;
            if (clubs && clubs.length > 0){
                clubs.forEach(club => {
                    if (club.availableSlots.includes("15:00:00")){
                        results[date].push(CLUBS[club.club_id])
                    }
                    // if (club.availableSlots.includes("19:00:00")){
                    //     results[date].push(CLUBS[club.club_id])
                    // }
                })

            }
        }

        const resultString = `search result:
${JSON.stringify(results, null, 2)}
        
        ` ;


        sendSlackNotification(resultString);

        return resultString;
    }
    throw new Error ('phone, dates & code are required');
}
module.exports = {
    sendSms,
    search
}
