import React, { useEffect, useRef, useState } from "react";
import debounce from "lodash.debounce";
import "./App.css";

function App() {
  const [content, setContent] = useState("");
  const [version, setVersion] = useState(0);
  const ws = useRef(null);
  const contentRef = useRef(null); // To reference the contentEditable div

  useEffect(() => {
    ws.current = new WebSocket("ws://localhost:3001");

    ws.current.onopen = () => {
      console.log("Connected to server");
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "init" || data.type === "update") {
        setContent(data.content);
        setVersion(data.version);
      }

      if (data.type === "conflict") {
        alert("Conflict detected. Refreshed with latest version.");
        setContent(data.content);
        setVersion(data.version);
      }

      if (data.type === "save") {
        alert("✅ Document saved successfully!");
      }
    };

    return () => {
      ws.current.close();
    };
  }, []);

  const sendUpdate = useRef(
    debounce((newContent, currentVersion) => {
      if (ws.current.readyState === WebSocket.OPEN) {
        ws.current.send(
          JSON.stringify({
            type: "update",
            content: newContent,
            version: currentVersion,
          })
        );
      }
    }, 300)
  ).current;

  const handleChange = () => {
    const newContent = contentRef.current.innerHTML;  // Get the current content directly
    setContent(newContent);  // Update state with the new content
    sendUpdate(newContent, version);  // Send update to WebSocket server
  };

  const handleSave = () => {
    if (ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type: "save" }));
    }
  };

  // Formatting functions
  const toggleBold = () => {
    document.execCommand("bold", false, null);
  };

  const toggleItalic = () => {
    document.execCommand("italic", false, null);
  };

  const changeFontColor = (color) => {
    document.execCommand("foreColor", false, color);
  };

  const changeHeading = (headingType) => {
    document.execCommand("formatBlock", false, headingType);
  };

  const changeFontSize = (size) => {
    document.execCommand("fontSize", false, size);
  };

  return (
    <div className="editor-container">
      <h1>📄 Real-Time Collaborative Editor</h1>

      {/* Toolbar with formatting buttons */}
      <div className="toolbar">
        <button onClick={toggleBold}><strong>B</strong></button>
        <button onClick={toggleItalic}><em>I</em></button>

        {/* Dropdown for Font Color */}
        <select onChange={(e) => changeFontColor(e.target.value)} className="color-dropdown">
          <option value="">Select Color</option>
          <option value="red">Red</option>
          <option value="blue">Blue</option>
          <option value="green">Green</option>
          <option value="black">Black</option>
        </select>

        {/* Dropdown for Heading Sizes */}
        <select onChange={(e) => changeHeading(e.target.value)} className="heading-dropdown">
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
        </select>

        {/* Dropdown for Font Size */}
        <select onChange={(e) => changeFontSize(e.target.value)} className="size-dropdown">
          <option value="3">Normal</option>
          <option value="4">Medium</option>
          <option value="5">Large</option>
          <option value="6">X-Large</option>
        </select>
      </div>

      {/* Content editable div */}
      <div
        ref={contentRef}
        className="editor"
        contentEditable={true}
        onInput={handleChange}
        placeholder="Start typing with your team..."
      ></div>

      <button onClick={handleSave}>💾 Save Document</button>
    </div>
  );
}

export default App;
