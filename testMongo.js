const { MongoClient } = require("mongodb");
require("dotenv").config();

async function testMongoConnection() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("Missing MONGODB_URI environment variable.");
  }

  const client = new MongoClient(uri);

  try {
    console.log("1. Connecting to MongoDB Atlas...");
    await client.connect();
    console.log("Connected successfully.");

    console.log('2. Opening database "testDB"...');
    const db = client.db("testDB");

    console.log('3. Opening collection "users"...');
    const usersCollection = db.collection("users");

    console.log("4. Inserting test document...");
    const insertResult = await usersCollection.insertOne({
      name: "test-user",
      createdAt: new Date(),
    });
    console.log("Insert successful:", insertResult.insertedId);

    console.log("5. Fetching all documents...");
    const documents = await usersCollection.find({}).toArray();

    console.log("6. Documents found:");
    console.log(documents);

    console.log("7. Test completed successfully.");
  } catch (error) {
    console.error("MongoDB connection test failed:");
    console.error(error);
  } finally {
    console.log("8. Closing connection...");
    await client.close();
    console.log("Connection closed.");
  }
}

testMongoConnection().catch((error) => {
  console.error("Unexpected fatal error:");
  console.error(error);
  process.exitCode = 1;
});
