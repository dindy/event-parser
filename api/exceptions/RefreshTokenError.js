import { AuthError } from "./AuthError.js"

export class RefreshTokenError extends AuthError {
    constructor(response, body) {
        super('Refreshing token has failed', response, body)
        this.name = "RefreshTokenError"
    }
}