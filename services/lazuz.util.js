const USER_ID = 10718;

const HOURS_COLORS = {
    "19:00:00": 'palegreen',
    "20:00:00": 'aquamarine',
    "21:00:00": 'coral',
}

const CLUBS = {
    "54": "קנטרי דקל",
    "139": "רוקח 67 תל אביב",
    "106": "רוקח 121 רמת גן",
    "66": "רוקח 4 תל אביב",
}
const CLUB_IDS='139,54,106,66'
const DAYS = {
    1: 'ראשון',
    2: 'שני',
    3: 'שלישי',
    4: 'רביעי',
    5: 'חמישי',
    6: 'שישי',
    7: 'שבת'
}
const SERVER_URL = 'https://git-hook-6aeb02160f71.herokuapp.com';
const LOCAL_URL = 'http://localhost:3000';
const daysMapping = {
    "1": 6,
    "2": 5,
    "3": 7,
    "4": 8,
    "5": 8,
    "6": 8,
    "7": 7,
}
const EMPTY_LINE = '<div style="color: transparent">.</div>'

function getDateText(date){
    const dateParts = date.split('-');
    const day = dateParts[2];
    const month = dateParts[1];
    const year = dateParts[0];
    const dayOfTheWeek = new Date(`${month}/${day}/${year}`).getDay() + 1;
    return {
        day:DAYS[dayOfTheWeek],
        shortDate: `${day}/${month}`
    }
}

function getDateCell(date){
    const {day,shortDate} = getDateText(date)
    return `<h2><span style="margin: 0 6px">${day} </span> <span style="margin: 0 6px">${shortDate}</span></h2>`;
}

function getDateHebrewDay(date){
    const dateParts = date.split('-');
    const day = dateParts[2];
    const month = dateParts[1];
    const year = dateParts[0];
    const dayOfTheWeek = new Date(`${month}/${day}/${year}`).getDay() + 1;
    return DAYS[dayOfTheWeek];
}

function getDates(){
    const today = new Date();
    const dates = [];
    for (let i=0; i < 11; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
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

function getHoursSection(localHost, club, dateItems, date){
    return dateItems.filter(data => data.club === club).map(data => `
        <tr>
           <th style="background-color: ${HOURS_COLORS[data.hour]}">${getDateHebrewDay(date)} ${data.hour}</th>
<!--           <th> <a href="${localHost ? LOCAL_URL : SERVER_URL}/lazuz/make?club=${club}&date=${date}&hour=${data.hour}">Make Reservation</a></th>-->
        </tr>
        `).join('')
}
function getHtmlResultsSection(localHost, results){
    return Object.keys(results).map(date => {
        const dateItems = results[date];
        if (dateItems.length === 0){
          return '';
        }

        const clubs = Array.from(new Set(dateItems.map(data => data.club)));
        return `
          <div>
              <div>${getDateCell(date)}</div>
              ${clubs.map(club => `
              <table>
                  <tr>
                    <th style="background-color: blanchedalmond">${CLUBS[club]}</th>
<!--                    <th style="background-color: blanchedalmond"></th>-->
                  </tr>
                  ${getHoursSection(localHost, club, dateItems, date)}
                 
               </table>
              `).join('')}
          </div>`;
    }).join('');
}

function getReservationsSection(localHost, reservations) {
    if (!reservations || reservations.length === 0){
        return ' <h1><u>No Reservations</u></h1>';
    }
    const getDateName = (reservation) => {
        const day =  getDateText(reservation.start_date).day;
        return `יום ${day} `;
    }
    const section = `
    <h1><u>הזמנות קיימות (${reservations.length}): </u></h1>
    ${reservations.map(reservation => `
        <div>
           <div style="background-color: blanchedalmond">
           <div>
              ${CLUBS[reservation.club_id]}, ${ getDateName(reservation)} (${getDateText(reservation.start_date).shortDate})
            </div>
            <div>
              בשעה  ${(reservation.start_time).toString().substring(0,5)} 
            </div>
             ${EMPTY_LINE}
           <a style="background-color: sandybrown" href="${localHost ? LOCAL_URL : SERVER_URL}/lazuz/cancel?reservation=${reservation.id}">ביטול ההזמנה</a>
           ${EMPTY_LINE}
        </div>
        `).join(EMPTY_LINE)}
    </table>
    `;
    // console.log('## reservations section', section)

    return section;
}
function wrapWithHtml(localHost, reservations, results, include){

    console.log('## localHost', localHost)
    console.log('## reservations', reservations)
    console.log('## results', results)
    console.log('## include', include)

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Tennis court search</title>
</head>
<style>
body{
    direction: rtl;
}
table{
width: 100%;
}
    th, td {
      border:1px solid black;
      vertical-align: top;
      padding: 8px;
      direction: rtl;
      text-align: start;
    }
</style>
<body>

${getReservationsSection(localHost, reservations)}
<hr/>
<h1><u>תוצאות חיפוש</u></h1>
  ${getHtmlResultsSection(localHost, results)}

${EMPTY_LINE}
${EMPTY_LINE}
${EMPTY_LINE}
${include ? '' : `to also search for later hours <a href="${localHost ? LOCAL_URL : SERVER_URL}/lazuz/search?include=true">click here</a>`}
${EMPTY_LINE}
${EMPTY_LINE}
<h5>Server time: <b>${(new Date()).toString()}</b></h5>

</body>
</html>
`
}

function getNextHour(hour){
    const parts = hour.split(':');
    const nextHour = parseInt(parts[0]) + 1;
    return `${nextHour}:00:00`;
}

module.exports = {
    wrapWithHtml,
    getDates,
    CLUB_IDS,
    USER_ID,
    getNextHour
}
