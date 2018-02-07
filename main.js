document.addEventListener('DOMContentLoaded', function () {
  document.querySelector('button[target]').addEventListener('click', c_screentshot);
  document.querySelector('button[id_0]').addEventListener('click', f_screentshot);
  document.querySelector('button[id_1]').addEventListener('click', createORloadDB);
  // document.querySelector('button[id_2]').addEventListener('click', loadDB);
  document.querySelector('button[id_3]').addEventListener('click', createOrloadTable);
  document.querySelector('button[id_4]').addEventListener('click', DeleteTable);
  document.querySelector('button[id_5]').addEventListener('click', popupDB);
});

var db;

function createORloadDB(element) {
    if (window.openDatabase) { 
        DB_name = dbname.value;
        db = window.openDatabase(DB_name, "1.0", "Capture_Screen", 1024*1024);
    }
}

function createOrloadTable(element) {
    if (!db) {
        alert ("Create Or Load DB First!");
    }
    else {
        db.transaction(function(tx){
            tablequery = "CREATE TABLE " + t_name.value + "(Time,File_Name,Hash)";
            tx.executeSql(tablequery);
        });
    }
}

function InsertData(data) {
    db.transaction(function(tx){ 
        alert (t_name.value)
        capture_time = data.split(" ")[0] +" "+data.split(" ")[1] +" "+ data.split(" ")[2]
        +" "+ data.split(" ")[3] + " "+ data.split(" ")[4];
        hash_value = data.split(" ")[5].split(".")[0]
        Inquery = "INSERT INTO " + t_name.value + "(Time,File_Name,Hash) values(?,?,?)"
        tx.executeSql(Inquery,[capture_time, data, hash_value]);
    });
}

function DeleteTable() {
    if (!db) {
        alert ("Load DB First")
    }
    else {
        db.transaction(function(tx){ 
            delquery = "DROP table " + td_name.value;
            tx.executeSql(delquery);
        });
    }
}

function popupDB() {
    var popUrl = "test.html";//팝업창에 출력될 페이지 URL
    var popOption = "width=900, height=500, resizable=no, scrollbars=no, status=no;";//팝업창 옵션(optoin)
    window.open(popUrl,"Print Web SQL Database",popOption);
}

function c_screentshot(element) {
    if(!!window.openDatabase) {
     alert("현재 브라우저는 Web SQL Database를 지원합니다")
    }
    else{
      alert("현재 브라우저는 Web SQL Database를 지원하지 않습니다")
    }
    var downloadLink = document.querySelector("#MHTML");
    chrome.tabs.getSelected(null, function(tab) {
        chrome.pageCapture.saveAsMHTML({tabId: tab.id}, function (mhtml){
            var url = window.URL.createObjectURL(mhtml);
            current_download(url, getLocalTimeString()+" "+tab.url.split("://")[1] + ".mht")
        });
    });

    chrome.tabs.captureVisibleTab(function(screenshotUrl) {
        //alert (screenshotUrl)
        cur_exif = cur_handleFileSelect(screenshotUrl)
        filename = getLocalTimeString()+" "+calcMD5(atob(cur_exif.split(',')[1])).toUpperCase()+".jpg"
        current_download(cur_exif, filename); 
        InsertData(filename);
    });
} 

function cur_handleFileSelect(dataURI) {
    var f = dataURI;
    // make exif data
    var zerothIfd = {};
    var exifIfd = {};
    var gpsIfd = {};
    //alert (getLocalTime4Exif());
    exifIfd[piexif.ExifIFD.DateTimeOriginal] = getLocalTime4Exif();
    var exifObj = {"0th":zerothIfd, "Exif":exifIfd, "GPS":gpsIfd};
    // get exif binary as "string" type
    var exifBytes = piexif.dump(exifObj);
    
    var reader = new FileReader();

    var origin = piexif.load(dataURI);

    // insert exif binary into JPEG binary(DataURL)
    var jpeg = piexif.insert(exifBytes, dataURI)
    return jpeg;
}

