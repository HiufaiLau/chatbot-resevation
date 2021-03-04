const createError = require('http-errors');
const express = require('express');
const path = require('path');
const logger = require('morgan');

const ReservationServce = require('./services/ReservationService');
const WitService = require('./services/WitService');
const SessionService = require('./services/SessionService');

const indexRouter = require('./routes/index');
const slackRouter = require('./routes/bots/slack');

module.exports = (config) => {
  const app = express();

  const reservationService = new ReservationServce(config.reservations);
  const witService = new WitService(config.wit.token);
  const sessionService = new SessionService();

  // view engine setup
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'ejs');

  app.use(logger('dev'));

  app.use(
    '/bots/slack',
    slackRouter({
      reservationService,
      witService,
      config,
      sessionService,
    })
  );

  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(express.static(path.join(__dirname, 'public')));

  // Don't create an error if favicon is requested
  app.use((req, res, next) => {
    if (req.originalUrl && req.originalUrl.split('/').pop() === 'favicon.ico') {
      return res.sendStatus(204);
    }
    return next();
  });

  // To test the witService, if it works, run localhost 3000 to see the result
  // app.use(async (req, res, next) => {
  //   const entities = await witService.query(
  //     'Hi I am Daniel. I would like to book a table for 2 at 7pm.'
  //   );
  //   console.log(entities);
  //   return next();
  // });

  app.use('/', indexRouter({ reservationService, config }));

  // catch 404 and forward to error handler
  app.use((req, res, next) => {
    next(createError(404));
  });

  // error handler
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
  });

  return app;
};