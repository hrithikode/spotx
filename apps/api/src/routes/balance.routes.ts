import { Router } from "express";
import { depositBalance, getBalance, getBalanceByAsset } from "../controllers/balance.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";


const router: Router = Router();

router.get("/", authenticate, getBalance);
router.get("/:symbol",authenticate, getBalanceByAsset);
router.post("/deposit", authenticate, depositBalance);

export default router;