import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import page from "./route/page_routes.js";
//import api from "./route/api_routes.js";
import forecast from "./route/python_routes.js";

const app = express();
const PORT = 3000;

// get the current file path
const _filename = fileURLToPath(import.meta.url); // get current path of this file
const _dirname = path.dirname(_filename); // get the directory name of this file

app.use(express.json()); // parse request to json
app.use(express.urlencoded({ extended: true })); // allow formData request
app.use(express.static(path.join(_dirname, '../frontend'))); // serve all files inside frontend

// serve pages
app.use('/', page);
// api route
//app.use('/api', api_routes);
// python route
app.use('/api', forecast);


app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
