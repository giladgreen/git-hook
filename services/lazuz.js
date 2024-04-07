const axios = require('axios');
// const { sendSlackNotification } = require("./slack.util");
const { createTokens, getTokens, updateToken } = require("./db");
const {wrapWithHtml, getDates, CLUB_IDS, USER_ID, getNextHour} = require("./lazuz.util");

const DEBUG_MODE = false;
let token;
let refreshToken;

const MOCK =  {
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

const options = {
    headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Node/12.14.1'
    }
}

const PREFERRED_HOURS = ["19:00:00", "20:00:00", "21:00:00"];

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
        return resultString;
    } catch (e) {
        console.error('## error sending sms:', e.message);
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
    } catch(e){
        console.log('## error getting token:', e.message);
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
        console.log('## got new token:', token);
        await updateToken(token);
    } catch(e){
        console.log('## error getting token:', e.message);
        console.log('## will use existing token:', token);
    }
}

async function getUserReservations(dates){
    try {
        const reservationsResponse = await axios.get(`https://server.lazuz.co.il/users/reservations/?start=${dates[0]}&end=${dates[dates.length-1]}`, {
            headers: {
                Authorization: `Bearer ${token}`,
                'User-Agent': 'Node/12.14.1'
            }
        });
        return reservationsResponse.data.results || [];
    } catch(e){
        console.log('## error getting token:', e.message);
        return [];
    }

}

async function getMockedSearchResults(dates,include) {
    return MOCK;
}


async function getSingleDateSearchResults(date) {
    try {
        const response = await axios.get(`https://server.lazuz.co.il/client-app/clubs-by-ids/?clubIds=${CLUB_IDS}&duration=60&date=${date}&court_type=3&category=null`, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
                'User-Agent': 'Node/12.14.1'
            }
        });
        return {
            date,
            clubs: response?.data?.clubs ?? []
        };
    } catch(e) {
        await refreshAccessToken();
        console.log('## error getting results:', e.message);
        throw e;
    }
}

async function getSearchResults(dates,include) {
    const results = [];
    const allData = await Promise.all(dates.map(date => getSingleDateSearchResults(date)));
    for (let i=0; i< allData.length; i++){
        const { date, clubs } = allData[i];
        results[date] = [];
        clubs.forEach(club => {
            if (!club?.availableSlots || !Array.isArray(club.availableSlots)){
                return;
            }
            const hoursToUse = include ? PREFERRED_HOURS : PREFERRED_HOURS.filter(h => h === '19:00:00');
            hoursToUse.forEach(hour => {
                if (club.availableSlots.includes(hour)){
                    results[date].push({ club: club.club_id, hour });
                }
            })
        })

    }
    return results;
}
async function actualReservationCall(requestBody) {
    for (let price=50; price<85; price+=5){
        requestBody.reservation.price = price;
        try {
            await axios.post(`https://server.lazuz.co.il/users/reservations/`, requestBody, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'User-Agent': 'Node/12.14.1'
                }
            });
            console.log('## booked with price:',price)
            return;
        } catch (e) {
            console.log('## failed to book with price:',price)
        }
    }
    throw new Error('failed to book, wrong price');

}
async function makeReservation(club, date, hour) {
    if (!club || !date || !hour) {
        throw new Error('club, date & hour are required');
    }
    try {
        await refreshAccessToken();
        const start_time = hour;
        const end_time = getNextHour(hour);

        const requestBody = {
            reservation: {
                id: null,
                booking_type: 'ext',
                is_paid_reservation: null,
                notMemberForce: null,
                title: 'Gilad Green',
                club_id: parseInt(club),
                court_id: 0,
                client_id: USER_ID,
                court_type: 3,
                created_by_user: USER_ID,
                start_date: date,
                end_date: date,
                start_time,
                end_time,
                duration: 60,
                chargingTypeId: 1,
                partners: null,
                partner_m: null
            },
            ticketCredit: null
        };
        await actualReservationCall(requestBody);
        return 'Reservation cancelled';
    } catch(e) {
        console.log('## error getting results:', e.message);
        throw e;
    }
}
async function cancelReservation(reservationId) {
    if (!reservationId) {
        throw new Error('reservationId is required');
    }
    try {
        await refreshAccessToken();
        await axios.patch(`https://server.lazuz.co.il/users/reservations/cancel`, {
            res_id: reservationId
        },{
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
                'User-Agent': 'Node/12.14.1'
            }
        });
        return 'Reservation cancelled';
    } catch(e) {
        console.log('## error getting results:', e.message);
        throw e;
    }

}
async function search(localHost, include) {
   await refreshAccessToken();

   const dates = getDates();

   const [reservations, results] = await Promise.all([
        getUserReservations(dates),
        (DEBUG_MODE ? getMockedSearchResults(dates, include) : getSearchResults(dates, include))
    ]);

    const html = wrapWithHtml(localHost, reservations, results, include);

    return html;
}

async function getTokensDataFromDB(){
    const tokens = await getTokens();
    const t = tokens.find(t => t.token_type === 'token');
    const rt = tokens.find(t => t.token_type === 'refreshToken');
    token = rt.token;
    refreshToken = t.token;
    console.log('## got tokens')
    console.log('## token:',token)
    console.log('## refreshToken:',refreshToken)
}
getTokensDataFromDB();

module.exports = {
    sendSms,
    setupToken,
    search,
    makeReservation,
    cancelReservation
}
