import {Router} from "express"
import {resisterUser} from "../controllers/user.controlers.js"
const router =Router()
router.route("/resistor").post(resisterUser)

export default router