var express = require('express');
const Excel = require('exceljs');
var fs = require('fs');
const multer = require('multer');
var router = express.Router();
const sqlite3 = require('sqlite3');
const {sendEmail, submitReport} = require('./mail.js');
const Database = new sqlite3.Database(__dirname+'/../../.database/bin/main-database.db');
const oauthKeys = JSON.parse(fs.readFileSync(__dirname+'/../storage/oauth.json')).passwords;
const websiteVersion = JSON.parse(fs.readFileSync(__dirname+'/../package.json')).version;

const port = fs.readFileSync(__dirname+'/../bin/port.txt');

const urgency_icons = {
    _1: "🟢",
    null: "❔",
    0: "🔵",
    1: "🟡",
    2: "🟣",
    3: "🟠",
    4: "🔴",
    5: "⚠️",
    12: "🟣",
    42: "🔴"
}

const customStorage = (destination) => {
    return multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, destination);
        },
        filename: (req, file, cb) => {
            const file_name = `${file.originalname}`;
            cb(null, file_name);
        }
    });
}
const fileImages = multer({storage: customStorage(__dirname+'/../public/images')});

router.use(express.urlencoded({ extended: true }));
router.use(express.json());

/* GET home page. */
router.get('/', (req, res, next) => {
    res.render('index', {
        version: websiteVersion,
        port: port,
        baseURL: `${req.protocol}://${req.hostname}:${port}/`
    });
});

/* GET home page. */
router.get('/changelog', (req, res, next) => {
    res.render('changelog', {
        version: websiteVersion,
        port: port,
        baseURL: `${req.protocol}://${req.hostname}:${port}/`
    });
});

router.get('/status-database', (req, res) => {
    const data = JSON.parse(fs.readFileSync(__dirname+`/../../.database/bin/status_database.json`));
    res.send(data);
});

router.get('/database', (req, res, next) => {
    const startTime = new Date();
    const queryData = req.query.query.replaceAll("%20"," ");

    try {
        Database.all(queryData, (err, rows) => {
            if (err) {
                console.error('Error querying the database:', err.message);
            } else {
                res.status(200).send({data: rows, time: (new Date() - startTime) / 1000})
            }
        });
    } catch (error) {
        console.log(error);
    }
});

router.post('/data/reports', (req, res) => {
    generateReport(req.body, res);
});

router.get('/storage/:file', (req, res) => {
    if (req.params.file === "config.json" || req.params.file === "misc.json") { 
        try {
            const data = JSON.parse(fs.readFileSync(__dirname+`/../storage/${req.params.file}`));
            res.send(data);
        } catch (error) {
            res.status(404).send({code: 404, message: "file not found"});
        }
    } else {return res.render('error', {title:"Rejected", message:"Access denied by server", error: {status:403, stack:"Possibly sensitive information."}})}
});

router.get('/download/:type/:file', (req, res) => {
    if (req.params.type === "report") {
        const filePath = __dirname+'/../storage/reports/'+req.params.file;

        res.download(filePath, req.params.file, (err) => {
            if (err) {
                console.error('Error downloading file:', err);
                res.status(404).send('File not found');
            } else {
                console.log('File sent successfully');
            }
        });
    }
});

router.get('/file/:name', (req, res) => {
    try {
        if (req.query.action === "size") {
            switch (req.params.name) {
                case "config.json":
                case "misc.json":
                    res.status(200).send({size: fs.statSync(__dirname+`/../storage/${req.params.name}`).size});
                    break;
                case "status_database.json":
                case "main-database.db":
                    res.status(200).send({size: fs.statSync(__dirname+`/../../.database/bin/${req.params.name}`).size});
                    break;
                default:
                    res.status(400);
                    break
            }
        } else if (req.query.action === "download") {
            switch (req.params.name) {
                case "config.json":
                case "misc.json":
                    res.download(__dirname+`/../storage/${req.params.name}`, req.params.name, (err) => {
                        if (err) {
                            console.error('Error downloading file:', err);
                            res.status(404).send('File not found');
                        } else {
                            console.log('File sent successfully');
                        }
                    });
                    break;
                case "status_database.json":
                case "main-database.db":
                    res.download(__dirname+`/../../.database/bin/${req.params.name}`, req.params.name, (err) => {
                        if (err) {
                            console.error('Error downloading file:', err);
                            res.status(404).send('File not found');
                        } else {
                            console.log('File sent successfully');
                        }
                    });
                    break;
                default:
                    res.status(400);
                    break;
            }
        }
    } catch (error) {
        res.status(500);
    }
});

