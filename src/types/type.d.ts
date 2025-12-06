import { Types } from 'mongoose';

declare global {
  type DbId = Types.ObjectId;
  interface UserPayload {
    role: 'user' | 'admin';
    email: string;
    name: string;
    id: DbId;
    sub: DbId;
  }
  interface FindAllQuery {
    email?: string;
    username?: string;
    page?: number;
  }
  interface User {
    email: string;
    password?: string;
    username: string;
    role?: 'user' | 'admin';
    _id: DbId;
  }
}
