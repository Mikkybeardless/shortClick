import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UrlDocument = Url & Document;

@Schema({ timestamps: true })
export class Url {
  @Prop({ required: true, unique: true, type: String })
  urlId: string;

  @Prop({ required: true, type: String })
  origUrl: string;

  @Prop({ required: true, type: String })
  shortUrl: string;

  @Prop()
  customDomain?: string;

  @Prop()
  customSlug?: string;

  @Prop({ type: Types.ObjectId, ref: 'auths' })
  owner?: Types.ObjectId;

  @Prop({ required: true, type: Number, default: 0 })
  clicks: number;

  @Prop()
  qrCode?: string;

  @Prop({
    type: [
      {
        country: { type: String },
        timestamp: { type: Date },
      },
    ],
    default: [],
  })
  analytics: { country: string; timestamp: Date }[];
}

export const UrlSchema = SchemaFactory.createForClass(Url);
