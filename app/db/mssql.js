import sql from "mssql";
let pool = undefined;

async function PoolCreation() {
  const config = {
    user: process.env.MSSQL_USER,
    password: process.env.MSSQL_PASSWORD,
    server: process.env.MSSQL_SERVER,
    database: "hit",
    options: {
      encrypt: false,
      trustServerCertificate: true,
    },
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 15000,
    },
    requestTimeout: 10000,
  };

  pool = await new sql.ConnectionPool(config).connect();
}

export async function recHit(d = "", csql = "") {
  if (!pool) await PoolCreation();
  const c = `use ${d}; 
  ${csql}`;
  let r = await pool.request().query(c);

  return r;
}
