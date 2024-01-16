function submitData() {
    var data = document.getElementById("qrdata").value;
    var radioButtons = document.querySelectorAll('input[name="options"]')
    let selectedSize;

    for (var radioButton of radioButtons) {
        if (radioButton.checked){
            selectedSize = radioButton.value;
        }
    }
    if (!checkForm()) {
        alert("Please enter something into the QR Data field first");
        return;
    } else {
        document.getElementById("qrcode").src = "https://qrcode.tec-it.com/API/QRCode?size=" + selectedSize + "&data=" + data + "&codepage=UTF8"
    }
}

function checkForm() {
    var data = document.getElementById("qrdata").value.length;
    if (data < 1) {
        return false;
    }
    return true;
}
function clearInput() {
    document.getElementById("qrdata").value = "";
}
