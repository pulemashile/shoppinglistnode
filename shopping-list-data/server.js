const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Define directory and file paths
const dirName = 'shopping-list-data';
const fileName = 'shopping-list.json';
const filePath = path.join(dirName, fileName);

// Ensure the directory and file exist
if (!fs.existsSync(dirName)) {
  fs.mkdirSync(dirName); // Create the directory if it doesn't exist
}
if (!fs.existsSync(filePath)) {
  fs.writeFileSync(filePath, JSON.stringify({ items: [] })); // Create the file with an empty list if it doesn't exist
}

// Create the HTTP server
const server = http.createServer((req, res) => {
  const urlParts = url.parse(req.url, true);
  const endpoint = urlParts.pathname;

  // Handle GET requests
  if (req.method === 'GET' && endpoint === '/shopping-list') {
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Error reading file' }));
      } else {
        try {
          const jsonData = JSON.parse(data);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(jsonData));
        } catch (parseError) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Error parsing JSON data' }));
        }
      }
    });
  }

  // Handle POST requests
  if (req.method === 'POST' && endpoint === '/shopping-list') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        const newItem = JSON.parse(body);
        fs.readFile(filePath, (err, data) => {
          if (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Error reading file' }));
          } else {
            const jsonData = JSON.parse(data);
            jsonData.items.push(newItem);
            fs.writeFile(filePath, JSON.stringify(jsonData), (err) => {
              if (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Error writing file' }));
              } else {
                res.writeHead(201, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(newItem));
              }
            });
          }
        });
      } catch (parseError) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON in request body' }));
      }
    });
  }

  // Handle PUT/PATCH requests
  if ((req.method === 'PUT' || req.method === 'PATCH') && endpoint.startsWith('/shopping-list/')) {
    const id = endpoint.split('/')[2]; // Get ID from URL
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        const updatedItem = JSON.parse(body);
        fs.readFile(filePath, (err, data) => {
          if (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Error reading file' }));
          } else {
            const jsonData = JSON.parse(data);
            const index = jsonData.items.findIndex((item) => item.id === id);
            if (index !== -1) {
              jsonData.items[index] = updatedItem;
              fs.writeFile(filePath, JSON.stringify(jsonData), (err) => {
                if (err) {
                  res.writeHead(500, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ error: 'Error writing file' }));
                } else {
                  res.writeHead(200, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify(updatedItem));
                }
              });
            } else {
              res.writeHead(404, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Item not found' }));
            }
          }
        });
      } catch (parseError) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON in request body' }));
      }
    });
  }

  // Handle DELETE requests
  if (req.method === 'DELETE' && endpoint.startsWith('/shopping-list/')) {
    const id = endpoint.split('/')[2]; // Get ID from URL
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Error reading file' }));
      } else {
        const jsonData = JSON.parse(data);
        const index = jsonData.items.findIndex((item) => item.id === id);
        if (index !== -1) {
          jsonData.items.splice(index, 1);
          fs.writeFile(filePath, JSON.stringify(jsonData), (err) => {
            if (err) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Error writing file' }));
            } else {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ message: 'Item deleted' }));
            }
          });
        } else {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Item not found' }));
        }
      }
    });
  }
});

// Start the server
server.listen(3000, () => {
  console.log('Server started on port 3000');
});
