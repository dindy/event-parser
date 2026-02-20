import { isString, isValidUrl, extractAddressParts } from "./utils.mjs"

export const extractImageUrl = value => {
    
    if (!value) return null

    if (isString(value)) return isValidUrl(value) ? value : null 
    
    if (value['url']) return isValidUrl(value['url']) ? value['url'] : null

    if (value['@id']) return isValidUrl(value['@id']) ? value['@id'] : null

    return null
}

export const extractPhysicalAddressFromLocation = value => {

    if (!value) return null

    if (value['@type']) {
        
        switch (value['@type']) {
            case 'Place':
                return extractPhysicalAddressFromPlace(value)
        
            case 'PostalAddress':
                return extractPhysicalAddressFromPostalAddress(value)
        
            default:
                break;
        }
    }

    if (value.name) {
        return { description: value.name }
    }

    return null
}

export const extractPhysicalAddressFromPlace = value => {
    
    if (!value) return null

    let physicalAddress = null

    if (value.name) {
        physicalAddress = extractAddressParts(value.name) ?? { description: value.name }
    }

    if (value.address) {
        physicalAddress = {
            ...physicalAddress ?? {},
            ...extractPhysicalAddressGeomFromObject(value) ?? {},
            ...extractPhysicalAddressFromAddress(value.address || null) ?? {}
        }
    }

    if (value.geo) {
        physicalAddress = {
            ...physicalAddress ?? {},
            ...extractPhysicalAddressGeomFromObject(value.geo)
        }
    }

    return physicalAddress
}

export const extractPhysicalAddressFromAddress = (value) => {

    if (!value) return null

    if (isString(value)) {
        return extractAddressParts(value) ?? { description: value }
    }

    if (value['@type'] && value['@type'] == 'PostalAddress') {
        return extractPhysicalAddressFromPostalAddress(value)
    }

    return null
}

export const extractPhysicalAddressFromPostalAddress = value => {
    
    if (!value) return null

    let pA = {}
    pA.locality = value.addressLocality || null
    pA.postalCode = value.postalCode || null
    pA.street = value.streetAddress || null
    pA.country = value.addressCountry || null
    if (value.description) pA.description = value.description
    if (value.extendedAddress) pA.description = value.extendedAddress

    if (pA.locality || pA.postalCode || pA.street || pA.country || pA.description) {
        return pA
    }

    return null
}

export const extractPhysicalAddressGeomFromObject = value => {

    if (!value) return null

    return (value.longitude && value.latitude) ?
        { geom: `${value.longitude};${value.latitude}` } :
        null
}