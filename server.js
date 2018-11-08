/*
  git add .
  git commit -m "Segundo commit de qr lector"
  git status
  heroku login
  heroku git:remote -a qr-lector
  heroku git:remote -a cadena-de-frio-admin
  git push heroku master
*/
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
//const mongoose = require('mongoose');

// MongoDB
// Name DB: id_qr
// User: mongodb
// Pass: mongodb123
// Enlace: mongodb://<dbuser>:<dbpassword>@ds241493.mlab.com:41493/id_qr
const MongoClient = require('mongodb').MongoClient;
//const url = "mongodb://localhost:27017/";
const url = "mongodb://mongodb:mongodb123@ds241493.mlab.com:41493/id_qr"

// Notificaciones Slack
var Slack = require('slack-node');
webhookUri = "https://hooks.slack.com/services/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";
slack = new Slack();
slack.setWebhook(webhookUri);


app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
//app.set('view engine','ejs');

const port = process.env.PORT || 3000;

//Generación de middleware
app.use(express.static( __dirname + '/public' )); 

//////////////////////////////////////////////////////////////////////////////////////////////

// Main (Index.html)
app.get('/', (req, res) => {
  console.log('Entro en GET /');
  res.sendFile( __dirname + '/index.html' );
});

// Sesion (sesion.html)
app.get('/sesion', (req, res) => {
  console.log('Entro en GET /sesion');
  //res.sendFile funciona para descargar archivos
  //res.sendFile( __dirname + '/views/sesion.ejs' );
  res.render('sesion.ejs', {mensaje: ""});
});

// QR Lector (video.html)
app.get('/qr-code', (req, res) => {
  console.log('Entro en GET /qr-code');
  res.sendFile( __dirname + '/pages/video.html' );
});

// Registro (registro.html)
app.get('/registro', (req, res) => {
  console.log('Entro en GET /registro');
  //res.sendFile( __dirname + '/pages/registro.html' );
  res.render('registro.ejs', {mensaje: ""});
});

//////////////////////////////////////////////////////////////////////////////////////////////

// Validar datos en DB y dirigir a admin.html
app.post('/sesion', (req, res) => {
  let body = req.body;
  let user = body.name;
  let pass = body.password;

  console.log(body);

  MongoClient.connect(url, function(err, client) {
    if (err) throw err;
    var dbo = client.db("id_qr"); 
    var userobj = { usuario: user }

    dbo.collection("Users").findOne(userobj, function(err, result) {
      if (err) throw err;
      else{
        if(result !== null){
          console.log('Usuario encontrado');
          //console.log(result);
          var pass_hash = result.password; 
          console.log(pass_hash);
          client.close(); //Closing first query
          bcrypt.compare(pass, pass_hash, function(err, out) {
            if( out === true){
              console.log('Password coinciden');

              MongoClient.connect(url, function(err, client) {
                if (err) throw err;
                var dbo = client.db("id_qr"); 
              dbo.collection("ID_Raspberry").find({}).toArray(function(err, result) {
                if (err) throw err;
                else{
                    res.render('admin.ejs', {mensaje: "", codigos: result});
                  }
                });
                client.close();
                });

              //res.sendFile( __dirname + '/pages/admin.html' );
            }else{
              console.log('Password no coinciden');
              res.render('sesion.ejs', {mensaje: "Usuario y/o contraseña no validos"});
              //res.redirect('/');
            }
          });

        } else{
          console.log('Usuario no encontrado');
          res.render('sesion.ejs', {mensaje: "Usuario no dado de alta"});
          //res.redirect('/');
        }
      }
    });
    //client.close();
  });

  //res.redirect('/');

});

//////////////////////////////////////////////////////////////////////////////////////////////



//////////////////////////////////////////////////////////////////////////////////////////////

// Registro 
app.post('/registro', (req, res) => {
  
  let body = req.body;
  console.log(body);
  let user = body.name;
  let pass = body.password;
  let pass_again = body.passwordA;

  var n = pass.localeCompare(pass_again);

  if(n == 0){
    bcrypt.genSalt(10, function(err, salt) {
      bcrypt.hash(pass, salt, function(err, hash) {
        var userobj = { usuario: user }
        var myobj = { usuario: user, password: hash };
        console.log(hash);
        
        
        MongoClient.connect(url, function(err, client) {
          if (err) throw err;
          var dbo = client.db("id_qr"); 
      
          dbo.collection("Users").find(userobj).toArray(function(err, result) {
            if (err) throw err;
            else{
              if (result.length){ 
                console.log('Usuario existente');
                res.render('registro.ejs', {mensaje: "Usuario ya existente, ingrese uno nuevo."});
              } else{
                console.log('Usuario nuevo');
                dbo.collection("Users").insertOne(myobj, function(err, result) {
                  if (err) throw err;
                  console.log('saved to database');
                });
                client.close();
                res.redirect('/sesion');
              }
            }
          });
        });
      });
    });
  } else{
    res.render('registro.ejs', {mensaje: "Las contraseñas no coinciden."});
  }


});

