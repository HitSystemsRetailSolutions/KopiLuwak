import dotenv from "dotenv";

// configurar todas las variables de entorno
export const configure = () => {
  dotenv.config();
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
