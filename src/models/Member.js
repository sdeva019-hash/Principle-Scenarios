import mongoose from 'mongoose';

const COMPANY_SIZES = ['1-499', '500-1999', '2000-9999', '10000+'];

const MemberSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  jobTitle: { type: String, required: true, trim: true },
  companyName: { type: String, required: true, trim: true },
  companySize: { type: String, enum: COMPANY_SIZES, required: true },
  country: { type: String, required: true, trim: true },
  bio: { type: String, maxlength: 280, default: '' },
  seniorityConfirmed: { type: Boolean, required: true },
  termsAccepted: { type: Boolean, required: true }
}, { timestamps: true });

MemberSchema.statics.findOrCreateByEmail = async function (email, fields) {
  const normalized = email.toLowerCase().trim();
  const existing = await this.findOne({ email: normalized });
  if (existing) return existing;
  return this.create({ ...fields, email: normalized });
};

export const COMPANY_SIZE_OPTIONS = COMPANY_SIZES;
export default mongoose.model('Member', MemberSchema);
