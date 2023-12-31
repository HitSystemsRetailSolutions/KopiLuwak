const {
  createBot,
  createProvider,
  createFlow,
  addKeyword,
} = require("@bot-whatsapp/bot");

const QRPortalWeb = require("@bot-whatsapp/portal");
const WebWhatsappProvider = require("@bot-whatsapp/provider/web-whatsapp");
const JsonFileAdapter = require("@bot-whatsapp/database/json");

const fs = require("fs");

require("dotenv").config();

const { OpenAI } = require("openai");
const messages = require("./Messages");
const { recHit } = require("./mssql/mssql");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

//******************************************************************************** */
//************API GOOGLE ********************************************************* */

const googleMapsClient = require('@google/maps').createClient({
  key: 'AIzaSyD-MBOkeqLuhCMXYpFH5jeje4Ae5exmuYE'
});

const verificarDireccion = (direccion) => {
  return new Promise((resolve, reject) => {
    googleMapsClient.geocode({ address: direccion }, (err, response) => {
      if (!err) {
        // Aquí puedes verificar si la respuesta contiene los datos de geolocalización
        if (response.json.results.length > 0) {
          resolve(true);
        } else {
          resolve(false);
        }
      } else {
        reject(err);
      }
    });
  });
};


//******************************************************************************** */

const sysprompt = fs.readFileSync("syspromt.txt", "utf8");
let numCount = 0;

