'use strict';
var MongoClient = require('mongodb').MongoClient
var ObjectId = require('mongodb').ObjectId
var aws = require('aws-sdk');
var s3 = new aws.S3();

var mongodbUrl = process.env.MONGODB
module.exports.handler = (event, context, callback) => {
    console.log(event);

    var id = event.id
    var attributes = Object.assign({}, event)

    delete attributes.id


    MongoClient.connect(mongodbUrl, function (err, db) {
        var clinicsCol = db.collection('clinics')
        clinicsCol.updateOne({_id: new ObjectId(id)}, {$set: attributes}, {}, function(err, result){
            if(err){
                db.close();
                console.log(err.stack)
                return callback(err, {status: "failed"})
            }


            clinicsCol.findOne({_id: new ObjectId(id)}, {}, function(err, result){
                db.close();
                if(err){
                    console.log(err.stack)
                    return callback(err, {status: "failed"})
                }
                console.log(result)
                return callback(null, {status: "ok"})
            })
        })


    });
};

module.exports.bucket = (event, context, callback) =>{
    console.log(JSON.stringify(event));

    var bucket = event.Records[0].s3.bucket.name
    var key = decodeURIComponent(event.Records[0].s3.object.key)



    s3.getObject({Bucket: bucket, Key: key}, function(err, data){
        if(err){
            console.log("Error getting object " + key + " from bucket " + bucket)
            return callback(err, {"status": "failed"})
        }

        var query = data.Body.toString("utf-8").split(",")
        var id = query[0].trim()
        var peopleNum = query[1].trim()
        var timestamp = query[2].trim()

        var attributes = {people_num: peopleNum}


        MongoClient.connect(mongodbUrl, function (err, db) {
            var clinicsCol = db.collection('clinics')
            clinicsCol.updateOne({_id: new ObjectId(id)}, {$set: attributes}, {}, function(err, result){
                if(err){
                    db.close();
                    console.log(err.stack)
                    return callback(err, {status: "failed"})
                }

                var clinicsHistoryCol = db.collection('clinics_history')
                clinicsHistoryCol.insertOne({clinic_id: new ObjectId(id), people_num: peopleNum, timestamp: timestamp}, function(err){
                    if(err){
                        console.log("Error inserting record: " + data.Body.toString("utf-8"))
                        console.log(err.stack)
                    }
                    clinicsCol.findOne({_id: new ObjectId(id)}, {}, function(err, result){
                        db.close();
                        if(err){
                            console.log(err.stack)
                            return callback(err, {status: "failed"})
                        }
                        if(!result){
                            console.log("Can't find clinic with id:" + id)
                            return callback(null, {status: "ok"})
                        }
                        console.log(result)
                        return callback(null, {status: "ok"})
                    })
                })

            })


        });
    })
}