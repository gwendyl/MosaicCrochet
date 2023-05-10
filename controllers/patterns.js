const mongoose = require('mongoose');


/////////////////////////////////////
// DB Models
////////////////////////////////////
const patternSchema = new mongoose.Schema(
    {
        nbrColors: Number,
        baseStitchCount: Number,
        stitchSize: Number,
        colors: Array,
    },
    {
        timestamps: true,
    },
    {
        collection: 'users'
    });
    const Pattern = mongoose.model('Pattern', patternSchema);



//////////////////////////////
// render functions
//////////////////////////////

exports.renderRound = (req, res, is_auth) => {
    console.log(req.body.color0);
    const roundCriteria = {
        nbrColors:       ((req.body.nbrColors>0)     ? req.body.nbrColors    : 3),
        baseStitchCount: ((req.body.baseStitches>0)  ? req.body.baseStitches : 6),
        stitchSize:      ((req.body.stitchSize>0)    ? req.body.stitchSize   : 10),
        colors: [        ((req.body.color0>"")       ? req.body.color0       : "#9b4f3f"), 
                         ((req.body.color1>"")       ? req.body.color1       : "#FFFFFF"), 
                         ((req.body.color2>"")       ? req.body.color2       : "#D4AF37"),
                         ((req.body.color3>"")       ? req.body.color3       : "#281E5D")
                ]
    };

    res.render("round", {userMsg: "", is_auth: is_auth, criteria: roundCriteria, req: req});

}