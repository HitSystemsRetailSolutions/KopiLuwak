import { Router } from "express";
import { recHit } from "../db/mssql.js";

const router = Router();

router.get("/", async (req, res) => {
  const { nombreDependienta } = req.body;

  if (nombreDependienta) {
    const results = await recHit(
      "fac_tena",
      `select * from dependentes where nom like '%${nombreDependienta}%'`
    );

    console.log(nombreDependienta);

    return res.json({
      nombre: nombreDependienta,
      data: results.recordset,
    });
  }

  const results = await recHit("fac_tena", "select TOP 1 * from dependentes");

  res.json(results.recordset);
});

router.get("/getTurnosDependienta", async (req, res) => {
  const { dependienta, fecha } = req.body;

  const results = await recHit(
    "fac_tena",
    `select tmst as fecha,iif(accio = 1 , 'inici Torn' ,'Fi Torn') as accio ,d.nom as nombreDependienta ,c.nom as nombreTienda from cdpDadesFichador f join dependentes d on d.codi=f.usuari join clients c on c.codi=f.lloc where d.nom like '%${dependienta}%' and tmst > ${fecha} order by fecha`
  );

  res.json(results.recordset);
});

router.get("/dependientas", async (req, res) => {
  const results = await recHit(
    "fac_tena",
    "select d.codi,d.nom,telefon,[adreça],e.valor from dependentes d join (select * from dependentesextes where nom = 'hBase') e on e.id=d.codi"
  );

  res.json(results.recordset);
});

export default router;
