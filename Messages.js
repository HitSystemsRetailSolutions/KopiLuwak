const fs = require("fs");

// Clase Messages
class Messages {
  contactInfo = {};

  orderHistory = {
    123: [
      [
        {
          item: "Pizza",
          quantity: 1,
        },
        {
          item: "Coke",
          quantity: 2,
        },
      ],
    ],
  };

  // Método constructor
  constructor() {
    // Verificar si existe el archivo "messages.json"
    if (fs.existsSync("messages.json")) {
      try {
        // Leer el contenido del archivo y parsearlo como JSON
        this.messages = JSON.parse(fs.readFileSync("messages.json"));
      } catch (e) {
        console.log("Error al leer messages.json", e);
        // Si hay un error al leer el archivo, se crea un objeto vacío y se guarda en "messages.json"
        this.messages = {};
        fs.writeFileSync("messages.json", JSON.stringify(this.messages));
      }
    } else {
      // Si el archivo no existe, se crea un objeto vacío y se guarda en "messages.json"
      this.messages = {};
      fs.writeFileSync("messages.json", JSON.stringify(this.messages));
    }
  }

  // Método para agregar un mensaje de usuario
  addMessage(phone, message) {
    if (!this.messages[phone]) {
      this.messages[phone] = [{ role: "user", content: message }];
      return;
    }
    this.messages[phone].push({ role: "user", content: message });
    // Manejar la eliminación de mensajes antiguos (cuando hay más de 50)
    if (this.messages[phone].length > 100) {
      this.messages[phone] = this.messages[phone].slice(-100);
    }
    // Actualizar el archivo de respaldo
    fs.writeFileSync("messages.json", JSON.stringify(this.messages));
  }

  // Método para agregar una respuesta del asistente
  addRespone(phone, message) {
    this.messages[phone].push({ role: "assistant", content: message });
    if (this.messages[phone].length > 100) {
      this.messages[phone] = this.messages[phone].slice(-100);
    }
    fs.writeFileSync("messages.json", JSON.stringify(this.messages));
  }

  // Método para agregar información del sistema
  addInfo(phone, message) {
    this.messages[phone].push({ role: "system", content: message });
    if (this.messages[phone].length > 100) {
      this.messages[phone] = this.messages[phone].slice(-100);
    }
    fs.writeFileSync("messages.json", JSON.stringify(this.messages));
  }

  // Método para obtener los mensajes de un número de teléfono
  getMessages(phone) {
    return this.messages[phone] || [];
  }

  // Método para obtener el último mensaje de un número de teléfono
  getLastMessage(phone) {
    const msg = this.getMessages(phone);
    return msg[msg.length - 1];
  }

  // Método para obtener el segundo último mensaje de un número de teléfono
  getSecondLastMessage(phone) {
    const msg = this.getMessages(phone);
    return msg[msg.length - 2];
  }

  // Método para eliminar todos los mensajes de un número de teléfono
  deleteMessages(phone) {
    this.messages[phone] = [];
    fs.writeFileSync("messages.json", JSON.stringify(this.messages));
  }
}

// Crear una instancia de la clase Messages y la exporta
const messages = new Messages();
module.exports = messages;
