import { Sequelize, DataTypes, Model } from 'sequelize'
import { sequelize } from '../database/database.mjs'

export class ImportedEvent extends Model { }

ImportedEvent.init({
    automationId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    uid: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    mbzUid: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    mbzId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    hash: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false,        
    }
}, {
    sequelize,
    modelName: 'ImportedEvent',
})    

export const alreadyExists = async (automationId, uid) => await ImportedEvent.findOne({
    where: { automationId, uid }
})

export const create = async (data) => ImportedEvent.create({ ...data })

export const update = async (event, data) => await (event.set({ ...data })).save() 