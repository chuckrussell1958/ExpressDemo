/**
 * Created by charlesrussell on 1/5/15.
 */
var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var cookieSession = require('cookie-session');
var serveStatic = require('serve-static');
var serveIndex = require('serve-index');
var https = require('https');
var http  = require('http');
var fs = require('fs');
var logger = require('morgan')

//Setup Access Logs - commented out for Heroku
/*try {
    var accessLogStream = fs.createWriteStream(__dirname + '/public/files/access.log', {flags: 'a'});
}
catch(e){
    console.log("Error creating Access Log File");
    throw(e);
}
*/

//Define Middleware

//Increments session state variable for each 'get'
homeHandler = function (req, res) {

    if (req.session.views) {
        req.session.views++;
    }
    else {
        req.session.views = 1;
    }
    dumpReqHeaders(req,res);
    res.end('\nTotal views for you: ' + req.session.views + ' \n');
};

//clears cookie if cookie is set
toggleHandler = function(req, res){
    if (req.cookies.name) {
        res.clearCookie('name');
        res.end('name cookie cleared! Was:' + req.cookies.name);
    }
    else {
        res.cookie('name', 'fooBar');
        res.end('name cookie set!');
    }
};

//digitally signs cookie
signedHandler = function(req, res){
    if (req.signedCookies.name) {
        res.clearCookie('name');
        res.end('name cookie cleared! Was:' + req.signedCookies.name);
    }
    else {
        res.cookie('name', 'foobar96', { maxage: 900000, signed: true, httpOnly:true });

        res.end('name cookie set!' + res.cookies);
    }
};

headerHandler = function(req,res){
    dumpReqHeaders(req,res);
    dumpResHeaders(req,res);
    res.end("Header Dump\n")
};

dumpReqHeaders = function(req,res){
    res.write("<Request Headers\>"+ "\n");
    res.write("request type: " + req.method + "\n" );
    res.write("request url: " + req.originalUrl + "\n");
    res.write("request path: " + req.path + "\n");

    var reqJason = JSON.parse(JSON.stringify(req.headers));
    for(var myKey in reqJason) res.write(myKey + ": " + reqJason[myKey] + "\n");

    res.write("\</Request Headers\>\n")
};

dumpResHeaders = function(req, res){
     return true;
};

//just goofing around
cookieJunk = function(req,res){
    if(req.cookies.parsed){
        console.log('Already Parsed:', req.cookies.parsed);
    }
    else {
        console.log('First Pass');
    }
    if (req.body.foo) {
        res.cookie('parsed','yes', {maxAge:900000, httpOnly:true});
        res.end('Body parsed! Value of foo: ' + req.body.foo + '\n');
    }
    else {
        console.log('---client request cookies header:\n', req.headers['cookie']);
        res.cookie('parsed','no');
        res.end('Body does not have foo!\n');
    }
};


//Configure Middleware App
try {
    var app = express()
            //.use(logger('combined', {stream: accessLogStream}))                //Commented out for Heroku
            .use(serveStatic(__dirname + '/public'))                             //static roots
            .use(serveIndex(__dirname +  '/public'))                             //static filesystem
            .use(bodyParser())                                                   //deprecated, should find alternatives
            .use(cookieParser('A019IR56w#$HA12345ABhG', 'STPIsTheRacersEdge'))   //can digitally sign cookies
            .use(cookieSession({keys: ['NowIsTheTimeToNodeAllDay12']}))          //digitally sign the session cookie
            .use('/header', function(req,res){
                headerHandler(req,res);
            })
            .use('/home', function (req, res) {
                homeHandler(req, res);
            })
            .use('/redirect', function (req,res){                                //hardcoded redirect
                res.redirect('/index.html');
            })
            .use('/reset', function (req, res) {
                delete req.session.views;
                res.end('Cleared all your views');
            })
            .use('/toggle', function (req, res) {
                toggleHandler(req, res);
            })
            .use('/signed', function (req, res) {
                signedHandler(req, res);
            })
            .use(function (req, res) {
                cookieJunk(req, res);
            })
            .use(function (err, req, res, next) {
                res.end('Invalid body!\n');
            })
        ;
    console.log("Middleware Configured");
}
catch(e){
    console.log("Middleware Configuration Error:" + e);
}

/* public & private keys */
var options = {
    key:  fs.readFileSync('./key.pem'),
    cert: fs.readFileSync('./cert.pem')
};

/* Spin up Servers */
var server_port = process.env.YOUR_PORT || process.env.PORT || 3000;
var server_host = process.env.YOUR_HOST || '0.0.0.0';
var secure_server_port = process.env.YOUR_PORT || process.env.PORT || 3001;


try{
    //HTTP
    http.createServer(app).listen(server_port, server_host, function() {
       console.log("HTTP Server Started on host: " + server_host + " Port: " + server_port);
    });
}
catch(e){
    console.log("Unable to Start Server on port:" + e);
}

try {// HTTPS
    //https.createServer(options, app).listen(secure_server_port, server_host, function() {
    //console.log("HTTPS Server Started on host: " + server_host + " Port: " + secure_server_port);
    //});

}
catch(e){
    console.log("Unable to Start HTTPS Server: " + e)
}
