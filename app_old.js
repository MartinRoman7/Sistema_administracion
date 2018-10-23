/* Servidor Web base para Node
const http = require('http');

http.createServer((req, res) => {

    res.writeHead(200, { 'Content-Type': 'application/json'});

    let salida = {
        nombre: 'Martin',
        carrera: 'Ing. Telemática',
        edad: '24',
        url: req.url
    }

    res.write( JSON.stringify (salida));
    //res.write('Hola mundo');
    // Indicar que se termina la respuesta
    res.end();
}).listen(8080);

console.log('Escuchando el puerto 8080');
*/