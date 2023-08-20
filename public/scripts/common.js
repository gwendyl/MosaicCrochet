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