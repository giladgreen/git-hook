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
const translations = {
    orderCourt: 'הזמן מגרש',
   day: 'יום',
    existingReservations: 'הזמנות קיימות',
    doneReservations: 'הזמנות שהסתיימו',
    totalCost: 'עלות כוללת',
    cancelReservation: 'ביטול הזמנה',
    searchResults: 'תוצאות חיפוש',
    pressHere: 'לחץ כאן',
    toSeeMoreResults: 'לתוצאות נוספות -',
    atHour: 'בשעה',
    shekels: 'ש"ח',
    noReservations: 'אין הזמנות',
    reservations: 'הזמנות',
    january: 'ינואר',
    february: 'פברואר',
    march: 'מרץ',
    april: 'אפריל',
    may: 'מאי',
    june: 'יוני',
    july: 'יולי',
    august: 'אוגוסט',
    september: 'ספטמבר',
    october: 'אוקטובר',
    november: 'נובמבר',
    december: 'דצמבר',
    pastReservationsSummary: 'סיכום הזמנות שהסתיימו',

}

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
function getDateName(reservation) {
    const day =  getDateText(reservation.start_date).day;
    return `${translations.day} ${day} `;
}
function getHoursSection(localHost, club, dateItems, date){
    return dateItems.filter(data => data.club === club).map(data => `
        <tr>
           <th style="background-color: ${HOURS_COLORS[data.hour]}">
                ${getDateHebrewDay(date)} ${data.hour}
                <a style="margin: 0 10px" href="${localHost ? LOCAL_URL : SERVER_URL}/lazuz/make?club=${club}&date=${date}&hour=${data.hour}">${translations.orderCourt}</a>
            </th> 
        </tr>
        `).join('')
}


function getHtmlResultsSection(localHost, results) {
    return Object.keys(results).map(date => {
        const dateItems = results[date];
        if (dateItems.length === 0) {
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
                  </tr>
                  ${getHoursSection(localHost, club, dateItems, date)}
                 
               </table>
              `).join('')}
          </div>`;
    }).join('');
}

function getMonthReservationsSection(monthReservationsObject) {
   return `
    <h1><u>${translations.reservations} ${translations[monthReservationsObject.name.toLowerCase()]}  (${monthReservationsObject.reservations.length}): ${monthReservationsObject.totalCost} ${translations.shekels}</u></h1>

    ${monthReservationsObject.reservations.map(reservation => `
        <div>
           <div style="background-color: blanchedalmond">
           <div>
              ${CLUBS[reservation.club_id]}, ${ getDateName(reservation)} (${getDateText(reservation.start_date).shortDate})
            </div>
            <div>
              ${translations.atHour}  ${(reservation.start_time).toString().substring(0,5)}  ${reservation.cTitle}
            </div>
          
             <div>
            ${reservation.price} ${translations.shekels}
            </div>
          
        </div>
        `).join(EMPTY_LINE)}
   
    `;
}
function getPastReservationsSection(reservations) {
    if (!reservations || reservations.length === 0){
        return '';
    }

    const reservationsByMonth = reservations.reduce((acc, curr) => {
        const month = curr.start_date.substring(6,7);
        if (!acc[month]){
            acc[month] = [];
        }
        acc[month].push(curr);
        return acc;
    },{});
    const currentYear = (new Date()).getFullYear();
    const reservationsByMonths = Object.keys(reservationsByMonth).map(month=>{
        return {
            name: new Date(`${currentYear}-${month}-01`).toLocaleString('default', { month: 'long' }),
            reservations: reservationsByMonth[month],
            totalCost: reservationsByMonth[month].reduce((acc, curr) => acc + curr.price, 0)
        }
    });
    reservationsByMonths.reverse();
    return `
        <div><u><b>${translations.pastReservationsSummary}</b></u></div>
        ${reservationsByMonths.map(getMonthReservationsSection).join(EMPTY_LINE)}
        `
}
function getFutureReservationsSection(localHost, reservations) {
    if (!reservations || reservations.length === 0){
        return ` <h1><u>${translations.noReservations}</u></h1>`;
    }



    const section = `
    <h1><u>${translations.existingReservations} (${reservations.length}): </u></h1>
    ${reservations.map(reservation => `
        <div>
           <div style="background-color: blanchedalmond">
           <div>
              ${CLUBS[reservation.club_id]}, ${ getDateName(reservation)} (${getDateText(reservation.start_date).shortDate})
            </div>
            <div>
              ${translations.atHour}  ${(reservation.start_time).toString().substring(0,5)} 
            </div>
            <div>
            ${reservation.cTitle}
            </div>
             <div>
            ${reservation.price} ${translations.shekels}
            </div>
             ${EMPTY_LINE}
           <a style="background-color: sandybrown" href="${localHost ? LOCAL_URL : SERVER_URL}/lazuz/cancel?reservation=${reservation.id}">${translations.cancelReservation}</a>
           ${EMPTY_LINE}
        </div>
        `).join(EMPTY_LINE)}
    `;

    return section;
}
function wrapWithHtml(localHost, reservations, results, include){
    const nowInIsrael = new Date((new Date()).toLocaleString("en-US", {timeZone: "Asia/Jerusalem"}));

    const getReservationExactTime = (reservation) => {
        return new Date(`${reservation.start_date}T${reservation.end_time}`);
    }

    const pastReservations = reservations.filter(reservation => getReservationExactTime(reservation) < nowInIsrael);
    const futureReservations = reservations.filter(reservation => getReservationExactTime(reservation) >= nowInIsrael);
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
.wether-widget {
   position: fixed;
   top: 0;
   left:0;
   z-index: 10;
}
.container {
   position: absolute;
   top: 0;
   right:0;
   direction: rtl;
   font-size: xx-large;
   z-index: 1;
}

</style>
<body>
 <div class="elfsight-app-e04da7d5-bc97-4e49-beed-0c664cf9ea47 wether-widget" data-elfsight-app-lazy></div>

 <div class="container" >

${getFutureReservationsSection(localHost, futureReservations)}
<hr/>
<h1><u>${translations.searchResults}</u></h1>
  ${getHtmlResultsSection(localHost, results)}

${EMPTY_LINE}

${getPastReservationsSection(pastReservations)}

${EMPTY_LINE}
${EMPTY_LINE}
${include ? '' : `${translations.toSeeMoreResults} <a href="${localHost ? LOCAL_URL : SERVER_URL}/lazuz/search?include=true">${translations.pressHere}</a>`}
${EMPTY_LINE}
${EMPTY_LINE}
<h5>Server time: <b>${(new Date()).toString()}</b></h5>

</div>

</body>
<script src="https://static.elfsight.com/platform/platform.js" data-use-service-core defer></script>
<script>
    setTimeout(()=>{
      try{
        const collection = document.getElementsByClassName('eapp-weather-daily-item-max');
        for (let i =0; i<7; i++) {
            const temparture = parseInt(collection[i].innerHTML);
            if (temparture > 28){
                collection[i].classList.add("too-hot");
            } else if (temparture < 17){
                collection[i].classList.add("too-cold");
            }else{
                 collection[i].classList.add("prefect");
            }
        }
      }catch(e){
         console.error(e)
      }
    },3500)

</script>
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
