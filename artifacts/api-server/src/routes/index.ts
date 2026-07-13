import { Router, type IRouter } from "express";
import healthRouter from "./health";
import intelligenceRouter from "./intelligence";
import cyberRouter from "./cyber-intel";
import subjectsRouter from "./subjects";
import researchReportsRouter from "./research-reports";
import extendedIntelRouter from "./extended-intel";

const router: IRouter = Router();

router.use(healthRouter);
router.use(intelligenceRouter);
router.use(cyberRouter);
router.use(subjectsRouter);
router.use(researchReportsRouter);
router.use(extendedIntelRouter);

export default router;
