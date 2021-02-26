import {
  Button,
  Center,
  Code,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  IconButton,
  Input,
  InputGroup,
  InputRightElement,
  Select,
  Spacer,
  Stack,
  Text,
  useColorMode,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import React, { useEffect, useRef, useState } from "react";
import * as CSS from "csstype";
import { useHistory, useLocation } from "react-router-dom";
import ScrollableFeed from "react-scrollable-feed";
import { LinkIcon, MoonIcon, SettingsIcon, SunIcon } from "@chakra-ui/icons";

function App() {
  const toast = useToast();
  const { colorMode, toggleColorMode } = useColorMode();
  const history = useHistory();
  const search = useLocation().search;
  var initParams = new URLSearchParams(search);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const btnRef = useRef(null);
  var [searchFilter, setSearchFilter] = useState<string>(
    initParams.get("searchFilter") || ""
  );
  var [websocket, setWebsocket] = useState<WebSocket>();
  var [websocketAddr, setWebsocketAddr] = useState<string>(
    "ws://10.31.32.2:5804"
  );
  var [websocketState, setWebsocketState] = useState<
    "closed" | "open" | "error" | "unknown" | "connecting"
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
    var ws = new WebSocket(web);
    setWebsocketState("connecting");
    ws.addEventListener("close", () => {
      console.log("closed");
      setWebsocketState("closed");
    });
    ws.addEventListener("error", (e) => {
      console.log(e);
      toast({
        title: "Error",
        status: "error",
        description: "Look at the console for more details",
      });
      setWebsocketState("error");
    });
    ws.addEventListener("message", (evt) => {
      setMessages((prevState: any) => [...prevState, evt.data]);
    });
    ws.addEventListener("open", () => {
      setWebsocket(ws);
      setWebsocketState("open");
    });
  }

  return (
    <Flex h="100vh" direction="column">
      <Flex>
        <Center pl={4}>
          <Heading size={"lg"}>TDU Logging Client</Heading>
        </Center>
        <Spacer />
        <IconButton
          aria-label="color mode"
          icon={colorMode === "dark" ? <MoonIcon /> : <SunIcon />}
          onClick={toggleColorMode}
          m={2}
        />
        <IconButton
          aria-label="connect"
          icon={<LinkIcon />}
          onClick={() =>
            websocket ? websocket.close() : connect(websocketAddr)
          }
          colorScheme={
            websocketState === "open"
              ? "green"
              : websocketState === "closed"
              ? undefined
              : websocketState === "error"
              ? "yellow"
              : undefined
          }
          m={2}
        />
        <IconButton
          aria-label="settings menu"
          icon={<SettingsIcon />}
          ref={btnRef}
          onClick={onOpen}
          m={2}
        >
          Open
        </IconButton>
      </Flex>

      <Drawer
        isOpen={isOpen}
        placement="right"
        onClose={onClose}
        finalFocusRef={btnRef}
      >
        <DrawerOverlay>
          <DrawerContent>
            <DrawerCloseButton />
            <DrawerHeader>Edit Settings</DrawerHeader>

            <DrawerBody>
              <Stack>
                <FormControl>
                  <FormLabel>Address</FormLabel>
                  <InputGroup>
                    <Input
                      defaultValue={websocketAddr}
                      w={500}
                      onChange={(ev) => setWebsocketAddr(ev.target.value)}
                    />
                    <InputRightElement width="4.5rem">
                      <Button
                        type="submit"
                        h="1.75rem"
                        size="sm"
                        onClick={() => {
                          websocket
                            ? websocket.close()
                            : connect(websocketAddr);
                        }}
                        colorScheme={
                          websocketState === "open"
                            ? "green"
                            : websocketState === "closed"
                            ? undefined
                            : websocketState === "error"
                            ? "yellow"
                            : undefined
                        }
                      >
                        {websocketState === "closed"
                          ? "Connect"
                          : websocketState === "open"
                          ? "Disconect"
                          : websocketState === "connecting"
                          ? "Connecting"
                          : !websocket
                          ? "Connect"
                          : "Unknown"}
                      </Button>
                    </InputRightElement>
                  </InputGroup>
                </FormControl>
                <FormControl>
                  <FormLabel>Log Level</FormLabel>
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
                </FormControl>
                <FormControl>
                  <FormLabel>Search</FormLabel>
                  <Input
                    // borderRadius="0px"
                    placeholder="Search"
                    value={searchFilter}
                    onChange={(e) => {
                      setSearchFilter(e.target.value);
                    }}
                  />
                </FormControl>
                <FormControl>
                  <Button
                    onClick={() => {
                      setMessages([]);
                    }}
                  >
                    Clear Messages
                  </Button>
                </FormControl>
              </Stack>
            </DrawerBody>

            <DrawerFooter></DrawerFooter>
          </DrawerContent>
        </DrawerOverlay>
      </Drawer>

      <Code w="100%" overflowY="scroll" flex="1" colorScheme={"blackAlpha"}>
        <ScrollableFeed>
          {messages
            ?.filter((message) => {
              var splitmsg = message.split(
                /^([0-9.]+) \((.+)\) \[([^]+)] (.*)/
              );
              return loglevel === "debug"
                ? splitmsg[2]?.includes(
                    "Debug" || "Info" || "Warning" || "Error"
                  )
                : loglevel === "info"
                ? splitmsg[2]?.includes("Info" || "Warning" || "Error")
                : loglevel === "warning"
                ? splitmsg[2]?.includes("Warning" || "Error")
                : loglevel === "error"
                ? splitmsg[2]?.includes("Error")
                : splitmsg[2]?.includes("");
            })
            ?.filter((message) => {
              return message
                ?.toLowerCase()
                .includes(searchFilter?.toLowerCase());
            })
            ?.map((message, index) => {
              var splitmsg = message.split(
                /^([0-9.]+) \((.+)\) \[([^]+)] (.*)/
              );
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
        </ScrollableFeed>
      </Code>
    </Flex>
  );
}

export default App;
