document.addEventListener("DOMContentLoaded", function(){

    //////////////////////////////////////////////////////
    // if local storeage not initiated, default themwrite
    //////////////////////////////////////////////////////
    initializeLocalStorage();

    // set the form fields
    $('#patternName').text(patternName());

    $('#nbrColors').val(nbrColors());
    $('#baseStitches').val(baseStitchQty()-2);
    $('#nbrRows').val(nbrRows());
    $('#color0').val(colorsArrayWithHash()[0]);
    $('#color1').val(colorsArrayWithHash()[1]);
    $('#color2').val(colorsArrayWithHash()[2]);
    $('#color3').val(colorsArrayWithHash()[3]);
 
    var colorPicker = null; // Store a reference to the color picker element
    var popup = null; // Store a reference to the popup container

    
    // hard to drop down onto first circle or two
    let startRow = 2;  // cant land on rows 0 or 1
    // show numbers on stitches.  Useful for debugging
    let showNbrs = false;

    let randomThreshold = .1;
    let showErrors = true;

    let canvas = $('#myCanvas')[0];
    let ctx = canvas.getContext("2d");

    // capture initial canvas size 
    let initCanvasWidth  = canvas.width;
    let initCanvasHeight = canvas.height;

    // compute maxiumum number of stitches that will fit
    let rows = [];
    let stitches = [];

    if (canvas.getContext) {
//        drawStartingRow();
        renderColorPickers();
        constructStitches();
        reconstructFromLocal();

        drawAllStitches();
        writeRowDetails();
    }

    $('#nbrColors')[0].addEventListener('change', (e) => {
        validateNumberInput($('#nbrColors')[0]);
        renderColorPickers();
        resetColors();
        //resetChart();
    });

    $('#showMarks')[0].addEventListener('click', (e) => {
        if ($('#showMarks')[0].checked) localStorage.setItem('rsh',  1)
        else localStorage.setItem('rsh',  0);
        drawAllStitches();
    });

    // var menuNode = document.getElementById('menu');

    const button = document.getElementById('button')
    let timer
    canvas.addEventListener('click', event => {
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
        writeRowDetails();
    }

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
                chosenRow = stitch.rowId;
            }
        });
        // Create an input element of type color
        colorPicker = document.createElement("input");
        colorPicker.type = "color";
        colorPicker.value = colorsArrayWithHash()[rows[chosenRow].baseColorId];
        if(rows[chosenRow].color) colorPicker.value = rows[chosenRow].color;
        colorPicker.addEventListener("change", function () {
            // get the new color, and close the color picker
            rows[chosenRow].color = colorPicker.value;
            closeColorPicker();
            drawAllStitches();
        });

        // Create a button
        var button = document.createElement("button");
        button.textContent = "Reset";
        button.addEventListener("click", function () {
            // Close the color picker and button container
            rows[chosenRow].color = null;
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
        renamePattern(patternName(), nameField.value, 'rct');
        localStorage.setItem('rt', nameField.value);
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
    
    let goButton = document.getElementById('goButton');
    goButton.addEventListener("click", function() {
        resetChart();
    });

    let baseStitches = document.getElementById('baseStitches');
    baseStitches.addEventListener("change", function() {
        validateNumberInput(this);
        resetChart();
    });
    
    let nbrRowsField = document.getElementById('nbrRows');
    nbrRowsField.addEventListener("change", function() {
        validateNumberInput(this);
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
        originX = 0;
        originY = canvas.height;    
        let ss = [];

        // constant for all stitches
  

        let startingX = originX;
        let id = 0;
        let currColorId = 0;

        for (let j = 0; j < nbrRows(); j++) {
        
            let currentRow = {
                id: j,
                humanId: j + 1,
                stitchCount: baseStitchQty(),
                baseColorId: currColorId,
                firstStitchNbr: id,
                color: rowColorsArray()[j]
            }
            rows.push(currentRow);

            ///////////////////////////////////////
            // push starting sc stich
            ///////////////////////////////////////
            stitches.push({
                id: id,  //save
                //currColorId: currColorId,
                //baseColorId: currColorId,
                colorFrom: j,
                rowId: j,
                parentStitchId: id - (baseStitchQty()*1),
                grandparentStitchId: getParent(id - (baseStitchQty()*1)),
                isDropDown: false,
                writtenInstruction: "sc"
            });
            id++;

            for (let i = 0; i < currentRow.stitchCount-2; i++) {
        
                var parentStitchId = id - baseStitchQty();

                let writtenInstr = "blsc"

                // find the 'grandmother' of the stitch.  this is the stitch that this stitch would drop down to
                // we just found the parentStitchId, which is this stitch's mother.  So just need to get the parentStitchId of the parentStitchId.
                let grandparentStitchId = getParent(parentStitchId);

                // reconstruct relevant information from saved shortStitches
                //let stitchColorId = currColorId;
                let isDropDown = false;
      
                stitches.push({
                    id: id,  //save
                    //currColorId: stitchColorId,
                    //baseColorId: stitchColorId,
                    colorFrom: j,
                    rowId: j,
                    parentStitchId: parentStitchId,
                    grandparentStitchId: grandparentStitchId,
                    isDropDown: isDropDown,
                    writtenInstruction: writtenInstr
                });

                // prep for next cycle
                id++;
            }

            ///////////////////////////////////////
            // push final sc stich
            ///////////////////////////////////////
            stitches.push({
                id: id,  //save
                //currColorId: currColorId,
                //baseColorId: currColorId,
                colorFrom: j,
                rowId: j,
                parentStitchId: id - baseStitchQty(),
                grandparentStitchId: getParent(id - baseStitchQty()),
                isDropDown: false,
                writtenInstruction: "sc"
            });
            id++;

            currColorId++;
            if (currColorId >= nbrColors()) currColorId = 0;
        }
}

    function stitchLocation(stitch) {
        // note that pattern goes from right to left
        // this computes the squares upper left corner, because will draw down and rightwards.
        let originX = canvas.width;
        let originY = canvas.height; 
        let squareW = canvas.width / (baseStitchQty()*1);
        let squareH = canvas.height / (nbrRows()*1 + 1);   
        // x position:  divide the ID value by the baseStitchQty and the remainder (mod) is how many stitches
        let pos = {
            x: originX - squareW * ((stitch.id % baseStitchQty())+1),
            y: originY - squareH * ((stitch.rowId) + 1)
        };

        // shift up (down?) by half a stitch to account for foundation row

        //pos.x = pos.x - squareW;
        pos.y = pos.y - (squareH / 2);
  
        return pos;
    }

    function reconstructFromLocal(){
        shortStitches().forEach(stitch => {
            attemptDropDown(stitches[stitch], false);
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

    function clearCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.beginPath();
    }

    function drawAllStitches() {
        // resize canvas so that stitches are always squares
        // bug whereby continual resize was shrinking canvas space
        //let squareWidth = Math.min(canvas.width / (baseStitchQty()*1), canvas.height / (nbrRows()*1 + 1))
        let squareWidth = Math.min(initCanvasWidth / (baseStitchQty()*1), initCanvasHeight / (nbrRows()*1 + 1))
        canvas.setAttribute('width', squareWidth * (baseStitchQty()*1));
        canvas.setAttribute('height', squareWidth * (nbrRows()*1+1));

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.beginPath();

        // constant for all stitches
        //let w = canvas.width / (baseStitchQty()+2);
        //let h = canvas.height / (nbrRows()+1);
        let w = squareWidth;
        let h = squareWidth;

        // need to add space for foundation row, finishing top row, and two side panels of scs
        // side panels will be full stitch width.  Top and bottom rows will each be half of the height of a normal stitch.

        /////////////////////////////////////////////
        // foundation row 
        /////////////////////////////////////////////
        // find row 0 color
        let row0color = colorsArrayWithHash()[rows[0].baseColorId];
        if (rows[0].color) row0color = rows[0].color;

        let startingY = canvas.height - h/2;

        for (let i = 0; i < baseStitchQty(); i++) {
            ctx.fillStyle = row0color;
            ctx.beginPath();
            let startingX = canvas.width - (i+1)*w;

            ctx.rect(startingX, startingY, w, h/2);
            ctx.stroke();
            ctx.fill();

            if (showMarks()) {
                ctx.strokeText('ch', startingX + w/2, startingY + h/4);
            }

        }        

        /////////////////////////////////////////////
        // finishing row 
        /////////////////////////////////////////////
        let topRowColor = colorsArrayWithHash()[rows[rows.length -1].baseColorId];
        if (rows[rows.length -1].color) topRowColor = rows[rows.length -1].color;

        startingY = 0;

        for (let i = 0; i < baseStitchQty(); i++) {
            ctx.fillStyle = topRowColor;
            ctx.beginPath();
            let startingX = canvas.width - (i+1)*w;

            ctx.rect(startingX, startingY, w, h/2);
            ctx.stroke();
            ctx.fill();

            if (showMarks()) {
                ctx.strokeText('sl', startingX + w/2, startingY + h/4);
            }

        }        

        // /////////////////////////////////////////////
        // // pattern
        // /////////////////////////////////////////////
                
        stitches.forEach(stitch => {
            ////////////////////////////
            // fill in current stitch
            ////////////////////////////
            //ctx.fillStyle = colorsArrayWithHash()[stitch.currColorId];
            // no longer deriving color from above... always use own color and drop down instead
            if(rows[stitch.rowId].color) {
                ctx.fillStyle = rows[stitch.rowId].color;
            } else {
                ctx.fillStyle = colorsArrayWithHash()[rows[stitch.rowId].baseColorId];
            }
            ctx.beginPath();
            let derivedLocation = stitchLocation(stitch);

            ctx.rect(derivedLocation.x, derivedLocation.y, w, h);
            ctx.stroke();
            ctx.fill();

            // what if, for each drop down, we actually created a column of yarn
            if (stitch.isDropDown) {
                let toStitch = stitch.grandparentStitchId;
                let toPos = getIdCoords(toStitch);                
                let priorStrokeStyle = ctx.strokeStyle;
                let priorStrokeWidth = ctx.lineWidth;
                ctx.lineWidth = w;
                ctx.strokeStyle = ctx.fillStyle;
                ctx.strokeStyle = '#fffff';
                ctx.beginPath();
                ctx.moveTo(derivedLocation.x + w/2, derivedLocation.y);
                ctx.lineTo(toPos.x + w/2, toPos.y);
                ctx.stroke();
                ctx.strokeStyle = priorStrokeStyle;
                ctx.likeWidth = priorStrokeWidth;
            }
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.lineWidth = 1;

            if (showMarks()) {
                // draw the line to its connected stitch
                if (stitch.grandparentStitchId >= 0 && stitch.isDropDown) {
                    let toPos = getIdCoords(stitch.grandparentStitchId);
                    ctx.beginPath();
                    ctx.moveTo(derivedLocation.x + w/2, derivedLocation.y + h/2);
                    ctx.lineTo(toPos.x + w/2, toPos.y + h/2);
                    ctx.stroke();
                }
            }

            let currRow = rows[stitch.rowId];

            if (stitch.id == currRow.firstStitchNbr && showMarks()) {
                ctx.strokeText(currRow.humanId, derivedLocation.x + (3*w/4), derivedLocation.y + (3*h/4));
            }
            if (showNbrs) ctx.strokeText(stitch.id, derivedLocation.x + (w/2), derivedLocation.y + (h/2));

            if (stitch.isDropDown && showMarks()) {
                ctx.strokeText('X', derivedLocation.x + w/2, derivedLocation.y + h/2);
            }
            if (stitch.writtenInstruction == 'sc' && showMarks()) {
                ctx.strokeText(stitch.writtenInstruction, derivedLocation.x + (w/2), derivedLocation.y + (h/2));
            }


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

    function isIntersect(point, stitch) {
        let stitchW = canvas.width / baseStitchQty();
        let stitchH = canvas.height / nbrRows();

        let derivedLocation = stitchLocation(stitch);


        if (
            point.x > derivedLocation.x &&
            point.x < derivedLocation.x + stitchW &&
            point.y > derivedLocation.y &&
            point.y < derivedLocation.y + stitchH 
        ) {
            return true;
        }
        else
            return false;
    }


    function attemptDropDown(stitch, recurseFlag) {
        // cannot drop down from first row
        if (stitch.rowId < startRow) {
            sendRowInfoAlert('Stitch is in first two rows.  Cannot dropdown.');
            return;
        }
        // cannot drop down sc column
        if(stitch.writtenInstruction == "sc"){
            sendRowInfoAlert('Stitch is starting or ending column of single crochet stitches.  Cannot dropdown.');
            return;
        }

        // // cannot dropp down if already dropped upon
        // if (stitch.currColorId != getBaseColorId(stitch.rowId)) {
        //     sendRowInfoAlert('Stitch is already dropped upon.  Cannot itself drop down.');
        //     return;
        // }
        // if already a dd, clear 
        if (colorLowerStitch(stitch, !stitch.isDropDown)) {
            stitch.isDropDown = !stitch.isDropDown;
        };
        if(stitch.isDropDown) stitch.writtenInstruction = "dddc";
        else stitch.writtenInstruction = "blsc"


        // if should be symmetrical, find symmetry stitches and drop them too
        // if(createSymmetry() && recurseFlag) {
        //     // use mod to compute the symmetry group that are looking for
        //     let symmetryGroup = stitch.id % (stitch.rowId + 1);
        //     stitches.forEach(symStitch => {
        //         // if the stitch is in the same row and in the same symmetry group, it should also drop down
        //         // but don't call for the stitch you already did, because will undo it
        //         if (symStitch.rowId == stitch.rowId && 
        //             symStitch.id % (symStitch.rowId + 1) == symmetryGroup &&
        //             symStitch.id != stitch.id) {
        //             showErrors = false;
        //             attemptDropDown(symStitch,false);
        //             showErrors = true;
        //         }
        //     })
        // }

    }


    function colorLowerStitch(sourceStitch, ddBool) {
        let success = false;
        stitches.forEach(stitch => {
            if (stitch.id == sourceStitch.parentStitchId) {
                //cannot be dropped on if already dropped on by another stitch
                if (ddBool && (stitch.colorFrom != stitch.rowId)) {
                    sendRowInfoAlert('Stitch cannot drop down onto a stitch that is already dropped onto by another stitch.');
                    success = false;
                    return success;
                }
                if (ddBool) {
                    //stitch.currColorId = newColorId;
                    stitch.colorFrom = sourceStitch.rowId;
                }
                else {
                    //stitch.currColorId = stitch.baseColorId;
                    stitch.colorFrom = stitch.rowId;
                }
                success = true;
            }
        })
        return success;
    }

    function writeRowDetails() {
        addInstrLine("When the 'Show Stitch Marks' option is turned on, the 'x' marks indicate stitches that should drop down to the exposed front loop two rows earlier.", 'inc');
        addInstrLine("sc = Single Crochet (US terminology)", 'sc');
        addInstrLine("blsc = Back-Loop Single Crochet (US terminology)", 'blsc');
        addInstrLine("dddc = Drop-Down Double Crochet (US terminology)", 'dddc');
        addInstrLine("ch = Chain", 'ch');
        addInstrLine("RS = right side of work", 'ch');
        addInstrLine("__________________________________________________________________");
        rows.forEach(row => {
            addRowDetail(row);
        })
    }
    function addRowDetail(row) {
        // clear last instructions
        removeRowDetail(row);

        // generate instructions
        let rowInstr = "";

        let currInstr = "";
        let prevInstr = " ";
        let instrCount = 0;

        // must have foundation row of chains in same color as R1
        if(row.id==0) {
            rowInstr = 'Foundation row and R1: ' + row.stitchCount + ' x ch, plus an additional turning ch. Starting in 2nd chain from hook, ' + row.stitchCount + ' x sc '
        } else {

            stitches.forEach(stitch => {
                // only look at stitches in this row
                if (stitch.rowId != row.id) {
                    return;
                }

                // new batch of instructions
                let currInstr = stitch.writtenInstruction;
                if (currInstr == prevInstr) {
                    // increment the count and move on
                    instrCount++;
                } else {
                    // write what we know
                    if (instrCount == 1) rowInstr = rowInstr + ", " + prevInstr;
                    if (instrCount > 1) rowInstr = rowInstr + ", " + instrCount + " x " + prevInstr;
                    // set up for next batch
                    prevInstr = currInstr;
                    instrCount = 1;
                }
            })

            //write the last instruction
            if (instrCount == 1) rowInstr = rowInstr + ", "  + prevInstr;
            if (instrCount > 1) rowInstr = rowInstr + ", " + instrCount + " x " + prevInstr;
            //trim off the leading comma
            rowInstr = rowInstr.substring(2);

            // add intro text
            rowInstr = "R" + row.humanId + ": attach new color yarn on RS with " + rowInstr + ', fasten off and cut yarn';
            // add closing text
            // rowInstr = rowInstr + ", sl in new color, ch"
        }
        
        // build instruction row as: row 
        // figure out color div definition
        var colorDiv = document.createElement('div');
        colorDiv.className = 'box';
        if (row.color) {
            colorDiv.style.backgroundColor = row.color;
        } else {
            colorDiv.style.backgroundColor =  colorsArrayWithHash()[row.baseColorId];
        }
        
        

        var ul = document.getElementById("rowsList");

        var li = document.createElement("li");
        let rowId = 'row' + row.id;
        li.setAttribute('id', rowId);
        li.appendChild(colorDiv);
        li.appendChild(document.createTextNode(rowInstr));
        ul.appendChild(li);

        $('#' + rowId).addClass('list-group-item');
    }

    function addInstrLine(instr, label) {
        // var colorDiv = document.createElement('div');
        // colorDiv.className = 'box inline';
        // colorDiv.style.backgroundColor = row.baseColorId;
        

        var ul = document.getElementById("rowsList");

        var oldLi = document.getElementById(label);
        if (oldLi) ul.removeChild(oldLi);
        
        var li = document.createElement("li");
        li.setAttribute('id', label);
        //li.appendChild(colorDiv);
        li.appendChild(document.createTextNode(instr));
        ul.appendChild(li);

        $('#' + label).addClass('list-group-item');
    }

    function removeRowDetail(row) {
        var ul = document.getElementById("rowsList");
        var li = document.getElementById('row' + row.id);
        // ul won't exist first time through the code
        if (li) ul.removeChild(li);
    }


    function sendRowInfoAlert(textMsg) {
        if(!showErrors) return;
        var errorDiv = document.getElementById('errorDiv');
        sendInfoAlert(textMsg, errorDiv);
    }

    function resetChart(){
        //resetColors();
        // update local storage with new values
        localStorage.setItem('rbq', $('#baseStitches').val()>0 ? $('#baseStitches').val() : 20);
        localStorage.setItem('rsz', $('#nbrRows').val()>0   ? $('#nbrRows').val()   : 20);

        // must reset chart
        stitches = [];
        rows=[];
        // let shortStitches = [];
        localStorage.setItem('rsts', JSON.stringify([]));
    
        constructStitches();
        drawAllStitches();
        writeRowDetails();
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
    
        localStorage.setItem('rca', JSON.stringify(colors));       

       rows.forEach(row => {
            row.baseColorId = row.id % nbrColors;
        })
    
        drawAllStitches();
        writeRowDetails();    
    }

    function saveNow() {
        // only save the stitches that have changed from default
        var ssTemp = [];
        stitches.forEach(stitch => {
            if (stitch.isDropDown) {
                ssTemp.push(stitch.id);
                localStorage.setItem('rsts', JSON.stringify(ssTemp));
            }
        })
        //const stitchesJson = JSON.stringify(shortStitches);

        // save the specialized row colors
        var srTemp = [];
        rows.forEach(r => {
            srTemp.push(r.color);
        })
        localStorage.setItem('rowc', JSON.stringify(srTemp));

                

        axios.post('/savePattern', {
            dd: localStorage.getItem('rsts'),
            bq: baseStitchQty()-2,
            sz: nbrRows(),
            ca: localStorage.getItem('rca'),
            t:  patternName(),
            id: localStorage.getItem('rid'),
            tp: 'rct',
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

function initializeLocalStorage() {
    // first check to see if we were passed a pattern
    localStorage.clear();
    if ($('#opBaseStitches').length > 0) localStorage.setItem('rbq', $('#opBaseStitches').val());
    if ($('#opnbrRows').length > 0) localStorage.setItem('rsz', $('#opnbrRows').val());
    if ($('#opDdStitches').length > 0) localStorage.setItem('rsts', $('#opDdStitches').val());
    if ($('#opColors').length > 0) localStorage.setItem('rca', $('#opColors').val());
    if ($('#opName').length > 0) localStorage.setItem('rt', $('#opName').val());
    if ($('#opId').length > 0) localStorage.setItem('rid', $('#opId').val());
    if ($('#oppb').length > 0) localStorage.setItem('pb', $('#oppb').val());
    if ($('#opRowColors').length > 0) localStorage.setItem('rowc', $('#opRowColors').val());
    
    // if we had a pattern, then
    if (!localStorage.getItem("rt")) localStorage.setItem("rp",0); else localStorage.setItem("rp",1);

    if (!localStorage.getItem("rt")) localStorage.setItem("rt","Draft Pattern");
    if (!localStorage.getItem("rbq")) localStorage.setItem("rbq",20);
    if (!localStorage.getItem("rsz")) localStorage.setItem("rsz",20);
    let defaultColors = ["9b4f3f","FFFFFF","D4AF37"];
    if (!localStorage.getItem("rca"))  localStorage.setItem("rca",  JSON.stringify(defaultColors));
    if (!localStorage.getItem("rsts")) localStorage.setItem("rsts", JSON.stringify([]));
    if (!localStorage.getItem("pb")) localStorage.setItem("pb",0);
    if (!localStorage.getItem("rowc")) localStorage.setItem("pb",JSON.stringify([]));

}

// easier access to local variables
function colorsArrayNoHash() {
    return JSON.parse(localStorage.getItem('rca'));
}
function colorsArrayWithHash() {
    let initialArray = JSON.parse(localStorage.getItem('rca'));
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
    if (localStorage.getItem('rsh') == 0) return false;
    return true;
}

function createSymmetry() {
    if (localStorage.getItem('rsy') == 0) return false;
    return true;
}

function baseStitchQty() {
    return (localStorage.getItem('rbq')*1) + 2;// add two for side panel sc columns
}
function patternName() {
    return localStorage.getItem('rt');
}
function nbrRows() {
    return localStorage.getItem('rsz');
}
function shortStitches() {
    return JSON.parse(localStorage.getItem('rsts'));
}
function rowColorsArray() {
    if (localStorage.getItem('rowc')) return JSON.parse(localStorage.getItem('rowc'));
    else return [];
}

