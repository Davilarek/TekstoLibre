const port = process.env.PORT || 7778;

const http = require('http');
const fs = require("fs");
const path = require('path');
const JSDOM = require("jsdom");
const vm = require('node:vm');
const myRequire = require;
const allowJS = !(process.argv[2] == "false") ?? true;

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
    // console.log(test);
    const parsed = path.parse(test);
    // console.log(parsed);
    if (parsed.base == "selfHost" && parsed.dir == __dirname) {
        res.writeHead(200);
        res.end();
        return;
    }
    if (!allowJS) {
        if (test.endsWith(".js")) {
            res.writeHead(404);
            res.end();
            return;
        }
    }
    if (fs.existsSync(test) && !test.endsWith(path.sep)) {
        fs.createReadStream(test).pipe(res);
        return;
    }
    // res.end(fs.readFileSync("./index.html"));
    if (!allowJS) {
        const rawHTML = fs.readFileSync("./index.html", "utf8");
        const root = new JSDOM.JSDOM(rawHTML);
        const finishedDeferred = {
            resolve: undefined,
            reject: undefined,
            promise: undefined,
        };
        finishedDeferred.promise = new Promise((resolve, reject) => {
            finishedDeferred.resolve = resolve;
            finishedDeferred.reject = reject;
        });
        const bridgeTest = {
            finishedDeferred,
        };
        const globals = {
            require(...args) {
                if (args[0] == "./TekstowoAPI")
                    return myRequire("tekstowo-api");
                return myRequire(args[0]);
            },
            globalThis: {
                Node: root.window.Node,
                URL,
                get document() {
                    return root.window.document;
                },
                localStorage: undefined,
                window: {
                    NO_JS: true,
                    bridgeTest,
                },
                location: {
                    href: req.url,
                },
                fetch(...args) {
                    if (typeof args[0] == "string")
                        if (args[0].startsWith("./")) {
                            console.log(args[0], req.headers.host + req.url.split(parsed.base)[0]);
                            args[0] = new URL(args[0], "http://" + req.headers.host + req.url.split(parsed.base)[0]);
                        }
                    return fetch(...args);
                },
                alert(...args) {
                    return console.log(...args);
                },
                console: {
                    get log() {
                        return console.log;
                    },
                    get error() {
                        return console.error;
                    },
                },
                settingsManager: {
                    settings: new Proxy({}, {
                        get() {
                            return {
                                value: undefined,
                            };
                        },
                    }),
                },
            },
        };
        const ctx = { ...globals, ...globals.globalThis };
        vm.createContext(ctx);
        vm.runInContext(fs.readFileSync("./main.js", "utf8"), ctx);
        bridgeTest.finishedDeferred.promise.then(() => {
            res.write(root.window.document.documentElement.outerHTML);
            res.end();
        });
        return;
    }
    fs.createReadStream("./index.html").pipe(res);
};

const server = http.createServer(requestHandler);

server.listen(port, (err) => {
    if (err) {
        return console.log('something bad happened', err);
    }

    console.log(`server is listening on ${port}` + (allowJS ? "" : " with JS disabled"));
});
