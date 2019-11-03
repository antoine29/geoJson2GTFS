const nodeGeocoderClient = require('./reverseGeoCodeClients/node-geocoder-client');
const geoCodeXyzClient = require('./reverseGeoCodeClients/geocodexyz-client');
const objectFieldsFilter = require('../geoJsonObjectUtils/objectFieldsFilter');
const settingsHandler = require('../settingsHandler/settingsHandler');
const colorprint = require("colorprint");

function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getAddressFromResponse(obj, fields) {
    let receivedAddresses = objectFieldsFilter(obj, fields);
    if (receivedAddresses.length === 0 ) return 'S/N';
    if (receivedAddresses[0] === undefined) return 'S/N';
    return receivedAddresses[0];
}

module.exports = async function coordsArrayToDirectionsArray(coords) {
    let totalSize = coords.length;
    let direction;
    let directions = [];
    let coord, lati, long;
    let response;

    if (!settingsHandler.getSettings().geocoderOptions) {
        colorprint.error('Geocoder options have not been declared in settings file. S/N addresses will be used \n');
    }

    for (let index=0; index<coords.length; index++) {

        coord = coords[index];
        long = coord[0];
        lati = coord[1];

        try {
            if (settingsHandler.getSettings().geocoderOptions) {
                // response = await geoCodeXyzClient(lati, long);
                response = await nodeGeocoderClient(lati, long);
                direction = getAddressFromResponse(
                    response, 
                    [
                        'addr-street', 'staddress', // geocode.xyz endpoint fields
                        'streetName',               // geocoder npm fields
                        'neighbourhood', 'road'     // locationIQ endpoint fields
                    ]
                );
            }
            else {
                direction = 'S/N';
            }
        }
        catch(error){
            direction = 'S/N';
        }
        finally {
            directions.push(direction);
            colorprint.info(`${direction}: ${index+1}/${totalSize} coords processed`);
            await timeout(700); // we have to wait at least one second to make the next req
        }
    }

    return directions;
}
