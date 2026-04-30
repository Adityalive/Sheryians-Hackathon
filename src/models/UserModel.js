import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    accountType: {
      type: String,
      enum: ['business', 'customer'],
      required: true,
      default: 'customer',
    },
    isAdmin: {
      type: Boolean,
      required: true,
      default: false,
    },
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    customerType: {
      type: String,
      enum: ['regular', 'premium', 'vip'],
      default: 'regular',
    },
    subscriptionLevel: {
      type: String,
      default: 'basic',
    },
  },
  { timestamps: true }
);

userSchema.index({ tenant: 1, email: 1 }, { unique: true });

export default mongoose.model('UserModel', userSchema);
