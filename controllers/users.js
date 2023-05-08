const {MongoClient} = require('mongodb')
    , mongoose = require('mongoose')
    , md5 = require("md5")
    , crypto = require("crypto")
    , sendTemplateEmail = require('../utils/emails/sendEmail')
    ;


// JSON Web Token helps shield a route from an unauthenticated user. Using JWT in your application will prevent unauthenticated users from accessing your users' home page and prevent unauthorized users from accessing your admin page.
// JWT creates a token, sends it to the client, and then the client uses the token for making requests. It also helps verify that you're a valid user making those requests.
const jwt = require('jsonwebtoken')

/////////////////////////////////////
// DB Models
////////////////////////////////////
const userSchema = new mongoose.Schema(
{
    email: {type: String, trim: true, required: true, unique: true,},
    password: String
},
{
    timestamps: true,
},
{
    collection: 'users'
});
const User = mongoose.model('User', userSchema);
    

const tokenSchema = new mongoose.Schema({
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    regEmail: {
        type: String
    },
    token: {
      type: String,
      required: true,
    },
    tokenType:
    { 
        type: String
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 3600,// this is the expiry time in seconds
    },
  });
  const Token = mongoose.model('Token', tokenSchema);
  
  
  

/////////////////////////////////////
// export functions
////////////////////////////////////
  
exports.login = async (req, res) => {

    const email = req.body.username;
    const password = md5(req.body.password);

    if (!email || !password) {
        this.renderLogin(res, "Username or Password not present")
        return
    }

    try {
        const foundUser = await User.findOne({email, password});
    if (!foundUser) {
        // no such login id
        this.renderLogin(res, "Incorrect Email or Password");
        } else {

            // create session
            req.session.authenticated = true;
            req.session.user = email;
            //res.json(req.session);

            this.renderContent(req, res, "");

        }
    } catch (error) {
        this.renderLogin(res,error.message);
    }
};

        

exports.register = async (req, res) => {
    const email = req.body.username;
    try {
        const foundUser = await User.findOne({email});
        if (foundUser) {
            this.renderLogin(res, "Email already registered.  Please log in or reset password.");
            return
        }

        // clean up old token ??? should it be cleaning up all tokens?
        let token = await Token.findOne({ regEmail: email });
        if (token) await token.deleteOne();

        // create new registration token
        let regToken = crypto.randomBytes(32).toString("hex");
        await new Token({
        regEmail: email,
        token: regToken,
        tokenType: "userRegister",
        createdAt: Date.now(),
        }).save();
    
        const link =`http://${req.headers.host}/registerPassword?token=${regToken}&email=${email}&userMsg=""`;
        sendTemplateEmail(email, "d-6f4569924db3494d910b2fde1bbf4a55", link);
        this.renderHome(res, "Please check your email for the link to complete account setup")
        return;
    
    } catch (error) {
        this.renderRegister(res, error.message);
        return
    }
}


exports.changePassword = async (req, res) => {
    const email = req.body.username;
    const password = md5(req.body.oldpassword);
    const newpassword = req.body.newpassword;
    const newpassword2 = req.body.newpassword2;

    if (req.body.newpassword.length < 6) {
        this.renderChangePassword(req, res, "Password less than 6 characters.  Password not changed.");
        return
    } 

    if (newpassword != newpassword2) {
        this.renderChangePassword(req, res, "New passwords do not match. Password not changed.");
        return;
    }

    const foundUser = await User.findOne({email, password});
    if(!foundUser) {
        // no such login id
        this.renderChangePassword(req, res,"Incorrect Email or Password.  Password not changed.");
        return
    } 

    if(foundUser.password!=password) {
        this.renderChangePassword(req, res,"Incorrect Email or Password.  Password not changed.");
        return
    } 

    await User.updateOne({email:email}, {password: md5(newpassword)});

    // reset session - I don't know if this is working yet
    req.session.authenticated = true;
    req.session.user = email;

    this.renderContent(req, res)
} 


exports.resetPassword = async (req, res) => {
    const email = req.body.username;
    const newpassword = md5(req.body.newpassword);
    const newpassword2 = md5(req.body.newpassword2);
    const tokenString = req.body.token;


    // check for valid token
    let regToken = await Token.findOne({token: tokenString });
    if (!regToken) {
        this.renderRegister(res, "Expired or invalid link.  Please enter email address for new registration email.");
        return;
    }

    if (regToken.regEmail != email) {
        this.renderRegister(res, "Token does not match username.  Please enter email address for new registration email.");
        return;
    }

    if (req.body.newpassword.length < 6) {
        res.render("resetpassword", {userMsg: "Password less than 6 characters", email: email, is_auth: false, token:tokenString});
        return
    } 

    const foundUser = await User.findOne({email});
    if(!foundUser) {
        // no such login id
        this.renderRegister(req, res,"No such email found.  Please enter email address for new registration email.");
        return
    } 

    if(newpassword!=newpassword2) {
        res.render("resetpassword", {userMsg: "New passwords do not match.", email: email, is_auth: false, token:tokenString});
        return
    } 

    await User.updateOne({email:email}, {password: newpassword});

    // reset session - I don't know if this is working yet
    req.session.authenticated = true;
    req.session.user = email;

    // delete the token that was just used
    regToken.deleteOne();

    this.renderContent(req, res)
} 

