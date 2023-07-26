$(document).ready(function () {

    //////////////////////////////////////////////////////
    // if local storeage not initiated, default them
    //////////////////////////////////////////////////////
    initializeLocalStorage();

    // set the form fields
    $('#patternName').text(patternName());

    $('#nbrColors').val(nbrColors());
    $('#baseStitches').val(baseStitchQty());
    $('#stitchSize').val(stitchSize());
    $('#color0').val(colorsArrayWithHash()[0]);
    $('#color1').val(colorsArrayWithHash()[1]);
    $('#color2').val(colorsArrayWithHash()[2]);
    $('#color3').val(colorsArrayWithHash()[3]);


    // hard to drop down onto first circle or two
    let startRound = 3;  // cant land on rounds 0 or 1
    // show numbers on stitches.  Useful for debugging
    let showNbrs = false;

    let canvas = $('#myCanvas')[0];
    let ctx = canvas.getContext("2d");

    let radiusX = stitchSize() * .6;
    let radiusY = stitchSize();

    // compute maxiumum number of stitches that will fit
    let rndCount = Math.min(canvas.width / (4 * stitchSize()) - 1, canvas.height / (4 * stitchSize()) - 1);
    let rounds = [];
    let stitches = [];

    if (canvas.getContext) {
        drawStartingCircle();
        renderColorPickers();
        constructStitches();
        reconstructFromLocal();

    
       // saveLocally();
        drawAllStitches();
        writeRoundDetails();
    }

    $('#nbrColors')[0].addEventListener('change', (e) => {
        renderColorPickers();
    });

    canvas.addEventListener('click', (e) => {
        const pos = {
            x: e.clientX,
            y: e.clientY
        };

        const canvasPos = toCanvasCoords(pos.x, pos.y, 1);

        stitches.forEach(stitch => {
            if (isIntersect(canvasPos, stitch)) {
                attemptDropDown(stitch);
                //saveLocally();
                drawAllStitches();
                writeRoundDetails();
                return;
            }
        })
    });

    window.addEventListener('resize', (e) => {
        console.log('window resized');
    });

    let nameField = document.getElementById('patternNameInput');
    nameField.addEventListener("change", function() {
        localStorage.setItem('t', nameField.value);
        $('#patternName').text(patternName());
        $('#patternNameInput').addClass("isHidden");
        $('#patternNameLabel').addClass("isHidden");
        saveNow();
    });
    
    let renameButton = document.getElementById('rename');
    renameButton.addEventListener("click", function() {
        $('#patternNameInput').removeClass("isHidden");
        $('#patternNameLabel').removeClass("isHidden");
    });
    
    let goButton = document.getElementById('goButton');
    goButton.addEventListener("click", function() {

        // update local storage with new values
        localStorage.setItem('bq', $('#baseStitches').val()>0 ? $('#baseStitches').val() : 6);
        localStorage.setItem('sz', $('#stitchSize').val()>0   ? $('#stitchSize').val()   : 10);
        let nbrColors     = $('#nbrColors').val()>0    ? $('#nbrColors').val()    : 3; 
        let colors = [];
        // JSON can't work with # signs, so store only the values
        
        colors.push($('#color0').val().slice(1));
        colors.push($('#color1').val().slice(1));
        if (nbrColors > 2) colors.push($('#color2').val().slice(1));
        if (nbrColors > 3) colors.push($('#color3').val().slice(1));
 
        localStorage.setItem('ca', JSON.stringify(colors));        


        // must reset chart
        stitches = [];
        // let shortStitches = [];
        localStorage.setItem('sts', JSON.stringify([]));

        //saveLocally();

        constructStitches();
        drawAllStitches();
        writeRoundDetails();
        return;

    });


    let saveButton = document.getElementById('saveButton');
    saveButton.addEventListener("click", function() {

        saveNow();

    });

    
    let printButton = document.getElementById('printButton');
    printButton.addEventListener("click", function() {
        const dataUrl = canvas.toDataURL();

        let windowContent = '<!DOCTYPE html>';
        windowContent += '<html>';
        windowContent += '<head><title>Print canvas</title></head>';
        windowContent += '<body>';
        windowContent += '<img src="' + dataUrl + '">';
        windowContent += '</body>';
        windowContent += '</html>';

        const printWin = window.open('', '', 'width=' + screen.availWidth + ',height=' + screen.availHeight);
        printWin.document.open();
        printWin.document.write(windowContent);

        printWin.document.addEventListener('load', function () {
            printWin.focus();
            printWin.print();
            printWin.document.close();
            printWin.close();
        }, true);
    });


    function createRandomPattern() {
        stitches.forEach(stitch => {
            if (Math.random() < randomThreshold) {
                attemptDropDown(stitch);
            }
        })

    }

    function createGeoPattern() {
        stitches.forEach(stitch => {
            if (stitch.id % multFactor == 0) {
                attemptDropDown(stitch);
            }
        })
    }
    function constructStitches() {

        originX = canvas.getBoundingClientRect().width / 2;
        originY = canvas.getBoundingClientRect().height / 2;    

        console.log('constructing stitches based upon canvas width and height of ' + canvas.getBoundingClientRect().width + ', ' + canvas.getBoundingClientRect().height);
        console.log('therefore origin is at ' + originX + ', ' + originY);
        let ss = [];

        // constant for all stitches
        let startingX = originX;
        let id = 0;
        let currColorId = 0;

        for (let j = 0; j < rndCount; j++) {

            let currentRound = {
                id: j,
                humanId: j + 1,
                stitchCount: baseStitchQty() * (j + 1),
                baseColorId: currColorId,
                firstStitchNbr: id
            }
            rounds.push(currentRound);

            let theta = (2 * Math.PI / currentRound.stitchCount);
            let startingY = originY + 2 * radiusY * (j + 1);
            for (let i = 0; i < currentRound.stitchCount; i++) {

                // let newX = Math.cos(i * theta) * (startingX - originX) - Math.sin(i * theta) * (startingY - originY) + originX;
                // let newY = Math.sin(i * theta) * (startingX - originX) + Math.cos(i * theta) * (startingY - originY) + originY;

                let newX = 0 - Math.sin(i * theta) * (startingY - originY) + originX;
                let newY = Math.cos(i * theta) * (startingY - originY) + originY;


                // determine the lower stitch that it will build upon
                // increment: account for the extra stitch 
                let nbrOfStitchesFromFirstStitch = id - currentRound.firstStitchNbr + 1;
                let increment = nbrOfStitchesFromFirstStitch * (1 / (j + 1));

                // drop down stitch = current stitch number + the number of stitches around + 
                // the incremental amount to increase the stitch count for the next row
                var parentStitchId;
                let rawStitchNbr = id - j * baseStitchQty() - increment;
                if (j > 0) parentStitchId = Math.round(rawStitchNbr);


                let isIncrease = false;
                if (Math.floor(rawStitchNbr) == rawStitchNbr) isIncrease = true;

                // find the 'grandmother' of the stitch.  this is the stitch that this stitch would drop down to
                // we just found the parentStitchId, which is this stitch's mother.  So just need to get the parentStitchId of the parentStitchId.
                let grandparentStitchId = getParent(parentStitchId);

                // reconstruct relevant information from saved shortStitches
                let stitchColorId = currColorId;
                let isDropDown = false;
      
                if(id==0) {
                    console.log('placing first stitch at ' + newX + '. ' + newY);
                }
                stitches.push({
                    x: newX,
                    y: newY,
                    // radiusX: radiusX,
                    // radiusY: radiusY,
                    theta: theta * i,
                    // startAngle: startAngle,
                    // endAngle: endAngle,
                    id: id,  //save
                    currColorId: stitchColorId,
                    roundId: j,
                    parentStitchId: parentStitchId,
                    grandparentStitchId: grandparentStitchId,
                    isDropDown: isDropDown,
                    isIncrease: isIncrease,
                    writtenInstruction: "blsc"
                });

                // prep for next cycle
                id++;
            }

            currColorId++;
            if (currColorId >= nbrColors()) currColorId = 0;
        }
    }

    function reconstructFromLocal(){
        shortStitches().forEach(stitch => {
            attemptDropDown(stitches[stitch]);
        })
    }
    function getParent(childId) {
        let parentStitchId;
        stitches.forEach(stitch => {
            if (stitch.id == childId) {
                parentStitchId = stitch.parentStitchId;
            }
        })
        return parentStitchId;
    }

    function getBaseColorId(roundId) {
        let baseColorId;
        rounds.forEach(round => {
            if (round.id == roundId) {
                baseColorId = round.baseColorId;
            }
        })
        return baseColorId;
    }

    function drawAllStitches() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.beginPath();
        
        // constant for all stitches
        let startAngle = 0;
        let endAngle = 2 * Math.PI;

                
        stitches.forEach(stitch => {
            // draw a little oval behind the stitch to indicate the base color of that round
            ctx.fillStyle = colorsArrayWithHash()[getBaseColorId(stitch.roundId)];
            ctx.beginPath();
            ctx.ellipse(stitch.x, stitch.y, radiusY, radiusX / 2, stitch.theta, startAngle, endAngle);
            ctx.stroke();
            ctx.fill();

            ctx.fillStyle = colorsArrayWithHash()[stitch.currColorId];

            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            ctx.lineWidth = 1;
            if (stitch.isIncrease) ctx.lineWidth = 8;

            // x and y parameters describe the middle of the ellipse
            ctx.beginPath();
            ctx.ellipse(stitch.x, stitch.y, radiusX, radiusY, stitch.theta, startAngle, endAngle);
            ctx.stroke();
            ctx.fill();

            ctx.lineWidth = 1;



            // draw the line to its connected stitch
            if (stitch.grandparentStitchId >= 0 && stitch.isDropDown) {
                let toPos = getIdCoords(stitch.grandparentStitchId);
                ctx.beginPath();
                ctx.moveTo(stitch.x, stitch.y);
                ctx.lineTo(toPos.x, toPos.y);
                ctx.stroke();
            }

            let currRound = getRound(stitch);

            if (stitch.id == currRound.firstStitchNbr) {
                ctx.strokeText(currRound.humanId, stitch.x, stitch.y);
            }
            if (showNbrs) ctx.strokeText(stitch.id, stitch.x, stitch.y);

            if (stitch.isDropDown) {
                ctx.strokeText('X', stitch.x, stitch.y);
            }


        })

        //saveNow();
    }


    function getIdCoords(id) {
        let pos;

        stitches.forEach(stitch => {
            if (stitch.id == id) {
                pos = {
                    x: stitch.x,
                    y: stitch.y
                };
            }
        })
        return pos;
    };

    function drawStartingCircle() {
        originX = canvas.width / 2;
        originY = canvas.height / 2;    

        ctx.fillStyle = "rgba(255, 255, 255, 0.125)";

        ctx.beginPath();
        ctx.ellipse(originX, originY, stitchSize(), stitchSize(), 0, 0, 2 * Math.PI);
        ctx.stroke();


    }

    function isIntersect(point, stitch) {
        if (Math.pow(point.x - stitch.x, 2) / Math.pow(radiusX, 2) + Math.pow(point.y - stitch.y, 2) / Math.pow(radiusY, 2) < 1) {
            console.log('point ' + point.x + ' ' + point.y + ' is between ' + stitch.x + ' ' + stitch.y);
            return true;
        }
        else
            return false;
    }


    function attemptDropDown(stitch) {

        // cannot drop down from first row
        if (stitch.round < startRound) {
            sendRoundInfoAlert('Stitch is in first two rounds.  Cannot dropdown.');
            return;
        }

        // cannot dropp down if already dropped upon
        if (stitch.currColorId != getBaseColorId(stitch.roundId)) {
            sendRoundInfoAlert('Stitch is already dropped upon.  Cannot itself drop down.');
            return;
        }
        // if already a dd, clear 
        if (colorLowerStitch(stitch, !stitch.isDropDown)) {
            stitch.isDropDown = !stitch.isDropDown;
            stitch.writtenInstruction = "dddc"
        };
    }


    function colorLowerStitch(sourceStitch, ddBool) {
        let success = false;
        let newColorId = getBaseColorId(sourceStitch.roundId);
        stitches.forEach(stitch => {
            if (stitch.id == sourceStitch.parentStitchId) {
                if (stitch.isDropDown) {
                    // cannot drop down on another drop down
                    sendRoundInfoAlert('Stitch cannot drop down onto a stitch that is itself dropping down.');
                    success = false;
                    return success;
                }

                //cannot be dropped on if already dropped on by another stitch
                if (ddBool && (stitch.currColorId != getBaseColorId(stitch.roundId))) {
                    sendRoundInfoAlert('Stitch cannot drop down onto a stitch that is already dropped onto by another stitch.');
                    success = false;
                    return success;
                }
                if (ddBool) {
                    stitch.currColorId = newColorId;
                }
                else {
                    stitch.currColorId = stitch.baseColorId;
                }
                success = true;
            }
        })
        return success;
    }

    function getRound(stitch) {
        let foundRound;

        rounds.forEach(round => {
            if (stitch.roundId == round.id)
                foundRound = round;
        })
        return foundRound;
    }

    function toCanvasCoords(pageX, pageY, scale) {
        console.log('toCanvasCoords called with X and Y of ' + pageX + ' ' + pageY)
        let rect = canvas.getBoundingClientRect();
        console.log('canvas.getBoundingClientRect returned ')
        console.log(rect);
        pos = {
            x: (pageX - rect.left) / scale,
            y: (pageY - rect.top) / scale
        }
        return pos;
    }

    function lineAtAngle(x1, y1, length, angle, canvas) {
        canvas.moveTo(x1, y1);
        x2 = x1 + Math.cos(angle) * length;
        y2 = y1 + Math.sin(angle) * length;
        canvas.lineTo(x2, y2);
        canvas.stroke();
    }

    function writeRoundDetails() {
        rounds.forEach(round => {
            addRoundDetail(round);
        })
    }
    function addRoundDetail(round) {
        // clear last instructions
        removeRoundDetail(round);

        // generate instructions
        let roundInstr = "";

        let currInstr = "";
        let prevInstr = " ";
        let instrCount = 0;
        stitches.forEach(stitch => {
            // only look at stitches in this round
            if (stitch.roundId != round.id) {
                return;
            }

            // new batch of instructions
            let currInstr = stitch.writtenInstruction;
            if (currInstr == prevInstr) {
                // increment the count and move on
                instrCount++;
            } else {
                // write what we know
                if (instrCount > 0) roundInstr = roundInstr + ", " + instrCount + " x " + prevInstr;
                // set up for next batch
                prevInstr = currInstr;
                instrCount = 1;
            }
        })

        //write the last instruction
        roundInstr = roundInstr + ", " + instrCount + " x " + prevInstr;
        //trim off the leading comma
        roundInstr = roundInstr.substring(2);

        // add intro text
        roundInstr = "R" + round.humanId + " (" + round.stitchCount + " stitches): " + roundInstr;

        // build instruction row as: row 
        // figure out color div definition
        var colorDiv = document.createElement('div');
        colorDiv.className = 'box inline';
        colorDiv.style.backgroundColor = round.baseColorId;
        

        var ul = document.getElementById("roundsList");

        var li = document.createElement("li");
        let roundId = 'round' + round.id;
        li.setAttribute('id', roundId);
        li.appendChild(colorDiv);
        li.appendChild(document.createTextNode(roundInstr));
        ul.appendChild(li);

        $('#' + roundId).addClass('list-group-item');
    }

    function removeRoundDetail(round) {
        var ul = document.getElementById("roundsList");
        var li = document.getElementById('round' + round.id);
        // ul won't exist first time through the code
        if (li) ul.removeChild(li);
    }

    function resizeCanvas(canvas) {
        var parent = canvas.parentElement;

        canvas.width = parent.offsetWidth;
        canvas.height = "auto";
    }

    function renderColorPickers() {
        // color 1 always rendered
        // color 2 always rendered

        let nbrColorElement = $('#nbrColors')[0];

        if (nbrColorElement.value < 3) {
            $('#color2').addClass('isHidden');
            $('#color2label').addClass('isHidden');
            $('#color3').addClass('isHidden');
            $('#color3label').addClass('isHidden');
        } else if (nbrColorElement.value < 4) {
            $('#color2').removeClass('isHidden');
            $('#color2label').removeClass('isHidden');
            $('#color3').addClass('isHidden');
            $('#color3label').addClass('isHidden');
        } else {
            $('#color2').removeClass('isHidden');
            $('#color2label').removeClass('isHidden');
            $('#color3').removeClass('isHidden');
            $('#color3label').removeClass('isHidden');
        }

    }

    function sendRoundInfoAlert(textMsg) {
        var errorDiv = document.getElementById('errorDiv');
        sendInfoAlert(textMsg, errorDiv);
    }





    function saveNow() {
        // only save the stitches that have changed from default
        var ssTemp = [];
        stitches.forEach(stitch => {
            if (stitch.isDropDown) {
                ssTemp.push(stitch.id);
                localStorage.setItem('sts', JSON.stringify(ssTemp));
            }
        })
        //const stitchesJson = JSON.stringify(shortStitches);

                

        axios.post('/savePattern', {
            dd: localStorage.getItem('sts'),
            bq: baseStitchQty(),
            sz: stitchSize(),
            ca: localStorage.getItem('ca'),
            t:  patternName(),
            id: localStorage.getItem('id')
        })
        .then(function (response) {
            console.log(response);
        })
        .catch(function (error) {
            console.log(error);
        });

    }
}); //document ready

