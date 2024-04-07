var express = require('express');
var fs = require('fs');
var router = express.Router();
const mobileKey = JSON.parse(fs.readFileSync(__dirname+'/../storage/oauth.json')).passwords.mobile;

const port = fs.readFileSync(__dirname+'/../bin/port.txt');

/* GET home page. */
router.get('/:p1?/:p2?', function(req, res, next) {
	if (req.params.p1 === "grid") next();
	let {session_mobile, ...layout} = req.cookies;

	const config_data = JSON.parse(fs.readFileSync(__dirname+'/../storage/config.json'));
	const status_database = JSON.parse(fs.readFileSync(__dirname+'/../../.database/bin/status_database.json'));
	const misc_data = JSON.parse(fs.readFileSync(__dirname+'/../storage/misc.json'));

	for (let property in config_data.layout) {
		if (layout[property] === undefined) {
			res.cookie(property, config_data.layout[property], { path:'/', maxAge: 2147483647, httpOnly: false });
			reload = true;
		}
	}

	if (session_mobile !== mobileKey) {
		res.render('login', {type: "mobile", layout: layout, port: port, baseURL: `${req.protocol}://${req.hostname}/${port}/`})
	} else {
		res.render('mobile-list', {
			config_data: config_data,
			status_database: status_database,
			misc_data: misc_data,
			layout: layout,
			hub_adress: fs.readFileSync(__dirname+'/../storage/hub-connection.txt', 'utf8'),
			baseURL: `${req.protocol}://${req.hostname}/${port}/`,
			port: port
		});
	}
});

router.get('/grid/:p1?/:p2?', function(req, res, next) {
	let {session_mobile, ...layout} = req.cookies;

	const config_data = JSON.parse(fs.readFileSync(__dirname+'/../storage/config.json'));
	const status_database = JSON.parse(fs.readFileSync(__dirname+'/../../.database/bin/status_database.json'));
	const misc_data = JSON.parse(fs.readFileSync(__dirname+'/../storage/misc.json'));

	if (session_mobile !== mobileKey) {
		res.render('login', {type: "mobile", port: port, baseURL: `${req.protocol}://${req.hostname}/${port}/`})
	} else {
		res.render('mobile-grid', {
			config_data: config_data,
			status_database: status_database,
			misc_data: misc_data,
			layout: layout,
			baseURL: `${req.protocol}://${req.hostname}/${port}/`,
			port: port
		});
	}
});

module.exports = router;