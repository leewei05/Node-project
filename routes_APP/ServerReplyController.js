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
    var tmp=req.body;
    CreditTypeM(tmp);
    //綠界回傳成功
    if(req.body.RtnCode=='1')
    {
        res.send('1|OK');
        //回傳固定格式給綠界

        var request=new sql.Request();
        //執行sql 預存程序 存取回傳值
        .execute('UpdateCreditBind').then(function(recordsets){
            if(recordsets.output.ErrorCode == 0)
            {
                console.log(recordsets);
            }
            else{
                console.log(recordsets);
            }
        });
    }
    //綠界失敗結果
    else{
        res.send('0|ErrorMessage');
        //回傳固定格式給綠界

        var request=new sql.Request();
        //執行sql 預存程序 存取回傳值
        .execute('UpdateCreditBind').then(function(recordsets){
            if(recordsets.output.ErrorCode == 0)
            {
                console.log(recordsets);
            }
            else{
                console.log(recordsets);
            }
        });
    }
});
module.exports = router;

function NowTime(){
    var today = new Date();
    var dd = today.getDate();
    var MM = today.getMonth()+1;
    var yyyy = today.getFullYear();
    var hh =today.getHours();
    var ss =today.getSeconds();
    var mm =today.getMinutes();
    if(dd<10) {
        dd = '0'+dd
    }
    if(MM<10) {
        MM = '0'+MM
    }
    return today = yyyy+ "/"+ MM + "/"+ dd +" "+hh +":"+ mm +":"+ss ;
}
