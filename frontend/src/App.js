import io from "socket.io-client";
import { useEffect, useState } from "react";
const socket = io.connect("http://localhost:3000");

function App() {
  useEffect(() => {
    socket.on("recieve message", (msg) => {
      console.log(msg);
    });
    socket.on("connect", () => {
      console.log("connected");
    });
  }, [socket]);

  return (
    <>
      <button
        onClick={() =>
          socket.emit("chat message", {
            message: 22 + 22,
          })
        }
      >
        Send Message
      </button>
    </>
  );
}

export default App;
