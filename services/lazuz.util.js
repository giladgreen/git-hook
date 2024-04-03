const axios = require('axios');
const { sendSlackNotification } = require("./slack.util");

const NAME = "eli p";

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

            console.log('## axiosUrl:', axiosUrl);
            console.log('## axiosData:', axiosData);
            await axios.post(axiosUrl, axiosData, { headers: { 'Content-Type': 'application/json' }});
            console.log('## axios sent');
            sendSlackNotification(`sms sent to ${body.phone}`);
            return 'wait for sms..'
        } catch (e) {
            console.error('## error sending sms:', e);
            console.error('## error sending sms:', e.message);
            sendSlackNotification(`error: ${e.message}`);
            throw e;
        }


    }

    throw new Error ('phone is required');
}
async function search(body) {
    if (body.code && body.phone && body.dates){
        const tokenResponse = await axios.post('https://server.lazuz.co.il/users/verification-sms/', {
            phone: body.phone,
            "vCode": body.code,
            "user": {
                phone: body.phone,
                name: NAME,
                policyApprove: true,
                android: 1
            }
        });

        const token = tokenResponse.data.user.token;
        sendSlackNotification(`got token, sending search request for this dates: ${body.dates}`);
        const results = {};
        for (let i=0; i< body.dates.length; i++){
            const date = body.dates[i];
            const response = await axios.get(`https://server.lazuz.co.il/client-app/clubs-by-ids/?clubIds=139,54&duration=60&date=${date}&court_type=3&category=null`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            results[date] = [];
            const clubs = response.data.clubs;
            if (clubs && clubs.length > 0){
                clubs.forEach(club => {
                    if (club.availableSlots.includes("19:00:00")){
                        results[date].push(CLUBS[club.club_id])
                    }
                })

            }
        }

        sendSlackNotification(`search result:
${JSON.stringify(results, null, 2)}
        
        `);
    }
    throw new Error ('phone, dates & code are required');
}
module.exports = {
    sendSms,
    search
}
