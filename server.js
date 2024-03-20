const http = require('http');
const fs = require('fs').promises;
const path = require('path');

function logRequest(ip, url, statusCode) {
    const logEntry = `${new Date().toISOString()} | IP: ${ip} | URL: ${url} | Status Code: ${statusCode}\n`;
    fs.appendFile('server.log', logEntry)
        .catch(err => {
            console.error('Error writing to log file:', err);
        });
}

async function handleRequest(req, res) {
    const ip = req.connection.remoteAddress;
    const url = req.url === '/' ? '/index.html' : req.url;
    const filePath = path.join(__dirname, url);

    try {
        const data = await fs.readFile(filePath);
        return { data, ip, url };
    } catch (err) {
        return { err, ip, url };
    }
}

const server = http.createServer(async (req, res) => {
    try {
        await new Promise((resolve) => setTimeout(resolve, 3000));
        const { data, ip, url } = await handleRequest(req, res);
        res.writeHead(200);
        res.end(data);
        logRequest(ip, url, 200);
    } catch (errorInfo) {
        const { err, ip, url } = errorInfo;
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
        logRequest(ip, url, 404);
    }
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});


function gracefulShutdown() {
    server.close(() => {
        console.log('Server gracefully shut down');
        process.exit(0);
    });
}

process.on('SIGINT', () => {
    console.log('Received SIGINT signal');
    gracefulShutdown();
});

process.on('SIGTERM', () => {
    console.log('Received SIGTERM signal');
    gracefulShutdown();
});