const getResponse = async (msg, num) => {
  let chatCompletion = null;
  const contact = messages.contactInfo[num];
  const orderHistory = messages.orderHistory[num];
  let extra = "";
  /*  
    ? `\nYou are talking to ${contact.name}, he lives in the address ${contact.address}. Remember it when you make the order. But ALWAYS aks him to confirm his direction, it's very important`
    : "";
  console.log(orderHistory);
  if (orderHistory) {
    extra += `\n\n The client haves ordered ${orderHistory.length} times in the past. The last orders were:\n`;
    extra += JSON.stringify(orderHistory);
  }

  console.log(extra);
*/

  try {
    // envia el conjunto de mensajes al gpt
    chatCompletion = await openai.chat.completions.create({
        messages: [
          {
            role: "system",
            content: sysprompt + extra,
          },
          ...msg,
        ],
        model: "gpt-3.5-turbo-1106",
        functions: [
          {
            name: "addOrder",
            description: "Adds a client order",
            parameters: {
              type: "object",
              properties: {
                items: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: {
                        type: "string",
                      },
                      quantity: {
                        type: "integer",
                      },
                      price: {
                        type: "number",
                      },
                    },
                    required: ["name", "quantity", "price"],
                  },
                  description: "An array with items that has been ordered",
                },
                paymentMethod: {
                  type: "string",
                  Option: ["EFECTIVO", "TARJETA"],
                  description: "The payment method used",
                },
                client: {
                  type: "object",
                  properties: {
                    name: {
                      type: "string",
                      description: "The name of the client",
                    },
                    address: {
                      type: "string",
                      description: "The address of the client",
                    },
                    postalCode: {
                      type: "string",
                      description:
                        "The client postal code on of [08320,08328,08329]",
                    },
                  },
                  required: ["name", "address", "postalCode"],
                  description: "The client that made the order",
                },
              },
              required: ["items", "paymentMethod", "client"],
            },
            function: function (data) {
              // Verifica si el nombre del cliente está presente
              if (!data.client.name) {
                return {
                  response:
                    "Por favor, dime tu nombre para completar el pedido.",
                };
              }
              // Verifica si el Codigo postal esta presente
              if (!data.client.postalCode) {
                return {
                  response:
                    "Por favor, dime tu codigo postal para completar el pedido.",
                };
              }
              // Verifica si la direccion esta presente
              if (!data.client.address) {
                return {
                  response:
                    "Por favor, dime tu direccion para completar el pedido.",
                };
              }
              const allowedPostalCodes = ["08320", "08328", "08329"];
              if (!allowedPostalCodes.includes(data.client.postalCode)) {
                return {
                  response:
                    "Lo siento, no realizamos entregas en el código postal proporcionado. Los códigos postales permitidos son: 08232, 08345, 08443.",
                };
              }

              return {
                // Respuesta de éxito con los detalles del pedido
              };
            },
          },
        ],

        function_call: "auto",
      })
      .catch((e) => {
        console.error("Error al comunicarse con OpenAI:", e);
        throw new Error("error comunicando con el gpt");
        });
      } catch (e) {
  console.error("Error manejado:", e.message);
  return e.message;
        }
  // mira si el gpt quiere ejecutar una funcion
  const func = chatCompletion.choices[0].message.function_call;
  if (func) {
    const date = new Date();
    const argumentos = JSON.parse(func.arguments);
    if(!await verificarDireccion(argumentos.client.address)){
        return "Direccion Erronea. Por favor, dime tu direccion para completar el pedido.";
    }

    const ticket = `[align: center][bold: on]
    Numero de pedido 
    [magnify: width 3; height 3]
    [negative: on]${
      argumentos.client.postalCode === "08328"
        ? "A"
        : argumentos.client.postalCode === "08320"
        ? "M"
        : "T"
    }-${++numCount}[negative: off][magnify: width 1; height 1][bold: off]
    GONDAL ISTAMBUL
    C/SEVILLA 5 (08320) EL MASNOU
    619369404
    
    [bold: on]
    DATOS DEL PEDIDO
    [bold: off]
    ${date.getDate()}/${
      date.getMonth() + 1
    }/${date.getFullYear()}   ${date.getHours()}:${date.getMinutes()}
    ${argumentos.items
      .map((item) => {
        return `[column: left ${item.quantity}x ${item.name} ; right ${item.price}€ ]`;
      })
      .join("\n")}
    [bold: on]
    [magnify: width 2; height 2]
    [negative: on]
    ${argumentos.paymentMethod.toUpperCase()}
    [negative: off]
    [magnify: width 1; height 1]
    
    DATOS DEL CLIENTE
    [bold: off]
    ${argumentos.client.name}
    ${num}
    ${argumentos.client.address}
    
    [barcode: type qr; data ${`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      argumentos.client.address
    )}`} ; error-correction L; cell 8; model 2]`;
    // TODO: implementar funciones
    console.log(func.arguments);
    const sql = `INSERT INTO impresoraCola (id, Impresora, Texte, tmstpeticio) VALUES (newid(),'Obrador_117_Tot', '${ticket} ', getdate());`;
    // recHit("fac_carne", sql);
    messages.contactInfo[num] = {
      name: argumentos.client.name,
      address: argumentos.client.address,
    };

    // guardo los 2 ultimos pedidos
    /*
    if (messages.orderHistory[num]) {
      messages.orderHistory[num].push(argumentos.items);
    } else {
      messages.orderHistory[num] = [argumentos.items];
    }
    messages.orderHistory[num] = messages.orderHistory[num].slice(-2);
*/

    const tiempo =
      argumentos.paymentMethod.toUpperCase() === "TARJETA" ? 50 : 30;
      return "Confirmación de impresión del ticket. Pedido recibido, tardara " + tiempo + " minutos aproximadamente";
    //return ticket;
  }

  // recoje la respuesta del gpt y la devuelve al usuario
  let response = chatCompletion.choices[0].message.content;
  return `${response}`;
};
// responde a todos los mensajes que llegan al whatsapp
const flowPrincipal = addKeyword("").addAction(
  {},
  async (ctx, { flowDynamic }) => {
    // añade el mensaje al registro
    messages.addMessage(ctx.from, ctx.body);
    // obtiene la respuesta del gpt
    let mensaje ="";
    try {
      mensaje = await getResponse(messages.getMessages(ctx.from), ctx.from);
    } catch (e) {
      console.log(e);
      mensaje = "error comunicando con el gpt";
    }
      // añade la respuesta al registro y la envia al usuario

      // Verifica si el ticket ha sido impreso
      if (mensaje.includes("Confirmación de impresión del ticket")) {
        // Borra los mensajes una vez que el ticket ha sido impreso
      messages.deleteMessages(ctx.from);
    } else {
      // Si no se ha impreso el ticket, añade la respuesta al registro
      messages.addRespone(ctx.from, mensaje);
    }
    return await flowDynamic(`${mensaje}`);
  }
);

const main = async () => {
  const adapterDB = new JsonFileAdapter();
  const adapterFlow = createFlow([flowPrincipal]);
  const adapterProvider = createProvider(WebWhatsappProvider);
  createBot({
    flow: adapterFlow,
    provider: adapterProvider,
    database: adapterDB,
  });
  QRPortalWeb();
};

main();