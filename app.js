var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var sassMiddleware = require('node-sass-middleware');
var socket_io = require('socket.io');

// var indexRouter = require('./routes/index-route');
// var roomRouter = require('./routes/room-route');

var app = express();

var io = socket_io();
app.io = io;

// express-session setup
var session = require('express-session')({
  secret: 'some secret here',
  resave: false,
  saveUninitialized: true
});
var sharedsession = require('express-socket.io-session');

app.use(session);

io.use(sharedsession(session)); 

var indexRouter = require('./routes/index-route.js')(app, io);
var roomRouter = require('./routes/room-route')(app, io);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(sassMiddleware({
  src: path.join(__dirname, 'public'),
  dest: path.join(__dirname, 'public'),
  indentedSyntax: false, // true = .sass and false = .scss
  sourceMap: true
}));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/room', roomRouter);

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
