//basic express module import
var express = require('express');
var http = require('http');
var path = require('path');
//express midleware module import
var bodyparser = require('body-parser');
var cookieParser = require('cookie-parser');
var static = require('serve-static');
var errorHandler = require('errorhandler');
//errorhandler midleware import
var expressErrorHandler = require('express-error-handler');
//session midleware import
var expressSession = require('express-session');
var main_config = require('./main_config');
var main_user = require('./main_user');
var main_route = require('./main_route');
//file io midleware import
var multer = require('multer');
var fs = require('fs');
//module import for using mysql
var mysql = require('mysql');
var pool = mysql.createPool({
    connectionLimit : main_config.connectionLimit,
    host : main_config.host,
    user : main_config.user,
    password : main_config.password,
    database : main_config.database,
    debug : main_config.debug
})
// declear express object as app
var app = express();
//multiple server connection midleware, called cors, import
var cors = require('cors');

//set port env, or 3000
app.set('port', process.env.PORT || main_config.server_port); 
//set body-parser as middleware
app.use(bodyparser.urlencoded({extended:false}));
app.use(bodyparser.json());
// path set using path function(var path) main for html, uploads for file io
app.use('/main', static(path.join(__dirname, 'main')));
app.set('main_views', __dirname + '/main_views');
app.set('view engine', 'ejs');
console.log('view engine set as ejs format');
app.use(main_config.photosavepath, static(path.join(__dirname, main_config.photosavepoint)));
//set cookieparser as middleware
app.use(cookieParser());
//set expressSession as middleware, it contained information from session object
app.use(expressSession({
    secret: 'my key',
    resave: true,
    saveUninitialized: true
}));
//set cors as middleware
app.use(cors());

//define storage function as middleware that have dependency on multer module
var storage = multer.diskStorage({
    destination: function(req, file, callback)
    {
        callback(null, 'uploads')
    },
    filename: function(req, file, callback)
    {
        callback(null, file.originalname)
    }
});

//define upload function as middleware that have dependency on multer module
var upload = multer({
    storage: storage,
    limits: {
        files: main_config.files,
        fileSize: main_config.fileSize
    }
});

// router decleared
var router = express.Router();

//main_route.init(app, express.Router(),upload);


// when requesting process/login route, respond log and got ID/Password
router.route('/process/login').post(main_user.login);

// when requesting process/logout route, respond log and got ID/Password
router.route('/process/logout').get(main_user.logout);

// when requesting process/login route, respond log and got ID/Password
router.route('/process/signup').post(upload.array('photo',1), main_user.signup);

// use router as middleware, that could route path given '/'
app.use('/', router);


// error handling function, module importing, use it as middleware when httperror 404 happened, outprint 404.html
var errorHandler = expressErrorHandler({
    static:
    {
        '404': './main/404.html'
    }
});
app.use(expressErrorHandler.httpError(404));
app.use(errorHandler);

//signal handler => close express server when process terminated

//확인되지 않은 예외 처리 - 서버 프로세스 종료하지 않고 유지함
process.on('uncaughtException', function (err) {
	console.log('uncaughtException Occuered : ' + err);
	console.log(err.stack);
});


// server function, ues app struct 'port' num(if would be contain env port or 3000)
http.createServer(app).listen(app.get('port'), function(){
   console.log('express web server port : '+ app.get('port'));
});