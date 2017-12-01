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
var sha256 = require('js-sha256');

router.post('/', function(req, res, nessxt) {
    var MEMIDNO = req.body.para.MerchantMemberID;	//身分證字號
    var tmp = req.body.para;
    var checkList = [MEMIDNO];
    var errList = ["ERR207"];
    flag = CheckISNull(res, checkList, errList, funName);
    if(flag)
    {
        //1. 執行
        var request=new sql.Request();
        //執行sql 預存程序 取得信用卡綁定狀態
        .execute('GetBindStatus').then(function(recordsets){
            if(recordsets.output.ErrorCode == 0)
            {
                if(recordsets.recordset.length==0)
                {
                //尚未綁定
                    var result={
                        "Result":'1',
                        "ErrMsg":"Waiting",
                        "ErrCode":"EE1001"
                    }
                    res.send(result);
                }
               else
               {
                    var ackFromECPAY=recordsets.recordset[0].RtnCode;
                    if(ackFromECPAY=='1')
                    {
                    //綁定成功
                        var result={
                            "Result":'0',
                            "ErrMsg":"Success",
                            "ErrCode":"0000"
                        }
                        res.send(result);
                    }
                    else
                    {
                    //綁定失敗
                        var result={
                            "Result":'1',
                            "ErrMsg":"Fail",
                            "ErrCode":"EE1002"
                        }
                        res.send(result);
                    }
               }
            }
            else{
                var finalOutput=  recordsets.output;
                finalOutput.Result='1';
                finalOutput.ErrorMsg=getErrMsg(finalOutput.ErrorCode);
                res.send(finalOutput);
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
