import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";
import { dirname } from "path";
import { fileURLToPath } from "url";

export class Server {
  constructor() {
    this.port = process.env.PORT;
    this.app = express();

    this.transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASSWORD,
      },
    });

    // cargar configuraciones
    this.middlewares();
    this.routes();
  }

  middlewares() {
    this.app.use(express.json());

    const __dirname = dirname(fileURLToPath(import.meta.url));

    this.app.use(express.static(__dirname + "/../../public"));
    this.app.use(cors());
  }

  routes() {
    this.app.post("/sendMail", (req, res) => {
      const { mail, msg, subject } = req.body;

      const mailOptions = {
        from: process.env.GMAIL_USER,
        to: mail,
        subject: subject,
        html: msg,
      };

      this.transporter.sendMail(mailOptions, (err, info) => {
        console.log({ err, info });
      });

      return res.json({
        msg: "mailEnviado",
      });
    });
  }

  listen() {
    this.app.listen(this.port, () => {
      console.log(`Servidor corriendo en el puerto ${this.port} 🚀`);
    });
  }
}
