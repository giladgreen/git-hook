const axios = require('axios');
const { sendSlackNotification } = require("./slack.util");

const NAME = "eli p";

const CLUBS ={
    "54": "C.DEKEL",
    "139": "ROKAH 67",
}
async function sendSms(body) {
    if (body.phone){
        await axios({
            method: 'POST',
            url: 'https://server.lazuz.co.il/users/signup-sms/',
            data: {
                phone: body.phone,
                name: NAME,
                policyApprove: true,
                android: 1
            }
        });

        sendSlackNotification(`sms sent to ${body.phone}`);
        return 'wait for sms..'
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
        };
         const axiosRequest = {
             method: 'POST',
             url: 'https://server.lazuz.co.il/users/verification-sms/',
             data
         }
        sendSlackNotification(`axiosRequest:`, axiosRequest);
        const tokenResponse = await axios(axiosRequest);

        const token = tokenResponse.data.user.token;
        sendSlackNotification(`got token, sending search request for this dates: ${body.dates}`);
        const results = {};
        body.dates.forEach(date =>{
            const response = await axios({
                method: 'GET',
                url: `https://server.lazuz.co.il/client-app/clubs-by-ids/?clubIds=139,54&duration=60&date=${date}&court_type=3&category=null`,
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

        })

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