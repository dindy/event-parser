import ical from 'node-ical'

const parse = async (data) => { 
    return await ical.async.parseICS(data)
}

export default { parse };