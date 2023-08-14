const {MongoClient} = require('mongodb')
    , mongoose = require('mongoose')
    ;

const users = require('./users');

/////////////////////////////////////
// DB Models
////////////////////////////////////
const patternSchema = new mongoose.Schema(
    {   
        userEmail: String,
        patternName: String,
        baseStitchCount: Number,
        stitchSize: Number,
        colors: String,
        ddStitches: String,
        pattern: String
    },
    {
        timestamps: true,
    },
    {
        collection: 'users'
    });
    const Pattern = mongoose.model('Pattern', patternSchema);


/////////////////////////////
//
/////////////////////////////
exports.renderPatternList = async  (req, res, userMsg) => {
    if (!req.session.user) {
        console.log('not authorized - renderPatternList');
        res.redirect('/login');
        return;
    }

    var resultSet = await Pattern.find({userEmail: req.session.user});
    var list = []
    resultSet.forEach(pattern => {
         list.push(pattern);        
    })    

    res.render("patternlist", {userMsg:userMsg, is_auth: true, list:list})    

}

exports.saveCurrentPattern = async (req, res, usermsg) => {

    var foundPattern = await Pattern.findOne({userEmail: req.session.user, _id: req.body.id});
    if(foundPattern) {
        try {
            await Pattern.updateOne({userEmail:req.session.user, _id:req.body.id}, 
                {
                    baseStitchCount: req.body.bq,
                    stitchSize: req.body.sz,
                    colors: req.body.ca,
                    ddStitches: req.body.dd,
                    pattern: req.body.t
                });
        } catch (error) {
            console.log(error);
        }

    } else {
        try {

            foundPattern = await new Pattern({
                userEmail: req.session.user,
                baseStitchCount: req.body.bq,
                stitchSize: req.body.sz,
                colors: req.body.ca,
                ddStitches: req.body.dd,
                pattern: req.body.t,
                createdAt: Date.now(),
            }).save();
            // establish session - I don't know if this is working yet
        } catch (error) {
            console.console.log(error);
        }
        
    } 
    this.openPattern(req, res, "", foundPattern._id);
 }

 exports.deletePattern = async (req, res, usermsg) => {

    const foundPattern = await Pattern.deleteOne({userEmail: req.session.user, _id: req.body._id});
    if(foundPattern) {
    } else {
    } 

 }

 exports.openPattern = async (req, res, usermsg, patternId) => {

 
    const foundPattern = await Pattern.findOne({userEmail: req.session.user, _id: patternId});
    if(!foundPattern) {
        this.renderPatternList(req, res, "Error - No Matching Pattern Found");
    }
    this.renderRound(req,res,foundPattern);
 }


//////////////////////////////
// render functions
//////////////////////////////

exports.renderRound = (req, res, pattern) => {
    if (!users.authorized(req)) {
        res.redirect('/');
        return;
    }
    res.render("round", {userMsg: "", is_auth: true, req: req, pattern:pattern});
}
        
exports.renderRect = (req, res, pattern) => {
    if (!users.authorized(req)) {
        res.redirect('/');
        return;
    }
    res.render("rect", {userMsg: "", is_auth: true, req: req, pattern:pattern});
}
        