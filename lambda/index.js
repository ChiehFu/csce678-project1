// dependencies
const AWS = require('aws-sdk');
AWS.config.update({region:'us-east-1'});

// get reference to S3 client
const s3 = new AWS.S3();

const util = require('util')
const request = require("request");
const requestPromise = util.promisify(request);
const sqs = new AWS.SQS({apiVersion: '2012-11-05'});

const queueUrl = 'https://sqs.us-east-1.amazonaws.com/706574619075/new_webpage_queue';
const Bucket = "csce678-project";

exports.handler = async (event) => {
    const url = event.queryStringParameters.url;
    // Download the page
    try {
        // Scrap the webpage
        const page = await requestPromise(url);
        
        // Preprocess the url of the page 
        let urlWithSlashReplaced = url.replace(/\//g, '_');
        urlWithSlashReplaced = urlWithSlashReplaced.replace(/\./g, '_');
        console.log(urlWithSlashReplaced)

        // Put the webpage to S3
        const s3Params = {
            Bucket,
            Key:urlWithSlashReplaced,
            Body:page.body
        };
        let res = await s3.upload(s3Params).promise();
        console.log("file upload completed: ", res)

        // Send the url of the webpage to message queue
        const msgParams = {
            MessageBody: urlWithSlashReplaced,
            QueueUrl: queueUrl
        };
        res = await sqs.sendMessage(msgParams).promise();
        console.log("message sent: ", res)

    } catch(error) {
        return {
            statusCode:500,
            body:error
        }
    }
    return {
        statusCode:200,
        body:"success!"
    }
};
