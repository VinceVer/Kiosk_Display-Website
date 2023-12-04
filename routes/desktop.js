var express = require('express');
var fs = require('fs');
var router = express.Router();
const sqlite3 = require('sqlite3');
const desktopKey = JSON.parse(fs.readFileSync(__dirname+'/../storage/oauth.json')).passwords.desktop;
const Database = new sqlite3.Database(__dirname+'/../../.database/bin/main-database.db');

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
		res.render('login', {type: "desktop", layout: layout})
	} else {
		if (reload) {
			res.redirect('/desktop');
		} else {
			res.render('desktop-home', {
				config_data: config_data,
				status_database: status_database,
				misc_data: misc_data,
				layout: layout
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
		res.render('login', {type: "desktop"})
	} else {
		if (reload) {
			res.redirect('/desktop-layout');
		} else {
			res.render('desktop-layout', {
				config_data: config_data,
				status_database: status_database,
				layout: layout
			});
		}
	}
});

router.get('/data/:type', function(req, res, next) {
	let {session_desktop, ...layout} = req.cookies;

	const config_data = JSON.parse(fs.readFileSync(__dirname+'/../storage/config.json'));
	const status_database = JSON.parse(fs.readFileSync(__dirname+'/../../.database/bin/status_database.json'));
	const misc_data = JSON.parse(fs.readFileSync(__dirname+'/../storage/misc.json'));

	if (session_desktop !== desktopKey) {
		res.render('login', {type: "desktop"})
	} else {
		res.render('desktop-data-'+req.params.type, {
			config_data: config_data,
			status_database: status_database,
			misc_data: misc_data,
			layout: layout
		});
	}
});

router.get('/data', function(req, res, next) {
	let {session_desktop, ...layout} = req.cookies;

	const config_data = JSON.parse(fs.readFileSync(__dirname+'/../storage/config.json'));
	const status_database = JSON.parse(fs.readFileSync(__dirname+'/../../.database/bin/status_database.json'));
	const misc_data = JSON.parse(fs.readFileSync(__dirname+'/../storage/misc.json'));

	if (session_desktop !== desktopKey) {
		res.render('login', {type: "desktop"})
	} else {
		res.render('desktop-data', {
			config_data: config_data,
			status_database: status_database,
			misc_data: misc_data,
			layout: layout
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
		res.render('login', {type: "desktop", layout: layout})
	} else {
		if (reload) {
			res.redirect('/desktop/info?query='+req.query.query);
		} else {
			res.render('desktop-infographics', {
				config_data: config_data,
				status_database: status_database,
				misc_data: misc_data,
				layout: layout
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
		layout: layout
	});
});

module.exports = router;