function current_download(capture_url, filename) {
  var a = document.createElement("a");
  a.href = capture_url;
  a.setAttribute("download", filename);
  var b = document.createEvent("MouseEvents");
  b.initEvent("click", false, true);
  a.dispatchEvent(b);
  return false;
}

function f_screentshot (element) {
    if(!!window.openDatabase) {
     alert("현재 브라우저는 Web SQL Database를 지원합니다")
    }
    else{
      alert("현재 브라우저는 Web SQL Database를 지원하지 않습니다")
    }
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        var tab = tabs[0]; // used in later calls to get tab info 
        captureToBlobs(tab)
    });

    var downloadLink = document.querySelector("#MHTML");
    chrome.tabs.getSelected(null, function(tab) {
    chrome.pageCapture.saveAsMHTML({tabId: tab.id}, function (mhtml){
      //alert (tab.url)
      var url = window.URL.createObjectURL(mhtml);
      //alert (url)
      //window.open(url)
      current_download(url, getLocalTimeString()+" "+tab.url.split("://")[1] + ".mht")
      });
    });
}

// https://github.com/mrcoles/full-page-screen-capture-chrome-extension
function captureToBlobs(tab) {
    var loaded = false,
        screenshots = [],
        timeout = 3000,
        timedOut = false;

    chrome.tabs.executeScript(tab.id, {file: 'page.js'}, function() {
        initiateCapture(tab, function() {
        getBlobs(screenshots);
        });
    });

    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        if (request.msg === 'capture') {
            capture(request, screenshots, sendResponse);
            // https://developer.chrome.com/extensions/messaging#simple
            return true;
        } else {
            console.error('Unknown message received from content script: ' + request.msg);
            return false;
        }
    });
}

function initiateCapture(tab, call_scroll) {
    chrome.tabs.sendMessage(tab.id, {msg: 'scrollPage'}, function() {
        // We're done taking snapshots of all parts of the window.
        call_scroll();
    });
}

function getBlobs(screenshots) {
    return screenshots.map(function(screenshot) {
        var dataURI = screenshot.canvas.toDataURL('image/jpeg', 0.8);
        blob = full_handleFileSelect(dataURI)
        full_download (blob[0], getLocalTimeString()+" "+calcMD5(blob[1]).toUpperCase()+".jpg")
       // return blob;
    });
}

// https://github.com/hMatoba/piexifjs
function full_handleFileSelect(dataURI) {
    var f = dataURI;
    
    // make exif data
    var zerothIfd = {};
    var exifIfd = {};
    var gpsIfd = {};
    zerothIfd[piexif.ImageIFD.Make] = "Maker Name";
    zerothIfd[piexif.ImageIFD.Software] = "Piexifjs";
    exifIfd[piexif.ExifIFD.DateTimeOriginal] = getLocalTime4Exif();
    var exifObj = {"0th":zerothIfd, "Exif":exifIfd, "GPS":gpsIfd};
    // get exif binary as "string" type
    var exifBytes = piexif.dump(exifObj);
    
    var reader = new FileReader();

    var origin = piexif.load(dataURI);

    // insert exif binary into JPEG binary(DataURL)
    var jpeg = piexif.insert(exifBytes, dataURI);
    
    // show JPEG modified exif
    // convert base64 to raw binary data held in a string
    // doesn't handle URLEncoded DataURIs
    var byteString = atob(jpeg.split(',')[1]);

    // separate out the mime component
    var mimeString = jpeg.split(',')[0].split(':')[1].split(';')[0];

    // write the bytes of the string to an ArrayBuffer
    var ab = new ArrayBuffer(byteString.length);
    var ia = new Uint8Array(ab);
    for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }

    // create a blob for writing to a file
    var blob = new Blob([ab], {type: mimeString}); 

    return [blob, byteString];
}

function full_download(capture_url, filename) {
    var a = document.createElement("a");
    a.href = window.URL.createObjectURL(capture_url);
    a.setAttribute("download", filename);
    var b = document.createEvent("MouseEvents");
    b.initEvent("click", false, true);
    a.dispatchEvent(b);
    return false;
}

