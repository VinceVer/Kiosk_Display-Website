var express = require('express');
var fs = require('fs');
var router = express.Router();
const sqlite3 = require('sqlite3');
const desktopKey = JSON.parse(fs.readFileSync(__dirname+'/../storage/oauth.json')).passwords.desktop;
const Database = new sqlite3.Database(__dirname+'/../../.database/bin/main-database.db');
const path = require('path');

const port = fs.readFileSync(__dirname+'/../bin/suffix.txt');

/* GET home page. */
router.get('/:p1?/:p2?', function(req, res, next) {
	if (req.params.p1 && req.params.p1 !== "k" && req.params.p1 !== "g") {
		next()
		return;
	}

	let {session_desktop, ...layout} = req.cookies;
	let reload;

	const config_data = JSON.parse(fs.readFileSync(__dirname+'/../storage/config.json'));
	const status_database = JSON.parse(fs.readFileSync(__dirname+'/../../.database/bin/status_database.json'));
	const misc_data = JSON.parse(fs.readFileSync(__dirname+'/../storage/misc.json'));

	for (let property in config_data.layout) {
		if (layout[property] === undefined) {
			res.cookie(property, config_data.layout[property], { path:'/', maxAge: 2147483647, httpOnly: false });
			reload = true;
		}
	}

	if (session_desktop !== desktopKey) {
		res.render('login', {type: "desktop", layout: layout, port: port, baseURL: `${req.protocol}://${req.hostname}/${port}/`})
	} else {
		if (reload) {
			res.redirect('/desktop');
		} else {
			res.render('desktop-home', {
				config_data: config_data,
				status_database: status_database,
				misc_data: misc_data,
				layout: layout,
				baseURL: `${req.protocol}://${req.hostname}/${port}/`,
				port: port
			});
		}
	}
});

router.get('/layout', function(req, res, next) {
	let {session_desktop, ...layout} = req.cookies;
	let reload;

	const config_data = JSON.parse(fs.readFileSync(__dirname+'/../storage/config.json'));
	const status_database = JSON.parse(fs.readFileSync(__dirname+'/../../.database/bin/status_database.json'));

	for (let property in config_data.layout) {
		if (layout[property] === undefined) {
			res.cookie(property, config_data.layout[property], { path:'/', maxAge: 2147483647, httpOnly: false });
			reload = true;
		}
	}

	if (session_desktop !== desktopKey) {
		res.render('login', {type: "desktop", port: port, baseURL: `${req.protocol}://${req.hostname}/${port}/`});
	} else {
		if (reload) {
			res.redirect('/desktop-layout');
		} else {
			res.render('desktop-layout', {
				config_data: config_data,
				status_database: status_database,
				layout: layout,
				baseURL: `${req.protocol}://${req.hostname}/${port}/`,
				port: port
			});
		}
	}
});

router.get('/data/:type', async function(req, res, next) {
	let {session_desktop, ...layout} = req.cookies;
	let other;

	const config_data = JSON.parse(fs.readFileSync(__dirname+'/../storage/config.json'));
	const status_database = JSON.parse(fs.readFileSync(__dirname+'/../../.database/bin/status_database.json'));
	const misc_data = JSON.parse(fs.readFileSync(__dirname+'/../storage/misc.json'));

	if (req.params.type === "reports") {
		try {
			const files = fs.readdirSync(__dirname+'/../storage/reports')
			other = await sortFiles(files, __dirname+'/../storage/reports');
		} catch (error) {
			other = "[]";
		}
	}

	if (session_desktop !== desktopKey) {
		res.render('login', {type: "desktop", port: port, baseURL: `${req.protocol}://${req.hostname}/${port}/`});
	} else {
		res.render('desktop-data-'+req.params.type, {
			config_data: config_data,
			status_database: status_database,
			misc_data: misc_data,
			layout: layout,
			other: other,
			baseURL: `${req.protocol}://${req.hostname}/${port}/`,
			port: port
		});
	}
});

// router.get('/schedules/:type', async function(req, res, next) {
// 	let {session_desktop, ...layout} = req.cookies;
// 	let other;

