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
var fs = require('fs');
var ReLogin;
var Result;

router.post('/UploadImg', function(req, res, next){
	  var tmp = req.body.para;
	  var MEMIDNO = req.body.para.IDNO;	//身分證字號
	  var checkList = [MEMIDNO];
		var errList = ["ERR207"];
		flag = CheckISNull(res, checkList, errList, funName);
		if(flag) //必填參數
		{
	      var Name=fileName(MEMIDNO,tmp.type,'jpg');
	      var base64Data = tmp.base64.replace(/^data:image\/png;base64,/, "");
	      base64Data = base64Data.replace(/^data:image\/jpeg;base64,/, "");
	      fs.writeFile('img/'+Name, base64Data, 'base64', function(err) {
	          if(err)
	          {
	              res.send(err);
	          }
	          else
	          {
	              var request=new sql.Request();
								//執行sql 預存程序 儲存照片名稱
	              .execute('UpdateImage').then(function(recordsets){
	                  var picCount=recordsets.recordsets[0].length;
										//判斷是否已經有儲存過照片了
	                  for(var i=0;i<picCount;i++)
	                  {
	                      var json_array=(recordsets.recordsets[0][i].CredentialsFile).toString();
	                      if(json_array.search(tmp.type)>0)
	                      {
	                          filePath=recordsets.recordsets[0][i].CredentialsFile;

	                      }
	                  }
	                  if(filePath=='No Picture')
	                  {
	                      var request=new sql.Request();
												//執行sql 預存程序 儲存照片名稱
	                      .execute('UpdateImage').then(function(recordsets){
	                          if(recordsets.output.ErrorCode == 0)
	                          {
	                              var result={
	                                      'Result':0,
	                                      'ErrMsg': "SUCCESS",
	                                      'ErrCode':"0000",
	                                      'Time': NowTime()
	                              }
	                              res.send(result);
	                          }
	                          else{
	                              var result={
	                                  'Result':1,
	                                  'ErrMsg': recordsets.output.ErrorMsg,
	                                  'ErrCode':recordsets.output.ErrorCode,
	                                  'Time': NowTime()
	                              }
	                              res.send(result);
	                          }
	                      });
	                  }
	                  else
	                  {
	                  //新增後刪除
	                      var request=new sql.Request();
												//執行sql 預存程序 儲存照片名稱
	                      .execute('UpdateImage').then(function(recordsets){
	                          if(recordsets.output.ErrorCode == 0)
	                          {
	                              //刪除
	                              fs.unlink('img/'+filePath,function(err) {
	                                  if(err) {
	                                      res.send(err);
	                                  }
	                                  else{
	                                      var result={
	                                          'Result':0,
	                                          'ErrMsg': "SUCCESS",
	                                          'ErrCode':"0000",
	                                          'Time': NowTime()
	                                      }
	                                      res.send(result);
	                                  }
	                              });
	                          }
	                          else{
	                              var result={
	                                  'Result':1,
	                                  'ErrMsg': recordsets.output.ErrorMsg,
	                                  'ErrCode':recordsets.output.ErrorCode,
	                                  'Time': NowTime()
	                              }
	                              res.send(result);
	                          }
	                      });
	                  }
	              });
	          }
	      });
	  }
	  else
	  {
	      flag=false;
	      errCode = "ERR208";
	  }
});

module.exports = router;

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
    console.log(today);
    return IDNO + "_" + kind + "_" + today + "." + ext;
}

function Base64Decode(str){
    return Base64.decode(str);
}

function Base64Encode(str){
    return Base64.encode(str);
}

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
