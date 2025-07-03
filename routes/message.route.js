import express from "express";
import { auth } from "../middelware/auth.js";
import { deleteMessage, fetchMessage, sendMessage } from "../controller/message.controller.js";

const route = express.Router();

route.post("/send", auth, sendMessage);
route.get("/fetch/:familyGroupId", auth, fetchMessage);
route.delete("/delete", auth, deleteMessage)

export default route ;