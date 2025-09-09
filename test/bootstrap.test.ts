const mongoose = require('mongoose');
const fs = require('fs');
require('dotenv').config();
process.env.NODE_ENV = 'test';

import User from '../src/user/models';
const { userService } = require('../src/user/service');

const fixtures: any = {};

before(async () => {
    fs.readdirSync('test/fixtures').filter((name: string) => require('path').extname(name) === '.json').forEach((name: string) => {
        fixtures[name.split('.')[0]] = require(`./fixtures/${name}`);
    });

    // @ts-expect-error: just ignore
    global.fixtures = fixtures;

    // create user auth token
    const userData = fixtures.users[0];
    const user = await User.create(userData);
    // @ts-expect-error: just ignore
    global.fixtures.jwtToken = await userService.generateUserToken(user);
});


after(async () => {
    console.log('Shutting down test...');

    // empty collections and delete database
    const collections = Object.keys(mongoose.connection.collections);
    for (const collectionName of collections) {
        const collection = mongoose.connection.collections[collectionName];
        try {
            await collection.deleteMany({});
            await collection.drop();
        } catch (error:any) {
            if (error.message === "ns not found") return;

            if (error.message.includes("a background operation is currently running"))
                return;

            console.log(error.message);
        }
    }
    //await mongoose.connection.db.dropDatabase();
    await mongoose.connection.close();
});