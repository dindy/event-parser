import { Sequelize, DataTypes, Model, where } from 'sequelize'
import { sequelize } from '../database.js'
import { Authorization } from './Authorization.js'
import { ImportedEvent } from './ImportedEvent.js'
import { AutomationLog } from './AutomationLog.js'
import { Application } from './Application.js'

export class Automation extends Model { }

Automation.init({
    authorizationId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    attributedToId: {
        type: DataTypes.INTEGER,
        allowNull: true,
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
    modelName: 'Automation',
    hooks: {
        beforeDestroy: async (automation, options) => {
            await AutomationLog.destroy({ where: { automationId: automation.id } })
            await ImportedEvent.destroy({ where: { automationId: automation.id } })
        }
    },
    sequelize,
})

Automation.belongsTo(Authorization)
Automation.hasMany(AutomationLog)
Automation.hasMany(ImportedEvent)
AutomationLog.belongsTo(Automation)
ImportedEvent.belongsTo(Automation)

export const exists = async (authorizationId, automationCriterias) => {
    
    const authorization = await Authorization.findOne({ where: { id: authorizationId } })
    
    return await Automation.findOne({
        where: {
            ...automationCriterias
        },
        include: {
            model: Authorization,
            include: {
                model: Application,
                where: {
                    id: authorization.applicationId
                }
            } 
        }
    })
}

export const save = async automationData => await Automation.create({
    ...automationData
})

export const listActive = async () => await Automation.findAll({
    where: {
        active: true
    }
}) 

export const findAuthorized = async (authorizationId, automationCriterias) => {

    const authorization = await Authorization.findOne({ where: { id: authorizationId } })
    
    return await Automation.findAll({
        where: {
            ...automationCriterias
        },
        include: [{
            model: Authorization,
            include: {
                model: Application,
                where: {
                    id: authorization.applicationId
                }
            } 
        }]
    })    
}

export const findById = async id => await Automation.findOne({
    where: {
        id
    }
})

export const destroy = async id => await Automation.destroy({
    where: {
        id
    },
    force: true,
    individualHooks: true,
})