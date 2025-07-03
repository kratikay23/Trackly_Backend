import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import Authorization from "./routes/user.route.js"
import SOSRoute from "./routes/sos.route.js"
import EmergencyContactRoute from "./routes/emgContact.route.js"
import FamilyRoute from "./routes/family.route.js"
import FamilyGroupRoute from "./routes/familyGroup.route.js"
import MessageRoute from "./routes/message.route.js"
import UserLocationRoute from "./routes/userLocation.route.js"
import cors from "cors"
import bodyParser from "body-parser";
dotenv.config();

const app = express();

app.use(cors());
mongoose.connect(process.env.DB)
    .then(() => {
        app.use(bodyParser.json());
        app.use(bodyParser.urlencoded({ extended: true }));

        app.use("/user",Authorization);
        app.use("/",SOSRoute);
        app.use("/emergency-contact",EmergencyContactRoute);
        app.use("/family", FamilyRoute);
        app.use("/family-group", FamilyGroupRoute);
        app.use("/family-group/message", MessageRoute);
        app.use("/", UserLocationRoute)

        app.listen(process.env.PORT, () => {
            console.log("Server Started....")
        })
    }).catch(err =>{
        console.log("Failed to Connect Server")
    })
