//basic express module import
var express = require('express');
var path = require('path');
var main_config = require('./main_config');
var mysql = require('mysql');
var pool = mysql.createPool({
    connectionLimit : main_config.connectionLimit,
    host : main_config.host,
    user : main_config.user,
    password : main_config.password,
    database : main_config.database,
    debug : main_config.debug
});
var static = require('serve-static');
//file io midleware import
var multer = require('multer');
var fs = require('fs');
//define storage function as middleware that have dependency on multer module
var storage = multer.diskStorage({
    destination: function(req, file, callback)
    {
        callback(null, main_config.photosavepoint)
    },
    filename: function(req, file, callback)
    {
        callback(null, file.originalname)
    }
});
// declear express object as app
var app = express();
app.use(main_config.photosavepath, static(path.join(__dirname, main_config.photosavepoint)));
//define upload function as middleware that have dependency on multer module
var upload = multer({
    storage: storage,
    limits: {
        files: main_config.files,
        fileSize: main_config.fileSize
    }
});

var login = function(req,res){
    
    console.log('login function has been called')
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
                res.write("<br><br><a href='/main/login.html'> back to login page </a>");
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
            res.write("<br><br><a href='/main/comm.html'> go to community page </a>");
            res.end();
        }
        else{
            res.writeHead('200',{'Content-type':'text/html;charset=utf8'});
            res.write('<h1>login failed</h1>');
            res.write("<br><br><a href='/main/login.html'> back to login page </a>");
            res.end();  
        }
    });
    }else{
        res.writeHead('200',{'Content-type':'text/html;charset=utf8'});
        res.write('<h1>database connection failed</h1>');
        res.write('<div><p>database is not online</p></div>');
        res.end();
    }
    
    
}

var logout = function(req,res){
    console.log('logout function has been called')
    if(req.session.user){
        console.log('logout bye bro :)');
        req.session.destroy(function(err){
            if (err)
                throw err;
            console.log('destory session and log out succesful');
            res.redirect('/main/login.html');
        });
    }else{
        console.log('not login yet');
        res.redirect('/main/login.html');
    }
}

var signup = function(req,res){
    console.log('singup function has been called');
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
                    res.write("<br><br><a href='/main/signup.html'> back to signup page /a>");
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
                    res.write("<br><br><a href='/main/login.html'> go to login page </a>");
                    res.end();
                }else{
                    res.writeHead('200',{'Content-type':'text/html;charset=utf8'});
                    res.write('<h1>signup failed</h1>');
                    res.write("<br><br><a href='/main/signup.html'> back to signup page /a>");
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
    
}
var addUser = function(id,password,name,birth,any,photourl,callback){
    console.log('addUser util function has been call');
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
var authUser = function(id, password, callback){
    
    console.log('authUser util function has been call');
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


module.exports.login = login;
module.exports.logout = logout;
module.exports.signup = signup;