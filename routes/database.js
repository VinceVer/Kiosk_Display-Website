var express = require('express');
var fs = require('fs');
var router = express.Router();
const sqlite3 = require('sqlite3');
const { ioEmitter } = require('../bin/www');
const oauthKeys = JSON.parse(fs.readFileSync(__dirname+'/../storage/oauth.json')).passwords;

router.use(express.urlencoded({ extended: true }));
router.use(express.json());

const Database = new sqlite3.Database(__dirname+'/../../.database/bin/logs.db', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (error) => {
    if (error) console.error(`An unexpected error occurred. The database will not be used. ${error.message}`);
});

const queries = {
    CREATE_TABLE: `CREATE TABLE IF NOT EXISTS data_updates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            time INTEGER NOT NULL,
            name TEXT NOT NULL,
            property TEXT NOT NULL,
            old,
            new,
            note TEXT
        )`
}

Database.run(queries.CREATE_TABLE, (error) => {
    if (error) console.error(`An unexpected error occurred. ${error.message}`);
});



/** Creates the necessary io connections.
 * @param io - io socket.
 */
const setupIoConnections = (io) => {
    io.on('connection', socket => {
        console.log(`A user has connected with socket id ${socket.id}`);

        const statusDatabase = JSON.parse(fs.readFileSync(__dirname+'/../../.database/bin/status_database.json'));
        const miscData = JSON.parse(fs.readFileSync(__dirname+'/../storage/misc.json'));
        socket.emit('update status_database', statusDatabase);
        socket.emit('update misc_data', miscData);


        socket.on('disconnect', () => {
            console.log(`The user with socket id ${socket.id} has disconnected.`);
        });
    });
}
ioEmitter.on('io_ready', setupIoConnections);



/** Safely shuts down the database.
 */
process.on('SIGINT', () => {
    Database.close((err) => {
        if (err) {
            console.error('Error closing the database:', err.message);
        } else {
            console.log('Database closed.');
            process.exit(0);
        }
    });
});

module.exports = router;