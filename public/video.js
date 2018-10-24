/*const MongoClient = require('mongodb').MongoClient;
const url = "mongodb://localhost:27017/";*/

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
        
        /*content='Tlaxcala-01'
        
        var xhr = new XMLHttpRequest();
        xhr.open('GET', 'http://localhost:3000/qrdata/'+content, true);
        xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
        xhr.onload = function () {
            // do something to response
            console.log('Entro en XHR');
        };
        xhr.send();*/
        /*MongoClient.connect(url, function(err, db) {
            if (err) throw err;
            var dbo = db.db("QR");
            var myobj = { name: "Company Inc", address: "Highway 37" };
            dbo.collection("ID_Raspberry").insertOne(myobj, function(err, res) {
                if (err) throw err;
                console.log("1 document inserted");
                db.close();
            });
            });*/
    }
});