function initializeLocalStorage() {
    // first check to see if we were passed a pattern
    localStorage.clear();
    if ($('#opBaseStitches').length > 0) localStorage.setItem('bq', $('#opBaseStitches').val());
    if ($('#opStitchSize').length > 0) localStorage.setItem('sz', $('#opStitchSize').val());
    if ($('#opDdStitches').length > 0) localStorage.setItem('sts', $('#opDdStitches').val());
    if ($('#opColors').length > 0) localStorage.setItem('ca', $('#opColors').val());
    if ($('#opName').length > 0) localStorage.setItem('t', $('#opName').val());
    if ($('#opId').length > 0) localStorage.setItem('id', $('#opId').val());

    // if we had a pattern, then
    if (!localStorage.getItem("t")) localStorage.setItem("p",0); else localStorage.setItem("p",1);

    if (!localStorage.getItem("t")) localStorage.setItem("t","Draft Pattern");
    if (!localStorage.getItem("bq")) localStorage.setItem("bq",6);
    if (!localStorage.getItem("sz")) localStorage.setItem("sz",10);
    let defaultColors = ["9b4f3f","FFFFFF","D4AF37"];
    if (!localStorage.getItem("ca"))  localStorage.setItem("ca",  JSON.stringify(defaultColors));
    if (!localStorage.getItem("sts")) localStorage.setItem("sts", JSON.stringify([]));
}

