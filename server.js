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
const url = "mongodb://localhost:27017/id_qr";
//const url = "mongodb://mongodb:mongodb123@ds241493.mlab.com:41493/id_qr"

// Notificaciones Slack
var Slack = require('slack-node');
webhookUri = "https://hooks.slack.com/services/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";
slack = new Slack();
slack.setWebhook(webhookUri);


app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.set('views', __dirname + '/views');

const port = process.env.PORT || 3000;

//Generación de middleware
app.use(express.static( __dirname + '/public' )); 

//////////////////////////////////////////////////////////////////////////////////////////////

// Main (Index.html)
app.get('/', (req, res) => {
  console.log('Entro en GET /');
  res.sendFile( __dirname + '/index.html' );
});

// Sesion (sesion.ejs)
app.get('/sesion', (req, res) => {
  console.log('Entro en GET /sesion');
  //res.sendFile funciona para descargar archivos
  //res.sendFile( __dirname + '/views/sesion.ejs' );
  res.render('sesion.ejs', {mensaje: ""});
});

// QR Lector (video.html)
app.post('/qr-code', (req, res) => {
  console.log('Entro en GET /qr-code');
  res.sendFile( __dirname + '/pages/video.html' );
});

// Registro (registro.ejs)
app.post('/registro', (req, res) => { 
  res.render('registro.ejs', {mensaje: ""});
});

// Configuracion (config.ejs)
app.post('/configuracion', (req, res) => { 
  
  let body = req.body;
  let id_codigo = body.codigoTable;

  /*MongoClient.connect(url, function(err, client) {
    if (err) throw err;
    var dbo = client.db("id_qr"); 
    dbo.collection("CLUES").find({}).toArray(function(err, result) {
    if (err) throw err;
    else{
        res.render('config.ejs', {mensaje: "", codigos: result});
      }
    });
    client.close();
  });*/

  MongoClient.connect(url, function(err, client) {
    if (err) throw err;
    var dbo = client.db("id_qr"); 
    dbo.collection("CLUES").aggregate([{ $group: { _id: "$NOMBRE DE LA UNIDAD" }},{ $sort : { "_id": 1 } }]).toArray(function(err, result_unidad) {
    if (err) throw err;
    else{
      client.close();
      MongoClient.connect(url, function(err, client) {
        if (err) throw err;
        var dbo = client.db("id_qr"); 
        dbo.collection("CLUES").aggregate([{ $group: { _id: "$CLUES_ENTIDAD" }},{ $sort : { "_id": 1 } }]).toArray(function(err, result_entidad) {
          if (err) throw err;
          else{
            client.close();
            MongoClient.connect(url, function(err, client) {
            if (err) throw err;
            var dbo = client.db("id_qr"); 
            dbo.collection("CLUES").aggregate([{ $group: { _id: "$CLUES_LOCALIDAD" }},{ $sort : { "_id": 1 } }]).toArray(function(err, result_localidad) {
              if (err) throw err;
              else{
                client.close();
              MongoClient.connect(url, function(err, client) {
              if (err) throw err;
              var dbo = client.db("id_qr"); 
              dbo.collection("CLUES").aggregate([{ $group: { _id: "$CLUES_JURISDICCIÓN" }},{ $sort : { "_id": 1 } }]).toArray(function(err, result_jurisdiccion) {
                if (err) throw err;
                else{
                  client.close();
                  MongoClient.connect(url, function(err, client) {
                  if (err) throw err;
                  var dbo = client.db("id_qr"); 
                  dbo.collection("CLUES").aggregate([{ $group: { _id: "$CLUES_MUNICIPIO" }},{ $sort : { "_id": 1 } }]).toArray(function(err, result_municipio) {
                    if (err) throw err;
                    else{
                      res.render('config.ejs', {mensaje: "", id_codigos: id_codigo, unidades:  result_unidad, estados: result_entidad, municipios: result_municipio, localidades: result_localidad, jurisdicciones: result_jurisdiccion});
                    }
                  });
                  });
                }
              });
              }); 
              }
            });
          });
          }
        });
      client.close();
      });
      }
    });
  });



  //res.render('config.ejs', {mensaje: "", codigos: ""});
});


