const mongoose = require("mongoose");

module.exports = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("MongoDB connected");

  // try to remove old incorrect unique index for tagNumber (if exists)
  try {
    const col = mongoose.connection.collection("animals");
    const indexes = await col.indexes();
    const hasTagIndex = indexes.some((i) => i.key && i.key.tagNumber);
    if (hasTagIndex) {
      // index name is usually "tagNumber_1"
      await col.dropIndex("tagNumber_1");
      console.log(
        "Dropped existing tagNumber index to allow partial unique index creation"
      );
    }
  } catch (e) {
    // ignore: index may not exist or already removed
  }
};
