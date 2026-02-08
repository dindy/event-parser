export default class Event {

    title = null
    description = null
    beginsOn = null
    endsOn = null
    onlineAddress = null
    status = null    
    tags = []
    physicalAddress = {
        description: null,
        street: null,
        locality: null,
        postalCode: null,
        country: null,
        geom: null,        
    }
    metadata = []
    draft = false
    options = {
        showStartTime: true,
        showEndTime: true       
    }
    uid = null
    picture = null
    // organizer = null

    
}