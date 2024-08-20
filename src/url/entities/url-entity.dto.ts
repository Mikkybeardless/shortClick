import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UrlDocument = Url & Document;

@Schema()
export class Analytics extends Document {
  @Prop({ required: true })
  country: string;

  @Prop({ required: true })
  timestamp: Date;

  @Prop({ required: true })
  clientIp: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  region: string;

  @Prop({ required: true })
  localtime: string;
}

export const AnalyticsSchema = SchemaFactory.createForClass(Analytics);

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

  @Prop({ type: [AnalyticsSchema], default: [] })
  analytics: Analytics[];
}

export const UrlSchema = SchemaFactory.createForClass(Url);
