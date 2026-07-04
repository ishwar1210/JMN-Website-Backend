require('dotenv').config();
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');

var whatwedoRouter = require('./routes/whatwedo');
var whatwedodetailRouter = require('./routes/whatwedodetail');
var technologiesRouter = require('./routes/technologies');
var careerRouter = require('./routes/career');
var careerApplicationsRouter = require('./routes/career_applications');
var homeRouter = require('./routes/home');
var clientRouter = require('./routes/client');
var achievementsRouter = require('./routes/achievements');
var authRouter = require('./routes/auth');
var technologiesdetailRouter = require('./routes/technologiesdetail');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const { protect } = require('./middleware/auth');

// Global middleware to protect write operations
app.use((req, res, next) => {
  const pathUrl = req.originalUrl.split('?')[0];
  if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
    if (pathUrl === '/api/career_applications' && req.method === 'POST') {
      return next();
    }
    if (pathUrl === '/api/auth/login') {
      return next();
    }
    return protect(req, res, next);
  }
  next();
});

app.use('/api/whatwedo', whatwedoRouter);
app.use('/api/whatwedodetail', whatwedodetailRouter);
app.use('/api/technologies', technologiesRouter);
app.use('/api/technologiesdetail', technologiesdetailRouter);
app.use('/api/career', careerRouter);
app.use('/api/career_applications', careerApplicationsRouter);
app.use('/api/home', homeRouter);
app.use('/api/client', clientRouter);
app.use('/api/achievements', achievementsRouter);
app.use('/api/auth', authRouter);

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
