export class RequestError extends Error {
    constructor(message = null, response = null, body = null) {
        super(message || 'Mobilizon API response error')
        this.name = "RequestError"
        this.response = response
        this.body = body
    }
}