import { Router } from "express";
import { recHit } from "../db/mssql.js";

const router = Router();

router.get("/", async (req, res) => {
  const results = await recHit("fac_tena", "select * from dependentes");

  res.json(results.recordset);
});

export default router;
