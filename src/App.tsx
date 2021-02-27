import {
  Button,
  Center,
  Checkbox,
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
import {
  ChevronDownIcon,
  LinkIcon,
  MoonIcon,
  SettingsIcon,
  SunIcon,
} from "@chakra-ui/icons";

function App() {
  const toast = useToast();
  const { colorMode, toggleColorMode } = useColorMode();
  const history = useHistory();
  const search = useLocation().search;
  // console.log(useLocation());
  var initParams = new URLSearchParams(search);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const btnRef = useRef(null);
  var [searchFilter, setSearchFilter] = useState<string>(
    initParams.get("searchFilter") || ""
  );
  var [activeSubsystems, setActiveSubsystems] = useState<
    Array<string | undefined>
  >(initParams.get("subsystems")?.split(",") || []);

  var [autoscroll, setAutoscroll] = useState<boolean>(
    initParams.get("autoscroll") === "true" || true
  );

  var [subsystems, setSubsystems] = useState<Array<string | undefined>>(
    initParams.get("subsystems")?.split(",") || []
  );
  var [websocket, setWebsocket] = useState<WebSocket>();
  var [websocketAddr, setWebsocketAddr] = useState<string>("");
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
    if (activeSubsystems.length > 0) {
      params.append("subsystems", activeSubsystems.toString());
    } else {
      params.delete("subsystems");
    }
    history.push({ search: params.toString() });
  }, [searchFilter, loglevel, activeSubsystems, autoscroll, history]);

  useEffect(() => {
    setWebsocketAddr(window.location.hostname);
    connect(window.location.hostname);
    // eslint-disable-next-line
  }, []);
  function connect(web: string) {
    setMessages([]);
    var ws = new WebSocket(`ws://${web}:5804`);
    setWebsocketState("connecting");
    ws.addEventListener("close", () => {
      // console.log("closed");
      setWebsocketState("closed");
      setWebsocket(undefined);
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
      var splitmsg = evt.data.split(/^([0-9.]+) \((.+)\) \[([^]+)] (.*)/);
      if (splitmsg[2] !== undefined) {
        setMessages((prevState: any) => [...prevState, evt.data]);

        if (!subsystems.includes(splitmsg[3])) {
          setSubsystems((prevState: any) => {
            if (!prevState.includes(splitmsg[3])) {
              return [...prevState, splitmsg[3]];
            }
            return [...prevState];
          });
        }
      }
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
          <Heading size={"lg"}>TDU Logging</Heading>
        </Center>
        <Spacer />
        <IconButton
          aria-label="autoscroll"
          icon={<ChevronDownIcon />}
          onClick={() => setAutoscroll((prevState) => !prevState)}
          colorScheme={autoscroll ? "blue" : undefined}
          m={2}
        />
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
          isDisabled={websocketState === "connecting"}
          colorScheme={
            websocketState === "open"
              ? "green"
              : websocketState === "connecting"
              ? "yellow"
              : websocketState === "closed"
              ? "red"
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
                        isDisabled={websocketState === "connecting"}
                        colorScheme={
                          websocketState === "open"
                            ? "green"
                            : websocketState === "connecting"
                            ? "yellow"
                            : websocketState === "closed"
                            ? "red"
                            : undefined
                        }
                      >
                        {websocketState === "closed"
                          ? "Closed"
                          : websocketState === "open"
                          ? "Connected"
                          : websocketState === "connecting"
                          ? "Connecting"
                          : !websocket
                          ? "Closed"
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
                <FormControl>
                  <FormLabel>Subsystems</FormLabel>
                  <Stack>
                    {subsystems.map((subsystem) => {
                      return (
                        <Checkbox
                          size="md"
                          colorScheme="green"
                          isChecked={activeSubsystems.includes(subsystem)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setActiveSubsystems((prevState) => [
                                ...prevState,
                                subsystem,
                              ]);
                            } else {
                              setActiveSubsystems((prevState) => [
                                ...prevState.filter((item) => {
                                  return item !== subsystem;
                                }),
                              ]);
                            }
                          }}
                        >
                          {subsystem}
                        </Checkbox>
                      );
                    })}
                  </Stack>
                </FormControl>
              </Stack>
            </DrawerBody>

            <DrawerFooter></DrawerFooter>
          </DrawerContent>
        </DrawerOverlay>
      </Drawer>

      <Code w="100%" overflowY="scroll" flex="1" colorScheme={"blackAlpha"}>
        {messages
          ?.filter((message) => {
            var splitmsg = message.split(/^([0-9.]+) \((.+)\) \[([^]+)] (.*)/);
            return loglevel === "debug"
              ? splitmsg[2]?.includes("Debug") ||
                  splitmsg[2]?.includes("Info") ||
                  splitmsg[2]?.includes("Warning") ||
                  splitmsg[2]?.includes("Error")
              : loglevel === "info"
              ? splitmsg[2]?.includes("Info") ||
                splitmsg[2]?.includes("Warning") ||
                splitmsg[2]?.includes("Error")
              : loglevel === "warning"
              ? splitmsg[2]?.includes("Warning") ||
                splitmsg[2]?.includes("Error")
              : loglevel === "error"
              ? splitmsg[2]?.includes("Error")
              : splitmsg[2]?.includes("");
          })
          ?.filter((message) => {
            var splitmsg = message.split(/^([0-9.]+) \((.+)\) \[([^]+)] (.*)/);
            // console.log(
            //   splitmsg[3],
            //   activeSubsystems.map((subsystem) =>
            //     subsystem ? splitmsg[3].includes(subsystem) : false
            //   ),
            //   activeSubsystems
            //     .map((subsystem) =>
            //       subsystem ? splitmsg[3].includes(subsystem) : false
            //     )
            //     .some((item) => item)
            // );
            if (activeSubsystems.length !== 0) {
              return activeSubsystems
                .map((subsystem) =>
                  subsystem ? splitmsg[3].includes(subsystem) : false
                )
                .some((item) => item);
            }
            return true;
          })
          ?.filter((message) => {
            return message?.toLowerCase().includes(searchFilter?.toLowerCase());
          })
          ?.map((message, index) => {
            var splitmsg = message.split(/^([0-9.]+) \((.+)\) \[([^]+)] (.*)/);
            var color: CSS.Property.Color =
              splitmsg[2] === "Info"
                ? colorMode === "dark"
                  ? "blue.300"
                  : "blue.500"
                : splitmsg[2] === "Debug"
                ? colorMode === "dark"
                  ? "green.300"
                  : "green.500"
                : splitmsg[2] === "Error"
                ? colorMode === "dark"
                  ? "red.300"
                  : "red.500"
                : splitmsg[2] === "Warning"
                ? colorMode === "dark"
                  ? "yellow.300"
                  : "yellow.500"
                : "";
            return (
              <Text textColor={color} w="100%" key={`log${index}`}>
                {splitmsg[1]} ({splitmsg[2]}) [{splitmsg[3]}] {splitmsg[4]}
              </Text>
            );
          })}
        <div
          style={{ visibility: "hidden" }}
          ref={(el) => {
            if (el && autoscroll) {
              el.scrollIntoView(false);
            }
          }}
        />
      </Code>
    </Flex>
  );
}

export default App;
