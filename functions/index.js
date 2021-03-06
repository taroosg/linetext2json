const functions = require('firebase-functions');
const express = require('express');
// const fs = require('fs');
const cors = require('cors');
const boom = require('express-boom');

class CustomError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

const app = express();
app.use(cors());
app.use(boom());

app.get('/hello', (req, res) => {
  // レスポンスの設定
  res.send('Hello Express!');
});

app.post('/linetext2json/v1', (req, res, next) => {

  try {
    // ユーザネーム抽出
    const indexOfTONOTALKRIREKI = req.body.toString().split('\n')[4].indexOf('とのトーク履歴');
    const userName = req.body.toString().split('\n')[4].slice(8, indexOfTONOTALKRIREKI)

    // テキストデータを1行づつ配列にする
    const linetext = req.body.toString().split('\n').filter((x, index) => index > 6);
    // 日付の正規表現
    const date = /\d{4}\/\d{1,2}\/\d{1,2}\(\D{1}\)/;
    // 時間の正規表現
    const time = /\d{1,2}:\d{2}/;
    // webkitboundaryの正規表現
    const boundary = /-{6}WebKitFormBoundary.*\-{2}/;
    // 出力用の配列
    const lineArray = [];
    // 日付を一時的に保存する変数
    let tempDate = '';
    // 1行ごとの配列を解析し，出力用の配列に入れる
    linetext.forEach(x => {
      if (x.match(date)) {
        tempDate = x;
      } else if (x.match(time)) {
        lineArray.push(
          {
            date: tempDate,
            time: x.split('\t')[0],
            user: x.split('\t')[1],
            text: x.split('\t')[2],
          }
        );
      } else if (x !== '' && !x.match(boundary)) {
        lineArray[lineArray.length - 1].text += x;
      }
    });
    res.send(lineArray);
    next();
  } catch (error) {
    res.boom.badRequest('invailed format file');
  }

})

// 出力
const api = functions.https.onRequest(app);
module.exports = { api };