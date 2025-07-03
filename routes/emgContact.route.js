import express from 'express';
import {
  addEmgContacts,
  fetchEmgContact,
  updateEmgContact,
  deleteEmgContact
} from "../controller/emgContact.controller.js";
import { auth } from '../middelware/auth.js';

const router = express.Router();

router.post("/add", auth, addEmgContacts);
router.get("/", auth, fetchEmgContact);
router.put("/update/:contactId", auth, updateEmgContact);
router.delete("/delete/:contactId", auth, deleteEmgContact);

export default router;
