import express from "express";
import { auth } from "../middelware/auth.js";
import { addFamily, addMembers, changeFamilyName, deleteFamily, fetchFamily, joinFamilyByCode, leaveFamily, removeMember, transferheadRole } from "../controller/family.controller.js";

const route = express.Router();

route.post("/add", auth, addFamily);
route.post("/add-member", auth, addMembers);
route.get("/fetch", auth, fetchFamily)
route.post("/remove-member", auth, removeMember);
route.post("/leave-family", auth, leaveFamily);
route.put("/change-name", auth, changeFamilyName);
route.post("/join-byCode", auth, joinFamilyByCode);
route.post("/transfer-head", auth, transferheadRole);
route.delete("/delete", auth, deleteFamily)
export default route;