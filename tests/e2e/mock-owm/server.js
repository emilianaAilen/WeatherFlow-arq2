const http = require('http');

const PORT = process.env.PORT || 9090;

const WEATHER_RESPONSE = {
  main: {
    temp: 22.5,
    humidity: 60,
    pressure: 1013,
  },
};

const server = http.createServer((req, res) => {
  if (req.url.startsWith('/data/2.5/weather')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(WEATHER_RESPONSE));
  } else if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(PORT, () => {
  console.log(`OWM mock server running on port ${PORT}`);
});
