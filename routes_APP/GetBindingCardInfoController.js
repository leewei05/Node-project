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
            url: 'https://payment-stage.ecpay.com.tw/MerchantMember/QueryMemberBinding',
            body: tmp,
            json: true
        },function(error, response, body){
            var Count=body.split('&')[2];
            var Count_value=Count.split('=')[1];
            //尚未註冊信用卡
            if(!Count_value)
            {
                var result={
                    'Result':'1',
                    'MerchantMemberID':MEMIDNO,
                    'CardID':'',
                    'Card6No':'',
                    'Card4No':'',
                    'BindingDate':'',
                    'ErrMsg':'此身分證字號尚未註冊過。',
                    'ErrCode':'ERR204'
                }
                res.send(result);
            }
            else
            {
            //有註冊信用卡
                var Json_str=body.split('&')[3];
                var Json_value=Json_str.split('=')[1];
                var Json_format =JSON.parse(Json_value);
                //有註冊多個 取第一個
                if(Json_value.substring(0,1)=="[")
                {
                    tmp.CardID=Json_format[0].CardID;
                    var result={
                        'Result':'0',
                        'MerchantMemberID':MEMIDNO,
                        'CardID':Json_format[0].CardID,
                        'Card6No':Json_format[0].Card6No,
                        'Card4No':Json_format[0].Card4No,
                        'BindingDate':Json_format[0].BindingDate,
                        'ErrMsg':'Success',
                        'ErrCode':'0000'
                    }
                }
                //一個信用卡資訊
                else
                {
                    tmp.CardID=Json_format;
                    var result={
                        'Result':'0',
                        'MerchantMemberID':MEMIDNO,
                        'CardID':Json_format.CardID,
                        'Card6No':Json_format.Card6No,
                        'Card4No':Json_format.Card4No,
                        'BindingDate':Json_format.BindingDate,
                        'ErrMsg':'Success',
                        'ErrCode':'0000'
                    }
                }

                res.send(result);
            }
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
