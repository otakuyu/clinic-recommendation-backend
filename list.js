'use strict';

var MongoClient = require('mongodb').MongoClient
var ObjectId = require('mongodb').ObjectId

var mongodbUrl = process.env.MONGODB


module.exports.handler = (event, context, callback) => {

    const response = {
        statusCode: 200,
        headers: {
            "Access-Control-Allow-Origin": "*"
        }
    };

    MongoClient.connect(mongodbUrl, function (err, db) {

        var clinicsCol = db.collection('clinics')
        clinicsCol.find({
            location: {
                $near: {
                    $geometry : {type: "Point", coordinates: [parseFloat(event.pathParameters.long), parseFloat(event.pathParameters.lat)]},
                    $minDistance: 0,
                    $maxDistance: parseFloat(event.pathParameters.radius)
                }
            }
        }).toArray(function(err, docs){
            db.close();
            if(err){
                console.log(err.stack)
                response.statusCode = 400
                response.body.message = err.stack
                return callback(null, response)
            }

            response.body = JSON.stringify(docs)
            return callback(null, response)
        })

    })
};

module.exports.listHistory = (event, context, callback) => {
    const response = {
        statusCode: 200,
        headers: {
            "Access-Control-Allow-Origin": "*"
        }
    };

    MongoClient.connect(mongodbUrl, function (err, db) {

        var clinicsCol = db.collection('clinics_history')
        clinicsCol.find({
            clinic_id: new ObjectId(event.pathParameters.clinic_id)
        }).sort({timestamp: -1}).toArray(function(err, docs){
            db.close();
            if(err){
                console.log(err.stack)
                response.statusCode = 400
                response.body.message = err.stack
                return callback(null, response)
            }

            response.body = JSON.stringify(docs)
            return callback(null, response)
        })

    })
}
