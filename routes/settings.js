var express = require('express');
var fs = require('fs');
var router = express.Router();
const settingsKey = JSON.parse(fs.readFileSync(__dirname+'/../storage/oauth.json')).passwords.settings;

const port = fs.readFileSync(__dirname+'/../bin/port.txt');

const getSendableData = (cookies, customData) => {
	const {session_settings, ... layout} = cookies;
	const data = JSON.parse(fs.readFileSync(__dirname+'/../storage/config.json'));

	const sendableData = {location: data.location, config_data: JSON.stringify(data), write: JSON.stringify(session_settings === settingsKey), layout: layout, port: port, baseURL: `${req.protocol}://${req.hostname}/${port}/`}
	for (let key in customData) {
		sendableData[key] = customData[key];
	}

	return sendableData;
}

/* GET home page. */
router.get('/', function(req, res, next) {
  	res.render('settings-home', getSendableData(req.cookies));
});

router.get('/grouping/:group?/:location?/:selector?', function(req, res, next) {
	const data = JSON.parse(fs.readFileSync(__dirname+'/../storage/config.json'));

	if (!req.params.group) {return res.render('settings-grouping-home', getSendableData(req.cookies));}

	const groupIndex = Number(req.params.group),
		locationIndex = Number(req.params.location),
		selectorIndex = Number(req.params.selector);

	let pageType;
	let name;

	if (data.groups[groupIndex]) {
		if (data.groups[groupIndex].locations[locationIndex]) {
			if (data.groups[groupIndex].locations[locationIndex].selectors[selectorIndex]) {
				pageType = "selector";
				name = data.groups[groupIndex].locations[locationIndex].selectors[selectorIndex];
			} else {
				pageType = "location";
				name = data.groups[groupIndex].locations[locationIndex].name;
			}
		} else {
			pageType = "group";
			name = data.groups[groupIndex].name;
		}

		res.render('settings-grouping-groups', getSendableData(req.cookies, {pageType: pageType, name: name}));
		return;
	} else {
		res.redirect("/settings/grouping");
	}
});

router.get('/downloads', function(req, res, next) {
	res.render('settings-downloads', getSendableData(req.cookies));
});

router.get('/apps/:appCode?', function(req, res, next) {
	const data = JSON.parse(fs.readFileSync(__dirname+'/../storage/config.json'));

	if (!req.params.appCode) {return res.render('settings-apps-home', getSendableData(req.cookies));}

	const appCode = req.params.appCode;

	if (!data.applications[appCode]) {
		res.render('settings-edit', getSendableData(req.cookies, {title: "404: App does not (yet) exist. (Looking for ", name: appCode, suffix: ")"}));
	} else {
		res.render('settings-edit', getSendableData(req.cookies, {title: "Update the display name of ", name: appCode, suffix: " to:", type: "app"}));
	}
});

router.get('/database/conditions/:type?', function(req, res, next) {
	const data = JSON.parse(fs.readFileSync(__dirname+'/../storage/config.json'));

	if (req.params.type === "add" && req.query.type) {
		res.render('settings-database-conditions-add', getSendableData(req.cookies, {type: req.query.type, title: `Add a ${data.urgency_conditions[req.query.type].text} condition:`}));
	} else if (!req.params.type && req.query.type && req.query.index) {
		if (req.query.type !== "misc") {
			res.render('settings-database-conditions-add', getSendableData(req.cookies, {type: req.query.type, title: `Edit ${data.urgency_conditions[req.query.type].text.split(" ")[0]} ${data.urgency_conditions[req.query.type].inputs[req.query.index].name}:`}));
		} else {
			res.render('settings-database-conditions-add', getSendableData(req.cookies, {type: req.query.type, title: `Edit ${req.query.index.split("$")[0].split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}:`, input_display: "none"}));
		}
	} else if (!req.query.type && !req.query.index) {
		next();
	} else {
		res.redirect("/settings/database/conditions");
	}
});

router.get('/database/:type', function(req, res, next) {
	const data = JSON.parse(fs.readFileSync(__dirname+'/../storage/config.json'));
	const statusDatabase = JSON.parse(fs.readFileSync(__dirname+'/../../.database/bin/status_database.json'));

	res.render('settings-database-'+req.params.type, getSendableData(req.cookies, {status_database: statusDatabase}));
});

router.get('/status/:type?/:code?/:message?', function(req, res, next) {
	const data = JSON.parse(fs.readFileSync(__dirname+'/../storage/config.json'));

	if (!req.params.type) {return res.render('settings-status-home', getSendableData(req.cookies));}

	const statusType = req.params.type,
		statusCode = req.params.code,
		messageIndex = req.params.message;

	if (statusType === "add") {
		res.render('settings-edit', getSendableData(req.cookies, {title: "Add a status type:", type: "s_type_add"}));
		next();
	} else {
		let pageType;

		if (data.status_messages[statusType]) {
			pageType = data.status_messages[statusType].codes[statusCode]
				? data.status_messages[statusType].codes[statusCode].messages[messageIndex]
					? "message"
					: "code"
				: "type";

			res.render('settings-status-types', getSendableData(req.cookies, {pageType: pageType}));
			return;
		} else {
			res.redirect("/settings/status");
		}
	}
});

module.exports = router;
