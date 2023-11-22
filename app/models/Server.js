import express from "express";
import cors from "cors";

export class Server {
  constructor() {
    this.port = process.env.PORT;

    this.app = express();

    this.middlewares();
    this.routes();
  }

  middlewares() {
    this.app.use(express.json());
    this.app.use(cors());
  }

  routes() {
    this.app.get("/", (req, res) => {
      return res.json({
        msg: "hola",
      });
    });
  }

  listen() {
    this.app.listen(this.port, () => {
      console.log(`Servidor corriendo en el puerto ${this.port} 🚀`);
    });
  }
}
