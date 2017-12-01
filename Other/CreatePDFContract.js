/*4.7 登入*/
var express = require('express');
var router = express.Router();
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
var fs = require('fs-extra');
var pdf = require('html-pdf');
var PDFDocument = require('pdfkit');
var hummus=require('hummus');

var ReLogin;
var Result;

/*----- region 初始化 -----*/
var flag = true;
var errMsg = "Success";
var errCode = "000000";
var funName = "CreatPDFController";
var registerStatus = -1;
var iUploadedCnt = 0;
var sPath = "";
var filePath='No Picture';
/*----- endregion -----*/


/*----- region 判斷開始 -----*/
router.post('/', function(req, res, next){
    var tmp=req.body.para;
		//寫入已存在之PDF
    var pdfWriter = hummus.createWriterToModify('./contract.pdf', {
        modifiedFilePath: './pdf/' + tmp.FileName+'.pdf'
    });

    var pageModifier = new hummus.PDFPageModifier(pdfWriter,0,true);
    //字體
    var textOptions = {font:pdfWriter.getFontForFile('./font/' + 'GenYoMinTW-Regular.ttf'),size:8,color:0x00};
    var textOptions_6 ={font:pdfWriter.getFontForFile('./font/' + 'GenYoMinTW-Regular.ttf'),size:6,color:0x00}

		//寫入文字
    pageModifier.startContext().getContext().writeText(
        tmp.Name,
        75, 705,
        textOptions
    );
    pageModifier.endContext().writePage();

		//寫入照片
    var cxt = pageModifier.startContext().getContext();
    cxt.drawImage(70,287,'./Image/'+tmp.Image, {transformation:{width:30,height:30}});
    pageModifier.endContext().writePage();

    //完成寫入
    pdfWriter.end();

    var result={
        'Result': '1',
        'ErrCode': '0000',
        'ErrMsg': '',
        'Time': NowTime()
    }
    res.send(result);
});

module.exports = router;

//產生PDF檔案
function fileName (IDNO,kind,ext){
    var today = new Date();
    var dd = today.getDate();
    var MM = today.getMonth()+1;
    var yyyy = today.getFullYear().toString();
    var hh =today.getHours();
    var ss =today.getSeconds();
    var mm =today.getMinutes();
    if(dd<10) {
        dd = '0'+dd
    }
    if(MM<10) {
        MM = '0'+MM
    }
    if(hh<10){
        hh = '0'+hh
    }
    if(mm<10){
        mm = '0'+mm
    }
    if(ss<10){
        ss = '0'+ss
    }
    MM= MM.toString();
    today = yyyy+ MM + dd +hh + mm +ss ;
    return IDNO + "_" + kind + "_" + today + "." + ext;
}

//現在時間
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
    if(hh<10){
        hh = '0'+hh
    }
    if(mm<10){
        mm = '0'+mm
    }
    if(ss<10){
        ss = '0'+ss
    }
    return today = yyyy+ "-"+ MM + "-"+ dd +" "+hh +":"+ mm +":"+ss ;
}
