const express = require('express')
const app = express()

const port = process.env.PORT || 3000;

//Generación de middleware
app.use(express.static( __dirname + '/public' ));
 
/*app.get('/', function (req, res) {
  //res.send('Hello World');
  let salida = {
    nombre: 'Martin',
    carrera: 'Ing. Telemática',
    edad: '24',
    url: req.url //Ya está filtrada la petición
    }
    res.send(salida);
});*/
 
app.get('/qrdata', function (req, res) {
    res.send('Dirección para lector de QR');
  });

app.listen(port, () => {
    console.log(`Escuchando el puerto ${ port }`);
});
