const port = process.env.PORT || 7778;

const http = require('http');
const fs = require("fs");
const path = require('path');

/**
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 */
const requestHandler = (req, res) => {
    // const url = new URL(req.url, `http://${req.headers.host}`);
    // const convertedPathname = path.parse(url.pathname);
    // console.log(convertedPathname);
    // if (convertedPathname.base == "selfHost" && convertedPathname.dir == '/') {
    //     res.writeHead(200);
    //     res.end();
    //     return;
    // }
    // if (fs.existsSync("." + convertedPathname.dir) && url.pathname != '/') {
    //     res.end(fs.readFileSync("." + url.pathname));
    //     return;
    // }
    const test = path.join(__dirname, req.url);
    console.log(test);
    const parsed = path.parse(test);
    console.log(parsed);
    if (parsed.base == "selfHost" && parsed.dir == __dirname) {
        res.writeHead(200);
        res.end();
        return;
    }
    if (fs.existsSync(test) && !test.endsWith(path.sep)) {
        fs.createReadStream(test).pipe(res);
        return;
    }
    // res.end(fs.readFileSync("./index.html"));
    fs.createReadStream("./index.html").pipe(res);
};

const server = http.createServer(requestHandler);

server.listen(port, (err) => {
    if (err) {
        return console.log('something bad happened', err);
    }

    console.log(`server is listening on ${port}`);
});
