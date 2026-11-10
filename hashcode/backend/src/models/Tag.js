import mongoose from 'mongoose';

// A technology tag such as "React" or "Node.js".
// Posts store the tag's slug; this model keeps the display name and description.
const tagSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 30 },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, default: '', maxlength: 200 },
  },
  { timestamps: true }
);

tagSchema.set('toJSON', {
  transform(_doc, ret) {
    delete ret.__v;
    return ret;
  },
});

export const Tag = mongoose.model('Tag', tagSchema);
