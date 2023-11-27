import { Router } from "express";
import { recHit } from "../db/mssql.js";

const router = Router();

router.get("/", async (req, res) => {
  const { name } = req.body;

  if (name) {
    const results = await recHit(
      "fac_tena",
      `select * from dependentes where nom like '%${name}%'`
    );
    return res.json(results.recordset);
  }

  const results = await recHit("fac_tena", "select TOP 3 * from dependentes");

  res.json(results.recordset);
});

// select d.codi,d.nom,telefon,[adreça],e.valor from dependentes d join (select * from dependentesextes where nom = 'hBase') e on e.id=d.codi
// select tmst,iif(accio = 1 , 'inici Torn' ,'Fi Torn') ,d.nom,c.nom from cdpDadesFichador f join dependentes d on d.codi=f.usuari join clients c on c.codi=f.lloc

export default router;
