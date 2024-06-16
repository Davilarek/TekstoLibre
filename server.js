const port = process.env.PORT || 7778;

const http = require('http');
const fs = require("fs");
const path = require('path');
const JSDOM = require("jsdom");
// const HTMLParser = require('node-html-parser');
// HTMLParser.HTMLElement.prototype.getElementsByClassName = function (name) {
//     return this.querySelectorAll("." + name);
// };
// HTMLParser.HTMLElement.prototype.createElement = function (type) {
//     return HTMLParser.parse(`<${type}></${type}>`);
// };
// HTMLParser.Node.prototype.insertBefore = function (newNode, referenceNode) {
//     let nodeToInsert = newNode;
//     if (newNode.parentNode) {
//         nodeToInsert = newNode.cloneNode(true);
//     }
//     if (referenceNode.previousSibling) {
//         referenceNode.previousSibling.insertAdjacentHTML('afterend', nodeToInsert.outerHTML);
//     }
//     else {
//         referenceNode.parentNode.insertAdjacentHTML('afterbegin', nodeToInsert.outerHTML);
//     }
//     if (newNode.parentNode) {
//         newNode.parentNode.removeChild(newNode);
//     }
// };
// HTMLParser.HTMLElement.prototype.before = function (...nodes) {
//     const parent = this.parentNode;
//     if (!parent) return;

//     nodes.forEach(node => {
//         parent.insertBefore(node, this);
//     });
// };
// Object.defineProperty(HTMLParser.HTMLElement.prototype, "outerHTML_", {
//     get() {
//         return this.toString();
//     },
//     set(v) {
//         this.parentNode.childNodes[this.parentNode.childNodes.indexOf(this)] = HTMLParser.parse(v);
//     },
// });
const vm = require('node:vm');
const myRequire = require;
const allowJS = !(process.argv[2] == "false") ?? true;

// function evalInScope(js, contextAsScope) {
//     // @ts-ignore
//     // eslint-disable-next-line quotes
//     return new Function(["contextAsScope", "js"], "return (function() { with(this) { return eval(js); } }).call(contextAsScope)")(contextAsScope, js);
// }

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
        /*         const globals = {
                    require(...args) {
                        console.log(myRequire(...args), args);
                        return myRequire(...args);
                    },
                    globalThis: {
                        get document() {
                            return root;
                        },
                        localStorage: undefined,
                    },
                };
                evalInScope(fs.readFileSync("./main.js", "utf8"), { ...globals, ...globals.globalThis }); */
        // const TekstowoAPI = myRequire("tekstowo-api");
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
