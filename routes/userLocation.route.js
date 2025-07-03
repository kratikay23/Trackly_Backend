import { Router } from "express";
import { userLocation, fetchFamilyLocations } from "../controller/userLocation.controller.js";
import { auth } from "../middelware/auth.js";

const router = Router();

router.post("/save-user-location",auth , userLocation);
router.get("/fetch-user-location", auth, fetchFamilyLocations);

export default router;
