document.addEventListener("DOMContentLoaded", function(){

    //////////////////////////////////////////////////////
    // if local storeage not initiated, default themwrite
    //////////////////////////////////////////////////////
    initializeLocalStorage();

    // set the form fields
    $('#patternName').text(patternName());

    $('#nbrColors').val(nbrColors());
    $('#baseStitches').val(baseStitchQty());
    $('#nbrRows').val(nbrRows());
    $('#color0').val(colorsArrayWithHash()[0]);
    $('#color1').val(colorsArrayWithHash()[1]);
    $('#color2').val(colorsArrayWithHash()[2]);
    $('#color3').val(colorsArrayWithHash()[3]);

    
    // hard to drop down onto first circle or two
    let startRow = 2;  // cant land on rows 0 or 1
    // show numbers on stitches.  Useful for debugging
    let showNbrs = false;

    let randomThreshold = .1;
    let showErrors = true;

    let canvas = $('#myCanvas')[0];
    let ctx = canvas.getContext("2d");

    // compute maxiumum number of stitches that will fit
    let rows = [];
    let stitches = [];

    if (canvas.getContext) {
//        drawStartingRow();
        renderColorPickers();
        constructStitches();
        reconstructFromLocal();

    
       // saveLocally();
       drawAllStitches();
        //drawInCenter();
        writeRowDetails();
    }

    $('#nbrColors')[0].addEventListener('change', (e) => {
        validateNumberInput($('#nbrColors')[0]);
        renderColorPickers();
        resetChart();
    });

    // $('#createSymmetry')[0].addEventListener('click', (e) => {
    //     if ($('#createSymmetry')[0].checked) localStorage.setItem('sy',  1)
    //     else localStorage.setItem('sy',  0);
    // });

    $('#showMarks')[0].addEventListener('click', (e) => {
        if ($('#showMarks')[0].checked) localStorage.setItem('rsh',  1)
        else localStorage.setItem('rsh',  0);
        drawAllStitches();
    });

    canvas.addEventListener('click', (e) => {
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

    });

    let nameField = document.getElementById('patternNameInput');
    nameField.addEventListener("change", function() {
        localStorage.setItem('rt', nameField.value);
        $('#patternName').text(patternName());
        $('#patternNameInput').addClass("isHidden");
        $('#patternNameLabel').addClass("isHidden");
        saveNow();
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
        resetChart();
    });
    
    let color1Field = document.getElementById('color1');
    color1Field.addEventListener("change", function() {
        resetChart();
    });
    
    let color2Field = document.getElementById('color2');
    color2Field.addEventListener("change", function() {
        resetChart();
    });
    
    let color3Field = document.getElementById('color3');
    color3Field.addEventListener("change", function() {
        resetChart();
    });
    

    // localStorage.setItem('sz', $('#stitchSize').val()>0   ? $('#stitchSize').val()   : 10);
    // let nbrColors     = $('#nbrColors').val()>0    ? $('#nbrColors').val()    : 3; 
    // let colors = [];
    // // JSON can't work with # signs, so store only the values
    
    // colors.push($('#color0').val().slice(1));
    // colors.push($('#color1').val().slice(1));


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

        // const dataUrl = canvas.toDataURL();

        // let windowContent = '<!DOCTYPE html>';
        // windowContent += '<html>';
        // windowContent += '<head><title>Print canvas</title></head>';
        // windowContent += '<body>';
        // windowContent += '<img src="' + dataUrl + '">';
        // windowContent += '</body>';
        // windowContent += '</html>';

        // const printWin = window.open('', '', 'width=' + screen.availWidth + ',height=' + screen.availHeight);
        // printWin.document.open();
        // printWin.document.write(windowContent);

        // printWin.document.addEventListener('load', function () {
        //     printWin.focus();
        //     printWin.print();
        //     printWin.document.close();
        //     printWin.close();
        // }, true);
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
                firstStitchNbr: id
            }
            rows.push(currentRow);

            for (let i = 0; i < currentRow.stitchCount; i++) {
        
                var parentStitchId = id - baseStitchQty();

                let writtenInstr = "blsc"

                // find the 'grandmother' of the stitch.  this is the stitch that this stitch would drop down to
                // we just found the parentStitchId, which is this stitch's mother.  So just need to get the parentStitchId of the parentStitchId.
                let grandparentStitchId = getParent(parentStitchId);

                // reconstruct relevant information from saved shortStitches
                let stitchColorId = currColorId;
                let isDropDown = false;
      
                stitches.push({
                    id: id,  //save
                    currColorId: stitchColorId,
                    baseColorId: stitchColorId,
                    rowId: j,
                    parentStitchId: parentStitchId,
                    grandparentStitchId: grandparentStitchId,
                    isDropDown: isDropDown,
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
        // note that pattern goes from right to left
        let originX = canvas.width;
        let originY = canvas.height; 
        let squareW = canvas.width / (baseStitchQty()*1+2);
        let squareH = canvas.height / (nbrRows()*1 + 1);   
        if (stitch.id < 10) console.log('using width of ' + squareW + ' and height of ' + squareH);
        // x position:  divide the ID value by the baseStitchQty and the remainder (mod) is how many stitches
        let pos = {
            x: originX - squareW * (((stitch.id+1) % baseStitchQty())),
            y: originY - squareH * (stitch.rowId + 1)
        };

        // shift right by 1 stitch to account for side panel of scs
        // shift up (down?) by half a stitch to account for foundation row
        if (stitch.id <10 ) console.log(stitch.id + ' being shifted from ' + pos.x + ', ' + pos.y + ' to ');
        pos.x = pos.x - squareW;
        pos.y = pos.y - (squareH / 2);
        if (stitch.id < 10) console.log('            ' + pos.x + ', ' + pos.y)
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

    function getBaseColorId(rowId) {
        let baseColorId;
        rows.forEach(row => {
            if (row.id == rowId) {
                baseColorId = row.baseColorId;
            }
        })
        return baseColorId;
    }

    function clearCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.beginPath();
    }

    function drawAllStitches() {

        // need to add space for foundation row, finishing top row, and two side panels of scs
        // side panels will be full stitch width.  Top and bottom rows will each be half of the height of a normal stitch.
        let squareWidth = Math.min(canvas.width / (baseStitchQty()*1 + 2), canvas.height / (nbrRows()*1 + 1))

        // resize canvas so that stitches are always squares
        canvas.setAttribute('width', squareWidth * (baseStitchQty()*1+2));
        canvas.setAttribute('height', squareWidth * (nbrRows()*1+1));

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.beginPath();

        // constant for all stitches
        //let w = canvas.width / (baseStitchQty()+2);
        //let h = canvas.height / (nbrRows()+1);
        let w = squareWidth;
        let h = squareWidth;
                
        stitches.forEach(stitch => {
            // draw a little oval behind the stitch to indicate the base color of that row
            ctx.fillStyle = colorsArrayWithHash()[stitch.currColorId];
            ctx.beginPath();
            let derivedLocation = stitchLocation(stitch);

            ctx.rect(derivedLocation.x, derivedLocation.y, w, h);
            if(stitch.id < 10) console.log('drawing from ' + derivedLocation.x + ', ' + derivedLocation.y + ' for width of ' + w + ' and height of ' + h);
            ctx.stroke();
            ctx.fill();


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

            let currRow = getRow(stitch);

            if (stitch.id == currRow.firstStitchNbr && showMarks()) {
                ctx.strokeText(currRow.humanId, derivedLocation.x + (3*w/4), derivedLocation.y + (3*h/4));
            }
            if (showNbrs) ctx.strokeText(stitch.id, derivedLocation.x + (w/2), derivedLocation.y + (h/2));

            if (stitch.isDropDown && showMarks()) {
                ctx.strokeText('X', derivedLocation.x + w/2, derivedLocation.y + h/2);
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

    // function drawStartingRow() {
    //     originX = 0;
    //     originY = canvas.height;    
    //     h = canvas.height - (canvas.height / nbrRows());

    //     ctx.fillStyle = "rgba(255, 255, 255, 0.125)";
    //     ctx.fillStyle = colorsArrayWithHash()[3];


    //     ctx.beginPath();
    //     ctx.rect(200, 200, 100,100);
    //     ctx.stroke();
    //     ctx.fill();


    // }

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

        // cannot dropp down if already dropped upon
        if (stitch.currColorId != getBaseColorId(stitch.rowId)) {
            sendRowInfoAlert('Stitch is already dropped upon.  Cannot itself drop down.');
            return;
        }
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
        let newColorId = getBaseColorId(sourceStitch.rowId);
        stitches.forEach(stitch => {
            if (stitch.id == sourceStitch.parentStitchId) {
                if (stitch.isDropDown) {
                    // cannot drop down on another drop down
                    sendRowInfoAlert('Stitch cannot drop down onto a stitch that is itself dropping down.');
                    success = false;
                    return success;
                }

                //cannot be dropped on if already dropped on by another stitch
                if (ddBool && (stitch.currColorId != getBaseColorId(stitch.rowId))) {
                    sendRowInfoAlert('Stitch cannot drop down onto a stitch that is already dropped onto by another stitch.');
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

    function getRow(stitch) {
        let foundRow;

        rows.forEach(row => {
            if (stitch.rowId == row.id)
                foundRow = row;
        })
        return foundRow;
    }



    function writeRowDetails() {
        addInstrLine("When the 'Show Stitch Marks' option is turned on, the 'x' marks indicate stitches that should drop down to the exposed front loop two rows earlier.", 'inc');
        addInstrLine("sc = Single Crochet (US terminology)", 'sc');
        addInstrLine("blsc = Back-Loop Single Crochet (US terminology)", 'blsc');
        addInstrLine("dddc = Drop-Down Double Crochet (US terminology)", 'dddc');
        addInstrLine("ch = Chain", 'ch');
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
            rowInstr = 'Foundation row and R1: ' + row.stitchCount + ' x ch, plus an additional turning ch. Turn work. Starting in 2nd chain from hook, ' + row.stitchCount + ' x sc '
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
            rowInstr = "R" + row.humanId + ": " + rowInstr;
            // add closing text
            // rowInstr = rowInstr + ", sl in new color, ch"
        }
        
        // build instruction row as: row 
        // figure out color div definition
        var colorDiv = document.createElement('div');
        colorDiv.className = 'box';
        colorDiv.style.backgroundColor =  colorsArrayWithHash()[row.baseColorId];
        

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

    // function resizeCanvas(canvas) {
    //     var parent = canvas.parentElement;

    //     canvas.width = parent.offsetWidth;
    //     canvas.height = "auto";
    // }

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

    function sendRowInfoAlert(textMsg) {
        if(!showErrors) return;
        var errorDiv = document.getElementById('errorDiv');
        sendInfoAlert(textMsg, errorDiv);
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

                

        axios.post('/savePattern', {
            dd: localStorage.getItem('rsts'),
            bq: baseStitchQty(),
            sz: nbrRows(),
            ca: localStorage.getItem('rca'),
            t:  patternName(),
            id: localStorage.getItem('rid'),
            tp: 'rct'
        })
        .then(function (response) {
            console.log(response);
        })
        .catch(function (error) {
            console.log(error);
        });
    }


    function resetChart(){
        // update local storage with new values
        localStorage.setItem('rbq', $('#baseStitches').val()>0 ? $('#baseStitches').val() : 20);
        localStorage.setItem('rsz', $('#nbrRows').val()>0   ? $('#nbrRows').val()   : 20);
        let nbrColors     = $('#nbrColors').val()>0    ? $('#nbrColors').val()    : 3; 
        let colors = [];
        // JSON can't work with # signs, so store only the values
        
        colors.push($('#color0').val().slice(1));
        colors.push($('#color1').val().slice(1));
        if (nbrColors > 2) colors.push($('#color2').val().slice(1));
        if (nbrColors > 3) colors.push($('#color3').val().slice(1));
    
        localStorage.setItem('rca', JSON.stringify(colors));       

        // must reset chart
        stitches = [];
        // let shortStitches = [];
        localStorage.setItem('rsts', JSON.stringify([]));
    
        //saveLocally();
    
        constructStitches();
        drawAllStitches();
        writeRowDetails();
    
    
    }
}); //document ready

function initializeLocalStorage() {
    // first check to see if we were passed a pattern
    localStorage.clear();
    if ($('#opBaseStitches').length > 0) localStorage.setItem('rbq', $('#opBaseStitches').val());
    if ($('#opnbrRows').length > 0) localStorage.setItem('rsz', $('#opnbrRows').val());
    console.log('initializeLocalStorage set rsz to ' + localStorage.getItem('rsz'));
    if ($('#opDdStitches').length > 0) localStorage.setItem('rsts', $('#opDdStitches').val());
    if ($('#opColors').length > 0) localStorage.setItem('rca', $('#opColors').val());
    if ($('#opName').length > 0) localStorage.setItem('rt', $('#opName').val());
    if ($('#opId').length > 0) localStorage.setItem('rid', $('#opId').val());

    // if we had a pattern, then
    if (!localStorage.getItem("rt")) localStorage.setItem("rp",0); else localStorage.setItem("rp",1);

    if (!localStorage.getItem("rt")) localStorage.setItem("rt","Draft Pattern");
    if (!localStorage.getItem("rbq")) localStorage.setItem("rbq",20);
    if (!localStorage.getItem("rsz")) localStorage.setItem("rsz",20);
    console.log('(2) initializeLocalStorage set rsz to ' + localStorage.getItem('rsz'));
    let defaultColors = ["9b4f3f","FFFFFF","D4AF37"];
    if (!localStorage.getItem("rca"))  localStorage.setItem("rca",  JSON.stringify(defaultColors));
    if (!localStorage.getItem("rsts")) localStorage.setItem("rsts", JSON.stringify([]));
    

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
    return localStorage.getItem('rbq');
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

/// needs to be moved to a shared file
function sendInfoAlert(textMsg, toDiv) {
    var alertImg = document.createElement("img");
    alertImg.setAttribute('src', "close.soon");
    alertImg.setAttribute('style', "display:none");
    alertImg.setAttribute('onerror', "(function(el){ setTimeout(function(){ $(el).parent().remove(); },2000 ); })(this);");

    let textNode = document.createTextNode(textMsg);
    var alertDiv = document.createElement("div");
    let divClass = "alert alert-dark overlay";
    alertDiv.setAttribute('class', divClass);
    alertDiv.appendChild(textNode);
    alertDiv.appendChild(alertImg);

    toDiv.appendChild(alertDiv);
}

// function initializeLocalStorage() {
//     // first check to see if we were passed a pattern
//     localStorage.clear();
//     if ($('#opBaseStitches').length > 0) localStorage.setItem('rbq', $('#opBaseStitches').val());
//     if ($('#opnbrRows').length > 0) localStorage.setItem('rsz', $('#opnbrRows').val());
//     if ($('#opDdStitches').length > 0) localStorage.setItem('rsts', $('#opDdStitches').val());
//     if ($('#opColors').length > 0) localStorage.setItem('rca', $('#opColors').val());
//     if ($('#opName').length > 0) localStorage.setItem('rt', $('#opName').val());
//     if ($('#opId').length > 0) localStorage.setItem('rid', $('#opId').val());

//     // if we had a pattern, then
//     if (!localStorage.getItem("rt")) localStorage.setItem("rp",0); else localStorage.setItem("rp",1);

//     if (!localStorage.getItem("rt")) localStorage.setItem("rt","Draft Pattern");
//     if (!localStorage.getItem("rbq")) localStorage.setItem("rbq",20);
//     if (!localStorage.getItem("rsz")) localStorage.setItem("rsz",20);
//     let defaultColors = ["9b4f3f","FFFFFF","D4AF37"];
//     if (!localStorage.getItem("rca"))  localStorage.setItem("rca",  JSON.stringify(defaultColors));
//     if (!localStorage.getItem("rsts")) localStorage.setItem("rsts", JSON.stringify([]));
    

// }

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
    return localStorage.getItem('rbq');
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
