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

//file io midleware import
var multer = require('multer');
var fs = require('fs');

//module import for using mysql
var mysql = require('mysql');

var pool = mysql.createPool({
    connectionLimit : 10,
    host : 'localhost',
    user : 'root',
    password : 'root',
    database : 'test',
    debug : false
})

// declear express object as app
var app = express();

//multiple server connection midleware, called cors, import
var cors = require('cors');

//set port env, or 3000
app.set('port', process.env.PORT || 3000); 

//set body-parser as middleware
app.use(bodyparser.urlencoded({extended:false}));
app.use(bodyparser.json());

// path set using path function(var path) public for html, uploads for file io
app.use('/public', static(path.join(__dirname, 'public')));
app.use('/uploads', static(path.join(__dirname, 'uploads')));

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
        files: 10,
        fileSize: 1024 * 1024 * 1024
    }
});

//variable for data object
var database;
//variable for schema and model object
var UserSchema;
var UserModel;

// router decleared
var router = express.Router();

/*router.route('/process/comm').get(function(req, res){
    console.log('/process/comm function called');
    res.redirect('/public/comm.html');
});
*/

// when requesting process/login route, respond log and got ID/Password
router.route('/process/login').post(function(req,res){
    console.log('/process/login router has been called');
    var paramId = req.body.id||req.query.id;
    var paramPassword = req.body.password||req.query.password;
    
    console.log('requesting parameter : ' + paramId + ', ' + paramPassword);
    if(pool){
        authUser(paramId,
                 paramPassword,
                 function(err, rows){
            if(err){
                console.log('ERROR OCCURED WHILE LOGIN');
                res.writeHead('200',{'Content-type':'text/html;charset=utf8'});
                res.write('<h1>ERROR OCCURED WHILE LOGIN PROCESS</h1>');
                res.write("<br><br><a href='/public/login.html'> back to login page </a>");
                console.dir(err);
                callback(err,null);
                return;
            }
        if (rows){
            console.dir(rows);
            var username = rows[0].name;
            var userwish = rows[0].any;
            var userphoto = rows[0].photourl;
            res.writeHead('200',{'Content-type':'text/html;charset=utf8'});
            res.write('<h1>login succesful</h1>');
            res.write('<br><h1>welcome ' + username + '! your wish is ' + userwish);
            res.write('<br><img src="' + userphoto + '"</p>')
            res.write("<br><br><a href='/public/comm.html'> go to community page </a>");
            res.end();
        }
        else{
            res.writeHead('200',{'Content-type':'text/html;charset=utf8'});
            res.write('<h1>login failed</h1>');
            res.write("<br><br><a href='/public/login.html'> back to login page </a>");
            res.end();  
        }
    });
    }else{
        res.writeHead('200',{'Content-type':'text/html;charset=utf8'});
        res.write('<h1>database connection failed</h1>');
        res.write('<div><p>database is not online</p></div>');
        res.end();
    }
});

// when requesting process/logout route, respond log and got ID/Password
router.route('/process/logout').get(function(req,res){
    console.log('/process/logout functin called');
    if(req.session.user){
        console.log('logout bye bro :)');
        req.session.destroy(function(err){
            if (err)
                throw err;
            console.log('destory session and log out succesful');
            res.redirect('/public/login.html');
        });
    }else{
        console.log('not login yet');
        res.redirect('/public/login.html');
    }
});

