import { spawn } from "child_process";
import { Router } from "express";

const router = Router();

function getForecastedData(method,  params=null){
      // 👇 This is Express "sending" data to Python
      // First argument: python file, second: function name, third: optional parameter
      const args = ["./src/backend/forecast/app.py", method];
      if (params) args.push(params);

      // command constructor to run the python file
      const python = spawn("/home/tommy/Documents/Projects/Resort-system/.venv/bin/python", args);
      return python;
}

router.get("/python/get-total-guest-house", (req, res) => {
      const { method } = req.query;
      const python = getForecastedData(method);
      
      let output = "";

      // 👇 Node listens to Python's stdout (the "response")
      python.stdout.on("data", (data) => output += data.toString());

      // catch error on python file
      python.stderr.on("data", (data) => console.error("Python error:", data.toString()));

      python.on("close", () => {
            try {
                  const json = JSON.parse(output);
                  res.json(json); // Node sends Python's response to client
                  console.log(json);
            } catch (err) {
                  res.status(500).json({ error: "Failed to parse Python output", raw: output });
            }
      });

      python.on("error", (err) => res.status(500).json({ error: "Python process failed", details: err.message }));
});

router.get("/python/get-checkins", (req, res) => {
      const { method, params } = req.query;

      const python = getForecastedData(method, params);
      
      let output = "";

      // 👇 Node listens to Python's stdout (the "response")
      python.stdout.on("data", (data) => output += data.toString());

      // catch error on python file
      python.stderr.on("data", (data) => console.error("Python error:", data.toString()));

      python.on("close", () => {
            try {
                  const json = JSON.parse(output);
                  res.json(json); // Node sends Python's response to client
                  console.log(json);
            } catch (err) {
                  res.status(500).json({ error: "Failed to parse Python output", raw: output });
            }
      });

      python.on("error", (err) => res.status(500).json({ error: "Python process failed", details: err.message }));

});

router.get("/python/get-current-occupancy", (req, res) => {
      const { method, params } = req.query;

      const python = getForecastedData(method, params);
      
      let output = "";

      // 👇 Node listens to Python's stdout (the "response")
      python.stdout.on("data", (data) => output += data.toString());

      // catch error on python file
      python.stderr.on("data", (data) => console.error("Python error:", data.toString()));

      python.on("close", () => {
            try {
                  const json = JSON.parse(output);
                  res.json(json); // Node sends Python's response to client
                  console.log(json);
            } catch (err) {
                  res.status(500).json({ error: "Failed to parse Python output", raw: output });
            }
      });

      python.on("error", (err) => res.status(500).json({ error: "Python process failed", details: err.message }));

});


export default router;
