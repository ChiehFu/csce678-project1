// dependencies
const AWS = require('aws-sdk');
const crypto = require('crypto');

AWS.config.update({region:'us-east-1'});
// get reference to S3 client
const s3 = new AWS.S3();
const sqs = new AWS.SQS({apiVersion: '2012-11-05'});

const queueUrl = 'https://sqs.us-east-1.amazonaws.com/706574619075/new_webpage_queue';
const Bucket = "csce678-project";

// get all keys 
function pollHashUploadWebsite() {
    console.log("Start a new long polling...");
    sqs.receiveMessage({
        QueueUrl: queueUrl,
        MaxNumberOfMessages: 10,
        WaitTimeSeconds: 20
    }, function(err, data) {
        if (err) console.log(err, err.stack); // an error occurred
        else {  // successful response
            if (data.Messages) {
                data.Messages.forEach((msg) => {
                    const url = msg.Body;
                    console.log("Received the message: ", url);
        
                    // Get the website content from S3 bucket by url
                    s3.getObject( { Bucket, Key: url }, (err, data) => {
                        if (err) console.log("err", err.stack); // an error occurred
                        else {
                            // Hash the website content with sha256
                            const hashedContent = crypto.createHash('sha256').update(data.Body.toString()).digest('hex');
                            //console.log(hashedContent);
                            // Put the hash content back to S3 bucket with the url with "-hash" suffix
                            s3.upload({ 
                                Bucket, 
                                Key: url + "_hash", 
                                Body: hashedContent 
                            }, (err, data) => {
                                if (err) console.log(err);
                                else {
                                    console.log("Hashed and Stored the page successfully");
                                    // Delete the message
                                    sqs.deleteMessage({ 
                                        QueueUrl: queueUrl, 
                                        ReceiptHandle: msg.ReceiptHandle
                                    }, function(err, data) {
                                        if (err) console.log(err, err.stack);
                                        else {
                                            console.log("Delete the message from queue successfully");
                                            console.log("Long polling ends \n");
                                            setTimeout(() => pollHashUploadWebsite(), 10000);
                                        }
                                    });
                                }
                            });
                        }
                    });
                });
            } else {
                console.log("Long polling ends \n");
                setTimeout(() => pollHashUploadWebsite(), 10000);
            }
        }           
    });
}

pollHashUploadWebsite();