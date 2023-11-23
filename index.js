import { Server } from "./app/models/Server.js";
import { configure } from "./app/helpers/configure.js";

configure();

const server = new Server();

server.listen();
