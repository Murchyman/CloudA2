import io from "socket.io-client";
import { useEffect, useState } from "react";
const socket = io.connect("http://localhost:3000");
function App() {
  const [text, setText] = useState("");
  const [output, setOutput] = useState([]);
  useEffect(() => {
    socket.on("connect", () => {
      console.log("connected");
    });
    socket.on("output", (data) => {
      console.log(data);
      if (output.length > 0) {
        setOutput(output.push(data));
      } else {
        setOutput([data]);
      }
    });
  }, [socket]);

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
      <div>
        {output.map((item) => (
          <div>
            <p>{item.message}</p>
            <p>{item.sentiment}</p>
            <p>{item.averageSentiment}</p>
          </div>
        ))}
      </div>
    </>
  );
}

export default App;
