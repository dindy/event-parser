import { requestApi } from './utils.js'
import { pass, getIdentitiesAndGroups } from '../api/mobilizon.js'

const saveEvent = async (data) => {

} 

export const queryInstance = async (req, res) => {
    
    let callback = null
    
    if (req.body && req.body.operationName) {
        switch (req.body.operationName) {
            case 'createEvent':
                callback = saveEvent
                break;
        
            default:
                break;
        }
    }
    const contentType = req.headers['content-type']
    const body = req.body
    const data = await requestApi(pass, req.user, res, contentType, body)
    
    if (callback) await callback(data)

    res.json(data)
}