/* GET fileData. */
router.get('/fileData', (req, res, next) => {
    const key = req.query.key, type = req.query.type;
    console.log(`/fileData: GET "${type}" with key "${key}"`);
    if (type === "oauth") {return res.render('error', {title:"Rejected", message:"Access denied by server", error: {status:403, stack:"Sensitive information."}})}
    if (!key) {return res.render('error', {title:"Rejected", message:"Access denied by server", error: {status:400, stack:"Client sent an empty or unreadable key"}})};

    let data, oathKey;
    try {
        data = JSON.parse(fs.readFileSync(__dirname+`/../storage/${type}.json`));
        oathKey = JSON.parse(fs.readFileSync(__dirname+'/../storage/oauth.json')).key;
    } catch (error) {
        return res.render('error', {title:"Server Error", message:"Server Error", error: {status:500, stack:`Unable to read {__dirname/../storage/${type}.json}`}})
    }

    if (key === oathKey) {return res.send(JSON.stringify({data: data, write: true}))};

    res.send(JSON.stringify({data: data, write: false}));
});

/* GET personal access token */
router.get('/repo', (req, res, next) => {
    try {
        const data = fs.readFileSync(__dirname+'/../storage/repo', 'utf-8');
        res.status(200).send(JSON.stringify({error: false, url: data.split("\n")[0]}));
    } catch (error) {
        res.status(500).send(JSON.stringify({error: true, token: error}));
    }
});

/* PUT config update. */
router.put('/update/:file/:type/:p1?/:p2?/:p3?/:p4?/:p5?', (req, res, next) => {
    const {file, type, ...properties} = req.params;
    const formData = req.body;

    if (checkAccess(file, req.cookies)) {
        let propertiesArray = [type];
        for (let query in properties) {
            if (properties[query] === undefined) break;
            propertiesArray.push(properties[query]);
        }

        let fileData;
        try {
            fileData = JSON.parse(fs.readFileSync(__dirname+`/../storage/${file}`));
        } catch (error) {
            return res.render('error', {title:"Server Error", message:"Server Error", error: {status:500, stack:`Unable to read {__dirname/../storage/${file}.json}`}})
        }

        if (formData.value && Object.keys(formData).length === 1) {
            modifyObject(fileData, propertiesArray, formData.value);
        } else {
            for (let key in formData) {
                const propertiesArraySUB = propertiesArray.slice();
                propertiesArraySUB.push(key);
                modifyObject(fileData, propertiesArraySUB, formData[key]);
            }
        }
        
        fs.writeFileSync(__dirname+`/../storage/${file}`, JSON.stringify(fileData, null, "\t"));
        res.status(200).send({message: "success"});
    } else {
        return res.status(403).send({message:"Access denied by server", error: {status:403, stack:"Client sent an unknown or invalid key"}});
    }
});

/* DELETE config update. */
router.delete('/:file/:type/:p1?/:p2?/:p3?/:p4?/:p5?', (req, res, next) => {
    const {file, type, ...properties} = req.params;

    if (checkAccess(file, req.cookies)) {
        let propertiesArray = [type];
        for (let query in properties) {
            if (properties[query] === undefined) break;
            propertiesArray.push(isNaN(Number(properties[query])) ? properties[query] : Number(properties[query]));
        }

        let fileData;
        try {
            fileData = JSON.parse(fs.readFileSync(__dirname+`/../storage/${file}`));
        } catch (error) {
            return res.render('error', {title:"Server Error", message:"Server Error", error: {status:500, stack:`Unable to read {__dirname/../storage/${file}.json}`}});
        }

        deleteObject(fileData, propertiesArray);

        fs.writeFileSync(__dirname+`/../storage/${file}`, JSON.stringify(fileData, null, "\t"));
        res.status(200).send({message: "success"});
    } else {
        return res.status(403).send({message:"Access denied by server", error: {status:403, stack:"Client sent an unknown or invalid session-id"}});
    }
});

/* POST files (images). */
router.post('/imageUpload', fileImages.single('file'), (req, res) => {
    if (!req.file) {return res.status(400).json({ message: 'No file uploaded' });}
    return res.status(200).json({ message: 'File uploaded successfully' });
});

