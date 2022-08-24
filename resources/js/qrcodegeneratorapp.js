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
        document.getElementById("qrcode").src = "https://chart.googleapis.com/chart?chs=" + selectedSize + "x" + selectedSize + "&cht=qr&chl=" + data + "&choe=UTF-8"
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