// 	const config_data = JSON.parse(fs.readFileSync(__dirname+'/../storage/config.json'));
// 	const status_database = JSON.parse(fs.readFileSync(__dirname+'/../../.database/bin/status_database.json'));
// 	const schedule_data = JSON.parse(fs.readFileSync(__dirname+'/../storage/schedules.json'));

// 	if (session_desktop !== desktopKey) {
// 		res.render('login', {type: "desktop"});
// 	} else {
// 		res.render('desktop-schedules-'+req.params.type, {
// 			config_data: config_data,
// 			status_database: status_database,
// 			schedule_data: schedule_data,
// 			layout: layout,
// 			other: other
// 		});
// 	}
// });

router.get('/data', function(req, res, next) {
	let {session_desktop, ...layout} = req.cookies;

	const config_data = JSON.parse(fs.readFileSync(__dirname+'/../storage/config.json'));
	const status_database = JSON.parse(fs.readFileSync(__dirname+'/../../.database/bin/status_database.json'));
	const misc_data = JSON.parse(fs.readFileSync(__dirname+'/../storage/misc.json'));

	if (session_desktop !== desktopKey) {
		res.render('login', {type: "desktop", port: port, baseURL: `${req.protocol}://${req.hostname}/${port}/`})
	} else {
		res.render('desktop-data', {
			config_data: config_data,
			status_database: status_database,
			misc_data: misc_data,
			layout: layout,
			baseURL: `${req.protocol}://${req.hostname}/${port}/`,
			port: port
		});
	}
});

router.get('/info', function(req, res, next) {
	let {session_desktop, ...layout} = req.cookies;
	let reload;

	const config_data = JSON.parse(fs.readFileSync(__dirname+'/../storage/config.json'));
	const status_database = JSON.parse(fs.readFileSync(__dirname+'/../../.database/bin/status_database.json'));
	const misc_data = JSON.parse(fs.readFileSync(__dirname+'/../storage/misc.json'));

	for (let property in config_data.layout) {
		if (layout[property] === undefined) {
			res.cookie(property, config_data.layout[property], { path:'/', maxAge: 2147483647, httpOnly: false });
			reload = true;
		}
	}

	if (session_desktop !== desktopKey) {
		res.render('login', {type: "desktop", layout: layout, port: port, baseURL: `${req.protocol}://${req.hostname}/${port}/`})
	} else {
		if (reload) {
			res.redirect('/desktop/info?query='+req.query.query);
		} else {
			res.render('desktop-infographics', {
				config_data: config_data,
				status_database: status_database,
				misc_data: misc_data,
				layout: layout,
				baseURL: `${req.protocol}://${req.hostname}/${port}/`,
				port: port
			});
		}
	}
});

router.get('/simple', function(req, res, next) {
	let {session_desktop, ...layout} = req.cookies;
	let reload;

	const config_data = JSON.parse(fs.readFileSync(__dirname+'/../storage/config.json'));
	const status_database = JSON.parse(fs.readFileSync(__dirname+'/../../.database/bin/status_database.json'));
	const misc_data = JSON.parse(fs.readFileSync(__dirname+'/../storage/misc.json'));

	for (let property in config_data.layout) {
		if (layout[property] === undefined) {
			res.cookie(property, config_data.layout[property], { path:'/', maxAge: 2147483647, httpOnly: false });
			reload = true;
		}
	}

	res.render('desktop-simple', {
		config_data: config_data,
		status_database: status_database,
		misc_data: misc_data,
		layout: layout,
		baseURL: `${req.protocol}://${req.hostname}/${port}/`,
		port: port
	});
});

module.exports = router;

const sortFiles = (files, folderPath) => {
	return new Promise(resolve => {
		const fileDetails = [];

		files.forEach((file) => {
			const filePath = path.join(folderPath, file);
		
			// Get file stats:
			fs.stat(filePath, (statErr, stats) => {
				if (statErr) {
					console.error('Error getting file stats:', statErr);
					return;
				}
			
				fileDetails.push({ name: file, createdAt: stats.birthtimeMs });
			
				// Check if all files have been processed
				if (fileDetails.length === files.length) {
					fileDetails.sort((a, b) => b.createdAt - a.createdAt);
			
					const sortedFiles = fileDetails.map((fileDetail) => fileDetail.name);
					resolve(sortedFiles);
				}
			});
		});
	});
}