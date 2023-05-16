
$(document).ready(function () {

    let canvas = document.getElementById('myCanvas');
    
    let nbrColorElement = document.getElementById('nbrColors')
    let baseStitchQty = $('#baseStitches').val();
    let nbrColors = nbrColorElement.value;
    let bigR = $('#stitchSize').val();

    // bigR = 10;

    console.log( );  
    let randomize = false;
    const randomThreshold = .5;

    let geoPattern = false;
    const multFactor = 3;

    // hard to drop down onto first circle or two
    let startRound = 3;  // cant land on rounds 0 or 1
    // show numbers on stitches.  Useful for debugging
    let showNbrs = false;

    let colors = [];
    switch (nbrColors) {
        case "2":
            colors = [document.getElementById('color0').value, 
                      document.getElementById('color1').value];
            break;
        case "3":
            colors = [document.getElementById('color0').value, 
                      document.getElementById('color1').value,
                      document.getElementById('color2').value];
            break;
        case "4":
            colors = [document.getElementById('color0').value, 
                      document.getElementById('color1').value,
                      document.getElementById('color2').value,
                      document.getElementById('color3').value];
            break;
        default:
            colors = [document.getElementById('color0').value, 
                      document.getElementById('color1').value];
        }

    originX = canvas.width / 2;
    originY = canvas.height / 2;
    let radiusX = bigR * .6;
    let radiusY = bigR;

    // compute maxiumum number of stitches that will fit
    let rndCount = Math.min(canvas.width / (4 * bigR) - 1, canvas.height / (4 * bigR) - 1);
    let rounds = [];
    let stitches = [];
    let shortStitches = [];

    if (canvas.getContext) {
        var ctx = canvas.getContext('2d');
        drawStartingCircle();
        renderColorPickers();
        constructStitches();

        if (randomize) {
            createRandomPattern();
        }

        if (geoPattern) {
            createGeoPattern();
        }
        drawAllStitches();
        writeRoundDetails();
    }

    nbrColorElement.addEventListener('change', (e) => {
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
                drawAllStitches();
                writeRoundDetails();
            }
        })
    });

    
    let saveButton = document.getElementById('saveButton');
    saveButton.addEventListener("click", function() {

        stitches.forEach(stitch => {
            shortStitches.push({
                id: stitch.id,  //save
                cid:stitch.currColorId,
                dd: (stitch.isDropDown) ? 1 : 0
            });
        })
        const stitchesJson = JSON.stringify(shortStitches);

        axios.post('/savePattern', {
            stitches: stitchesJson
          })
          .then(function (response) {
            console.log(response);
          })
          .catch(function (error) {
            console.log(error);
          });

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
        let ss = [];

        let c = document.getElementById("myCanvas");
        let ctx = c.getContext("2d");



        // constant for all stitches
        let startAngle = 0;
        let endAngle = 2 * Math.PI;
        let startingX = originX;
        let id = 0;
        let currColorId = 0;

        for (let j = 0; j < rndCount; j++) {

            let currentRound = {
                id: j,
                humanId: j + 1,
                stitchCount: baseStitchQty * (j + 1),
                baseColorId: currColorId,
                firstStitchNbr: id
            }
            rounds.push(currentRound);

            let theta = (2 * Math.PI / currentRound.stitchCount);
            let startingY = originY + 2 * radiusY * (j + 1);
            for (let i = 0; i < currentRound.stitchCount; i++) {
                // coordinates of the center of the ellipse
                // so rotating around a circle that has a radius of (bigR + radiusY)
                //newXCoord = originX + i*(bigR+radiusY)*Math.(theta);
                //newYCoord = originY + 2*radiusY + i*(bigR+radiusY)*Math.cos(theta);



                let newX = Math.cos(i * theta) * (startingX - originX) - Math.sin(i * theta) * (startingY - originY) + originX;
                let newY = Math.sin(i * theta) * (startingX - originX) + Math.cos(i * theta) * (startingY - originY) + originY;


                // determine the lower stitch that it will build upon
                // increment: account for the extra stitch 
                let nbrOfStitchesFromFirstStitch = id - currentRound.firstStitchNbr + 1;
                let increment = nbrOfStitchesFromFirstStitch * (1 / (j + 1));

                // drop down stitch = current stitch number + the number of stitches around + 
                // the incremental amount to increase the stitch count for the next row
                var parentStitchId;
                let rawStitchNbr = id - j * baseStitchQty - increment;
                if (j > 0) parentStitchId = Math.round(rawStitchNbr);


                let isIncrease = false;
                if (Math.floor(rawStitchNbr) == rawStitchNbr) isIncrease = true;

                // find the 'grandmother' of the stitch.  this is the stitch that this stitch would drop down to
                // we just found the parentStitchId, which is this stitch's mother.  So just need to get the parentStitchId of the parentStitchId.
                let grandparentStitchId = getParent(parentStitchId);

                // reconstruct relevant information from saved shortStitches
                let stitchColorId = currColorId;
                let isDropDown = false;
                if ( shortStitches.length >0) {
                    if (stitchColorId != shortStitches[id].cid) {
                        stitchColorId = shortStitches[id].cid;
                        isDropDown = (shortStitches[id].dd==1) ? true : false;
                    }
                }
                // if(shortStitches.length>0){
                //     if (stitchColorId != shortStitches[id].currColorId) stitchColorId = shortStitches[id].currColorId;                }
                // }
                stitches.push({
                    x: newX,
                    y: newY,
                    radiusX: radiusX,
                    radiusY: radiusY,
                    theta: theta * i,
                    startAngle: startAngle,
                    endAngle: endAngle,
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
            if (currColorId >= colors.length) currColorId = 0;
        }
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
        
        stitches.forEach(stitch => {
            // draw a little oval behind the stitch to indicate the base color of that round
            ctx.fillStyle = colors[getBaseColorId(stitch.roundId)];
            ctx.beginPath();
            ctx.ellipse(stitch.x, stitch.y, stitch.radiusY, stitch.radiusX / 2, stitch.theta, stitch.startAngle, stitch.endAngle);
            ctx.stroke();
            ctx.fill();

            ctx.fillStyle = colors[stitch.currColorId];

            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            ctx.lineWidth = 1;
            if (stitch.isIncrease) ctx.lineWidth = 8;

            // x and y parameters describe the middle of the ellipse
            ctx.beginPath();
            ctx.ellipse(stitch.x, stitch.y, stitch.radiusX, stitch.radiusY, stitch.theta, stitch.startAngle, stitch.endAngle);
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
        let c = document.getElementById("myCanvas");
        let ctx = c.getContext("2d");

        ctx.fillStyle = "rgba(255, 255, 255, 0.125)";

        ctx.beginPath();
        ctx.ellipse(originX, originY, bigR, bigR, 0, 0, 2 * Math.PI);
        ctx.stroke();


    }

    function isIntersect(point, stitch) {
        if (Math.pow(point.x - stitch.x, 2) / Math.pow(stitch.radiusX, 2) + Math.pow(point.y - stitch.y, 2) / Math.pow(stitch.radiusY, 2) < 1)
            return true;
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
        let rect = canvas.getBoundingClientRect();
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

        if (nbrColorElement.value < 3) {
            $('#color3').addClass('isHidden');
            $('#color3label').addClass('isHidden');
            $('#color4').addClass('isHidden');
            $('#color4label').addClass('isHidden');
        } else if (nbrColorElement.value < 4) {
            $('#color3').removeClass('isHidden');
            $('#color3label').removeClass('isHidden');
            $('#color4').addClass('isHidden');
            $('#color4label').addClass('isHidden');
        } else {
            $('#color3').removeClass('isHidden');
            $('#color3label').removeClass('isHidden');
            $('#color4').removeClass('isHidden');
            $('#color4label').removeClass('isHidden');
        }

    }

    function sendRoundInfoAlert(textMsg) {
        var errorDiv = document.getElementById('errorDiv');
        console.log('found canvas div ' + errorDiv);
        sendInfoAlert(textMsg, errorDiv);
    }
}); //document ready



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

    console.log(alertDiv);
    console.log(toDiv);

    toDiv.appendChild(alertDiv);
}





