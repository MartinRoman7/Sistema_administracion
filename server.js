/*
  git add .
  git commit -m "Segundo commit de qr lector"
  git status
  heroku git:remote -a qr-lector
  git push heroku master
*/
const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const bcrypt = require('bcryptjs');
//const mongoose = require('mongoose');

const MongoClient = require('mongodb').MongoClient;
//const url = "mongodb://localhost:27017/QR";

// Notificaciones Slack
var Slack = require('slack-node');
webhookUri = "<Token>";
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
  
  /*MongoClient.connect(url, function(err, client) {
  if (err) throw err;
  var dbo = client.db("QR"); 
  dbo.collection('ID_Raspberry').find().toArray((err, result) => {
    if (err) return console.log(err)
    // renders index.ejs
    res.render('index.ejs', {codigos: result});
    });
  });*/
});

//////////////////////////////////////////////////////////////////////////////////////////////

// Validar datos en DB y dirigir a admin.html
app.post('/inicio_sesion', (req, res) => {
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

          bcrypt.compare(pass, pass_hash, function(err, out) {
            if( out === true){
              console.log('Password coinciden');
              //res.redirect('/admin.html');
              res.sendFile( __dirname + '/admin.html' );
            }else{
              console.log('Password no coinciden');
              res.redirect('/');
            }
          });

        } else{
          console.log('Usuario no encontrado');
          res.redirect('/');
        }
      }
    });
    client.close();
  });

  //res.redirect('/');

});

//////////////////////////////////////////////////////////////////////////////////////////////

// Dirigir a registro.html
app.post('/registro_page', (req, res) => {
  //let codigo = req.body.codigo;
  //res.redirect('/registro.html')
  res.sendFile( __dirname + '/registro.html' );
});

//////////////////////////////////////////////////////////////////////////////////////////////

// Registro 
app.post('/registro', (req, res) => {
  let body = req.body;
  let user = body.name;
  let pass = body.password;

  console.log(body);

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
            } else{
              console.log('Usuario nuevo');
              dbo.collection("Users").insertOne(myobj, function(err, result) {
                if (err) throw err;
                console.log('saved to database');
              });
              client.close();
            }
          }
        });
      });
      res.redirect('/');
    });
  });

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

// Obtener valores con método GET
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
          res.render('admin.ejs', {codigos: result});
        } else{
          console.log('Código no encontrado');
          //res.redirect('/admin.html');
          res.sendFile( __dirname + '/admin.html' );
        }
      }
    });
    client.close();
  });

  //res.redirect('/');

});


//////////////////////////////////////////////////////////////////////////////////////////////


app.post('/configuracion', (req, res) => { 
  res.sendFile( __dirname + '/configuracion.html' );
});

//////////////////////////////////////////////////////////////////////////////////////////////

app.listen(port, () => {
    console.log(`Escuchando el puerto ${ port }`);
});

