require('dotenv').config()

const express = require('express')
    , session = require('express-session')
    , ejs = require('ejs')
    , url = require('url')
;

const users = require('./controllers/users');
const patterns = require('./controllers/patterns');

const port = process.env.PORT;
const app = express(); 
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(express.urlencoded({extended: true}));
app.use(express.json({ limit: '300kb' }));

app.use(
    session({
        secret: process.env.SESSIONSECRET,
        cookie: { maxAge: 24 * 60 * 60 * 1000 }, //milliseconds
        resave: true,
        saveUninitialized: false,  // critical
    })
);

/////////////////////////////////
//  start server
/////////////////////////////////
const server = app.listen(port, () => {
    console.log(`Server started today on port ${port}`);
});
// Handling Error
process.on("unhandledRejection", err => {
    console.log(`An error occurred: ${err.message}`)
    server.close(() => process.exit(1))
  })


/////////////////////////////////
// routes
/////////////////////////////////
app.get("/", function (req, res) { users.renderHome(res,"")});
app.get("/about", function (req, res) { users.renderAbout(res,"")});
app.get("/resources", function (req, res) { users.renderResources(res,"")});

app.get("/login", function (req, res) {users.renderLogin(res,"")});
app.post("/login", async function (req, res) {users.login(req,res);});

app.get("/register", function (req, res) {users.renderRegister(res,"")} );
app.post("/register", async function(req, res) {users.register(req, res);});

app.get("/registerpassword", function (req, res) {users.renderRegisterPassword(req, res,"")} );
app.post("/registerpassword", function (req, res) {
    users.registerPassword(req, res,"")
} );

app.get("/resetpassword", function (req, res) {users.renderResetPassword(req, res,"")});
app.post("/resetpassword", async function(req, res) {
    users.resetPassword(req,res);
});

app.get("/changepassword", function (req, res) {users.renderChangePassword(req, res,"")});
app.post("/changepassword", async function(req, res) {
    users.changePassword(req,res);
});

app.get("/resetlink", async function(req, res) {users.renderSendLinkForm(res,"")});
app.post("/resetlink", async function(req, res) {users.sendResetLink(req, res);});

app.get("/logout", function (req, res) {users.logout(req, res);});

app.get("/content", function (req, res) {users.renderContent(req,res, "")});

app.get("/login", function (req, res) {users.renderLogin(res,"")});
app.get("/patternlist", function (req, res) {

    patterns.renderPatternList(req, res);
});


app.get("/round", function (req, res)  {patterns.renderRound(req,res)});
app.get("/rect", function (req, res)  {patterns.renderRect(req,res)});

app.post("/savePattern",   function(req,res) {
    patterns.saveCurrentPattern(req,res,"");
});

app.post("/renamePattern",   function(req,res) {
    patterns.renamePattern(req,res,"");
});


app.post("/deletePattern", function(req,res) {
    patterns.deletePattern(req, res,"");
}
);

app.get("/openPattern", function(req,res) {
    const patternId = url.parse(req.url, true).query.id;
    patterns.openPattern(req, res, "", patternId);
}
);

