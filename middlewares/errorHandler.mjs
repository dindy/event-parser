import AppError from "./exceptions/AppError.mjs"
import MissingParameter from "./exceptions/MissingParameter.mjs"
import { DatabaseError } from "sequelize"

export default async (error, req, res, next) => {

    if (error instanceof AppError) {
    
        res.status(error.statusCode).json(error.getData())            
    
    } else if (error instanceof DatabaseError) {
    
        res.status(500).json({
            name: 'DatabaseError',
            message: error.message
        })
    
    } else {

        res.status(500).json({
            name: error.name || 'UnknownError',
            message: error.message
        })
    }

    next(error)
}