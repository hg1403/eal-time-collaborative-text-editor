const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const fs = require("fs");
const path = require("path");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = 3001;
const savedFilePath = path.join(__dirname, "saved.txt");

let savedContent = "";
let currentVersion = 0;

// Load the latest content from the last save entry
if (fs.existsSync(savedFilePath)) {
  const fileContent = fs.readFileSync(savedFilePath, "utf8");
  const entries = fileContent.split("\n\n=== Save Entry ===\n\n");
  savedContent = entries[entries.length - 1] || "";
}

wss.on("connection", (ws) => {
  console.log("New client connected");

  // Send initial content and version
  ws.send(
    JSON.stringify({
      type: "init",
      content: savedContent,
      version: currentVersion,
    })
  );

  ws.on("message", (message) => {
    const data = JSON.parse(message);

    if (data.type === "update") {
      if (data.version === currentVersion) {
        savedContent = data.content;
        currentVersion++;

        // Broadcast updated content to all other clients
        wss.clients.forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(
              JSON.stringify({
                type: "update",
                content: savedContent,
                version: currentVersion,
              })
            );
          }
        });
      } else {
        // Auto-resolve by sending back latest content without alert
        ws.send(
          JSON.stringify({
            type: "update",
            content: savedContent,
            version: currentVersion,
          })
        );
      }
    }

    if (data.type === "save") {
      const timestamp = new Date().toLocaleString();
      const entry = `\n\n=== Save Entry ===\n\nTime: ${timestamp}\n\n${savedContent}`;
      
      // Append instead of overwriting
      fs.appendFile(savedFilePath, entry, "utf8", (err) => {
        if (err) {
          console.error("Error saving file:", err);
        } else {
          console.log("Document saved to history.");
          ws.send(JSON.stringify({ type: "save" }));
        }
      });
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
