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
        patternType: {type: String, default: 'rnd'},
        baseStitchCount: Number,
        stitchSize: Number,
        colors: String,
        ddStitches: String,
        pattern: String,
        rowColors: String
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
        res.redirect('/login');
        return;
    }

    var resultSet = await Pattern.find({userEmail: req.session.user, patternType: {$ne: "rct"}});
    var list = []
    resultSet.forEach(pattern => {
         list.push(pattern);        
    })    

    var resultSet = await Pattern.find({userEmail: req.session.user, patternType: "rct"});
    var rectList = []
    resultSet.forEach(pattern => {
        rectList.push(pattern);        
    })    

    res.render("patternlist", {userMsg:userMsg, is_auth: true, list:list, rectList:rectList})    

}

exports.renamePattern = async (req, res, usermsg) => {
    var foundPattern = await Pattern.findOne({userEmail: req.session.user, 
                                              patternType: req.body.tp,
                                              pattern:   req.body.from});
    if(foundPattern) {
        try {
            await foundPattern.updateOne(
                {
                    pattern: req.body.to
                });
        } catch(error) {
            console.log(error);
        }
    }
}
// exports.saveCurrentPattern = async (req, res, usermsg) => {
//     var foundPattern = await Pattern.findOne({userEmail: req.session.user, patternType: req.body.tp, pattern: req.body.t});
//     if(foundPattern) {
//         try {
//             await Pattern.updateOne({userEmail:req.session.user, patternType: req.body.tp, pattern:req.body.t}, 
//                 {
//                     userEmail:req.session.user,
//                     baseStitchCount: req.body.bq,
//                     stitchSize: req.body.sz,
//                     colors: req.body.ca,
//                     ddStitches: req.body.dd,
//                     pattern: req.body.t,
//                     PatternType: req.body.tp,
//                     rowColors: req.body.rowc
//                 });
//         } catch (error) {
//             console.log(error);
//         }

//     } else {
//         try {
//             foundPattern = await new Pattern({
//                 userEmail: req.session.user,
//                 baseStitchCount: req.body.bq,
//                 stitchSize: req.body.sz,
//                 colors: req.body.ca,
//                 ddStitches: req.body.dd,
//                 pattern: req.body.t,
//                 patternType: req.body.tp,
//                 rowColors: req.body.rowc,
//                 createdAt: Date.now(),
//             }).save();
//         } catch (error) {
//             console.console.log(error);
//         }
        
//     } 
//  }

exports.saveCurrentPattern = async (req, res, usermsg) => {
    try {
        let foundPattern = await Pattern.findOne({ userEmail: req.session.user, patternType: req.body.tp, pattern: req.body.t });

        if (foundPattern) {
            await Pattern.updateOne(
                { userEmail: req.session.user, patternType: req.body.tp, pattern: req.body.t },
                {
                    userEmail: req.session.user,
                    baseStitchCount: req.body.bq,
                    stitchSize: req.body.sz,
                    colors: req.body.ca,
                    ddStitches: req.body.dd,
                    pattern: req.body.t,
                    patternType: req.body.tp,
                    rowColors: req.body.rowc
                }
            );
        } else {
            foundPattern = await new Pattern({
                userEmail: req.session.user,
                baseStitchCount: req.body.bq,
                stitchSize: req.body.sz,
                colors: req.body.ca,
                ddStitches: req.body.dd,
                pattern: req.body.t,
                patternType: req.body.tp,
                rowColors: req.body.rowc,
                createdAt: Date.now(),
            }).save();
        }

        res.status(200).json({ message: 'Pattern saved successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error saving pattern' });
    }
};

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
    if(foundPattern.patternType == 'rct'){
        this.renderRect(req,res,foundPattern);
    }
    else {
        this.renderRound(req,res,foundPattern);
    }

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
        