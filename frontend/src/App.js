import io from "socket.io-client";
import { useEffect, useState } from "react";
import { styled } from "@mui/material/styles";
import Paper from "@mui/material/Paper";
import InputBase from "@mui/material/InputBase";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import CircularProgress from "@mui/material/CircularProgress";
import { List, Typography } from "@mui/material";
const socket = io.connect("http://localhost:3000");
function App() {
  const [tag, setTag] = useState("");
  const [tweets, setTweets] = useState([]);
  const [loading, setLoading] = useState(false);
  const Item = styled(Paper)(({ theme }) => ({
    backgroundColor: theme.palette.mode === "dark" ? "#1A2027" : "#fff",
    ...theme.typography.body2,
    padding: theme.spacing(1),
    textAlign: "center",
    color: theme.palette.text.secondary,
  }));
  useEffect(() => {
    socket.on("connect", () => {});
    socket.on("connection", (data) => {
      console.log(data);
    });
    socket.on("output", (data) => {
      console.log(data);
      setLoading(false);
      setTweets((tweets) => [...tweets, data]);
    });
  }, [socket]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        height: "100vh",
        padding: "2em",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Paper
          component="form"
          sx={{
            p: "2px 4px",
            display: "flex",
            alignItems: "center",
            width: 400,
          }}
        >
          <InputBase
            onChange={(e) => {
              setTweets([]);
              setTag(e.target.value);
            }}
            sx={{ ml: 1, flex: 1 }}
            placeholder="Type a tag"
            inputProps={{ "aria-label": "type a tag" }}
          />
        </Paper>
        <br />
        <Button
          onClick={() => {
            socket.emit("param", {
              rule: tag,
            });
            setLoading(true);
          }}
          variant="contained"
        >
          Start stream
        </Button>
        <br />
        <Button
          onClick={() => socket.disconnect()}
          color="error"
          variant="contained"
        >
          Stop stream
        </Button>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "flex-start",
          margin: "3em",
          justifyContent: "flex-start",
        }}
      >
        {loading ? <CircularProgress /> : null}
        {tweets.length > 0 && (
          <Paper
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "flex-start",
              padding: "2em",
              maxHeight: "50vh",
              maxWidth: "33vw",
              overflow: "auto",
            }}
          >
            <Typography variant="h4">#{tag}</Typography>
            <Typography variant="h6">
              Average Sentiment:{" "}
              {tweets.length > 0
                ? tweets?.[tweets.length - 1]?.averageSentiment
                : "null"}
            </Typography>
            <Typography variant="h6">Total Tweets: {tweets.length}</Typography>
            {/* clear tweets */}
            <Button
              onClick={() => setTweets([])}
              color="error"
              variant="contained"
            >
              Clear tweets
            </Button>

            <List>
              {tweets.map((tweet, index) => (
                <Item key={index}>
                  <div>{tweet.message}</div>
                  <h5>
                    sentiment:{" "}
                    {tweet.sentiment === 0 ? "neutral" : tweet.sentiment}
                  </h5>
                  <h5>
                    spelling errors:{" "}
                    {tweet.misspelled.length > 0
                      ? tweet.misspelled.map((word, index) => (
                          <span key={index}>{word}, </span>
                        ))
                      : null}
                  </h5>
                  <h5>
                    handles:{" "}
                    {tweet.handles.length > 0
                      ? tweet.handles.map((hashtag, index) => (
                          <span key={index}>{hashtag}, </span>
                        ))
                      : null}
                  </h5>
                  <Divider />
                </Item>
              ))}
            </List>
          </Paper>
        )}
      </div>
    </div>

    // <>
    //   <h1>
    //     {tweets.length > 0
    //       ? tweets?.[tweets.length - 1]?.averageSentiment
    //       : "average sentiment"}
    //   </h1>
    //   <button
    //     onClick={() =>
    //       socket.emit("param", {
    //         rule: text,
    //       })
    //     }
    //   >
    //     Send Message
    //   </button>
    //   <input type="text" onChange={(e) => setText(e.target.value)} />
    //   <button onClick={() => socket.disconnect()}>Disconnect</button>
    //   <div>
    //     {tweets.map((item) => (
    //       <div>
    //         <p>{item.message}</p>
    //         <p>{item.sentiment}</p>
    //         <p>{item.averageSentiment}</p>
    //       </div>
    //     ))}
    //   </div>
    // </>
  );
}

export default App;
