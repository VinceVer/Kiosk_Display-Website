var express = require('express');
var fs = require('fs');
const multer = require('multer');
var router = express.Router();
const sqlite3 = require('sqlite3');
const Database = new sqlite3.Database(__dirname+'/../../.database/bin/main-database.db');
const oauthKeys = JSON.parse(fs.readFileSync(__dirname+'/../storage/oauth.json')).passwords;

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
    res.render('index');
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

router.get('/storage/:file', (req, res) => {
    if (req.params.file === "config.json" || req.params.file === "misc.json") { 
        try {
            const data = JSON.parse(fs.readFileSync(__dirname+`/../storage/${req.params.file}`));
            res.send(data);
        } catch (error) {
            res.status(404).send({code: 404, message: "file not found"});
        }
    } else {return res.render('error', {title:"Rejected", message:"Access denied by server", error: {status:403, stack:"Sensitive information."}})}
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

/* PUT config update. */
router.put('/update/:file/:type/:p1?/:p2?/:p3?/:p4?/:p5?', (req, res, next) => {
    const {file, type, ...properties} = req.params;
    const formData = req.body;

    console.log(req.cookies)

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

module.exports = router;



/* Functions. */
const checkAccess = (file, cookies) => {
    switch(file) {
        case "config.json":
            return (cookies.session_settings === oauthKeys.settings);
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
        if (typeof fileData[currentProperty] === 'object') {
            modifyObject(fileData[currentProperty], properties.slice(1), value)
        } else if (properties.length === 2) {
            fileData[currentProperty] = {}
            modifyObject(fileData[currentProperty], properties.slice(1), value)
        }
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