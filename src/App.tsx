import {
  Button,
  Code,
  Flex,
  Input,
  InputGroup,
  Select,
  Text,
} from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import * as CSS from "csstype";
import { useHistory, useLocation } from "react-router-dom";

function App() {
  const history = useHistory();
  const search = useLocation().search;
  var initParams = new URLSearchParams(search);
  const fieldRef = useRef<HTMLInputElement>(null);
  var [searchFilter, setSearchFilter] = useState<string>(
    initParams.get("searchFilter") || ""
  );
  var [websocketAddr, setWebsocketAddr] = useState<string>(
    "ws://10.31.32.2:5804"
  );
  var [websocketState, setWebsocketState] = useState<
    "closed" | "open" | "error" | "unknown"
  >("unknown");

  var [loglevel, setLoglevel] = useState<
    "debug" | "info" | "warning" | "error" | string
  >(initParams.get("loglevel") || "debug");

  var [messages, setMessages] = useState<Array<string>>([]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (searchFilter) {
      params.append("searchFilter", searchFilter);
    } else {
      params.delete("searchFilter");
    }
    if (loglevel) {
      params.append("loglevel", loglevel);
    } else {
      params.delete("loglevel");
    }
    history.push({ search: params.toString() });
  }, [searchFilter, loglevel, history]);

  function connect(web: string) {
    setMessages([]);
    var websocket = new WebSocket(web);
    websocket.addEventListener("close", () => {
      console.log("closed");
      setWebsocketState("closed");
    });
    websocket.addEventListener("error", (e) => {
      console.log("error");
      setWebsocketState("error");
    });
    websocket.addEventListener("message", (evt) => {
      setMessages((prevState: any) => [...prevState, evt.data]);
      if (fieldRef.current) fieldRef.current?.scrollIntoView();
    });
    websocket.addEventListener("open", () => {
      setWebsocketState("open");
    });
  }

  return (
    <Flex h="100vh" direction="column">
      <InputGroup p={2}>
        <Input
          defaultValue={websocketAddr}
          w={500}
          onChange={(ev) => setWebsocketAddr(ev.target.value)}
        />
        <Button
          type="submit"
          onClick={() => connect(websocketAddr)}
          colorScheme={
            websocketState === "open"
              ? "green"
              : websocketState === "closed"
              ? "grey"
              : websocketState === "error"
              ? "yellow"
              : "purple"
          }
        >
          {websocketState}
        </Button>
        <Select
          onChange={(data) => {
            setLoglevel(data.target.value);
          }}
          value={loglevel}
        >
          <option value="error">Error</option>
          <option value="warning">Warning</option>
          <option value="info">Info</option>
          <option value="debug">Debug</option>
        </Select>
      </InputGroup>
      <Input
        // borderRadius="0px"
        placeholder="Search"
        value={searchFilter}
        onChange={(e) => {
          setSearchFilter(e.target.value);
        }}
      />

      <Code w="100%" overflowY="scroll" flex="1" colorScheme={"blackAlpha"}>
        {messages
          ?.filter((message) => {
            var splitmsg = message.split(/^([0-9.]+) \((.+)\) \[([^]+)] (.*)/);
            return loglevel === "debug"
              ? splitmsg[2]?.includes("Debug" || "Info" || "Warning" || "Error")
              : loglevel === "info"
              ? splitmsg[2]?.includes("Info" || "Warning" || "Error")
              : loglevel === "warning"
              ? splitmsg[2]?.includes("Warning" || "Error")
              : loglevel === "error"
              ? splitmsg[2]?.includes("Error")
              : splitmsg[2]?.includes("");
          })
          ?.filter((message) => {
            return message?.toLowerCase().includes(searchFilter?.toLowerCase());
          })
          ?.map((message, index) => {
            var splitmsg = message.split(/^([0-9.]+) \((.+)\) \[([^]+)] (.*)/);
            var color: CSS.Property.Color =
              splitmsg[2] === "Info"
                ? "blue.300"
                : splitmsg[2] === "Debug"
                ? "green.300"
                : splitmsg[2] === "Error"
                ? "red.300"
                : splitmsg[2] === "Warning"
                ? "yellow.300"
                : "";
            return (
              <>
                <Text textColor={color} w="100%" key={`log${index}`}>
                  {splitmsg[1]} ({splitmsg[2]}) [{splitmsg[3]}] {splitmsg[4]}
                </Text>
              </>
            );
          })}
        <div ref={fieldRef} />
      </Code>
    </Flex>
  );
}

export default App;
