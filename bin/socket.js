const fs = require('fs');

let statusDatabase = JSON.parse(fs.readFileSync(__dirname+'/../../.database/bin/status_database.json')),
    miscData = JSON.parse(fs.readFileSync(__dirname+'/../storage/misc.json'));

const compareObjects = (oldObject, newObject) => {
    const result = {};

    for (let property in newObject) {
        if (JSON.stringify(oldObject[property]) !== JSON.stringify(newObject[property])) result[property] = newObject[property];
    }

    return result;
}

module.exports = (app, io) => {
    console.log("Setting up IO socket...");

    /** Handle socket connections.
     */
    

    /** Emit updated data.
     */
    setInterval(() => {
        const newStatusDatabase = JSON.parse(fs.readFileSync(__dirname+'/../../.database/bin/status_database.json'));
        const statusDatabaseDiff = compareObjects(statusDatabase, newStatusDatabase);
        if (Object.keys(statusDatabaseDiff).length > 0) {
            io.emit('update status_database', statusDatabaseDiff);
            statusDatabase = newStatusDatabase;
        }

        const newMiscData = JSON.parse(fs.readFileSync(__dirname+'/../storage/misc.json'));
        const miscDataDiff = compareObjects(miscData, newMiscData);
        if (Object.keys(miscDataDiff).length > 0) {
            io.emit('update misc_data', miscDataDiff);
            miscData = newMiscData;
        }
    }, 1000);

    console.log("IO socket has been set up.");
}