//////////////////////////////////////////////////////////////////////////////////////////////

// Validar datos en DB y dirigir a admin.html
app.post('/sesion', (req, res) => {
  let body = req.body;
  let user = body.name;
  let pass = body.password;
  //console.log(body);

  if(user == "" || pass == ""){
    res.render('sesion.ejs', {mensaje: "Los campos deben tener valores."});
  }else{
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
  }
});

//////////////////////////////////////////////////////////////////////////////////////////////

// Administrador
app.post('/administrador', (req, res) => {

  MongoClient.connect(url, function(err, client) {
    if (err) throw err;
    var dbo = client.db("id_qr"); 
    dbo.collection("ID_Raspberry").find({}).toArray(function(err, result) {
    if (err) throw err;
    else{
      console.log(result);
      res.render('admin.ejs', {mensaje: "", codigos: result});
      }
    });
    client.close();
    });

});

//////////////////////////////////////////////////////////////////////////////////////////////

// Registro 
app.post('/registro-validate', (req, res) => {
  
  let body = req.body;
  console.log(body);
  let user = body.name;
  let pass = body.password;
  let pass_again = body.passwordA;

  if(user == "" || pass == "" || pass_again == ""){
    res.render('registro.ejs', {mensaje: "Los campos deben tener valores."});
  }else{
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
  //let objcodigo = body.codigo;

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

/*app.post('/database-actualizada', (req, res) => { 

  const csvFilePath='/home/martin/Descargas/data.csv';
  const csv=require('csvtojson');

  MongoClient.connect(url, function(err, client) {
    if (err) throw err;
    var dbo = client.db("id_qr"); 
  dbo.collection("CLUES").drop(function(err, result) {
    if (err) throw err;
    if (result) console.log("Collection deleted");
    client.close();
    });
  });  

  csv()
    .fromFile(csvFilePath)
    .then((jsonArray)=>{

      console.log(jsonArray);

      const len = jsonArray.length;
      console.log(len);

      MongoClient.connect(url, function(err, client) {
        if (err) throw err;
        var dbo = client.db("id_qr"); 

        for (i = 0; i < len; i++) {
          
            dbo.collection("CLUES").insertOne(jsonArray[i], function(err, result) {
              if (err) throw err;
              console.log('saved to database');
            });
          }
            client.close();
        });
        
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

  });

  /*async function start() {

    const jsonArray=await csv().fromFile(csvFilePath);
    //console.log(jsonArray);
    //console.log("=================================================");
    /*const objJson = Object.assign({},jsonArray);
    console.log(objJson);*/
 /*   const len = jsonArray.length;
    console.log(len);

    MongoClient.connect(url, function(err, client) {
      if (err) throw err;
      var dbo = client.db("id_qr"); 

      for (i = 0; i < len; i++) {
        
          dbo.collection("CLUES").insertOne(jsonArray[i], function(err, result) {
            if (err) throw err;
            console.log('saved to database');
          });
        }
          client.close();
          update();
      });

      
    /*console.log("=================================================");
    const string = JSON.stringify(jsonArray);
    console.log(string);
    console.log("=================================================");
    const out = string.replace('[','').replace(']','');
    console.log(out);
    console.log("=================================================");*/
      
  /*}*/

  //start();

//});

//////////////////////////////////////////////////////////////////////////////////////////////

// Actualizar configuración del dispositivo
app.post('/configuracion-actualizada', (req, res) => { 
  
  let body = req.body;
  console.log(body);

  let estado = body.estado;
  let municipio = body.municipio;
  let jurisdiccion = body.jurisdiccion;
  let localidad = body.localidad;
  let unidad = body.unidad;
  let clues = body.clues;
  let codigo = body.codigo;

  MongoClient.connect(url, function(err, client) {
    if (err) throw err;
    var dbo = client.db("id_qr");
    
    var myquery = { codigo: codigo };
    var newvalues = { $set: { estado: estado, municipio: municipio, jurisdiccion: jurisdiccion, localidad: localidad, unidad: unidad, clues: clues } };

    dbo.collection("ID_Raspberry").updateOne(myquery, newvalues, function(err, result) {
    if (err) throw err;
    else{
      console.log(result);
      //res.render('admin.ejs', {mensaje: "", codigos: result});
      }
    });
    client.close();
  });
  


});

//////////////////////////////////////////////////////////////////////////////////////////////

// API 

app.get('/api/v1/database', (req, res) => {

  MongoClient.connect(url, function(err, client) {
    if (err) throw err;
    var dbo = client.db("id_qr"); 
    dbo.collection("CLUES").aggregate([{ $group: { _id: { Estado: "$CLUES_ENTIDAD",Municipio: "$CLUES_MUNICIPIO",Localidad: "$CLUES_LOCALIDAD",Jurisdiccion: "$CLUES_JURISDICCIÓN",Unidad: "$NOMBRE DE LA UNIDAD",CLUES: "$CLUES" }}},{ $sort : { "_id.Estado": 1 }}]).toArray(function(err, result) {
    if (err) throw err;
    else{
      //console.log(result);
      res.send(result);
    }
    client.close();
    });
    });

});

// Estado - Jurisdicción
app.get('/api/v1/database/estado/jurisdiccion/:id', (req, res) => {

  let id = req.params.id;

  MongoClient.connect(url, function(err, client) {
    if (err) throw err;
    var dbo = client.db("id_qr"); 
    dbo.collection("CLUES").aggregate([{ "$match": { "CLUES_ENTIDAD": id }}, { $group: {_id: { Jurisdiccion: "$CLUES_JURISDICCIÓN"}}},{ $sort : { "_id.Jurisdiccion": 1 } }]).toArray(function(err, result) {
    if (err) throw err;
    else{
      //console.log(result);
      res.send(result);
    }
    client.close();
    });
    });

});

// Estado - Municipios
app.get('/api/v1/database/estado/municipio/:id', (req, res) => {

  let id = req.params.id;

  MongoClient.connect(url, function(err, client) {
    if (err) throw err;
    var dbo = client.db("id_qr"); 
    dbo.collection("CLUES").aggregate([{ "$match": { "CLUES_ENTIDAD": id }}, { $group: {_id: { Municipio: "$CLUES_MUNICIPIO"}}},{ $sort : { "_id.Municipio": 1 } }]).toArray(function(err, result) {
    if (err) throw err;
    else{
      //console.log(result);
      res.send(result);
    }
    client.close();
    });
    });

});

// Jurisdicción - Municipios
app.get('/api/v1/database/jurisdiccion/municipio/:id', (req, res) => {

  let id = req.params.id;

  MongoClient.connect(url, function(err, client) {
    if (err) throw err;
    var dbo = client.db("id_qr"); 
    dbo.collection("CLUES").aggregate([{ "$match": { "CLUES_JURISDICCIÓN": id }}, { $group: {_id: { Municipio: "$CLUES_MUNICIPIO"}}},{ $sort : { "_id.Municipio": 1 } }]).toArray(function(err, result) {
    if (err) throw err;
    else{
      //console.log(result);
      res.send(result);
    }
    client.close();
    });
    });

});

// Jurisdicción - Localidades
app.get('/api/v1/database/jurisdiccion/localidad/:id', (req, res) => {

  let id = req.params.id;

  MongoClient.connect(url, function(err, client) {
    if (err) throw err;
    var dbo = client.db("id_qr"); 
    dbo.collection("CLUES").aggregate([{ "$match": { "CLUES_JURISDICCIÓN": id }}, { $group: {_id: { Localidad: "$CLUES_LOCALIDAD"}}},{ $sort : { "_id.Localidad": 1 } }]).toArray(function(err, result) {
    if (err) throw err;
    else{
      //console.log(result);
      res.send(result);
    }
    client.close();
    });
    });

});

// Municipio - Jurisdicción
app.get('/api/v1/database/municipio/jurisdiccion/:id', (req, res) => {

  let id = req.params.id;

  MongoClient.connect(url, function(err, client) {
    if (err) throw err;
    var dbo = client.db("id_qr"); 
    dbo.collection("CLUES").aggregate([{ "$match": { "CLUES_MUNICIPIO": id }}, { $group: {_id: { Jurisdiccion: "$CLUES_JURISDICCIÓN"}}},{ $sort : { "_id.Jurisdiccion": 1 } }]).toArray(function(err, result) {
    if (err) throw err;
    else{
      //console.log(result);
      res.send(result);
    }
    client.close();
    });
    });

});

// Municipio - Localidades
app.get('/api/v1/database/municipio/localidad/:id', (req, res) => {

  let id = req.params.id;

  MongoClient.connect(url, function(err, client) {
    if (err) throw err;
    var dbo = client.db("id_qr"); 
    dbo.collection("CLUES").aggregate([{ "$match": { "CLUES_MUNICIPIO": id }}, { $group: {_id: { Localidad: "$CLUES_LOCALIDAD"}}},{ $sort : { "_id.Localidad": 1 } }]).toArray(function(err, result) {
    if (err) throw err;
    else{
      //console.log(result);
      res.send(result);
    }
    client.close();
    });
    });

});

// Jurisdicción, Muncipio - Localidades
app.get('/api/v1/database/jurisdiccion-municipio/localidad/:juris&:mun', (req, res) => {

  let jurisdiccion = req.params.juris;
  let municipio = req.params.mun;
  console.log(jurisdiccion+" "+municipio);

  MongoClient.connect(url, function(err, client) {
    if (err) throw err;
    var dbo = client.db("id_qr"); 
    dbo.collection("CLUES").aggregate([{ "$match": { "CLUES_MUNICIPIO": municipio, "CLUES_JURISDICCIÓN": jurisdiccion }}, { $group: {_id: { Localidad: "$CLUES_LOCALIDAD"}}},{ $sort : { "_id.Localidad": 1 } }]).toArray(function(err, result) {
    if (err) throw err;
    else{
      //console.log(result);
      res.send(result);
    }
    client.close();
    });
    });

});

// Jurisdicción, Muncipio, Localidad - Unidad de Salud, CLUES
app.get('/api/v1/database/jurisdiccion-municipio-localidad/us-clues/:juris&:mun&:loc', (req, res) => {

  let jurisdiccion = req.params.juris;
  let municipio = req.params.mun;
  let localidad = req.params.loc;
  console.log(jurisdiccion+" "+municipio+ " "+localidad);

  MongoClient.connect(url, function(err, client) {
    if (err) throw err;
    var dbo = client.db("id_qr"); 
    dbo.collection("CLUES").aggregate([{ "$match": { "CLUES_MUNICIPIO": municipio, "CLUES_JURISDICCIÓN": jurisdiccion,  "CLUES_LOCALIDAD": localidad}}, { $group: {_id: { Unidad: "$NOMBRE DE LA UNIDAD", CLUES: "$CLUES"}}},{ $sort : {  "_id.Unidad": 1, "_id.CLUES": 1 } }]).toArray(function(err, result) {
    if (err) throw err;
    else{
      //console.log(result);
      res.send(result);
    }
    client.close();
    });
    });

});



//////////////////////////////////////////////////////////////////////////////////////////////

app.listen(port, () => {
    console.log(`Escuchando el puerto ${ port }`);
});

