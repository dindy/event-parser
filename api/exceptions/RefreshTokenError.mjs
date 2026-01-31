import { AuthError } from "./AuthError.mjs"

export class RefreshTokenError extends AuthError {
    constructor(response, body) {
        super('Refreshing token has failed', response, body)
        this.name = "RefreshTokenError"
    }
}