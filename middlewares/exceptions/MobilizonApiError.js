import AppError from "./AppError.js"

export default class MobilizonApiError extends AppError {
    constructor(responseError) {
        super(responseError.message)
        this.name = "MobilizonApiError"
        this.mobilizonApiErrorName = responseError.name
        if (responseError.body.errors) {
            this.statusCode = 400
        } else {
            this.statusCode = responseError.response?.status || 500
        }
        this.body = responseError.body
    }

    getData() {
        return {
            ...(super.getData()),
            mobilizonApiErrorName: this.mobilizonApiErrorName,
            body: this.body
        }
    }    
}