import ical from 'node-ical'

export const scrap = async url =>
{
    const abortCtrl = new AbortController()
    setTimeout(() => abortCtrl.abort(), 15_000)

    return await ical.async.fromURL(url, { signal: abortCtrl.signal })
}        