//////////////////////////////////////////////////////////////////////////////////////////////

// Insertar en base de datos con método GET
app.get('/qrdata/:id', function (req, res) {
    res.send('Dirección para lector de QR');
    let id = req.params.id;
    
    MongoClient.connect(url, function(err, client) {
      if (err) throw err;
      var dbo = client.db("id_qr");
      //var dbo = client.db("QR");
      var myobj = { ID: id  };

      dbo.collection("ID_Raspberry").find(myobj).toArray(function(err, result) {
        if (err) throw err;
        else{
        if (result.length){
          console.log('El identificador ya se encuentra en la base de datos');
         
          slack.webhook({
            channel: "aws-iot-fundacion",
            text: "El identificador " + id + " se ha rechazado ya que existe en la base de datos.",
          }, function(err, response) {
            console.log(response);
          });

        }else{
          dbo.collection("ID_Raspberry").insertOne(myobj, function(err, res) {
            if (err) throw err;
            console.log('El identificador se agregó en la base de datos');

            slack.webhook({
              channel: "aws-iot-fundacion",
              text: "El identificador " + id + " se ha registrado en la base de datos.",
            }, function(err, response) {
              console.log(response);
            });

          });
        }
        console.log(result);
        client.close();
      }
      });

      });

  });

//////////////////////////////////////////////////////////////////////////////////////////////

// Insertar en base de datos con método POST
app.post('/quotes', (req, res) => {
  
  let body = req.body
  
  // Retorno en back
  console.log(req.body)
  
  // Retorno a la página web
  /*res.json({
    body
  });*/

  MongoClient.connect(url, function(err, client) {
    if (err) throw err;
    var dbo = client.db("id_qr"); 

    dbo.collection("ID_Raspberry").insertOne(body, function(err, result) {
      if (err) throw err;
      console.log('saved to database');
    });
    client.close();
  });
  res.redirect('/');
});


//////////////////////////////////////////////////////////////////////////////////////////////

// Actualizar registro con método PUT



//////////////////////////////////////////////////////////////////////////////////////////////

// Búsqueda de códigos
app.post('/buscar', (req, res) => {
  //let codigo = req.body.codigo;
  let objcodigo = req.body;
  console.log(objcodigo);

  MongoClient.connect(url, function(err, client) {
    if (err) throw err;
    var dbo = client.db("id_qr"); 
  
    dbo.collection("ID_Raspberry").find(objcodigo).toArray(function(err, result) {
      if (err) throw err;
      else{
        if (result.length){ 
          console.log('Código encontrado');
          res.render('admin.ejs', {mensaje: "", codigos: result});
        } else{
          client.close(); //Closing last connection
          console.log('Código no encontrado');

          MongoClient.connect(url, function(err, client) {
            if (err) throw err;
            var dbo = client.db("id_qr"); 
          dbo.collection("ID_Raspberry").find({}).toArray(function(err, result) {
            if (err) throw err;
            else{
                res.render('admin.ejs', {mensaje: "No existe código en la DB", codigos: result});
              }
            });
            client.close();
            });

          //res.redirect('/admin.html');
          //res.render('admin.ejs', {mensaje: "No existe código en la DB", codigos: ""});
          //res.sendFile( __dirname + '/admin.html' );
        }
      }
    });
    client.close();
  });

  //res.redirect('/');

});

//////////////////////////////////////////////////////////////////////////////////////////////

// Mostrar todos los códigos
/*app.post('/buscar-todos', (req, res) => {

  MongoClient.connect(url, function(err, client) {
    if (err) throw err;
    var dbo = client.db("id_qr"); 
  dbo.collection("ID_Raspberry").find({}).toArray(function(err, result) {
    if (err) throw err;
    else{
        res.render('admin.ejs', {mensaje: "", codigos: result});
      }
    });
    client.close();
    });

});*/

//////////////////////////////////////////////////////////////////////////////////////////////


app.post('/configuracion', (req, res) => { 
  res.sendFile( __dirname + '/pages/configuracion.html' );
});

//////////////////////////////////////////////////////////////////////////////////////////////

app.listen(port, () => {
    console.log(`Escuchando el puerto ${ port }`);
});

