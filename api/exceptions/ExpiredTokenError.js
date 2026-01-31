import { AuthError } from "./AuthError.js"

export class ExpiredTokenError extends AuthError {
    constructor(response, body) {
        super('Token has expired', response, body)
        this.name = "ExpiredTokenError"
    }
}