function getLocalTimeString(){
    var now = new Date();
    return now.toLocaleString();
}

function getLocalTime4Exif() {
    var now_time = new Date();
    var year = now_time.getFullYear();
    var month = now_time.getMonth() +1 ;
    var date = now_time.getDate();
    var hour = now_time.getHours();
    var minute = now_time.getMinutes();
    var second = now_time.getSeconds();
    var fulltime = year + ":" + month + ":" + date + " " + hour + ":" + minute + ":" + second;

    return fulltime;
}

function capture(data, screenshots, sendResponse) {
    chrome.tabs.captureVisibleTab(
        null, {format: 'jpeg', quality: 100}, function(dataURI) {
            if (dataURI) {
                var image = new Image();
                image.onload = function() {
                    data.image = {width: image.width, height: image.height};
                    // given device mode emulation or zooming, we may end up with
                    // a different sized image than expected, so let's adjust to
                    // match it!
                    if (data.windowWidth !== image.width) {
                        var scale = image.width / data.windowWidth;
                        data.x *= scale;
                        data.y *= scale;
                        data.totalWidth *= scale;
                        data.totalHeight *= scale;
                    }

                    // lazy initialization of screenshot canvases (since we need to wait
                    // for actual image size)
                    if (!screenshots.length) {
                        Array.prototype.push.apply(
                            screenshots,
                            _initScreenshots(data.totalWidth, data.totalHeight)
                        );
                        if (screenshots.length > 1) {
                            $('screenshot-count').innerText = screenshots.length;
                        }
                    }

                    // draw it on matching screenshot canvases
                    _filterScreenshots(
                        data.x, data.y, image.width, image.height, screenshots
                    ).forEach(function(screenshot) {
                        screenshot.ctx.drawImage(
                            image,
                            data.x - screenshot.left,
                            data.y - screenshot.top
                        );
                    });

                    // send back log data for debugging (but keep it truthy to
                    // indicate success)
                    sendResponse(JSON.stringify(data, null, 4) || true);
                };
                image.src = dataURI;
            }
        });
}

function _initScreenshots(totalWidth, totalHeight) {
    // Create and return an array of screenshot objects based on the `totalWidth` and `totalHeight` of the final image.
    // We have to account for multiple canvases if too large, because Chrome won't generate an image otherwise.

    var MAX_PRIMARY_DIMENSION = 15000 * 2,
        MAX_SECONDARY_DIMENSION = 4000 * 2,
        MAX_AREA = MAX_PRIMARY_DIMENSION * MAX_SECONDARY_DIMENSION;
    var badSize = (totalHeight > MAX_PRIMARY_DIMENSION ||
                   totalWidth > MAX_PRIMARY_DIMENSION ||
                   totalHeight * totalWidth > MAX_AREA),
        biggerWidth = totalWidth > totalHeight,
        maxWidth = (!badSize ? totalWidth :
                    (biggerWidth ? MAX_PRIMARY_DIMENSION : MAX_SECONDARY_DIMENSION)),
        maxHeight = (!badSize ? totalHeight :
                     (biggerWidth ? MAX_SECONDARY_DIMENSION : MAX_PRIMARY_DIMENSION)),
        numCols = Math.ceil(totalWidth / maxWidth),
        numRows = Math.ceil(totalHeight / maxHeight),
        row, col, canvas, left, top;

    var canvasIndex = 0;
    var result = [];

    for (row = 0; row < numRows; row++) {
        for (col = 0; col < numCols; col++) {
            canvas = document.createElement('canvas');
            canvas.width = (col == numCols - 1 ? totalWidth % maxWidth || maxWidth :
                            maxWidth);
            canvas.height = (row == numRows - 1 ? totalHeight % maxHeight || maxHeight :
                             maxHeight);

            left = col * maxWidth;
            top = row * maxHeight;

            result.push({
                canvas: canvas,
                ctx: canvas.getContext('2d'),
                index: canvasIndex,
                left: left,
                right: left + canvas.width,
                top: top,
                bottom: top + canvas.height
            });

            canvasIndex++;
        }
    }

    return result;
}

