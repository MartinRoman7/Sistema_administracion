let scanner = new Instascan.Scanner(
    {
        video: document.getElementById('preview')
    }
);
scanner.addListener('scan',function(content){
    console.log('' + content);
    alert('Escaneo de contenido: ' + content);

    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'https://qr-lector.herokuapp.com/qrdata/'+content, true);
    xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    xhr.onload = function () {
        // do something to response
        console.log('Entro en XHR');
    };
    xhr.send();
});

Instascan.Camera.getCameras().then(cameras =>
{
    if(cameras.length > 0){
        scanner.start(cameras[0]);
    } else{
        console.log("No existe dispositivo de cámara");
        
        /*content='Tlaxcala-05'
        
        var xhr = new XMLHttpRequest();
        xhr.open('GET', 'http://localhost:3000/qrdata/'+content, true);
        xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
        xhr.onload = function () {
            // do something to response
            console.log('Entro en XHR');
        };
        xhr.send();*/

    }
});
