import crypto from 'crypto'
import { Sequelize, DataTypes, Model } from 'sequelize'
import { sequelize } from '../database/database.mjs'
import { Application } from './Application.mjs'

export class Authorization extends Model {}

Authorization.init({
    applicationId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    mobilizonUserId: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    accessToken: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    refreshToken: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    expiresIn: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    refreshTokenExpiresIn: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    scope: {
        type: DataTypes.STRING,
        allowNull: true,
    },    
    hash: {
        type: DataTypes.STRING,
        allowNull: false,        
    }
}, {
    sequelize,
    modelName: 'Authorization',   
})

Authorization.belongsTo(Application)
Application.hasMany(Authorization)

export const findById = async (id, includeApplication = false) => {

    const options = { where: { id } }
    if (includeApplication) {
        options.include = Application
    }

    try {
        return await Authorization.findOne(options)
    } catch (error) {
        console.error(error);
        
    }
}

export const findByMbzUserId = async (mobilizonUserId, appId) => {
    return await Authorization.findOne({
        where: { mobilizonUserId },
        include: {
            model: Application,
            where: {
                id: appId
            }
        }
    })
} 

export const findByHash = async (hash) => {

    return await Authorization.findOne({
        where: { hash },
    })
}

export const createTemp = async (applicationId, authData) => {
    
    return Authorization.build({
        applicationId,
        accessToken: authData.access_token,
        refreshToken: authData.refresh_token,
        expiresIn: authData.expires_in,
        refreshTokenExpiresIn: authData.refresh_token_expires_in,
        scope: authData.scope,
        hash: generateHash(),
        createdAt: Date.now()
    })
}

export const saveMobilizonUserId = async (auth, mobilizonUserId) => {
    
    auth.mobilizonUserId = mobilizonUserId
    await auth.save()

    return auth
} 

export const refresh = async (
    auth,
    refreshToken,
    accessToken,
) => {
    
    auth.refreshToken = refreshToken
    auth.accessToken = accessToken
    await auth.save()
    
    return await findById(auth.id, true)
}

export const hasTokenExpired = (auth) => {
    
    const lastRefresh = auth.updatedAt || auth.createdAt

    return Date.now() - lastRefresh.getTime() >= auth.expiresIn * 1000
}

export const generateHash = () => {
    return crypto.randomBytes(20).toString('hex')
}