const arduinopathC = "C:\\Users\\Petr\\Downloads\\arduino-1.6.8-windows\\arduino-1.6.8\\arduino_debug.exe";
var arduinopath = arduinopathC;

var http = require('http'),
    fileSystem = require('fs'),
    path = require('path'),
    shell = require('shelljs');

function randomInt(low, high) {
    return Math.floor(Math.random() * (high - low) + low);
}

http.createServer(function(request, response) {
        response.setHeader('Access-Control-Allow-Origin', '*');
        response.setHeader('Access-Control-Allow-Methods', 'GET, POST');
        response.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
        response.setHeader('Access-Control-Allow-Credentials', true);

        var data = request.url

        if (data == '/favicon.ico') {
            response.writeHead(200);
        } else {
            data = decodeURI(data);
            data = data.substring(7);

            arduinopath = arduinopathC;
            var rnd = "s" + randomInt(0, 99999).toString();
            var rnd_o = "o" + rnd;
            var s_Path = rnd + "/" + rnd + ".ino";
            var o_Path = rnd_o + "\\";
            var h_Path = rnd_o + "/" + rnd + ".ino.with_bootloader.hex";

            var json = JSON.parse(data);
            var board = json.board;
            var sketch = json.sketch;
            sketch = sketch.replace(/%0A/g, '\n');

            shell.exec("mkdir " + rnd, { silent: true });
            shell.exec("mkdir " + rnd_o, { silent: true });

            fileSystem.writeFile(s_Path, sketch, function(err) {
                if (err) {
                    return console.log(err);
                }

                arduinopath += (" --board " + board) + (" --pref build.path=" + rnd_o) + (" --verify " + s_Path);
                shell.exec(arduinopath, function(code, stdout, stderr) {
                    if (code == 0) {
                        var filePath = path.join(__dirname, h_Path);

                        fileSystem.readFile(h_Path, 'utf8', function(err, data) {
                            if (err) {
                                return log(err);
                            }

                            var output = { "code": code, "hex": data, "stderr": null, "stdout": stdout }
                            var _output = JSON.stringify(output);

                            response.writeHead(200, {
                                'Content-Type': 'application/json',
                                'Content-Length': _output.length
                            });
                            response.write(_output);
                            response.end();

                            shell.rm('-rf', rnd);
                            shell.rm('-rf', rnd_o);
                        });
                    } else {
                        stderr = stderr.replace(/Loading configuration.../g, '');
                        stderr = stderr.replace(/\r\nInitializing packages.../g, '');
                        stderr = stderr.replace(/\r\nPreparing boards.../g, '');
                        stderr = stderr.replace(/\r\nVerifying...\r\n/g, '');

                        var output = { "code": code, "hex": null, "stderr": stderr, "stdout": stdout }
                        var _output = JSON.stringify(output);

                        response.writeHead(200, {
                            'Content-Type': 'application/json',
                            'Content-Length': _output.length
                        });
                        response.write(_output);
                        response.end();

                        shell.rm('-rf', rnd);
                        shell.rm('-rf', rnd_o);
                    }
                });
            });
        }
    })
    .listen(2000);

function log(data) {
    console.log(data);
}