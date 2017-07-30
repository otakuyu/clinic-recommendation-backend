'use strict';

var fs = require('fs')
var csv = require('fast-csv')
var MongoClient = require('mongodb').MongoClient

var mongodbUrl = process.env.MONGODB


MongoClient.connect(mongodbUrl, function (err, db) {
    if(err) return db.close()
    console.log("connected")
    var clinicsCol = db.collection('clinics')
    var batch = clinicsCol.initializeOrderedBulkOp()

    fs.createReadStream("./clinics.csv")
        .pipe(csv.parse({headers: ["Latitude", "Longitude", "Hospital name", "Phone number" ,"Street address", "Suburb", "Postcode", "State",,,,,,,]}))
        .on("data", function(data){
            batch.find({"name": data["Hospital name"]}).upsert().updateOne({
                "name": data["Hospital name"],
                "phone": data["Phone number"],
                "location": {
                    "type": "Point",
                    "coordinates": [parseFloat(data['Longitude']), parseFloat(data['Latitude'])]
                },
                "address": data["Street address"] + ", " + data["Suburb"] + ", " + data["State"] + " " + data["Postcode"],
                "doctor_num": getRandomInt(1, 30),
                "type": getType(),
                "avg_wait": getRandomInt(10, 40)
            })
            console.log(data)
        })
        .on("end", function(){
            batch.execute(function(err, result){
                if(err) {
                    db.close()
                    return console.log(err)
                }

                clinicsCol.ensureIndex({"location": "2dsphere"}, {}, function(err){
                    db.close()
                    if(err){
                        return console.log(err)
                    }
                    console.log("Success!!")
                })
            })
        })
})

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}

function getType(){
    var type = getRandomInt(0, 2)
    if(type == 0){
        return "GP"
    }else if(type == 1){
        return "public"
    }else if(type == 2){
        return "private"
    }
}