function _filterScreenshots(imgLeft, imgTop, imgWidth, imgHeight, screenshots) {
    // Filter down the screenshots to ones that match the location of the given image.
    var imgRight = imgLeft + imgWidth,
        imgBottom = imgTop + imgHeight;
    return screenshots.filter(function(screenshot) {
        return (imgLeft < screenshot.right &&
                imgRight > screenshot.left &&
                imgTop < screenshot.bottom &&
                imgBottom > screenshot.top);
    });
}

// "http://pajhome.org.uk/crypt/md5/md5.html"
var hex_chr = "0123456789abcdef";
function rhex(num){
  str = "";
  for(j = 0; j <= 3; j++)
    str += hex_chr.charAt((num >> (j * 8 + 4)) & 0x0F) +
           hex_chr.charAt((num >> (j * 8)) & 0x0F);
  return str;
}


function str2blks_MD5(str) {
  nblk = ((str.length + 8) >> 6) + 1;
  blks = new Array(nblk * 16);
  for(i = 0; i < nblk * 16; i++) blks[i] = 0;
  for(i = 0; i < str.length; i++)
    blks[i >> 2] |= str.charCodeAt(i) << ((i % 4) * 8);
  blks[i >> 2] |= 0x80 << ((i % 4) * 8);
  blks[nblk * 16 - 2] = str.length * 8;
  return blks;
}

/*
 * Add integers, wrapping at 2^32. This uses 16-bit operations internally 
 * to work around bugs in some JS interpreters.
 */
function add(x, y) {
  var lsw = (x & 0xFFFF) + (y & 0xFFFF);
  var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
  return (msw << 16) | (lsw & 0xFFFF);
}

/*
 * Bitwise rotate a 32-bit number to the left
 */
function rol(num, cnt) {
  return (num << cnt) | (num >>> (32 - cnt));
}

/*
 * These functions implement the basic operation for each round of the
 * algorithm.
 */
function cmn(q, a, b, x, s, t) {
  return add(rol(add(add(a, q), add(x, t)), s), b);
}

function ff(a, b, c, d, x, s, t) {
  return cmn((b & c) | ((~b) & d), a, b, x, s, t);
}

function gg(a, b, c, d, x, s, t){
  return cmn((b & d) | (c & (~d)), a, b, x, s, t);
}

function hh(a, b, c, d, x, s, t){
  return cmn(b ^ c ^ d, a, b, x, s, t);
}

function ii(a, b, c, d, x, s, t){
  return cmn(c ^ (b | (~d)), a, b, x, s, t);
}

/*
 * Take a string and return the hex representation of its MD5.
 */
