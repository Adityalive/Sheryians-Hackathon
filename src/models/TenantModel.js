import mongoose from 'mongoose';

const tenantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      lowercase: true,
    },
    settings: {
      supportEmail: {
        type: String,
        trim: true,
        default: '',
      },
      timezone: {
        type: String,
        trim: true,
        default: 'UTC',
      },
      brandVoice: {
        type: String,
        trim: true,
        default: 'helpful',
      },
    },
  },
  { timestamps: true }
);

export default mongoose.model('Tenant', tenantSchema);
