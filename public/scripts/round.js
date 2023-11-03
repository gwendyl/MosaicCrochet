document.addEventListener("DOMContentLoaded", function(){

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
 

    var colorPicker = null; // Store a reference to the color picker element
    var popup = null; // Store a reference to the popup container


    // hard to drop down onto first circle or two
    let startRound = 2;  // cant land on rounds 0 or 1
    // show numbers on stitches.  Useful for debugging
    let showNbrs = false;

    let randomThreshold = .05; // lower number is less likely to hit
    let showErrors = true;

    let canvas = $('#myCanvas')[0];
    let ctx = canvas.getContext("2d");

    // compute maxiumum number of stitches that will fit
    let rounds = [];
    let stitches = [];

    if (canvas.getContext) {
        drawStartingCircle();
        renderColorPickers();
        constructStitches();
        reconstructFromLocal();

        drawAllStitches();
        writeRoundDetails();
    }

    $('#nbrColors')[0].addEventListener('change', (e) => {
        validateNumberInput($('#nbrColors')[0]);
        renderColorPickers();
        resetColors();
    });

    $('#createSymmetry')[0].addEventListener('click', (e) => {
        if ($('#createSymmetry')[0].checked) localStorage.setItem('sy',  1)
        else localStorage.setItem('sy',  0);
    });

    $('#showMarks')[0].addEventListener('click', (e) => {
        if ($('#showMarks')[0].checked) localStorage.setItem('sh',  1)
        else localStorage.setItem('sh',  0);
        drawAllStitches();
    });
 
    const button = document.getElementById('button')
    let timer
    canvas.addEventListener('click', (event) => {
        if (event.detail === 1) {
            timer = setTimeout(() => {
            processCanvasSingleClick(event);
            }, 200)
        }
    })

    document.addEventListener("click", closeColorPickerOutside);
    
    canvas.addEventListener('dblclick', event => {
        clearTimeout(timer)
        processCanvasDoubleClick(event);
    })

    function processCanvasSingleClick(e) {
        const pos = {
            x: e.clientX,
            y: e.clientY
        };

        const canvasPos = toCanvasCoords(canvas, pos.x, pos.y);

        stitches.forEach(stitch => {
            if (isIntersect(canvasPos, stitch)) {
                attemptDropDown(stitch, true);
            }
        })
        drawAllStitches();
        writeRoundDetails();

    };

    function processCanvasDoubleClick(e){
        openColorPicker(e);
    }

    function openColorPicker(e) {
        e.preventDefault();

       // first, detect the row
        const pos = {
            x: e.clientX,
            y: e.clientY
        };
        const canvasPos = toCanvasCoords(canvas, pos.x, pos.y);
        
        let chosenRow;
        stitches.forEach(stitch => {
            if (isIntersect(canvasPos, stitch)) {
                chosenRound = stitch.roundId;
            }
        });
        // Create an input element of type color
        colorPicker = document.createElement("input");
        colorPicker.type = "color";
        colorPicker.value = colorsArrayWithHash()[rounds[chosenRound].baseColorId];
        colorPicker.addEventListener("change", function () {
            // get the new color, and close the color picker
            rounds[chosenRound].color = colorPicker.value;
            closeColorPicker();
            drawAllStitches();
        });

        // Create a button
        var button = document.createElement("button");
        button.textContent = "Reset";
        button.addEventListener("click", function () {
            // Close the color picker and button container
            rounds[chosenRound].color = null;
            closeColorPicker();
            drawAllStitches();
        });
                // Get the cursor position adjusted for window scroll
                var x = e.clientX + window.scrollX;
                var y = e.clientY + window.scrollY;
        
                // Create a container for the color picker and button
                popup = document.createElement("div");
                popup.style.position = "absolute";
                popup.style.left = x + "px";
                popup.style.top = y + "px";
                popup.appendChild(colorPicker);
                popup.appendChild(button);
        
            // Append the color picker to the document body
                document.body.appendChild(popup);
        
                // Trigger a click event on the color picker to open it
                // setTimeout(function () {
                //     colorPicker.click();
                // }, 100);
            }
        
            function closeColorPicker() {
                if (popup) {
                    document.body.removeChild(popup);
                    popup = null;
                }
            }
        
            function closeColorPickerOutside(event) {
                if (popup && event.target !== popup) {
                    closeColorPicker();
                }
            }
        
        
    let nameField = document.getElementById('patternNameInput');
    nameField.addEventListener("change", function() {
        renamePattern(patternName(), nameField.value, 'rnd');
        localStorage.setItem('t', nameField.value);
        $('#patternName').text(patternName());
        $('#patternNameInput').addClass("isHidden");
        $('#patternNameLabel').addClass("isHidden");
        //saveNow();
    });
    
    let renameButton = document.getElementById('rename');
    renameButton.addEventListener("click", function() {
        if ( $('#patternNameInput').hasClass("isHidden")){
            $('#patternNameInput').removeClass("isHidden");
            $('#patternNameLabel').removeClass("isHidden");
        } else {
            $('#patternNameInput').addClass("isHidden");
            $('#patternNameLabel').addClass("isHidden");    
        }
    });
    
    let copyButton = document.getElementById('copy');
    copyButton.addEventListener("click", function() {
        // generate a new name as name + (copy)
        localStorage.setItem('t', patternName()+' (copy)')
        $('#patternName').text(patternName());
        saveNow();
    });
    

    let goButton = document.getElementById('goButton');
    goButton.addEventListener("click", function() {
        resetChart();
    });

    let baseStitches = document.getElementById('baseStitches');
    baseStitches.addEventListener("change", function() {
        validateNumberInput(this);
        resetChart();
    });
    
    let stitchSizeField = document.getElementById('stitchSize');
    stitchSizeField.addEventListener("change", function() {
        resetChart();
    });
    
    let color0Field = document.getElementById('color0');
    color0Field.addEventListener("change", function() {
        resetColors();
    });
    
    let color1Field = document.getElementById('color1');
    color1Field.addEventListener("change", function() {
        resetColors();
    });
    
    let color2Field = document.getElementById('color2');
    color2Field.addEventListener("change", function() {
        resetColors();
    });
    
    let color3Field = document.getElementById('color3');
    color3Field.addEventListener("change", function() {
        resetColors();
    });

    let saveButton = document.getElementById('saveButton');
    saveButton.addEventListener("click", function() {
        saveNow();
    });

    let randomizeButton = document.getElementById('randomize');
    randomizeButton.addEventListener("click", function() {
        createRandomPattern();
        drawAllStitches();
    });

    // let geoButton = document.getElementById('geo');
    // geoButton.addEventListener("click", function() {
    //     createGeoPattern();
    //     drawAllStitches();
    // });

    
    let printButton = document.getElementById('printButton');
    printButton.addEventListener("click", function() {
        window.print();
    });


    function createRandomPattern() {
        showErrors = false;
        stitches.forEach(stitch => {
            if (Math.random() < randomThreshold) {
                attemptDropDown(stitch, true);
            }
        })
        showErrors = true;
    }

    function createGeoPattern() {
        showErrors = false;
        stitches.forEach(stitch => {
            if (stitch.id % 2 == 0) {
                attemptDropDown(stitch, false);
            }
        })
        showErrors = true;
    }

    function constructStitches() {
    
        // originX = canvas.getBoundingClientRect().width / 2;
        // originY = canvas.getBoundingClientRect().height / 2;    
        originX = canvas.width / 2;
        originY = canvas.height / 2;    
        let ss = [];
    
        // constant for all stitches
        let startingX = originX;
        let id = 0;
        let currColorId = 0;
        let rndCount = Math.min(canvas.width / (4 * stitchSize()) - 1, canvas.height / (4 * stitchSize()) - 1);
    
        for (let j = 0; j < rndCount; j++) {
       
            let currentRound = {
                id: j,
                humanId: j + 1,
                stitchCount: baseStitchQty() * (j + 1),
                baseColorId: currColorId,
                firstStitchNbr: id,
                color: rowColorsArray()[j]
            }
            rounds.push(currentRound);
    
            let theta = (2 * Math.PI / currentRound.stitchCount);
            // let startingY = originY + 2 * radiusY * (j + 1);
            for (let i = 0; i < currentRound.stitchCount; i++) {
    
                // let newX = Math.cos(i * theta) * (startingX - originX) - Math.sin(i * theta) * (startingY - originY) + originX;
                // let newY = Math.sin(i * theta) * (startingX - originX) + Math.cos(i * theta) * (startingY - originY) + originY;
    
                // let newX = 0 - Math.sin(i * theta) * (startingY - originY) + originX;
                // let newY = Math.cos(i * theta) * (startingY - originY) + originY;
    
    
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
                let writtenInstr = "blsc"
                if (Math.floor(rawStitchNbr) == rawStitchNbr) {
                    isIncrease = true;
                    writtenInstr = "incBlsc"
                }
    
                // find the 'grandmother' of the stitch.  this is the stitch that this stitch would drop down to
                // we just found the parentStitchId, which is this stitch's mother.  So just need to get the parentStitchId of the parentStitchId.
                let grandparentStitchId = getParent(parentStitchId);
    
                // reconstruct relevant information from saved shortStitches
                //let stitchColorId = currColorId;
      
                stitches.push({
                    theta: theta * i,
                    id: id,  //save
                    //currColorId: stitchColorId,
                    //baseColorId: stitchColorId,
                    colorFrom: j,
                    roundId: j,
                    parentStitchId: parentStitchId,
                    grandparentStitchId: grandparentStitchId,
                    ddType: 'N', // N means none.  x means drop directly down.  L means shift counter clockwise by one.  R means shift clockwise by 1
                    isIncrease: isIncrease,
                    writtenInstruction: writtenInstr
                });
    
                // prep for next cycle
                id++;
            }
    
            currColorId++;
            if (currColorId >= nbrColors()) currColorId = 0;
        }
    }

    function stitchLocation(stitch) {
        //let originX = canvas.getBoundingClientRect().width / 2;
        //let originY = canvas.getBoundingClientRect().height / 2; 
        let originX = canvas.width / 2;
        let originY = canvas.height / 2; 
        let radiusY = stitchSize();   
        let startingY = originY + 2 * radiusY * (stitch.roundId + 1);

        let pos = {
            x: 0 - Math.sin(stitch.theta) * (startingY - originY) + originX,
            y: Math.cos(stitch.theta) * (startingY - originY) + originY
        };

        return pos;
    }

    function reconstructFromLocal(){
        shortStitches().forEach(stitchCode => {
            // the fact that a stitch is referenced in 
            // short stitches means that it drops down, so no N case
            let ddType;
            let stitchId = stitchCode+"";
            if (stitchId.includes("X")) {
                ddType = 'X';
                stitchId = stitchId.substring(0,stitchId.length-1);
            } else if (stitchId.includes("L")) {
                ddType = 'L';
                stitchId = stitchId.substring(0,stitchId.length-1);
            } else if (stitchId.includes("R")) {
                ddType = 'R';
                stitchId = stitchId.substring(0,stitchId.length-1);
            } else {
                // Ns are not recorded, so if there is not an X, L, or R, then it is pattern that was created when there were only X type drop downs.  Treat as X 
                ddType = 'X';
            }
            stitches[stitchId].ddType = ddType;            
            // attemptDropDown(stitches[stitchId], false);
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

    // function getBaseColorId(roundId) {
    //     let baseColorId;
    //     rounds.forEach(round => {
    //         if (round.id == roundId) {
    //             baseColorId = round.baseColorId;
    //         }
    //     })
    //     return baseColorId;
    // }

    function clearCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.beginPath();
    }

    function drawAllStitches() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.beginPath();


        // constant for all stitches
        let startAngle = 0;
        let endAngle = 2 * Math.PI;
        let radiusX = stitchSize() * .8;
        let radiusY = stitchSize();

                
        stitches.forEach(stitch => {
            // draw a little oval behind the stitch to indicate the base color of that round
            ctx.fillStyle = colorsArrayWithHash()[rounds[stitch.roundId].baseColorId];
            if(rounds[stitch.roundId].color) ctx.fillStyle = rounds[stitch.roundId].color;
            ctx.beginPath();
            let derivedLocation = stitchLocation(stitch);
            ctx.ellipse(derivedLocation.x, derivedLocation.y, radiusY, radiusX / 2, stitch.theta, startAngle, endAngle);
            ctx.stroke();
            ctx.fill();

            // a stitch is never any other color, so can use base color here
            ctx.fillStyle = colorsArrayWithHash()[rounds[stitch.roundId].baseColorId];
            if(rounds[stitch.roundId].color) ctx.fillStyle = rounds[stitch.roundId].color;

            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            ctx.lineWidth = 1;
            if (stitch.isIncrease && showMarks()) {
                ctx.lineWidth = 8;
            }

            // x and y parameters describe the middle of the ellipse
            ctx.beginPath();
            ctx.ellipse(derivedLocation.x, derivedLocation.y, radiusX, radiusY, stitch.theta, startAngle, endAngle);
            ctx.stroke();
            ctx.fill();

            ctx.lineWidth = 1;

            // what if, for each drop down, we actually created a column of yarn
            if (stitch.grandparentStitchId >= 0 && (stitch.ddType != 'N')) {
                let toStitch = stitch.grandparentStitchId;
                if (stitch.ddType == "L") {
                    toStitch--;
                    // be careful that haven't crossed round number and dropped too low
                    if (toStitch < 0 || (stitch.roundId-2 != stitches[toStitch].roundId)) {
                        toStitch = toStitch + rounds[stitch.roundId-2].stitchCount;
                    }
                } else if (stitch.ddType == "R") {
                    toStitch++;
                    // be careful that haven't crossed round number and skipped up too high
                    if ((stitch.roundId-2 != stitches[toStitch].roundId)) {
                       toStitch = toStitch - rounds[stitch.roundId-2].stitchCount;
                    }
                }
                let toPos = getIdCoords(toStitch);
                let priorStrokeStyle = ctx.strokeStyle;
                let priorStrokeWidth = ctx.lineWidth;
                ctx.lineWidth = 2*radiusX;
                //ctx.strokeStyle = colorsArrayWithHash()[stitch.baseColorId];
                ctx.strokeStyle = colorsArrayWithHash()[rounds[stitch.roundId].baseColorId];
                if(rounds[stitch.roundId].color) ctx.strokeStyle = rounds[stitch.roundId].color;
                ctx.beginPath();
                ctx.moveTo(derivedLocation.x, derivedLocation.y);
                ctx.lineTo(toPos.x, toPos.y);
                ctx.stroke();
                ctx.strokeStyle = priorStrokeStyle;
                ctx.lineWidth = priorStrokeWidth;
            }

            // always showing yarn, so no need to show black line for dd
            // if (showMarks()) {
            //     // draw the line to its connected stitch
            //     if (stitch.grandparentStitchId >= 0 && (stitch.ddType != 'N')) {

            //         // here we would have to look at the stitch DropDownTo value and shift left or right as appropriate.
            //         let toStitch = stitch.grandparentStitchId;
            //         if (stitch.ddType == "L") toStitch--;
            //         if (stitch.ddType == "R") toStitch++;
            //         let toPos = getIdCoords(toStitch);
            //         ctx.beginPath();
            //         ctx.moveTo(derivedLocation.x, derivedLocation.y);
            //         ctx.lineTo(toPos.x, toPos.y);
            //         ctx.stroke();
            //     }
            // }

            let currRound = getRound(stitch);

            if (stitch.id == currRound.firstStitchNbr && showMarks()) {
                // cannot put in the middle of the circle because interferes with color detection
                ctx.strokeText(currRound.humanId, derivedLocation.x + radiusX/2, derivedLocation.y + radiusY/2);
            }
            if (showNbrs) ctx.strokeText(stitch.id, derivedLocation.x, derivedLocation.y);

            // if ((stitch.ddType != 'N') && showMarks()) {
            //     // ctx.strokeText('X', stitch.x, stitch.y);
            //     ctx.strokeText('X', derivedLocation.x, derivedLocation.y);
            // }


        })

        //saveNow();
    }


    function getIdCoords(id) {
        let pos;

        stitches.forEach(stitch => {
            if (stitch.id == id) {
                pos = stitchLocation(stitch);
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
        let radiusY = stitchSize();
        let radiusX = stitchSize() * .8;

        let derivedLocation = stitchLocation(stitch);
        if (Math.pow(point.x - derivedLocation.x, 2) / Math.pow(radiusX, 2) + Math.pow(point.y - derivedLocation.y, 2) / Math.pow(radiusY, 2) < 1) {
            return true;
        }
        else
            return false;
    }

    function attemptDropDown(stitch, recurseFlag) {
        // cannot drop down from first row
        if (stitch.roundId < startRound) {
            sendRoundInfoAlert('Stitch is in first two rounds.  Cannot dropdown.');
            return;
        }

        // cannot dropp down if already dropped upon
        // to determine if a stitch is already covered by yarn, check the color of the center of the stitch in the canvas
        let derivedLocation = stitchLocation(stitch);
        var pixelData = ctx.getImageData(derivedLocation.x, derivedLocation.y, 1, 1).data; 
        let yarnColor = rgbToHex(pixelData[0], pixelData[1], pixelData[2]);
        //let baseColor = colorsArrayNoHash()[stitch.baseColorId]
        let baseColor = colorsArrayNoHash()[rounds[stitch.roundId].baseColorId];

        if (hexColorDelta(yarnColor, baseColor)<.96 &&
            hexColorDelta(yarnColor, rounds[stitch.roundId].color)){
            sendRoundInfoAlert('Stitch is already dropped upon.  Cannot itself drop down.');
            return;
        }

        //attemptColorLowerStitch(stitch);
        findDropDownLocation(stitch);
        
        // fix written instructions
        if (stitch.ddType != 'N') {
            // here we need additional instructions if looking to left or right
            if (stitch.isIncrease) {
                stitch.writtenInstruction = "incDddc"
            } else {
                stitch.writtenInstruction = "dddc"
            }
            if (stitch.ddType == 'L') stitch.writtenInstr = stitch.writtenInstr + " (cc)";
            if (stitch.ddType == 'R') stitch.writtenInstr = stitch.writtenInstr + " (c)";
        } else {
            if (stitch.isIncrease) {
                stitch.writtenInstruction = "incBlsc"
            } else {
                stitch.writtenInstruction = "blsc"
            }
        }
                
        // if should be symmetrical, find symmetry stitches and drop them too
        if(createSymmetry() && recurseFlag) {
            // use mod to compute the symmetry group that are looking for
            let symmetryGroup = stitch.id % (stitch.roundId + 1);
            stitches.forEach(symStitch => {
                // if the stitch is in the same round and in the same symmetry group, it should also drop down
                // but don't call for the stitch you already did, because will undo it
                if (symStitch.roundId == stitch.roundId && 
                    symStitch.id % (symStitch.roundId + 1) == symmetryGroup &&
                    symStitch.id != stitch.id) {
                    showErrors = false;
                    attemptDropDown(symStitch,false);
                    showErrors = true;
                }
            })
        }

    }


    function findDropDownLocation(sourceStitch) {        
        sourceStitch.ddType = nextDDPosition(sourceStitch.ddType);
        return true;
    }

    function attemptColorLowerStitch(sourceStitch) {
        let success = false;
       // let newColorId = getBaseColorId(sourceStitch.roundId);
        let oldddType = sourceStitch.ddType;
        let newddType;

        let targetStitchId = sourceStitch.parentStitchId;
        // if original drop
        ('old type ' + oldddType + ' new type ' + nextDDPosition(oldddType));
        newddType = nextDDPosition(oldddType);
        switch (oldddType) {
            case 'X': // moving from X to L
                targetStitchId--;
                //need to be careful that haven't dropped down a row
                break;
            case 'L': // moving from L to R
                targetStitchId++;
                break;
            case 'R': // moving from R to N
                targetStitchId = null;
                success = true;
                break;
            default: // moving from N to X
                targetStitchId = sourceStitch.parentStitchId;
                
        }

        // first we attempt to drop down on the new stitch.  If successful, we will clear prior stitch.
        if (newddType != 'N') {
            if (stitches[targetStitchId].ddType != 'N') {
                sendRoundInfoAlert('Stitch cannot drop down onto a stitch that is itself dropping down.');
                success = false;
                return success;       
            }
        }
        success = true;
   
     

        //update the source stitch with the new value for its drop down.
        if (success) sourceStitch.ddType = newddType;
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

    function lineAtAngle(x1, y1, length, angle, canvas) {
        canvas.moveTo(x1, y1);
        x2 = x1 + Math.cos(angle) * length;
        y2 = y1 + Math.sin(angle) * length;
        canvas.lineTo(x2, y2);
        canvas.stroke();
    }

    function writeRoundDetails() {
        addInstrLine("Stitches in bold outline are recommended increase stitches.  They should be constructed in the same lower-round stitch as their immediate prior stitch.", 'dd');
        addInstrLine("blsc = Back-Loop Single Crochet (US terminology)", 'blsc');
        addInstrLine("incBlsc = Back-Loop Single Crochet - Increase (US terminology)", 'incblsc');
        addInstrLine("dddc = Drop-Down Double Crochet (US terminology)", 'dddc');
        addInstrLine("incDddc = Drop-Down Double Crochet - Increase (US terminology)  For this stitch, drop down to the appropriate lower loop as normal, however do not skip a stitch before placing the next stitch.  This will accomplish the increase.", 'incdddc');
        addInstrLine("sl = Slip Stitch to close Round", 'slst');
        addInstrLine("ch = Chain", 'ch');
        addInstrLine("NOTE:  First stitch of each round starts in the same location as the slip stitch that joined the round together", 'note');
        addInstrLine("Depending upon your personal crochet tension, you may get smoother results if you choose not to skip a stitch behind a dddc.")
        addInstrLine("__________________________________________________________________");
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
        if(round.id==0) {
            roundInstr = 'R1: ' + round.stitchCount + ' sc in magic circle, sl in new color, ch'
        } else {

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
                    if (instrCount == 1) roundInstr = roundInstr + ", " + prevInstr;
                    if (instrCount > 1) roundInstr = roundInstr + ", " + instrCount + " x " + prevInstr;
                    // set up for next batch
                    prevInstr = currInstr;
                    instrCount = 1;
                }
            })

            //write the last instruction
            if (instrCount == 1) roundInstr = roundInstr + ", "  + prevInstr;
            if (instrCount > 1) roundInstr = roundInstr + ", " + instrCount + " x " + prevInstr;
            //trim off the leading comma
            roundInstr = roundInstr.substring(2);

            // add intro text
            roundInstr = "R" + round.humanId + " (" + round.stitchCount + " stitches): " + roundInstr;
            // add closing text
            roundInstr = roundInstr + ", sl in new color, ch"
        }
        
        // build instruction row as: row 
        // figure out color div definition
        var colorDiv = document.createElement('div');
        colorDiv.className = 'box';
        colorDiv.style.backgroundColor =  colorsArrayWithHash()[round.baseColorId];
        

        var ul = document.getElementById("roundsList");

        var li = document.createElement("li");
        let roundId = 'round' + round.id;
        li.setAttribute('id', roundId);
        li.appendChild(colorDiv);
        li.appendChild(document.createTextNode(roundInstr));
        ul.appendChild(li);

        $('#' + roundId).addClass('list-group-item');
    }

    function addInstrLine(instr, label) {
        // var colorDiv = document.createElement('div');
        // colorDiv.className = 'box inline';
        // colorDiv.style.backgroundColor = round.baseColorId;
        

        var ul = document.getElementById("roundsList");

        var oldLi = document.getElementById(label);
        if (oldLi) ul.removeChild(oldLi);

        var li = document.createElement("li");
        li.setAttribute('id', label);
        //li.appendChild(colorDiv);
        li.appendChild(document.createTextNode(instr));
        ul.appendChild(li);

        $('#' + label).addClass('list-group-item');
    }

    function removeRoundDetail(round) {
        var ul = document.getElementById("roundsList");
        var li = document.getElementById('round' + round.id);
        // ul won't exist first time through the code
        if (li) ul.removeChild(li);
    }

    function sendRoundInfoAlert(textMsg) {
        if(!showErrors) return;
        var errorDiv = document.getElementById('errorDiv');
        sendInfoAlert(textMsg, errorDiv);
    }

    function resetChart(){
        resetColors();
        // update local storage with new values
        localStorage.setItem('bq', $('#baseStitches').val()>0 ? $('#baseStitches').val() : 6);
        localStorage.setItem('sz', $('#stitchSize').val()>0   ? $('#stitchSize').val()   : 10);
    
        // must reset chart
        stitches = [];
        // let shortStitches = [];
        localStorage.setItem('sts', JSON.stringify([]));
    
        constructStitches();
        drawAllStitches();
        writeRoundDetails();    
    }

    function resetColors(){
        // update local storage with new values
        let nbrColors     = $('#nbrColors').val()>0    ? $('#nbrColors').val()    : 3; 
        let colors = [];
        // JSON can't work with # signs, so store only the values
        
        colors.push($('#color0').val().slice(1));
        colors.push($('#color1').val().slice(1));
        if (nbrColors > 2) colors.push($('#color2').val().slice(1));
        if (nbrColors > 3) colors.push($('#color3').val().slice(1));
    
        localStorage.setItem('ca', JSON.stringify(colors));        
    
        rounds.forEach(round => {
            round.baseColorId = round.id % nbrColors;
        })

        //constructStitches();
        drawAllStitches();
        writeRoundDetails();    
    }

   
    function saveNow() {
        // only save the stitches that have changed from default
        var ssTemp = [];
        stitches.forEach(stitch => {
            if (stitch.ddType != 'N') {
                // here we would have to push the stitch number and either an X, L, or R next to it
                ssTemp.push(stitch.id + stitch.ddType);
                localStorage.setItem('sts', JSON.stringify(ssTemp));
            }
        })
        //const stitchesJson = JSON.stringify(shortStitches);
    
        // save the specialized row colors
        var srTemp = [];
        rounds.forEach(r => {
            srTemp.push(r.color);
        })
        localStorage.setItem('rowc', JSON.stringify(srTemp));

        axios.post('/savePattern', {
            dd: localStorage.getItem('sts'),
            bq: baseStitchQty(),
            sz: stitchSize(),
            ca: localStorage.getItem('ca'),
            t:  patternName(),
            id: localStorage.getItem('id'),
            tp: 'rnd',
            pb: localStorage.getItem('pb'),
            rowc: localStorage.getItem('rowc')
        })
        .then(function (response) {
            console.log(response);
        })
        .catch(function (error) {
            console.log(error);
        });
    
    }
}); //document ready

function nextDDPosition (startPosition) {
    let ddTypes = ['X','L','R','N']
    let nextPos;
    for(i=0; i< ddTypes.length; i++) {
        if (ddTypes[i] == startPosition) nextPos = i+1;
    }
    if (nextPos >= ddTypes.length) nextPos = 0;
    return ddTypes[nextPos];
}

function initializeLocalStorage() {
    // first check to see if we were passed a pattern
    localStorage.clear();
    if ($('#opBaseStitches').length > 0) localStorage.setItem('bq', $('#opBaseStitches').val());
    if ($('#opStitchSize').length > 0) localStorage.setItem('sz', $('#opStitchSize').val());
    if ($('#opDdStitches').length > 0) localStorage.setItem('sts', $('#opDdStitches').val());
    if ($('#opColors').length > 0) localStorage.setItem('ca', $('#opColors').val());
    if ($('#opName').length > 0) localStorage.setItem('t', $('#opName').val());
    if ($('#opId').length > 0) localStorage.setItem('id', $('#opId').val());
    if ($('#oppb').length > 0) localStorage.setItem('pb', $('#oppb').val());
    if ($('#opRowColors').length > 0) localStorage.setItem('rowc', $('#opRowColors').val());

    // if we had a pattern, then
    if (!localStorage.getItem("t")) localStorage.setItem("p",0); else localStorage.setItem("p",1);

    if (!localStorage.getItem("t")) localStorage.setItem("t","Draft Pattern");
    if (!localStorage.getItem("bq")) localStorage.setItem("bq",6);
    if (!localStorage.getItem("sz")) localStorage.setItem("sz",10);
    let defaultColors = ["9b4f3f","FFFFFF","D4AF37"];
    if (!localStorage.getItem("ca"))  localStorage.setItem("ca",  JSON.stringify(defaultColors));
    if (!localStorage.getItem("sts")) localStorage.setItem("sts", JSON.stringify([]));
    if (!localStorage.getItem("pb")) localStorage.setItem("pb",0);
    if (!localStorage.getItem("rowc")) localStorage.setItem("pb",JSON.stringify([]));


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
function showMarks() {
    if (localStorage.getItem('sh') == 0) return false;
    return true;
}

function createSymmetry() {
    if (localStorage.getItem('sy') == 0) return false;
    return true;
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
function rowColorsArray() {
    if (localStorage.getItem('rowc')) return JSON.parse(localStorage.getItem('rowc'));
    else return [];
}
