export default class AppError extends Error {
    constructor(message) {
        super(message)
        this.name = "AppError"
        this.statusCode = 500
    }

    getData() {
        return {
            name: this.name,
            message: this.message
        }
    }
}