import { findApp } from '../models/index.mjs' 

const login = async (req, res) => {
    
    if (!req.query.instance) return res.end('No instance parameter found')
    
    const instanceUrl = req.query.instance

    const app = findApp(instanceUrl)

    res.end()
}

export { login }