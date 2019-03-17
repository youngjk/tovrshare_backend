//======================================================
// Application Requirements
//======================================================
var swaggerTools = require('swagger-tools');
var yaml = require('yamljs');
var swaggerDocs = yaml.load('./api/swagger/swagger.yaml');
var express = require('express');
var http = require('http');
var https = require('https');
var pg = require('pg');
var bodyParser = require('body-parser');
var session = require('express-session');
var MemoryStore = require('memorystore')(session);
var app = express();
const {SESSION_SECRET} = require('./api/utils/tovrshare-constants');

app.use(bodyParser({limit: '5mb'}));
app.use(bodyParser());

//======================================================
// Application Configuration
//======================================================
app.use(express.static(__dirname + '/public'));

//Port Setup
app.set('port', (process.env.PORT || 5000));
app.listen(app.get('port'), function() {
    console.log('Node app is running on port', app.get('port'));
});

//Session Checker
app.use(session({
  store: new MemoryStore({
    checkPeriod: 86400000 // prune expired entries every 24h
  }),
  name: "tovrshare-session-cookie-id",
  secret: SESSION_SECRET,
  saveUninitialized: false,
  resave: true,
  cookie : {
    maxAge: 31 * 24 * 60 * 60 * 1000
  }
}));

//Blank Views (TODO: Remove)
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

swaggerTools.initializeMiddleware(swaggerDocs, function(middleware) {
    app.use(middleware.swaggerUi());
});

// pg.defaults.ssl = true;

//======================================================
// Controller Bindings
//======================================================
var tourController = require('./api/tours/tours');
var roomController = require('./api/rooms/rooms');
var loginController = require('./api/login/login');
var homeController = require('./api/home/home');

app.use('/api/v1/tours', tourController);
app.use('/api/v1/rooms', roomController);
app.use('/api/v1/login', loginController);
app.use('/api/v1/home', homeController);

//==========================================================================
// HOME
//==========================================================================

app.get('/', function(request, response) {
  response.render('pages/index');
});