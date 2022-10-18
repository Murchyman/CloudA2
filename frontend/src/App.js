import io from "socket.io-client";
import { useEffect, useState } from "react";
const socket = io.connect("http://localhost:3000");
function App() {
  const [text, setText] = useState("");
  const [tweets, setTweets] = useState([]);
  useEffect(() => {
    socket.on("connect", () => {});
    socket.on("connection", (data) => {
      console.log(data);
    });
    socket.on("output", (data) => {
      console.log(data);
      setTweets((tweets) => [...tweets, data]);
    });
  }, [socket]);

  return (
    <>
      <h1>
        {tweets.length > 0
          ? tweets?.[tweets.length - 1]?.averageSentiment
          : "average sentiment"}
      </h1>
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
      <button onClick={() => socket.disconnect()}>Disconnect</button>
      <div>
        {tweets.map((item) => (
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
