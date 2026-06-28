import { Router } from "express";
import { addToActivity, getAllActivity, login, register, deleteActivity } from "../user.controller.js";

const router = Router();

router.route("/login").post(login)
router.route("/register").post(register)
router.route("/add_to_activity").post(addToActivity)
router.route("/get_all_activity").get(getAllActivity)
router.route("/delete_activity").delete(deleteActivity)


export default router;
