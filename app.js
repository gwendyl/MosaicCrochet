//NOTES TO SELF.  Consider refactor to move authentication logic to a middle layer.  See https://www.loginradius.com/blog/engineering/guest-post/nodejs-authentication-guide/
// think about where the cookie logic needs to be for the password change functionality

require('dotenv').config()

const express = require('express');
const ejs = require('ejs');
const {MongoClient} = require('mongodb');
const mongoose = require('mongoose');
//const session = require('express-session');
const crypto = require("crypto");
const sendEmail = require("./utils/emails/sendEmail");

// JSON Web Token helps shield a route from an unauthenticated user. Using JWT in your application will prevent unauthenticated users from accessing your users' home page and prevent unauthorized users from accessing your admin page.
// JWT creates a token, sends it to the client, and then the client uses the token for making requests. It also helps verify that you're a valid user making those requests.
const jwt = require('jsonwebtoken')
// To prevent unauthenticated users from accessing the private route, take the token from the cookie, verify the token, and redirect users based on role.
// You'll get the token from the client using a node package called cookie-parser. 
const cookieParser = require("cookie-parser");

//const passport = require("passport"); 
//const passportLocalMongoose = require("passport-local-mongoose");

const md5 = require("md5");

const port = process.env.PORT;
 
const app = express();
 
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());

// app.use(session({
//     secret: process.env.PWDSECRET,
//     resave: false,
//     saveUninitialized: false
//   }));
//   app.use(passport.initialize());
//   app.use(passport.session());



const uri = "mongodb+srv://"+process.env.MONGODBCRED+"@mosaic1.ul7isoy.mongodb.net/?retryWrites=true&w=majority"; 

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

//userSchema.plugin(passportLocalMongoose);
//userSchema.plugin(findOrCreate);

const User = mongoose.model('User', userSchema);
//passport.use(User.createStrategy());
//passport.serializeUser(function(user, done) {
//    done(null, user.id);
//  });
  
const tokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "user",
  },
  token: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 3600,// this is the expiry time in seconds
  },
});
const Token = mongoose.model('Token', tokenSchema);





// passport.deserializeUser(function(id, done) {
//     User.findById(id, function(err, user) {
//       done(err, user);
//     });
//   });


main().catch(err => console.log(err));
async function main() {
    const options = {
        dbName: 'mosaiccrochet'
    }
    await mongoose.connect(uri, options);
}



/////////////////////////////////
//  main routes
/////////////////////////////////
app.get("/", function (req, res) {
    res.render("home");
} );

const server = app.listen(port, () => {
    console.log(`Server started today on port ${port}`);
  });
// Handling Error
process.on("unhandledRejection", err => {
    console.log(`An error occurred: ${err.message}`)
    server.close(() => process.exit(1))
  })


/////////////////////////////////
// Login logic
/////////////////////////////////

app.get("/login", function (req, res) {
    res.render("login", {userMsg: "no message"});
}  );

app.post("/login", async function (req, res) {
    
    const email = req.body.username;
    const password = md5(req.body.password);
    if (!email || !password) {
        return res.status(400).json({
          message: "Username or Password not present",
        })
      }



    try {
        const foundUser = await User.findOne({email, password});
    if (!foundUser) {
          res.status(401).json({
            message: "Login not successful",
            error: "User not found",
          })
        } else {
            const maxAge = 3*60*60; // 3 hours in seconds
            const token = jwt.sign(
                {id:foundUser._id, email},
                process.env.JWTSECRET,
                { expiresIn: maxAge }
            );
            res.cookie("jwt", token, {
                httpOnly: true,
                maxAge: maxAge * 1000 // ms
            });
          res.status(201).json({
            message: "Login successful",
            user: foundUser._id,
          });
        }
      } catch (error) {
        res.status(400).json({
          message: "An error occurred",
          error: error.message,
        })
      }



//     if(!foundUser) {
//         // no such login id
//         console.log('no such username');
//         res.render("login", {userMsg: "Incorrect Email or Password"});
        
//     } else {
//         console.log('check pwd agaisnt ' + foundUser.password);
//         if(foundUser.password!=md5(req.body.password)) {
//             console.log('incoorect passwrd: '+ foundUser.password + ' vs ' + md5(req.body.password));
//             res.render("login", {userMsg: "Incorrect Email or Password"});
//         } else {
//             console.log('successful login');
//  //           passport.authenticate("local")(req, res, function(){
//                 res.redirect("/content");
//  //             });
            
//         }
//     } 
});

/////////////////////////////////
// Register logic
/////////////////////////////////

app.get("/register", function (req, res) {
    res.render("register");
}  );

