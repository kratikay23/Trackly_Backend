import express from "express";
import { auth } from "../middelware/auth.js";
import { triggerSOS } from "../controller/sosalert.controller.js";

const route = express.Router();

route.post("/trigger-sos", auth,triggerSOS);

export default route;