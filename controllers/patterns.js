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
        return;
    }

    var resultSet = await Pattern.find({userEmail: req.session.user});
    var list = []
    resultSet.forEach(pattern => {
         list.push(pattern);        
    })    

    console.log('inside renderpatternlist about to actually render');
    res.render("patternlist", {userMsg:userMsg, is_auth: true, list:list})    

}

exports.saveCurrentPattern = async (req, res, usermsg) => {

    console.log('saving pattern for ' + req.session.user);
    var foundPattern = await Pattern.findOne({userEmail: req.session.user, _id: req.body.id});
    if(foundPattern) {
        console.log('user already has a pattern');
        console.log(req.body);
        try {
            console.log('attempting update');
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

            console.log('attempting insert');
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

    console.log('deleting pattern ' + req.body._id);
    const foundPattern = await Pattern.deleteOne({userEmail: req.session.user, _id: req.body._id});
    if(foundPattern) {
        console.log('successfully deleted');
        console.log(req.body);
    } else {
        console.log('no such pattern exists');
    } 

 }

 exports.openPattern = async (req, res, usermsg, patternId) => {

    console.log('opening pattern ' + patternId + ' for ' + req.session.user);
 
    const foundPattern = await Pattern.findOne({userEmail: req.session.user, _id: patternId});
    if(!foundPattern) {
        this.renderPatternList(req, res, "Error - No Matching Pattern Found");
    }
    console.log('found pattern:');
    console.log(foundPattern);
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
    console.log('res.render called with pattern as argument');
    console.log(pattern);
    res.render("round", {userMsg: "", is_auth: true, req: req, pattern:pattern});
}
        