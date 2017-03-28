const arduinopathC = "C:\\Users\\Petr\\Downloads\\arduino-1.6.8-windows\\arduino-1.6.8\\arduino_debug.exe";
var arduinopath = arduinopathC;

var http = require('http'),
    fileSystem = require('fs'),
    path = require('path'),
    shell = require('shelljs');

function randomInt (low, high) {
    return Math.floor(Math.random() * (high - low) + low);
}

http.createServer(function(request, response) {  
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    response.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    response.setHeader('Access-Control-Allow-Credentials', true);

    var data = request.url
    data = data.replace(/%20/g, ' ');
    data = data.replace(/%0A/g, '\n');

    if(data == '/favicon.ico'){
        response.writeHead(200);
    }
    else{
        arduinopath = arduinopathC;
        var rnd = "s" + randomInt(0, 99999).toString();
        var rnd_o = "o" + rnd;
        var s_Path = rnd + "/" + rnd + ".ino";
        var o_Path = rnd_o + "\\";
        var h_Path = rnd_o + "/" + rnd + ".ino.with_bootloader.hex";

        var board = data.substring(4, data.indexOf("&s="));
        var sketch = data.substring(data.indexOf("&s=")+3);

        shell.exec("mkdir " + rnd, {silent:true});
        shell.exec("mkdir " + rnd_o, {silent:true});

        
        fileSystem.writeFile(s_Path, sketch, function(err) {
            if(err) {
                return console.log(err);
            }
            
            arduinopath += (" --board " + board) + (" --pref build.path=" + rnd_o) + (" --verify " + s_Path); 
            shell.exec(arduinopath, function(code, stdout, stderr) {                
                if (code == 0){
                    var filePath = path.join(__dirname, h_Path);
                    var stat = fileSystem.statSync(filePath);

                    response.writeHead(200, {
                        'Content-Type': 'text/hex', 
                        'Content-Length': stat.size
                    });
                    
                    var readStream = fileSystem.createReadStream(filePath);
                    readStream.on('data', function(data) {
                        response.write(data);
                    });
                    
                    readStream.on('end', function() {
                        response.end();      
                        shell.rm('-rf', rnd);
                        shell.rm('-rf', rnd_o);  
                    });
                }
                else{
                    response.writeHead(403);
                    
                    shell.rm('-rf', rnd);
                    shell.rm('-rf', rnd_o);  
                }
            });
        }); 
    }
})
.listen(2000);