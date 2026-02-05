export const getEventModel = () => ({
    title: null,
    startTimestamp: null,
    endTimestamp: null,
    description: null,
    place: null,
    ticketsUrl: null,
    address: null,
    hosts: [],
    url: null,
    online: null,
    physicalAddress: {
        description: null,
        geom: null,
        locality: null,
        postalCode: null,
        street: null,
        country: null,
    },
    og: []
})

export const getGroupModel = () => ({
    logos: [],
    banners: [],
    name: null,
    url: null,
    description: null,
    physicalAddress: null
})