function calcMD5(str) {
  x = str2blks_MD5(str);
  a =  1732584193;
  b = -271733879;
  c = -1732584194;
  d =  271733878;

  for(i = 0; i < x.length; i += 16)   {
    olda = a;
    oldb = b;
    oldc = c;
    oldd = d;

    a = ff(a, b, c, d, x[i+ 0], 7 , -680876936);
    d = ff(d, a, b, c, x[i+ 1], 12, -389564586);
    c = ff(c, d, a, b, x[i+ 2], 17,  606105819);
    b = ff(b, c, d, a, x[i+ 3], 22, -1044525330);
    a = ff(a, b, c, d, x[i+ 4], 7 , -176418897);
    d = ff(d, a, b, c, x[i+ 5], 12,  1200080426);
    c = ff(c, d, a, b, x[i+ 6], 17, -1473231341);
    b = ff(b, c, d, a, x[i+ 7], 22, -45705983);
    a = ff(a, b, c, d, x[i+ 8], 7 ,  1770035416);
    d = ff(d, a, b, c, x[i+ 9], 12, -1958414417);
    c = ff(c, d, a, b, x[i+10], 17, -42063);
    b = ff(b, c, d, a, x[i+11], 22, -1990404162);
    a = ff(a, b, c, d, x[i+12], 7 ,  1804603682);
    d = ff(d, a, b, c, x[i+13], 12, -40341101);
    c = ff(c, d, a, b, x[i+14], 17, -1502002290);
    b = ff(b, c, d, a, x[i+15], 22,  1236535329);    

    a = gg(a, b, c, d, x[i+ 1], 5 , -165796510);
    d = gg(d, a, b, c, x[i+ 6], 9 , -1069501632);
    c = gg(c, d, a, b, x[i+11], 14,  643717713);
    b = gg(b, c, d, a, x[i+ 0], 20, -373897302);
    a = gg(a, b, c, d, x[i+ 5], 5 , -701558691);
    d = gg(d, a, b, c, x[i+10], 9 ,  38016083);
    c = gg(c, d, a, b, x[i+15], 14, -660478335);
    b = gg(b, c, d, a, x[i+ 4], 20, -405537848);
    a = gg(a, b, c, d, x[i+ 9], 5 ,  568446438);
    d = gg(d, a, b, c, x[i+14], 9 , -1019803690);
    c = gg(c, d, a, b, x[i+ 3], 14, -187363961);
    b = gg(b, c, d, a, x[i+ 8], 20,  1163531501);
    a = gg(a, b, c, d, x[i+13], 5 , -1444681467);
    d = gg(d, a, b, c, x[i+ 2], 9 , -51403784);
    c = gg(c, d, a, b, x[i+ 7], 14,  1735328473);
    b = gg(b, c, d, a, x[i+12], 20, -1926607734);
    
    a = hh(a, b, c, d, x[i+ 5], 4 , -378558);
    d = hh(d, a, b, c, x[i+ 8], 11, -2022574463);
    c = hh(c, d, a, b, x[i+11], 16,  1839030562);
    b = hh(b, c, d, a, x[i+14], 23, -35309556);
    a = hh(a, b, c, d, x[i+ 1], 4 , -1530992060);
    d = hh(d, a, b, c, x[i+ 4], 11,  1272893353);
    c = hh(c, d, a, b, x[i+ 7], 16, -155497632);
    b = hh(b, c, d, a, x[i+10], 23, -1094730640);
    a = hh(a, b, c, d, x[i+13], 4 ,  681279174);
    d = hh(d, a, b, c, x[i+ 0], 11, -358537222);
    c = hh(c, d, a, b, x[i+ 3], 16, -722521979);
    b = hh(b, c, d, a, x[i+ 6], 23,  76029189);
    a = hh(a, b, c, d, x[i+ 9], 4 , -640364487);
    d = hh(d, a, b, c, x[i+12], 11, -421815835);
    c = hh(c, d, a, b, x[i+15], 16,  530742520);
    b = hh(b, c, d, a, x[i+ 2], 23, -995338651);

    a = ii(a, b, c, d, x[i+ 0], 6 , -198630844);
    d = ii(d, a, b, c, x[i+ 7], 10,  1126891415);
    c = ii(c, d, a, b, x[i+14], 15, -1416354905);
    b = ii(b, c, d, a, x[i+ 5], 21, -57434055);
    a = ii(a, b, c, d, x[i+12], 6 ,  1700485571);
    d = ii(d, a, b, c, x[i+ 3], 10, -1894986606);
    c = ii(c, d, a, b, x[i+10], 15, -1051523);
    b = ii(b, c, d, a, x[i+ 1], 21, -2054922799);
    a = ii(a, b, c, d, x[i+ 8], 6 ,  1873313359);
    d = ii(d, a, b, c, x[i+15], 10, -30611744);
    c = ii(c, d, a, b, x[i+ 6], 15, -1560198380);
    b = ii(b, c, d, a, x[i+13], 21,  1309151649);
    a = ii(a, b, c, d, x[i+ 4], 6 , -145523070);
    d = ii(d, a, b, c, x[i+11], 10, -1120210379);
    c = ii(c, d, a, b, x[i+ 2], 15,  718787259);
    b = ii(b, c, d, a, x[i+ 9], 21, -343485551);

    a = add(a, olda);
    b = add(b, oldb);
    c = add(c, oldc);
    d = add(d, oldd);
  }
  return rhex(a) + rhex(b) + rhex(c) + rhex(d);
}
