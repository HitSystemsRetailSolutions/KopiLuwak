import dotenv from "dotenv";
dotenv.config();

// configurar todas las variables de entorno
export const configure = () => {
  process.env.PORT = process.env.PORT || 80;

  // configurar variables de entorno de la base de datos
  if (
    !process.env.MSSQL_SERVER ||
    !process.env.MSSQL_USER ||
    !process.env.MSSQL_PASSWORD
  ) {
    throw new Error(
      "Faltan variables de entorno de la base de datos. Revisar archivo .env"
    );
  }
};