app.post("/register", async function(req, res, next) {

    const email = req.body.username;
    const password = md5(req.body.password);

    if (password.length < 6) {
        return res.status(400).json({ message: "Password less than 6 characters" })
      }
      try {
        await User.create({
            email,
          password,
        }).then(user => {
          const maxAge = 3 * 60 * 60; // 3 hours in seconds
          const token = jwt.sign(
            { id: user._id, email },
            process.env.JWTSECRET,
            {
                expiresIn: maxAge
            }
          );
          res.cookie("jwt", token, {
            httpOnly: true,
            maxAge: maxAge * 1000 // ms
          });
          res.status(200).json({
            message: "User successfully created",
            user: user._id,
          });
      })
      } catch (error) {
        res.status(400).json({
          message: "User not successful created",
          error: error.message,
        })
      }





//     const foundUser = await findUser(req.body.username);
//     if(foundUser) {
//         res.render("login", {userMsg: "Email already exists"});
//         console.log('username already exists');
//     } else {
//     if(req.body.password.length < 6) {
//         return res.status(400).json({ message: "Password less than 6 characters" })
//     } else {
//     if(!foundUser) {
//         console.log('converting ' + req.body.password);
//         if(saveUser(req.body.username, md5(req.body.password))) {
//  //           passport.authenticate("local")(req, res, function(){
//                 res.render("secrets")
//  //           })
//         }
//     } }}
});

/////////////////////////////////
// Change Password Logic
/////////////////////////////////

app.get("/passwordchange", function (req, res) {
    res.render("passwordchange", {userMsg: "No Message Yet"});
}  );

app.post("/passwordchange", async function(req, res) {
    const foundUser = await findUser(req.body.username);
    if(!foundUser) {
        // no such login id
        console.log('no such username');
        res.render("passwordchange", {userMsg: "Incorrect Email or Password"});
        
    } else {
        console.log('check pwd agaisnt ' + foundUser.password);
        if(foundUser.password!=md5(req.body.oldpassword)) {
            console.log('incoorect passwrd');
            res.render("passwordchange", {userMsg: "Incorrect Email or Password"});
        } else {
            if(updatePwd(req.body.username, md5(req.body.newpassword))) {
                res.render("secrets")
            }
        }
    } 
});

/////////////////////////////////
// Request Password reset Link logic
/////////////////////////////////
app.get("/resetlink", async function(req, res) {
  res.render("resetlink", {userMsg: "No Message Yet"});
});

app.post("/resetlink", async function(req, res) {
  console.log("post resetlink route for "+req.body.username);
  const user = await User.findOne({ email: req.body.username });
  if (!user) {
    console.log('no such username');
    res.render("resetlink", {userMsg: "Email does not exist."});
  }
  
  let token = await Token.findOne({ userId: user._id });
  if (token) {
    console.log('deleting found prior token ' + token)
    await token.deleteOne();
  }
  let resetToken = crypto.randomBytes(32).toString("hex");
  console.log('created token ' + resetToken);
  const hash =md5(resetToken);
  console.log('hashed token ' + hash);
  
  await new Token({
    userId: user._id,
    token: hash,
    createdAt: Date.now(),
  }).save();

  const clientURL = 'localhost://'+process.env.PORT;
  const link = `${clientURL}/passwordReset?token=${resetToken}&id=${user._id}`;
  console.log('created link ' + link);
  sendEmail(user.email,"Password Reset Request",{name: user.email,link: link,},"./template/requestResetPassword.handlebars");
  return link;
});
/////////////////////////////////
// Logout logic
/////////////////////////////////

app.get("/logout", function (req, res) {
    res.cookie("jwt", "", { maxAge: "1" })
    res.redirect("/");
}  );

/////////////////////////////////
// Content logic
/////////////////////////////////

app.get("/content", function (req, res, next) {
    userAuth(req, res, next);
    res.render("secrets");

//   User.find({"secret": {$ne: null}}, function(err, foundUsers){
//     if (err){
//       console.log(err);
//     } else {
//       if (foundUsers) {
//         res.render("secrets", {usersWithSecrets: foundUsers});
//       }
//     }
//   });
});

/////////////////////////////////
// Functions
/////////////////////////////////

async function saveUser(userName, password) {
    const newUser = new User({ email: userName, password:password });
    await newUser.save();
}

async function updatePwd(userName, newPassword) {
    console.log('creating new record for ' + userName + ' ' + newPassword);
    return await User.updateOne({email:userName}, {password: newPassword});
}


async function isLoggedIn(){
    return false;
}


function userAuth(req, res, next) {
    const token = req.cookies.jwt
    if (token) {
      jwt.verify(token, process.env.JWTSECRET, (err, decodedToken) => {
        if (err) {
          return res.status(401).json({ message: "Not authorized 1" })
        } else {
          next();
        }
      })
    } else {
      return res
        .status(401)
        .json({ message: "Not authorized, token not available" })
    }
  }