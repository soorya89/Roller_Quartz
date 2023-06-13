const db = require('./config/connection');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const logger = require('morgan');
const session = require('express-session');
const flash = require('connect-flash');
const dotenv = require('dotenv');
const multer = require('multer');
const swal=require('sweetalert2')
const Fash = require('express-flash');
const toastr = require('express-toastr')
var adminRouter = require('./routes/adminRouter');
var userRouter = require('./routes/userRouter');

var app = express();
dotenv.config();
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');



app.use(function (req, res, next) {
  res.header(
    "Cache-Control",
    "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0"
  );
  next();
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const timestamp = Date.now();
    const newFilename = `${timestamp}_${path.basename(file.originalname, ext)}${ext}`;
    cb(null, newFilename);
  },

});

app.use(
  multer({
    dest: 'uploads',
    storage: storage,
    limits: { fileSize: 1024 * 1024 }, // 1MB
  }).array('productImage',4)
);

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/node_modules', express.static('node_modules'));

//body-parser middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

//express-session middlewares
app.use(
  session({
    secret: 'keyboard cat',
    resave: 'false',
    saveUninitialized: 'false',
    cookie: { maxAge: 600000 },
  })
);

app.use(flash());
app.use(toastr())

// Router settings middlewares
app.use('/', userRouter);
app.use('/admin', adminRouter);

app.use(function (req, res, next) {
  res.locals.currentUrl = req.originalUrl;
  next();
});

// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404));

});

// error handler
app.use((req, res, next) => {
  res.locals.error = req.session.error;
  res.locals.message = req.session.message;
  delete req.session.error;
  delete req.session.message;
  next();
});
app.use(function (err, req, res, next) {
  if (err.status === 404) {
    res.status(404).render("404");
  } else {
    res.status(err.status || 500);
    res.render("error", { error: err });
  }
});

// set locals, middlewares for user section
app.use(function (req, res, next) {
  res.locals.user = req.session.user || null;
  next();
});

module.exports = app;
