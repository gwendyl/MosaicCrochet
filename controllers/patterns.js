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
        colors: Array,
        ddStitches: Array,
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
exports.saveCurrentPattern = async (req, res, usermsg) => {

    console.log('saving pattern for ' + req.session.user);
    const foundPattern = await Pattern.findOne({userEmail: req.session.user});
    if(foundPattern) {
        console.log('user already has a pattern');
        console.log(req.body);
        try {
            await Pattern.updateOne({userEmail:req.session.user}, 
                {
                    baseStitchCount: req.body.bq,
                    stitchSize: req.body.sz,
                    colors: req.body.ca,
                    ddStitches: req.body.dd
                });
        } catch (error) {
            console.log(error);
        }

    } else {
        try {

            await new Pattern({
            userEmail: req.session.user,
            baseStitchCount: req.body.bq,
            stitchSize: req.body.sz,
            colors: req.body.ca,
            ddStitches: req.body.dd,
            createdAt: Date.now(),
            }).save();
        
            // establish session - I don't know if this is working yet
        } catch (error) {
            console.console.log(error);
        }
        
    } 

 }


//////////////////////////////
// render functions
//////////////////////////////

exports.renderRound = (req, res) => {
    if (!users.authorized(req)) {
        res.redirect('/');
        return;
    }

    
    // const roundCriteria = {
    //     nbrColors:       ((req.body.nbrColors>0)     ? req.body.nbrColors    : 3),
    //     baseStitchCount: ((req.body.baseStitches>0)  ? req.body.baseStitches : 6),
    //     stitchSize:      ((req.body.stitchSize>0)    ? req.body.stitchSize   : 10),
    //     colors: [        ((req.body.color0>"")       ? req.body.color0       : "#9b4f3f"), 
    //                      ((req.body.color1>"")       ? req.body.color1       : "#FFFFFF"), 
    //                      ((req.body.color2>"")       ? req.body.color2       : "#D4AF37"),
    //                      ((req.body.color3>"")       ? req.body.color3       : "#281E5D")
    //             ]
    // };

    //res.render("round", {userMsg: "", is_auth: true, criteria: roundCriteria, req: req});
    res.render("round", {userMsg: "", is_auth: true, req: req});
}

        