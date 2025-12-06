import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

import { Role } from '../role/roles.enum';

export type AuthDocument = Auth & Document;

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
  role?: Role;
}

export const AuthSchema = SchemaFactory.createForClass(Auth);