/* POST login. */
router.post('/login/:type', (req, res) => {
    if (!req.cookies.UUID) {
        res.cookie(`UUID`, generateUniqueIdentifier(), {path:'/', maxAge: 2147483647});
    }

    const type = req.params.type;
    const key = req.body.key;
    let oauth = JSON.parse(fs.readFileSync(__dirname+'/../storage/oauth.json'));

    try {
        if (key === oauth.passwords[type]) {
            res.cookie(`session_${type}`, key, { path:'/', maxAge: 2147483647, httpOnly: true });
            res.status(403).json({access: true});
        } else {
            res.status(403).json({access: false});
        }
    } catch(err){console.log(err)}
    
    oauth = null;
});

/* GET logout. */
router.get('/logout/:type', (req, res) => {
    const type = req.params.type;
    res.cookie(`session_${type}`, "", { path:'/', maxAge: 0, httpOnly: true });
    res.status(200).json({access: false});
});

/* PUT hub-connection. */
router.put('/hub-connection', (req, res) => {
    try {
        fs.writeFileSync(__dirname+`/../storage/hub-connection.txt`, req.body.ip);
        res.status(200).send({location: JSON.parse(fs.readFileSync(__dirname+`/../storage/config.json`)).location, data: JSON.parse(fs.readFileSync(__dirname+`/../storage/misc.json`))})
    } catch (error) {
        res.status(500).send({message:"Error", error: {status:500, stack: error}})
    }
});

router.post('/issue/submit', (req, res) => {
    try {
        success = submitReport(req.body.text);
        res.status(201).send({success: success});
    } catch(error) {
        res.status(500).send({success: false});
    }
});

module.exports = router;



/* Functions. */
const checkAccess = (file, cookies) => {
    switch(file) {
        case "config.json":
            return (cookies.session_settings === oauthKeys.settings);
            break;
        case "schedules.json":
            return (cookies.session_desktop === oauthKeys.desktop);
            break;
        case "misc.json":
            return (cookies.session_desktop === oauthKeys.desktop);
            break;
        case "queue.json":
            return (cookies.session_desktop === oauthKeys.desktop || cookies.session_mobile === oauthKeys.mobile);
            break;
        default:
            return false;
    }
}

const modifyObject = (fileData, properties, value) => {
    if (properties.length === 1) {
        fileData[properties[0]] = value;

    } else {
        const currentProperty = properties[0];
        if (typeof fileData[currentProperty] !== 'object' || fileData[currentProperty] === null) {
            fileData[currentProperty] = {};
        }
        modifyObject(fileData[currentProperty], properties.slice(1), value)
    }
}

const deleteObject = (fileData, properties) => {
    if (properties.length === 1) {
        if (Array.isArray(fileData)) {
            fileData.splice(properties[0], 1)
        } else {
            delete fileData[properties[0]];
        }
    } else {
        const currentProperty = properties[0];
        if (typeof fileData[currentProperty] === 'object') {
            console.log(properties[0])
            deleteObject(fileData[currentProperty], properties.slice(1))
        }
    }
}

