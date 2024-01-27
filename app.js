var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require("cors");
var fs = require('fs');

var indexRouter = require('./routes/index');
var settingsRouter = require("./routes/settings");
var desktopRouter = require("./routes/desktop");
var mobileRouter = require("./routes/mobile");

var app = express();

// file verification to avoid errors
(function verifyFiles() {
  fs.readFile(__dirname+'/storage/misc.json', 'utf-8', (err, data) => {
    if (err) {
      console.error('Error reading misc.json: ',err);
      return;
    }
    try {
      const jsonData = JSON.parse(data);
      if (!jsonData.standby) {
        jsonData.standby = {
          name: "Example",
          phone: 0
        }
        fs.writeFileSync(__dirname+'/storage/misc.json', JSON.stringify(jsonData, null, "\t"));
      }
    } catch (parseError) {
      console.error('Error parsing misc.json: ', parseError);
    }
  })
})();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/settings', settingsRouter);
app.use('/desktop', desktopRouter);
app.use('/mobile', mobileRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
