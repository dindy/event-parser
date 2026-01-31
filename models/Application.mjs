import { Sequelize, DataTypes, Model } from 'sequelize'
import { sequelize } from '../database/database.mjs'

export class Application extends Model {}

Application.init({
    domain: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    scope: {
        type: DataTypes.STRING
    },
    clientId: {
        type: DataTypes.STRING,
    },
    clientSecret: {
        type: DataTypes.STRING,
    }    
}, {
    sequelize,
    modelName: 'Application',   
})

const query = async (sql, params) => {
    try {
        const [results, fields] = await connection.query(sql, params)
        return results
    } catch (err) {
        console.log(err)
        throw err
    }        
}

export const findByInstance = async (domain) => {

    return Application.findOne({
        where: {
            domain
        },
    })
}

export const findById = async (id) => { 
    return Application.findOne({
        where: {
            id
        },
    })
}

export const findByClientId = async (clientId) => {
    return Application.findOne({
        where: {
            clientId
        },
    })
}

export const save = async (appData) => {
    
    return await Application.create({
        ...appData,
        clientSecret: appData.client_secret,
        clientId: appData.client_id,
    })
}
