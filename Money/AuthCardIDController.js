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

router.post('/', function(req, res, next) {
    //1. 確認授權類別為1~4
    var tmp = req.body.para;
    if(tmp.type<1 ||tmp.type>4)
    {
        flag=false;
        errCode="ERR479";
        //授權類別錯誤
    }
    else
    {
        var origin_tradeno=tmp.MerchantTradeNo;
        var MEMIDNO = tmp.MerchantMemberID;	//身分證字號
        var checkList = [MEMIDNO];
        var errList = ["ERR207"];
        flag = CheckISNull(res, checkList, errList, funName);
        //確認身分證是否有參數
        if(flag)
        {
        //2. 綠界API
            //2.1 敘述選擇
            switch(tmp.type)
            {
                //描述
                case 1:
                    var str ='test';
                    var TradeDesc_str= str.replace(/\r?\n|\r/g, "").replace(/\s+/g, "");
                    tmp.TradeDesc=TradeDesc_str;
                    break;
            }
            //2.2 產生訂單編號
            var sqlrequest=new sql.Request();
            //執行sql的預存程序 取得這次訂單的編號
            .execute('GetPayInfo').then(function(recordsets){
                //sql 結果
                if(recordsets.output.ErrorCode == 0)
                {
                    if(recordsets.output.Amount>0)
                    //金額大於0
                    {
                        //2.3 取得綁定完信用卡之CardID
                        var First_Amount=recordsets.output.Amount;
                        var tmp_1=
                        {
                            'para':
                            {
                                'MerchantMemberID':MEMIDNO,
                                'MerchantID':'3002607'
                            }
                        }
                        request.post({
                            //取得已綁定之信用卡之資訊
                            url: 'http://localhost/iRentAPI/api/GetBindingCard',
                            body: tmp_1,
                            json: true
                        },function(error, response, body){
                            //未綁定
                            if(!body.CardID)
                            {
                                var result={
                                    'Result':'1',
                                    'ErrMsg':'請先綁定信用卡',
                                    'ErrCode':'ERR176'
                                }
                                res.send(result);
                            }
                            else
                            {
                            //2.4 呼叫綠界直接授權api
                               tmp.CardID=body.CardID;
                                //取得卡號資訊
                               delete tmp.type;
                               tmp.MerchantID='3002607';
                               tmp.MerchantTradeDate=NowTime();
                               tmp.MerchantTradeNo= recordsets.output.RealOrderNum;
                               tmp.TotalAmount=First_Amount;
                               var check = CheckMacValue(tmp,recordsets.output.RealOrderNum,First_Amount);
                               tmp.CheckMacValue=check;
                               //加入檢查碼
                                   request.post({
                                       url: 'https://payment-stage.ecpay.com.tw/MerchantMember/AuthCardID/V2',
                                       body: tmp,
                                       json: true
                                   },function(error, response, body){
                                    //自行解析ReturnCode
                                   var RtnCode =body.split('&')[0];
                                   var RtnCodeValue =RtnCode.split('=')[1];
                                   var args=ParseBody(body);
                                   args=JSON.parse(args);
                                   var OrderNum_1=origin_tradeno.replace('H',"");
                                   var Rtn= args.RtnCode;
                                   //3 把結果存下來並輸出結果
                                   if(Rtn==1)
                                   {
                                   //授權成功
                                       var sqlrequest=new sql.Request();
                                       //執行sql 預存程序 存進資料庫
                                       .execute('UpdateTrade').then(function(recordsets){
                                           if(recordsets.output.ErrorCode == 0)
                                           {
                                               if(recordsets.output.EtagPay>0)
                                               {
                                                    var finalOutput=  recordsets.output;
                                                    finalOutput.Result='0';
                                                    finalOutput.AllpayTradeNo=args.AllpayTradeNo;
                                                    res.send(finalOutput);

                                               }
                                               else
                                               {
                                                var finalOutput=  recordsets.output;
                                                finalOutput.Result='0';
                                                finalOutput.AllpayTradeNo=args.AllpayTradeNo;
                                                res.send(finalOutput);
                                               }
                                           }
                                           else{
                                                var finalOutput=  recordsets.output;
                                                finalOutput.Result='1';
                                                finalOutput.AllpayTradeNo=args.AllpayTradeNo;
                                                finalOutput.ErrorMsg=getErrMsg(finalOutput.ErrorCode);
                                                res.send(finalOutput);
                                           }
                                       });
                                   }
                                   else
                                   {
                                   //授權失敗
                                       var sqlrequest=new sql.Request();
                                       //執行sql 預存程序 存進資料庫
                                       .execute('UpdateTrade').then(function(recordsets){
                                           if(recordsets.output.ErrorCode == 0)
                                           {
                                               var result={
                                                   'Result':'1',
                                                   'ErrMsg':args.RtnMsg,
                                                   'ErrCode':args.RtnCode,
                                                   'AllpayTradeNo':args.AllpayTradeNo
                                               }
                                               res.send(result);
                                           }
                                           else{
                                            var finalOutput=  recordsets.output;
                                            finalOutput.Result='1';
                                            finalOutput.AllpayTradeNo=args.AllpayTradeNo;
                                            finalOutput.ErrorMsg=getErrMsg(finalOutput.ErrorCode);
                                            res.send(finalOutput);
                                           }
                                       });
                                   }
                               });
                            }

                        });
                    }
                }
                else
                {
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

// 產生檢查碼
function CheckMacValue(tmp, OrderNum, Amount){
    var TradeDesc_str= tmp.TradeDesc.replace(/\r?\n|\r/g, "").replace(/\s+/g, "");
    var CheckValue = "HashKey=pwFHCqoQZGmho4w6"; //ok
    CheckValue += "&CardID="+tmp.CardID;
    CheckValue += "&MerchantID="+"3002607";
    CheckValue += "&MerchantMemberID="+tmp.MerchantMemberID;
    CheckValue += "&MerchantTradeDate="+NowTime();
    CheckValue += "&MerchantTradeNo="+OrderNum;
    CheckValue += "&stage="+tmp.stage;
    CheckValue += "&TotalAmount="+Amount;
    CheckValue += "&TradeDesc="+encodeURI(TradeDesc_str);
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

//解析回傳值
function ParseBody(tmp){
    var RtnArray=['RtnCode','MerchantTradeNo','MerchantID','RtnMsg','AllpayTradeNo','gwsr','card6no','card4no','BindingDate','process_date','auth_code','amount','eci'];
    var edited = "{";
    for(var i=0;i<RtnArray.length;i++)
    {
        if(RtnArray[i]=='RtnCode')
        {
            var paraStart=tmp.search(RtnArray[i]);
            var whereToCut = 0+paraStart;
            var paraNameValue =tmp.substr(whereToCut,tmp.length);
            var paraValue =paraNameValue.split('&')[0].split('=')[1];
            paraValue=="undefined"? " ":" ";
            edited += '"'+RtnArray[i]+'"'+":"+paraValue+',';
        }
        else
        {
            var paraStart=tmp.search(RtnArray[i]);
            var whereToCut = 0+paraStart;
            var paraNameValue =tmp.substr(whereToCut,tmp.length);
            var paraValue =paraNameValue.split('&')[0].split('=')[1];
            paraValue=="undefined"? " ":" ";
            edited += '"'+RtnArray[i]+'":"'+paraValue+'",';
        }
    }
    edited = edited.slice(0, -1);
    edited += "}";
    return edited;
}

//取得現在時間
function NowTime (){
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
    if(ss<10){
        ss ='0'+ss
    }
    if(mm<10){
        mm ='0'+mm
    }
    if(hh<10){
        hh ='0'+hh
    }
    return today = yyyy+ "/"+ MM + "/"+ dd +" "+hh +":"+ mm +":"+ss ;
}
