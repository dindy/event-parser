import { SignJWT, jwtVerify } from 'jose'
import InvalidToken from './exceptions/InvalidToken.js';
import MissingToken from './exceptions/MissingToken.js';

export const tokenParser = async (req, res, next) => {
    
    if (!req.cookies || !req.cookies.access_token) {
        throw new MissingToken
    }
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const jwt = req.cookies.access_token
    let token = null
    try {
        token = await jwtVerify(jwt, secret)
    } catch (error) {
        throw new InvalidToken
    }
    req.user = token.payload    
    next()
}