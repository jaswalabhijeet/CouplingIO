// Module dependencies
var express = require('express');
var session = require('express-session');
var http = require('http');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var path = require('path');
// Mongo
var mongo = require('mongodb');
var mongoose = require('mongoose');
var UserDB = require('./schemas/user');
//Auth
var basicAuth = require('basic-auth-connect')
//Passport
var passport = require('passport')
var flash = require('connect-flash');

var bitcore   = require('bitcore');

//Launch express
var app = express();

//Get Arguments
var args = process.argv.slice(2);
var port = process.env.PORT;

//Set Envarioment
if (args[0] == 'dev'){
    var port = 3010;
} else if (args[0] == 'prod'){
    //Use HTTP Auth on PROD
    app.use(basicAuth('coupling', '666'));
}

//Connect DB
mongoose.connect('mongodb://admin:admin@ds053190.mongolab.com:53190/couplingio');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback () {
    console.log('Connected to MONGOLAB DB !');
});

// Config Envarioment
app.set('port', port || process.env.PORT);
app.set('views', __dirname + '/views');
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.use(cookieParser());
app.use(bodyParser.json({limit: '50mb'})); 
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({ secret: 'ilovescotchscotchyscotchscotch' }));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash()); 
//Schemas
require('./schemas/user')(db,bitcore);

//Passport
require('./routes/passport')(passport,db);

//Routes
var routes = require('./routes/routes');

//Set Up JSON parser and view engine
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Express app requirements and response
app.use(function(req,res,next){
    req.db = db;
    next();
});


app.get('/partials/:name',routes.partials);
app.get('/', isLoggedIn , routes.index);
app.get('/enter', routes.index);
app.get('/issueCoupon',isLoggedIn  , routes.index);
app.get('/404', routes.index);
app.get('/home', isLoggedIn, routes.index);
app.get('/myProfile', isLoggedIn, routes.index);
app.get('/myUser', isLoggedIn, routes.myUser);
app.get('/logout', isLoggedIn, routes.logout);

app.get('/auth/twitter', passport.authenticate('twitter', { scope : 'email' }));
app.get('/auth/twitter/callback', 
    passport.authenticate('twitter', {
        successRedirect : '/home',
        failureRedirect : '/enter'
    })
);

app.get('/auth/google', passport.authenticate('google', { scope : ['profile', 'email'] }));
app.get('/auth/google/callback',
    passport.authenticate('google', {
        successRedirect : '/home',
        failureRedirect : '/enter'
    })
);

app.get('/auth/facebook', passport.authenticate('facebook', { scope : ['email'] }));
app.get('/auth/facebook/callback',
    passport.authenticate('facebook', {
        successRedirect : '/home',
        failureRedirect : '/enter'
    })
);

app.post('/issueCoupon', routes.issueCoupon);

//IF NOT GO TO ERROR404
//app.all('*',function(req,res) { res.redirect('/404') });

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();
    else
        res.redirect('/enter');
}

//Start the server
app.listen(app.get('port'), function() {
    console.log('CouplingIO app started on '+Date(Date.now())+' at port: '+app.get('port'));
})



