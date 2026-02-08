const monthTokens = [
  ['janvier','janv.','janv'],
  ['fevrier','février','fev','fev.','fév','fév.'],
  ['mars','mar','mar.'],
  ['avril','avr','avr.'],
  ['mai'],
  ['juin'],
  ['juillet','juil.','juil'],
  ['août','aout','aoû.','aou.','aou','aoû'],
  ['septembre','sept.','sep.','sept','sep'],
  ['octobre','oct.','oct'],
  ['novembre','nov.','nov'],
  ['decembre','décembre','dec.','dec','déc.','déc'],
];

const monthsRegexp = monthTokens
    .map(tokens => tokens.map(token => token.replace('.', `\\.`)))
    .map(tokens => new RegExp(`([0-9]{1,2}) (${tokens.join('|')}) ([0-9]{4}|[0-9]{2})?`, "gi"))

// const test = `L'événement aura lieu le 06 août 2025 à 16h et finira le 4 août à 22h.`
// const test = `L'événement aura lieu le 04/08/2025 de 16h30 à 03h00.`

const convertMatchToDate = (match, monthIndex) => {
    
    const day = parseInt(match[1]);
    const month = monthIndex;
    const currentYear = (new Date()).getFullYear();
    const year = match[4] ? match[4].length == 4 ? match[4] : '20' + match[4] : currentYear;
    try {
        return new Date(year, month, day, 0, 0, 0, 0);
    } catch (e) {
        
    }
}

const convertMatchToTime = match => {
    
    let minutes = 0;
    let hours = 0;
    if (match[4]) {
        hours = parseInt(match[4]);
    } else {
        hours = parseInt(match[2]);
        minutes = parseInt(match[3]);
    }
    
    return { hours, minutes };
}

const parseDatesFromText = (text) => {

    let foundDates = [];
    let foundTimes = [];
    let monthIndex = 0;
    let score = 0;

    for (const monthRegexp of monthsRegexp) {
        
        const matches = ([...text.matchAll(monthRegexp)]);
        
        if (matches) {
            for (const match of matches) {
                foundDates.push(convertMatchToDate(match, monthIndex));
            }
        }
        monthIndex++;
    }

    if (foundDates.length == 0) {
        const regExp = /([0-9]{1,2})(?:-|\/)([0-9]{1,2})((?:-|\/)([0-9]{4}|[0-9]{2}))?/gi;
        const matches = ([...text.matchAll(regExp)]);

        if (matches) {
            for (const match of matches) {
                foundDates.push(convertMatchToDate(match, parseInt(match[2]) - 1));
            }
        }    
    }

    let startDateCandidate = null;
    let endDateCandidate = null;
    let startTimeCandidate = null;
    let endTimeCandidate = null;
    let startDateTimeCandidate = null;
    let endDateTimeCandidate = null;

    if (foundDates.length > 0) {
        startDateCandidate = foundDates[0];
        
        if (foundDates.length > 1) {
            endDateCandidate = foundDates[1];
            if (endDateCandidate < startDateCandidate) {
                const tmpDate = startDateCandidate;
                startDateCandidate = endDateCandidate;
                endDateCandidate = tmpDate;
            }
        }
    }

    const regExpTime = /(([0-9]{1,2})(?::|h)([0-9]{2})|([0-9]{1,2})(?:h))/gi
    const matchesTime = ([...text.matchAll(regExpTime)]);
    if (matchesTime) {
        for (const matchTime of matchesTime) {
            foundTimes.push(convertMatchToTime(matchTime));
        }
    }

    if (foundTimes.length > 0) {
        startTimeCandidate = foundTimes[0];

        if (foundTimes.length > 1) {
            endTimeCandidate = foundTimes[1];
        }
    }

    if (startDateCandidate) {
        startDateTimeCandidate = new Date(startDateCandidate.getTime());
        if (startTimeCandidate) {
            startDateTimeCandidate.setHours(startTimeCandidate.hours, startTimeCandidate.minutes);
        }
    }

    if (endDateCandidate) {
        endDateTimeCandidate = new Date(endDateCandidate.getTime());
        if (endTimeCandidate) {
            endDateTimeCandidate.setHours(endTimeCandidate.hours, endTimeCandidate.minutes);
        }
    } else if (endTimeCandidate && startDateCandidate) {
        endDateTimeCandidate = new Date(startDateCandidate.getTime());
        if (endTimeCandidate.hours < startTimeCandidate.hours) {
            endDateTimeCandidate.setDate(endDateTimeCandidate.getDate() + 1);
        }
        endDateTimeCandidate.setHours(endTimeCandidate.hours, endTimeCandidate.minutes);
    }

    if (startDateCandidate) score++;
    // if (startTimeCandidate) score++;
    if (startDateCandidate && startTimeCandidate) score++;
    if (endDateCandidate) score++;
    // if (endTimeCandidate) score++;
    if (endDateCandidate && endTimeCandidate || startDateCandidate && endTimeCandidate) score++;

    // console.log('startDateCandidate',startDateCandidate);
    // console.log('startTimeCandidate',startTimeCandidate);
    // console.log('startDateTimeCandidate',startDateTimeCandidate);
    // console.log('endDateCandidate',endDateCandidate);
    // console.log('endTimeCandidate',endTimeCandidate);
    // console.log('endDateTimeCandidate',endDateTimeCandidate);

    return {
        startDateTimeCandidate,
        endDateTimeCandidate,
        score
    }
};

export { monthTokens, parseDatesFromText };
