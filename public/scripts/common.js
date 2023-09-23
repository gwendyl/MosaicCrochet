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

function validateNumberInput(inputField) {
    if(!/^[0-9]+$/.test(inputField.value)){
        alert("Please only enter numeric characters (" + inputField.getAttribute("min") + " - " + inputField.getAttribute("max") + ")")
        inputField.value = inputField.getAttribute("min")
    }        
    // multiplying by 1 to force comparison to be numeric not string
    if(inputField.value*1 > inputField.getAttribute("max")*1){
        alert("Maximum allowable value is " + inputField.getAttribute("max"))
        inputField.value = inputField.getAttribute("max")
    }        
    if(inputField.value*1 < inputField.getAttribute("min")*1) {
        alert("Minumum allowable value is " + inputField.getAttribute("min"))
        inputField.value = inputField.getAttribute("min")
    }
}

function toCanvasCoords(canvas, pageX, pageY) {
    let rect = canvas.getBoundingClientRect();
    let scale = rect.width / canvas.width;
    pos = {
        x: (pageX - rect.left) / scale,
        y: (pageY - rect.top) / scale
    }

    return pos;
}

function rgbToHex(r, g, b) {
    if (r > 255 || g > 255 || b > 255)
        throw "Invalid color component";
    return ((r << 16) | (g << 8) | b).toString(16);
}

function hexColorDelta(hex1, hex2) {
    // get red/green/blue int values of hex1
    var r1 = parseInt(hex1.substring(0, 2), 16);
    var g1 = parseInt(hex1.substring(2, 4), 16);
    var b1 = parseInt(hex1.substring(4, 6), 16);
    // get red/green/blue int values of hex2
    var r2 = parseInt(hex2.substring(0, 2), 16);
    var g2 = parseInt(hex2.substring(2, 4), 16);
    var b2 = parseInt(hex2.substring(4, 6), 16);
    // calculate differences between reds, greens and blues
    var r = 255 - Math.abs(r1 - r2);
    var g = 255 - Math.abs(g1 - g2);
    var b = 255 - Math.abs(b1 - b2);
    // limit differences between 0 and 1
    r /= 255;
    g /= 255;
    b /= 255;
    // 0 means opposite colors, 1 means same colors
    return (r + g + b) / 3;
}

