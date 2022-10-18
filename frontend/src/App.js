import io from "socket.io-client";
import { useEffect, useState } from "react";
const socket = io.connect("http://localhost:3000");
function App() {
  useEffect(() => {
    socket.on("connect", () => {
      console.log("connected");
    });
    socket.on("output", (data) => {
      console.log(data);
    });
  }, [socket]);
  const [text, setText] = useState("");

  return (
    <>
      <button
        onClick={() =>
          socket.emit("param", {
            rule: text,
          })
        }
      >
        Send Message
      </button>
      <input type="text" onChange={(e) => setText(e.target.value)} />
    </>
  );
}

export default App;
