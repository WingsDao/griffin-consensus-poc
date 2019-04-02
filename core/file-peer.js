/**
 * @module file-peer
 */

'use strict';

const http = require('http');

/**
 * Create one-request server on random port with given file contents
 *
 * @param  {stream.Readable} fileStream      Stream to write to response
 * @param  {Number}          [connections=1] Number of pulls to be made from server till it shuts down
 * @param  {Number}          [aliveFor=5000] Number of milliseconds while server is still alive
 * @return {Number}                          PORT that is opened
 */
exports.peer = function createFileServer(fileStream, connections = 1, aliveFor = 5000) {

    let pulls    = 0;
    const port   = randomPort();
    const server = http.createServer();

    server.on('request', (req, res) => {
        res.on('finish', () => (++pulls === connections) && server.close());
        fileStream.pipe(res);
    });

    server.listen(port);
    setTimeout(() => server.close(), aliveFor);

    return port;
};


/**
 * Pull data from peer to file via HTTP
 *
 * @param  {String}          host   Host to query
 * @param  {Number}          port   Port of the server
 * @param  {stream.Writable} stream Stream where to write response
 * @return {Promise}                Promise tbat's gonna be resolved on request end
 */
exports.pull = function pullFromPeer(host, port, stream) {

    return new Promise((resolve, reject) => {
        http.get({host, port}, (res) => {
            res.pipe(stream);
            res.on('end', resolve);
            res.on('error', reject);
        });
    });
};

/**
 * Peer single string (usually a JSON) via creating short-time HTTP server
 *
 * @param  {String|Object} string          Data to peer (share via HTTP)
 * @param  {Number}        [connections=1] Number of connections after which server is closed
 * @param  {Number}        [aliveFor=5000] Number of ms to wait until server shutdown
 * @return {Number}                        Port to peer from
 */
exports.peerString = function createBufferServer(string, connections = 1, aliveFor = 5000) {
    if (string instanceof Object) {
        string = JSON.stringify(string);
    }

    let pulls    = 0;
    const port   = randomPort();
    const server = http.createServer();

    server.on('request', (req, res) => {
        res.end(string);
        (++pulls === connections) && server.close();
    });

    server.listen(port);
    setTimeout(() => server.close(), aliveFor);

    return port;
};

/**
 * Pull data from peer via HTTP as Promise
 *
 * @param  {String}  host Host or IP to pull from
 * @param  {Number}  port Port to request
 * @return {Promise}      Promise with pulled data
 */
exports.pullString = function poolSingleString(host, port) {
    return new Promise((resolve, reject) => {
        http.get({host, port}, (res) => {
            let result = '';
            res.on('data', (chunk) => (result += chunk));
            res.on('end',  ()      => resolve(result));
            res.on('error', reject);
        });
    });
};

/**
 * Generate port in range 5000-9999.
 *
 * 3 reasons to do this in MVP:
 * - local host won't cause conflicts in port accessing
 * - one peer can share it's data to different nodes
 * - some randomization can help in resolving fake nodes
 *
 * @return {Number} Number in range 5000-9999
 */
function randomPort() {
    return 5000 + parseInt(Math.random() * 4999);
}
