
const express = require('express')
const app = express()
const bodyParser = require('body-parser')
//const mongoose = require('mongoose');

// MongoDB
const MongoClient = require('mongodb').MongoClient;
//const url = "mongodb://localhost:27017/";
const url = "mongodb://<dbuser>:<dbpassword>@DB:Port/DB_name"

// Notificaciones Slack
var Slack = require('slack-node');
webhookUri = "<Token Webhook>";
slack = new Slack();
slack.setWebhook(webhookUri);


app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

const port = process.env.PORT || 3000;

//Generación de middleware
app.use(express.static( __dirname + '/public' ));
 
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


app.listen(port, () => {
    console.log(`Escuchando el puerto ${ port }`);
});