const generateReport = (settings, res) => {
    const config_data = JSON.parse(fs.readFileSync(__dirname+'/../storage/config.json'));

    function stringToUnix(string) {
        const [year, month, day] = string.split('-').map(Number);
        return Math.floor((new Date(year, month - 1, day)).getTime() / 1000);
    }

    const start_timecode = stringToUnix(settings.time_start);
    const end_timecode = stringToUnix(settings.time_end) + 86400;

    console.log(`Generating report from ${start_timecode} to ${end_timecode}`);

    const queryData = `SELECT * FROM devicetimeline WHERE time BETWEEN ${start_timecode} AND ${end_timecode} AND status_message LIKE "%[Manually Set]" ORDER BY time, kiosk_name ASC`;

    /* Functions. */
    function parseToCSV(rows) {
        let outputString = "Time, Kiosk Name, Device Type, From Status, To Status\n";
        for (let row of rows) {
            outputString += `${row.last_seen.replace("T"," ")}, ${row.kiosk_name}, ${row.type}, ${urgency_icons[String(row.from_urgency_level).replace("-","_")]}, ${urgency_icons[String(row.to_urgency_level).replace("-","_")]}\n`;
        }
        return outputString || `[${new Date().toISOString()}]\nAn unexpected error occured during the generation of this report.`;
    }

    function parseToJSON(rows) {
        let outputObject = [];
        for (let row of rows) {
            outputObject.push({
                time: row.last_seen.replace("T"," "),
                kiosk: row.kiosk_name,
                device_type: row.type,
                device_name: row.device_name,
                from_urgency_level: urgency_icons[String(row.from_urgency_level).replace("-","_")],
                to_urgency_level: urgency_icons[String(row.to_urgency_level).replace("-","_")]
            });
        }
        return JSON.stringify(outputObject, null, "\t") || `[${new Date().toISOString()}]\nAn unexpected error occured during the generation of this report.`;
    }

    function parseToMD(rows) {
        let outputString = `# ${config_data.location} Report Generator\n**[Generated at ${(new Date()).toISOString().slice(0, 19).replace("T"," ")}]**\n\nThis report contains data from ${settings.time_start} to ${settings.time_end}\nThe data in this report only includes manual changes.\n\n**Data:**\n`;
        outputString += "| Time | Kiosk Name | Device Type | From Status | To Status |\n"
        outputString += "| ----- | ----- | ----- | ----- | ----- |\n"
        const data = [];

        for (let row of rows) {
            outputString += `| ${[
                row.last_seen.replace("T"," "),
                row.kiosk_name,
                row.type,
                urgency_icons[String(row.from_urgency_level).replace("-","_")],
                urgency_icons[String(row.to_urgency_level).replace("-","_")]
            ].join(" | ")} |\n`;
        }

        return outputString || `[${new Date().toISOString()}]\nAn unexpected error occured during the generation of this report.`;
    }

    function parseToTXT(rows) {
        let outputString = `-------------------- ${config_data.location} Report Generator --------------------\n[Generated at ${(new Date()).toISOString().slice(0, 19).replace("T"," ")}]\n\nThis report contains data from ${settings.time_start} to ${settings.time_end}\nThe data in this report only includes manual changes.\n\n---------------------${"-".repeat(config_data.location.length)}--------------------------------------\n`;

        for (let row of rows) {
            outputString += `[${row.last_seen.replace("T"," ")}]: ${row.device_name} has been set to online. (${urgency_icons[String(row.from_urgency_level).replace("-","_")]} -> ${urgency_icons[String(row.to_urgency_level).replace("-","_")]})\n`;
        }

        outputString += `---------------------${"-".repeat(config_data.location.length)}--------------------------------------`;
        return outputString || `[${new Date().toISOString()}]\nAn unexpected error occured during the generation of this report.`;
    }

    async function parseToXLSX(rows) {
        const workbook = new Excel.Workbook();
        const worksheet = workbook.addWorksheet('Report Data');

        // Define your data
        const data = [["Time", "Kiosk Name", "Device Type", "From Status", "To Status"]];
        for (let row of rows) {
            data.push([
                row.last_seen.replace("T"," "),
                row.kiosk_name,
                row.type,
                urgency_icons[String(row.from_urgency_level).replace("-","_")],
                urgency_icons[String(row.to_urgency_level).replace("-","_")]
            ]);
        }

        // Add data to the worksheet
        data.forEach(row => {
            worksheet.addRow(row);
        });

        // Save the workbook
        return await workbook.xlsx.writeBuffer()
    }
    /* ---------- */
    


    try {
        Database.all(queryData, async (err, rows) => {
            if (err) {
                console.error('Error querying the database:', err.message);
            } else {
                let output;
                console.log(settings.format)
                switch (settings.format) {
                    case ".csv":
                        output = parseToCSV(rows);
                        break;
                    case ".json":
                        output = parseToJSON(rows);
                        break;
                    case ".md":
                        output = parseToMD(rows);
                        break;
                    case ".txt":
                        output = parseToTXT(rows);
                        break;
                    case ".xlsx":
                        output = await parseToXLSX(rows);
                        console.log(output)
                        break;
                }

                fs.writeFileSync(__dirname+`/../storage/reports/${settings.name.replace(/[<>:"/\\|?*\x00-\x1F]/g, " ")}${settings.format}`, output);
                if (settings.email_output === "on") {
                    mail.sendEmail(settings.email_recipient, settings.name.replace(/[<>:"/\\|?*\x00-\x1F]/g, " "), parseToTXT(rows), __dirname+`/../storage/reports/${settings.name}${settings.format}`, settings.format);
                }
                
                if (res) {
                    res.status(201).send({name: settings.name.replace(/[<>:"/\\|?*\x00-\x1F]/g, " "), extension: settings.format, recipients: settings.email_recipient.split(",")});
                }
            }
        });
    } catch (error) {
        console.log(error);
    }
}

const generateUniqueIdentifier = () => {
    // Generate a random number and convert it to a string
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
}



/* Shut down. */
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
/* ---------- */