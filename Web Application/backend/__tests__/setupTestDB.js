/**
 * Test database setup using mongodb-memory-server in replica set mode.
 * Replica set is required because the app uses MongoDB transactions
 * (mongoose.startSession / session.startTransaction).
 */

import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";

let replSet;

export const connectTestDB = async () => {
    // Disconnect from any existing database connection first
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }

    // Start an in-memory replica set so that transactions are allowed
    replSet = await MongoMemoryReplSet.create({
        replSet: {
            storageEngine: "wiredTiger",
        },
    });

    const uri = replSet.getUri();

    await mongoose.connect(uri);
};

export const closeTestDB = async () => {
    // Only drop database if we're connected to the test replica set
    if (mongoose.connection.readyState !== 0) {
        const dbName = mongoose.connection.name;
        // Safety check: only drop if it's a test database (in-memory databases have random names)
        if (replSet && dbName) {
            await mongoose.connection.dropDatabase();
        }
        await mongoose.connection.close();
    }

    if (replSet) {
        await replSet.stop();
    }
};

export const clearDatabase = async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        await collections[key].deleteMany({});
    }
};
