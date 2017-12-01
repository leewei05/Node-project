//---- 基本設定 ----
var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var http = require('http');

var port = 80;
var app = express();

//Lee
var uploadImage=require('./routes_APP/UploadImageController');
var creditCardBind= require('./routes_APP/CreditCardBindController.js');
var getCreditCardBind =  require('./routes_APP/GetBindingCardInfoController.js');
var authCardID =  require('./routes_APP/AuthCardIDController.js');
var serverReply =  require('./routes_APP/ServerReplyController.js');
var creditCardBindResult = require('./routes_APP/CreditBindResultController.js');
var deleteCreditCard =require('./routes_APP/DeleteCreditCardController.js');
var CreatePDF = require('./routes_APP/CreatePDFContract.js');




// bodyParser : Parse incoming request bodies in a middleware before your handlers,
// support json encoded bodies
// app.use(bodyParser.json());
// // parse application/x-www-form-urlencoded
// app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));



// 將路由套用至應用程式,可以指定路由的基礎路徑

//Lee
app.use('/api/UploadImage',uploadImage);
app.use('/api/CreditCardBind',creditCardBind);
app.use('/api/GetBindingCard',getCreditCardBind);
app.use('/api/AuthCardID',authCardID);
app.use('/api/ServerReply',serverReply);
app.use('/api/CreditCardBindResult',creditCardBindResult);
app.use('/api/DeleteCreditCard', deleteCreditCard);
app.use('/api/CreatePDF',CreatePDF);

//Error handling
app.use(function (err, req, res, next) {
    // logic
    errorLog.error(`Error Message : ${err}`);
    console.error(err);
    res.status(500).send('Something broke!');
});


//Server Port
// app.listen(port, function(){
//     console.log('Server started on port '+ port);
// });
app.set('port',port)
serverhttp = http.createServer(app)
serverhttp.listen(port)
console.log('Server started on port ');