exports.registerPassword = async (req, res, usermsg) => {
    const email = req.body.username;
    const unhashedpassword = req.body.newpassword;
    const password = md5(req.body.newpassword);
    const password2 = md5(req.body.newpassword2);
    const tokenString = req.body.token;

    if (unhashedpassword.length < 6) {
        res.render("registerpassword", {userMsg: "Password less than 6 characters", is_auth: false, email, token: tokenString});
        return;
    } 

    if (password!=password2) {
        res.render("registerpassword", {userMsg: "Passwords do not match", is_auth: false, email, token: tokenString});
        return;
    } 

    const foundUser = await User.findOne({email});
    if(foundUser) {
        // no such login id
        res.render("registerpassword", {userMsg: "Apologies - email already set up", is_auth: false, email, token: tokenString});
        return;
    } 

    let regToken = await Token.findOne({ regEmail: email, token: tokenString });
    if (!regToken) {
        this.renderRegister(res, "Expired or invalid link.  Please enter email address for new registration email.");
        return;
    }


    try {

        await new User({
        email: email,
        password: password,
        createdAt: Date.now(),
        }).save();

        // establish session - I don't know if this is working yet
        req.session.authenticated = true;
        req.session.user = email;

        // delete registration token
        await regToken.deleteOne();
        this.renderContent(req, res, "");
    } catch (error) {
        this.renderRegister(res, error.message);
    }

}

exports.sendResetLink = async (req, res) => {
    const user = await User.findOne({ email: req.body.username });
    if (!user) {
       this.renderSendLinkForm(res, "Email is not registered. Please register!");
        return
    }

    let priorResetToken = await Token.findOne({ userId: user._id });
    if (priorResetToken) await priorResetToken.deleteOne();

    let resetToken = crypto.randomBytes(32).toString("hex");

    await new Token({
    userId: user._id,
    regEmail: req.body.username,
    token: resetToken,
    tokenType: 'resetPassword',
    createdAt: Date.now(),
    }).save();

    const clientURL = 'http://localhost:'+process.env.PORT;
    const link = `${clientURL}/resetpassword?token=${resetToken}&id=${user._id}`;
    sendTemplateEmail(user.email, "d-a31f1268bfcc40cf856ef2f107339e49", link);
    this.renderLogin(res, "Please check your email for the link to reset your password")
    return;
}

exports.authorized = (req, res) => {
    if(req.session.authenticated) {
        res.render("secrets", { is_auth: true });
    } else {
        this.renderLogin(res, "");
    }
        
  }


exports.logout = (req, res) => {
    // reset session - I don't know if this is working yet
    req.session.authenticated = false;
    res.redirect("/");
}

//////////////////////////////
// render functions
//////////////////////////////
exports.renderHome = (res, usermsg) => {
    res.render("home", {userMsg: usermsg, is_auth: false});
}
exports.renderContent = (req, res) => {
    this.authorized(req, res);
}
exports.renderLogin = (res, usermsg) => {
    res.render("login", {userMsg: usermsg, is_auth: false});
}

exports.renderRegister = (res, usermsg) => {
    res.render("register", {userMsg: usermsg, is_auth: false});
}
exports.renderRegisterPassword = (req, res, usermsg) => {
    res.render("registerpassword", {userMsg: usermsg, is_auth: false, email:req.query.email, token:req.query.token});
}

exports.renderChangePassword = async (req, res, usermsg) => {
    //obtain token details
        // reset session - I don't know if this is working yet
    if(!req.session.user) {
        this.renderLogin(res, "Session expired.  Please log in");
        return
    }
    res.render("changepassword", {userMsg: usermsg, email: req.session.user, is_auth: false});
}
exports.renderResetPassword = async (req, res, usermsg) => {
    //obtain token details
    let regToken = await Token.findOne({token: req.query.token });
    if (!regToken) {
        this.renderSendLinkForm(res,"Expired or invalid link. Enter your email to receive a new link for password reset.") 
        return;
    }
    res.render("resetpassword", {userMsg: usermsg, email: regToken.regEmail, is_auth: false, token:req.query.token});
}
exports.renderSendLinkForm = (res,usermsg) => {
    res.render("resetLink", {userMsg: usermsg, is_auth: false});
}   

//////////////////////////////
// database connecion
//////////////////////////////
const uri = "mongodb+srv://"+process.env.MONGODBCRED+"@mosaic1.ul7isoy.mongodb.net/?retryWrites=true&w=majority"; 

main().catch(err => console.log(err));
async function main() {
    const options = {
        dbName: 'mosaiccrochet'
    }
    await mongoose.connect(uri, options);
}

