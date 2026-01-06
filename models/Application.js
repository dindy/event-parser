import { Sequelize, DataTypes, Model } from 'sequelize'
import { sequelize } from '../database.js'

export class Application extends Model {}

Application.init({
    domain: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    redirectUri: {
        type: DataTypes.STRING,
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

export const findByInstanceAndUri = async (domain, redirectUri) => {

    return Application.findOne({
        where: {
            domain,
            redirectUri
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
        redirectUri: appData.redirect_uri[0],
    })
}
