module.exports = {
    server_port : 3000,
    connectionLimit : 10,
    host : 'localhost',
    user : 'root',
    password : 'root',
    database : 'test',
    debug : false,
    secret: 'my key',
    resave: true,
    saveUninitialized: true,
    files: 10,
    fileSize: 1024 * 1024 * 1024,
    photosavepoint : 'uploads',
    photosavepath : '/uploads',
    route_info : [
        {file : './user', path : '/process/login', method : 'login', type : 'post'},
        {file : './user', path : '/process/logout', method : 'logout', type : 'get'},
        {file : './user', path : '/process/signup', method : 'signup', type : 'post', upload : 'photo'},
    ]
    
}