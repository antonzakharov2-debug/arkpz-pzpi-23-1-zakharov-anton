require("dotenv").config();
const express = require("express");
const cors = require("cors");
const YAML = require("yamljs");
const swaggerUi = require("swagger-ui-express");
const path = require("path");
const mongoose = require("mongoose");
require("./config/db")();

const app = express();

app.use(cors({
  origin: "*",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.json());

app.use("/api/auth", require("./routes/auth"));
app.use("/api/animals", require("./routes/animals"));
app.use("/api/notifications", require("./routes/notifications"));
app.use("/api/farms", require("./routes/farms"));

const swagger = YAML.load(path.join(__dirname, "swagger.yaml"));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swagger));

app.get("/", (req, res) => res.send("Farm Environment Control API"));

app.listen(5000, () => console.log("Server running on port 5000"));

// After mongoose connects, try changeStream; if not supported, fallback to polling
mongoose.connection.once("open", () => {
  console.log("MongoDB connection open, initializing watchers...");

  let pollingStarted = false;

  const startPolling = () => {
    if (pollingStarted) return;
    pollingStarted = true;
    console.warn("Starting polling fallback for animal state checks (every 10s)");
    setInterval(async () => {
      try {
        const Animal = require("./models/Animal");
        const Farm = require("./models/Farm");
        const User = require("./models/User");
        const Notification = require("./models/Notification");

        const badAnimals = await Animal.find({ state: "bad", notified: { $ne: true } }).limit(200);
        if (!badAnimals || badAnimals.length === 0) return;

        for (const doc of badAnimals) {
          try {
            const farm = await Farm.findById(doc.farm).select("name");
            const recommendations = [
              "Check water supply and ensure fresh clean water is available.",
              "Inspect feed quality and adjust nutrition; consider veterinary check.",
              "Check shelter/temperature conditions; improve ventilation or heating.",
              "Isolate the animal and perform basic health inspection; call veterinarian if needed.",
              "Increase monitoring frequency and record symptoms for analysis.",
              "Review vaccination and deworming schedule; update if overdue."
            ];
            const rec = recommendations[Math.floor(Math.random() * recommendations.length)];
            const message = `Animal #${doc.animalNumber} (${doc.species}) on farm "${farm ? farm.name : doc.farm}" reported status "bad". Recommendation: ${rec}`;

            const users = await User.find({ farms: doc.farm }).select("_id").lean();
            const recipients = users.map(u => u._id);
            if (!recipients || recipients.length === 0) {
              console.log(`No users subscribed to farm ${doc.farm} — skipping notification for animal ${doc._id}`);
            } else {
              const notif = new Notification({
                message,
                farm: doc.farm,
                animal: doc._id,
                recommendation: rec,
                recipients
              });
              await notif.save();

              await Animal.updateOne({ _id: doc._id }, { $set: { notified: true } });

              console.log(`Notification created (polling) for farm ${doc.farm}, animal ${doc._id}`);
            }
          } catch (e) {
            console.error("Error creating notification for animal", doc._id, e.message || e);
          }
        }
      } catch (e) {
        console.error("Polling error:", e.message || e);
      }
    }, 10000);
  };

  (async () => {
    try {
      const coll = mongoose.connection.collection("animals");
      let changeStream;
      try {
        changeStream = coll.watch([], { fullDocument: "updateLookup" });
      } catch (initErr) {
        // sync failure (e.g. not supported) -> fallback
        console.warn("ChangeStream initialization failed (sync):", initErr.message || initErr);
        startPolling();
        return;
      }

      // attach error handler immediately to avoid uncaught errors
      changeStream.on("error", (err) => {
        console.error("ChangeStream runtime error:", err.message || err);
        try {
          changeStream.close().catch(()=>{});
        } catch(e){ }
        startPolling();
      });

      changeStream.on("change", async (change) => {
        try {
          if (!["update", "insert", "replace"].includes(change.operationType)) return;
          const doc = change.fullDocument;
          if (!doc) return;
          if (doc.state === "bad" && !doc.notified) {
            const Notification = require("./models/Notification");
            const User = require("./models/User");
            const Farm = require("./models/Farm");
            const Animal = require("./models/Animal");

            const farm = await Farm.findById(doc.farm).select("name");
            const recommendations = [
              "Check water supply and ensure fresh clean water is available.",
              "Inspect feed quality and adjust nutrition; consider veterinary check.",
              "Check shelter/temperature conditions; improve ventilation or heating.",
              "Isolate the animal and perform basic health inspection; call veterinarian if needed.",
              "Increase monitoring frequency and record symptoms for analysis.",
              "Review vaccination and deworming schedule; update if overdue."
            ];
            const rec = recommendations[Math.floor(Math.random() * recommendations.length)];
            const message = `Animal #${doc.animalNumber} (${doc.species}) on farm "${farm ? farm.name : doc.farm}" reported status "bad". Recommendation: ${rec}`;

            // select only users that explicitly reference this farm id (use id as-is)
            const users = await User.find({ farms: doc.farm }).select("_id").lean();

            const recipients = users.map(u => u._id);
            if (!recipients || recipients.length === 0) {
              console.log(`No users subscribed to farm ${doc.farm} — skipping notification for animal ${doc._id}`);
            } else {
              const notif = new Notification({
                message,
                farm: doc.farm,
                animal: doc._id,
                recommendation: rec,
                recipients
              });
              await notif.save();

              // mark animal as notified
              await Animal.updateOne({ _id: doc._id }, { $set: { notified: true } });

              console.log(`Notification created (changeStream) for farm ${doc.farm}, animal ${doc._id}`);
            }
          }
        } catch (err) {
          console.error("ChangeStream handler error:", err.message || err);
        }
      });

      console.log("Animal change stream initialized");
    } catch (err) {
      // any unexpected error -> fallback
      console.warn("ChangeStream initialization failed, falling back to polling. Error:", err.message || err);
      startPolling();
    }
  })();
});
