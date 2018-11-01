let scanner = new Instascan.Scanner(
    {
        video: document.getElementById('preview')
    }
);
scanner.addListener('scan',function(content){
    //console.log('' + content);
    alert('Escaneo de código QR realizado');

    var xhr = new XMLHttpRequest();
    xhr.open('GET', '<URL to GET>'+content, true);
    xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    xhr.onload = function () {
        // do something to response
        //console.log('Entro en XHR');
    };
    xhr.send();
});


Instascan.Camera.getCameras().then(cameras =>
{
    if(cameras.length > 0){
        scanner.start(cameras[0]);
    } else{
        console.log("No existe dispositivo de cámara");
    }
});
