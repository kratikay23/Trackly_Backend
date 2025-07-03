import express from "express";
import { auth } from "../middelware/auth.js";
import {  createFamilyGroup, fetchFamilyGroup } from "../controller/familyGroup.controller.js";

const route = express.Router();

route.post("/create", auth, createFamilyGroup );
route.get("/fetch/:famgroupId",auth, fetchFamilyGroup);

export default route;