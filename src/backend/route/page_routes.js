import { Router } from "express";
import path from "path";
import { fileURLToPath } from "url";

const router = Router();

// get the current file path
const _filename = fileURLToPath(import.meta.url); // get current path of this file
const _dirname = path.dirname(_filename); // get the directory name of this file
// get the frontend dir path
const projectRoot = path.resolve(_dirname, "../../");
const frontendPath = path.join(projectRoot, "/frontend")

// login page
router.get('/login', (req, res) => {
      res.sendFile(path.join(frontendPath, 'template', 'login.html'));
});

// system page
router.get('/resort-admin-page', (req, res) => {
      res.sendFile(path.join(frontendPath, 'template', 'resto.html'));
});

export default router;