// easier access to local variables
function colorsArrayNoHash() {
    return JSON.parse(localStorage.getItem('ca'));
}
function colorsArrayWithHash() {
    let initialArray = JSON.parse(localStorage.getItem('ca'));
    var finalArray = [];
    for(i=0; i< initialArray.length; i++) {
        finalArray.push('#'+initialArray[i]);
    }
    return finalArray;
}


function nbrColors() {
    return colorsArrayWithHash().length;
}
function baseStitchQty() {
    return localStorage.getItem('bq');
}
function patternName() {
    return localStorage.getItem('t');
}
function stitchSize() {
    return localStorage.getItem('sz');
}
function shortStitches() {
    return JSON.parse(localStorage.getItem('sts'));
}

/// needs to be moved to a shared file
function sendInfoAlert(textMsg, toDiv) {
    var alertImg = document.createElement("img");
    alertImg.setAttribute('src', "close.soon");
    alertImg.setAttribute('style', "display:none");
    alertImg.setAttribute('onerror', "(function(el){ setTimeout(function(){ $(el).parent().remove(); },2000 ); })(this);");

    let textNode = document.createTextNode(textMsg);
    var alertDiv = document.createElement("div");
    let divClass = "alert alert-dark";
    alertDiv.setAttribute('class', divClass);
    alertDiv.appendChild(textNode);
    alertDiv.appendChild(alertImg);

    toDiv.appendChild(alertDiv);
}
