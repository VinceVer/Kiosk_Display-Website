var express = require('express');
var fs = require('fs');
var router = express.Router();
const mobileKey = JSON.parse(fs.readFileSync(__dirname+'/../storage/oauth.json')).passwords.mobile;

/** GET home page. */
router.get('/:p1?/:p2?', function(req, res, next) {
	if (req.params.p1 === "grid") next();
	let {session_mobile, ...layout} = req.cookies;

	console.log(req.cookies['mobile.sites']);

	const config_data = JSON.parse(fs.readFileSync(__dirname+'/../storage/config.json'));
	const status_database = JSON.parse(fs.readFileSync(__dirname+'/../../.database/bin/status_database.json'));
	const misc_data = JSON.parse(fs.readFileSync(__dirname+'/../storage/misc.json'));

	if (session_mobile !== mobileKey) {
		res.render('login', {type: "mobile", cookies: layout});
		return;
	}

	res.render('mobile/index', {
		config_data: config_data,
		status_database: status_database,
		misc_data: misc_data,
		cookies: layout
	});
});

router.get('/grid/:p1?/:p2?', function(req, res, next) {
	let {session_mobile, ...layout} = req.cookies;

	const config_data = JSON.parse(fs.readFileSync(__dirname+'/../storage/config.json'));
	const status_database = JSON.parse(fs.readFileSync(__dirname+'/../../.database/bin/status_database.json'));
	const misc_data = JSON.parse(fs.readFileSync(__dirname+'/../storage/misc.json'));

	if (session_mobile !== mobileKey) {
		res.render('login', {type: "mobile"})
	} else {
		res.render('mobile-grid', {
			config_data: config_data,
			status_database: status_database,
			misc_data: misc_data,
			cookies: layout
		});
	}
});

module.exports = router;