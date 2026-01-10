import { Sequelize, DataTypes, Model } from 'sequelize'
import { sequelize } from '../database.js'
import { Authorization } from './Authorization.js'
import { ImportedEvent } from './ImportedEvent.js'
import { AutomationLog } from './AutomationLog.js'

export class Automation extends Model { }

Automation.init({
    authorizationId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    attributedToId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    organizerActorId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    url: {
        type: DataTypes.STRING,
        allowNull: false,        
    },
    type: {
        type: DataTypes.STRING,
        allowNull: false,        
    },    
    active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    },    
}, {
    sequelize,
    modelName: 'Automation',   
})

Automation.belongsTo(Authorization)
Automation.hasMany(AutomationLog)
Automation.hasMany(ImportedEvent)

export const exists = async automation => await Automation.findOne({
    where: {
        ...automation
    },
})

export const save = async automation => await Automation.create({
    ...automation
})

export const listActive = async () => await Automation.findAll({
    where: {
        active: true
    }
}) 

export const findByAuthId = async authorizationId => await Automation.findAll({
    where: {
        authorizationId
    }
}) 

export const findById = async id => await Automation.findOne({
    where: {
        id
    }
})