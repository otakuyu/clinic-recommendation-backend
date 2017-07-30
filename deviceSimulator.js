'use strict';

var awsIot = require('aws-iot-device-sdk')
var MongoClient = require('mongodb').MongoClient

var mongodbUrl = process.env.MONGODB

module.exports.handler = (event, context, callback) => {
    MongoClient.connect(mongodbUrl, function (err, db) {


        var clinicsCol = db.collection('clinics')
        clinicsCol.aggregate([{ $sample: { size: 1 } }]).toArray(function(err, docs){
            db.close();
            console.log(docs)
            if(docs.length < 1){
                return callback(err)
            }
            if(err){
                console.log(err.stack)
                return callback(err)
            }

            var clinic_id = docs[0]._id.toString()
            var people_num = getRandomInt(0, 40)
            var timestamp = new Date().getTime()
            var mqtt_message = clinic_id + ", " + people_num + ", " + timestamp
            console.log("Trying to connect through mqtt")
            console.log(mqtt_message)


            var device = awsIot.device({
                keyPath: "./certs/fd3808c4ce-private.pem.key",
                certPath: "./certs/fd3808c4ce-certificate.pem.crt",
                caPath: "./certs/root-ca.cert.pem",
                clientId: clinic_id,
                host: "a2rk2i73bhub09.iot.ap-southeast-2.amazonaws.com"
            })

            device
                .on('connect', function () {
                    console.log('connect');
                    device.publish('govhack', mqtt_message, function(err){
                        device.end()
                        if(err) {
                            console.log(err)
                            console.log("failed")
                            return callback(err, {"status": "failed"})
                        }

                        console.log("success")
                        return callback(null, {"status": "ok"})
                    });
                });
        })

    })



};

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}