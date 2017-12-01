var express = require('express');
var sql = require('mssql');
var soap = require('soap');
var sql = require('mssql');
var async = require('async');
var conn = require('../database/connectmssql');
var APILog = require('../public/Ins_APILog');
var baseCheck = require('../public/baseCheck');
var CheckISNull = require('../public/CheckISNull');
var CheckIDNO = require('../public/CheckIDNO');
var CheckMobile = require('../public/CheckMobile');
var getErrMsg = require('../public/getErrMsg.js');
var sha1 = require('../public/sha1');
var AES = require('../public/AesEncryptController');
var Img = require('../public/GetImg');
var InsErrorLog= require('../public/InsErrorLog');
var binary = require('binary');
var multer =require('multer');
var bodyParser = require('body-parser');
var Base64 = require('js-base64').Base64;
var fs = require('fs');
var router = express.Router();
var request = require('request');
var sha256 = require('sha256');

router.post('/', function(req, res, next) {
    var MEMIDNO = req.body.para.MerchantMemberID;	//身分證字號
    var tmp = req.body.para;
    var checkList = [MEMIDNO];
    var errList = ["ERR207"];
    flag = CheckISNull(res, checkList, errList, funName);
    if(flag)
    {
    //呼叫綠界API
        var check = CheckMacValue(req.body.para);
        req.body.para.CheckMacValue=check;
        req.body.para.MerchantID='3002607';
        request.post({
            url: 'https://payment-stage.ecpay.com.tw/MerchantMember/DeleteCardID',
            body: tmp,
            json: true
        },function(error, response, body){
            res.send(body);
        });
    }
    else
    {
        flag =false;
        errCode = "ERR208";
    }
});

module.exports = router;

function CheckMacValue(tmp){
    var CheckValue = "HashKey=pwFHCqoQZGmho4w6"; //ok
    CheckValue += "&CardID="+tmp.CardID;
    CheckValue += "&MerchantID="+'3002607';
    CheckValue += "&MerchantMemberID="+tmp.MerchantMemberID;
    CheckValue += "&HashIV=EkRm7iFT261dpevs";  //ok
    // console.log('1: '+CheckValue);
    CheckValue = encodeURIComponent(CheckValue);
    // console.log('2, URI: '+CheckValue);
    CheckValue = CheckValue.toLowerCase();
    CheckValue = CheckValue.replace('%2d','-');
    CheckValue = CheckValue.replace('%5f','_');
    CheckValue = CheckValue.replace('%2e','.');
    CheckValue = CheckValue.replace('%21','!');
    CheckValue = CheckValue.replace('%2a','*');
    CheckValue = CheckValue.replace('%28','(');
    CheckValue = CheckValue.replace('%29',')');
    CheckValue = CheckValue.replace('%20','+');
    // console.log('3, lower: '+CheckValue);
    CheckValue = sha256(CheckValue);
    // console.log('4, SHA256: '+CheckValue);
    CheckValue = CheckValue.toUpperCase();
    // console.log('5, UPPER: '+CheckValue);
    return CheckValue;
}
