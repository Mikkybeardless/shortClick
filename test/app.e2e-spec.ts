import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../src/app.module';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongooseModule } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

describe('E2E tests', () => {
  let app: INestApplication;
  let mongodb: Connection;
  let mongoServer: MongoMemoryServer;

  const clearDB = async () => {
    if (mongodb) {
      const collections = await mongodb.db.collections();
      for (let collection of collections) {
        await collection.deleteMany();
      }
    }
  };

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [MongooseModule.forRoot(mongoUri), AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    mongodb = moduleFixture.get<Connection>(Connection);
  });

  afterAll(async () => {
    await clearDB();
    await mongodb.close();
    await mongoServer.stop();
    await app.close();
  });

  it('should not be able to sign in', async () => {
    await clearDB();
    const res = await request(app.getHttpServer()).post('/auth/login').send({
      email: 'test@yahoo.com',
      password: 'password',
    });
    console.log(res.body);
    expect(res.status).toEqual(404);
    expect(res.body.message).toEqual('User not found');
  });

  it('should be able to sign up', async () => {
    await clearDB();
    const res = await request(app.getHttpServer()).post('/auth/register').send({
      username: 'James',
      email: 'mikky@gmail.com',
      password: 'password',
    });

    console.log(res.body);
    expect(res.status).toEqual(201);
    expect(res.body.message).toEqual('User created successfully');
    expect(res.body.data.user).toHaveProperty('_id');
    expect(res.body.data.user).toHaveProperty('username');
    expect(res.body.data.user.username).toEqual('James');
    expect(res.body.data.user).toHaveProperty('email');
    expect(res.body.data.user.email).toEqual('mikky@gmail.com');
  });

  it('should be able to sign in', async () => {
    await clearDB();
    await mongodb.db.collection('users').insertOne({
      username: 'Grace',
      email: 'yam@gmail.com',
      password: await bcrypt.hash('password', 10),
    });

    const res = await request(app.getHttpServer()).post('/auth/login').send({
      email: 'yam@gmail.com',
      password: 'password',
    });

    console.log(res.body);
    expect(res.status).toEqual(200);
    expect(res.body.message).toEqual('Login successful');
    expect(res.body.data).toHaveProperty('access_token');
    expect(res.body.data).not.toHaveProperty('password');
  });

  it('should not be able to sign in - invalid payload', async () => {
    const res = await request(app.getHttpServer()).post('/auth/login').send({
      email: 'test@mymail.com',
    });

    console.log(res.body);
    expect(res.status).toEqual(400);
    expect(res.body.message).toEqual('Validation Error');
    expect(res.body).toHaveProperty('errors');
  });
});
