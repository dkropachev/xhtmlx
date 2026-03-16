// Simple static server for Playwright tests
// Serves docs/ as root (mimics GitHub Pages)
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 3333;
const DOCS_DIR = path.join(__dirname, "../../docs");
const ROOT_DIR = path.join(__dirname, "../..");

const MIME = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".map": "application/json",
};

const server = http.createServer((req, res) => {
  let filePath;
  const url = req.url.split("?")[0];

  // Mock API endpoints
  if (url.startsWith("/api/")) {
    res.writeHead(200, { "Content-Type": "application/json" });
    const routes = {
      "/api/users": { users: [{ id: 1, name: "Alice", email: "alice@example.com", role: "admin" }, { id: 2, name: "Bob", email: "bob@example.com", role: "user" }] },
      "/api/posts": { posts: [{ id: 1, title: "Hello", body: "World", userId: 1 }] },
      "/api/todos": { todos: [{ id: 1, title: "Test", completed: true }, { id: 2, title: "Build", completed: false }] },
    };
    res.end(JSON.stringify(routes[url] || {}));
    return;
  }

  // Serve from docs/ (mimics GitHub Pages)
  if (url === "/" || url === "/index.html") {
    filePath = path.join(DOCS_DIR, "index.html");
  } else {
    filePath = path.join(DOCS_DIR, url);
  }

  // Fallback to root for xhtmlx.js
  if (!fs.existsSync(filePath)) {
    filePath = path.join(ROOT_DIR, url);
  }

  if (!fs.existsSync(filePath)) {
    // Try index.html for directories
    const indexPath = path.join(filePath, "index.html");
    if (fs.existsSync(indexPath)) {
      filePath = indexPath;
    } else {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
  }

  const stat = fs.statSync(filePath);
  if (stat.isDirectory()) {
    filePath = path.join(filePath, "index.html");
    if (!fs.existsSync(filePath)) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
  }

  const ext = path.extname(filePath);
  const mime = MIME[ext] || "text/plain";

  res.writeHead(200, { "Content-Type": mime });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, () => {
  console.log("Test server on http://localhost:" + PORT);
});
