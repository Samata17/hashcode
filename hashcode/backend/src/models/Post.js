import mongoose from 'mongoose';

const postSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, minlength: 3, maxlength: 150 },
    // Readable URL part: /post/getting-started-with-react
    slug: { type: String, required: true, unique: true, lowercase: true },
    content: { type: String, required: true }, // Markdown text
    excerpt: { type: String, default: '', maxlength: 300 },
    coverImage: { type: String, default: '' },
    // Tag slugs, e.g. ["react", "javascript"]. Details for each tag live in the Tag model.
    tags: { type: [String], default: [] },
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
    publishedAt: { type: Date },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    readingTime: { type: Number, default: 1 }, // estimated minutes to read
  },
  { timestamps: true }
);

// Before saving, estimate reading time (~200 words per minute).
postSchema.pre('save', function setReadingTime() {
  if (this.isModified('content')) {
    const words = this.content.trim().split(/\s+/).length;
    this.readingTime = Math.max(1, Math.round(words / 200));
  }
});

// Indexes make common queries fast (public feed, tag filter, author's posts).
postSchema.index({ status: 1, publishedAt: -1 });
postSchema.index({ tags: 1 });
postSchema.index({ author: 1 });

postSchema.set('toJSON', {
  transform(_doc, ret) {
    delete ret.__v;
    return ret;
  },
});

export const Post = mongoose.model('Post', postSchema);
