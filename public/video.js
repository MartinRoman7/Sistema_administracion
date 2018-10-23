let scanner = new Instascan.Scanner(
    {
        video: document.getElementById('preview')
    }
);
scanner.addListener('scan',function(content){
    console.log('' + content);
    alert('Escaneo de contenido: ' + content);
    /* Contenido sobre acciones que hacer con lectura */
});
Instascan.Camera.getCameras().then(cameras =>
{
    if(cameras.length > 0){
        scanner.start(cameras[0]);
    } else{
        console.log("No existe dispositivo de cámara");
    }
});