// Import some necessary modules
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const passport = require('passport');

// The routes files specify the URL paths that the server will respond to
var router = require('./routes/index');

var app = express();



// View engine setup (this is express's way of setting up a template engine)
// Here we are using the Jade template engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Middleware setup

// Log all requests to the console
app.use(logger('dev'));
// Parse JSON and URL encoded data into req.body
app.use(express.json());
// Parse URL encoded data into req.body
app.use(express.urlencoded({ extended: false }));
// Parse cookies into req.cookies
app.use(cookieParser());
// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));
// Enable session management
app.use(session({
  secret: 'keyboard cat',   // This is a secret key used to sign the session ID cookie
  resave: false,
  saveUninitialized: false,
  store: new SQLiteStore({ db: 'data.db', dir: './data'})
}));
app.use(passport.initialize());  // Enable authentication using passport
app.use(passport.session());

// Map the URL paths to the route files
app.use('/', router);

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
