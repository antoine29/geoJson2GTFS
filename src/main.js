const geoJsonFileReader = require('./fileHandlers/geoJsonFileReader');
const geoJsonFileWriter = require('./fileHandlers/geoJsonFileWriter');
const fileWriter = require('./fileHandlers/fileWriter');
const geoJsonObjectValidator = require('./geoJsonObjectUtils/geoJsonObjectValidator');
const geoJsonObjectToCsv = require('./geoJsonObjectToCsv/geoJsonObjectToCsv');
const coordsArrayToDirectionsArray = require('./geoJsonFileCompleter/coordsArrayToDirectionsArray');
const fse = require('./fileHandlers/fs-extraUtils');
const filesSearcher = require('./fileHandlers/filesSearcher');

const agencyObjectGenerator = require('./gtfsEntitiesGenerators/agencyGenerator/agencyObjectGenerator');
const calendarObjectGenerator = require('./gtfsEntitiesGenerators/calendarObjectGenerator/calendarObjectGenerator');
const gtfsStopsObjectGenerator = require('./gtfsEntitiesGenerators/stopsObjectGenerator/gtfsStopsObjectGenerator');

function getLocalSettings() {
    // this will be a json file comming as parameter
    let generalSettings = {
        agencySettings: {
            agencyTimeZone: "America/Caracas" ,
            agencyUrl: "https://github.com/antoine29"
        },
        calendarSettings: [
            {
                serviceId: "AllWeek", 
                startDate: "20120101",
                endDate: "20301212",
                serviceDays: [1,1,1,1,1,1,1]
            },
            {
                serviceId: "laborDays", 
                startDate: "20120101",
                endDate: "20301212",
                serviceDays: [1,1,1,1,1,0,0]
            }
        ]
    };

    return generalSettings;
}

async function main(generalSettings) {
    
    let gtfsFolderRoute = './gtfs/';
    let calendarFileName = 'calendar.txt';
    let agencyFileName = 'agency.txt';
    
    fse.initializeEmptyFolder(gtfsFolderRoute);

    // These rows only have to be writen once time at the begining of the program
    // Writing calendar.txt and its headers
    let calendarObjectFields = calendarObjectGenerator.calendarObjectFields();
    let gtfsCalendarHeadersRow = geoJsonObjectToCsv(calendarObjectFields, true);
    fileWriter(gtfsFolderRoute+calendarFileName, gtfsCalendarHeadersRow);
    // Writing agency.txt and its headers
    let agencyObjectFields = agencyObjectGenerator.agencyObjectFields();
    let gtfsAgencyHeadersRow = geoJsonObjectToCsv(agencyObjectFields, true);
    fileWriter(gtfsFolderRoute+agencyFileName, gtfsAgencyHeadersRow);
    
    // Generating the calendar.txt rows
    let calendarObjectValues = calendarObjectGenerator.calendarObjectGenerator(generalSettings);
    let gtfsCalendarRows = geoJsonObjectToCsv(calendarObjectValues, false);
    fileWriter(gtfsFolderRoute+calendarFileName, gtfsCalendarRows);
    
    // Getting all geojson files in directory
    let geoJsonFolder = './geoJsonFiles/*.geojson' ;
    let geoJsonFiles = filesSearcher(geoJsonFolder);

    for (let fileIndex = 0; fileIndex < geoJsonFiles.length; fileIndex++) {
        
        let geoJsonFileName = geoJsonFiles[fileIndex];
        
        const input = typeof geoJsonFileName === "string" ?
            geoJsonFileReader(geoJsonFileName) : geoJsonFileName;

        if (geoJsonObjectValidator(input)) {
            // Generating an agency.txt row for each geoJson file
            let agency = agencyObjectGenerator.agencyObjectGenerator(input, generalSettings);
            let agencyCsvRow = geoJsonObjectToCsv(agency);
            fileWriter(gtfsFolderRoute+agencyFileName, agencyCsvRow);

        }
    }
    
    
    // if (geoJsonObjectValidator(input)) {
        
        // Generating an agency.txt row for each geoJson file
        // let agency = agencyObjectGenerator.agencyObjectGenerator(input, generalSettings);
        // let agencyCsvRow = geoJsonObjectToCsv(agency);
        // fileWriter('./gtfs/agency.csv', agencyCsvRow);

        // // TO DO:: generate directions array in the geoJson object/file
        // // make directions using the geoJson coords
        // // let directions = await coordsArrayToDirectionsArray(input.features[0].geometry.coordinates);
        // // let directions = [
        // //     "a1",
        // //     "a2",
        // //     "a3",
        // //     "a4",
        // //     "a5"
        // // ];
        
        // // let gtfsFields = {
        // //     directions: directions
        // // };
        
        // // adding the custom field in the original geoJson object
        // // input.gtfs = gtfsFields;
        
        // // writing (updating) the geoJson file
        // // geoJsonFileWriter(input, geoJsonFileName);
        
        
        // // Generating stops.txt rows for each geoJson file
        // let stops = gtfsStopsObjectGenerator(input);
        // let stopsRows = geoJsonObjectToCsv(stops);
        // fileWriter('./gtfs/stops.csv', stopsRows);

        // // TO DO: Generating routes.txt row for each geoJson file
        // // TO DO: Generating trips.txt row for each geoJson file
        // // TO DO: Generating frequencies.txt for each geoJson file
        // // TO DO: Generating stop_times.txt rows for each geoJson file
    // }
    // else {
    //     console.log("invalid geoJson file !!!");
    // }
}

main(getLocalSettings());
