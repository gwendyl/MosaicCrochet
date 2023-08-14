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