// when requesting process/login route, respond log and got ID/Password
router.route('/process/signup').post(upload.array('photo',1),function(req,res){
    console.log('/process/signup functin called');
    try{
        var paramId = req.body.id||req.jquery.id;
        var paramPassword = req.body.password||req.jquery.password;
        var paramName = req.body.name||req.query.name;
        var paramBirth = req.body.birth||req.query.birth;
        var paramAny = req.body.any||req.query.any;
        var files = req.files;
        console.log('[uploaded file information]');
        console.dir(req.files[0]);
        console.log('---------------------------');
        var originalname = '',
            filename = '',
            mimetype = '',
            size = 0;
        if(Array.isArray(files))
            {
                console.log('file number which contained in array : %d', files.length);
                for(var index = 0; index < files.length; index++)
                    {
                        originalname = files[index].originalname;
                        filename = files[index].filename;
                        mimetype = files[index].mimetype;
                        size = files[index].size;
                    }
            }else
                {
                    console.log('file number : 1');
                    originalname = files[index].originalname;
                    filename = files[index].filename;
                    mimetype = files[index].mimetype;
                    size = files[index].size;
                }
        console.log('[file information] : ' +
                    originalname + ',' +
                    filename + ',' +
                    mimetype + ',' +
                    size)
        var paramPhotourl = '/uploads/' + originalname;
        console.log('requesting value :' + paramId + ',' + paramPassword + ',' + paramName + ',' + paramBirth + ',' + paramAny + ',' + paramPhotourl);
        if(pool){
            addUser(paramId,
                    paramPassword,
                    paramName,
                    paramBirth,
                    paramAny,
                    paramPhotourl,
                    function(err,addedUser){
                if(err){
                    console.log('ERROR OCCURED WHILE ADDING USER');
                    res.writeHead('200',{'Content-type':'text/html;charset=utf8'});
                    res.write('<h1>ERROR OCCURED WHILE ADDING PROCESS</h1>');
                    res.write("<br><br><a href='/public/signup.html'> back to signup page /a>");
                    console.dir(err);
                    callback(err,null);
                    return;
                }
                if(addedUser){
                    console.dir(addedUser);
                    console.log('inserted %s rows', addedUser.affectedRows);
                    var insertId = addedUser.insertId;
                    console.log('added records id : %s', insertId);
                    res.writeHead('200',{'Content-type':'text/html;charset=utf8'});
                    res.write('<h1>sign up succesful!!!</h1>');
                    res.write("<br><br><a href='/public/login.html'> go to login page </a>");
                    res.end();
                }else{
                    res.writeHead('200',{'Content-type':'text/html;charset=utf8'});
                    res.write('<h1>signup failed</h1>');
                    res.write("<br><br><a href='/public/signup.html'> back to signup page /a>");
                    res.end();
                }
            })
        }else{
            res.writeHead('200',{'Content-type':'text/html;charset=utf8'});
            res.write('<h1>database connection failed</h1>');
            res.write('<div><p>database is not online</p></div>');
            res.end();
        }
    }catch(err){
        console.dir(err.stack);
    }
});


// use router as middleware, that could route path given '/'
app.use('/', router);


var addUser = function(id,password,name,birth,any,photourl,callback){
    console.log('addUser function has been called');
    pool.getConnection(function(err,conn){
        if(err){
            if(conn){
                conn.release();
            }
            console.dir(err);
            callback(err,null);
            console.log('DB connection failed while adding');
            return;
        }
        console.log("database thread connected id : %s", conn.threadId);
        var data = {id:id,
                    password:password,
                    name:name,
                    birth:birth,
                    any:any,
                    photourl:photourl
                    };
        var tablename = 'myuser';
        var exec = conn.query('insert into ' + tablename + ' set ?', data, function(err,result){
            conn.release();
            console.log('execute sql : %s',exec.sql);
            if(err){
                console.log('ERROR OCCURED WHEN EXECUTE SQL');
                console.log(err);
                callback(err,null);
                return;
            }
            callback(null, result);
        });
    });
}

//authorization function that depend on database 
var authUser = function(id, password, callback){
    console.log("authUser function has been called");
    pool.getConnection(function(err,conn){
        if(err){
            if(conn){
                conn.release();
            }
            console.dir(err);
            callback(err,null);
            console.log('DB connection failed while authorization');
            return;
        }
        console.log("database thread connected id : %s", conn.threadId);
        var column = ['id','name','birth','any','photourl'];
        var tablename = 'myuser';
        var exec = conn.query("select ?? from ?? where id = ? and password = ?", [column,tablename,id,password],function(err,rows){
            conn.release();
            console.log('execute sql : %s',exec.sql);
            if(rows.length>0){
                console.log('found record matching information : %s, %s', id, password);
                callback(null,rows);
            }else{
                console.log('none of data has been matched');
                callback(null, null);
            }
        });
    });
}

// error handling function, module importing, use it as middleware when httperror 404 happened, outprint 404.html
var errorHandler = expressErrorHandler({
    static:
    {
        '404': './public/404.html'
    }
});
app.use(expressErrorHandler.httpError(404));
app.use(errorHandler);

//signal handler => close express server when process terminated
process.on('SIGTERM', function () {
    console.log("process has been terminated, your express module turn off");
    app.close();// -> this make app.on('close') gonna be down relatively
});
//express handler => close express module dependable app module when app got signal(close)
app.on('close', function () {
	console.log("express app module has been turned off. disconnect you database now");
	if (database) {
		database.close();
	}
});

// server function, ues app struct 'port' num(if would be contain env port or 3000)
http.createServer(app).listen(app.get('port'), function(){
   console.log('express web server port : '+ app.get('port'));
});