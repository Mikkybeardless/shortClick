import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AuthDocument = Auth & Document;

export enum Role {
  User = 'user',
  Admin = 'admin',
}
@Schema({
  timestamps: true,
})
export class Auth {
  @Prop({ required: true })
  username: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true, default: Role.User })
  role: Role;
}

export const AuthSchema = SchemaFactory.createForClass(Auth);
