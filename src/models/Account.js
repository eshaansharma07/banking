const mongoose = require("mongoose");

const accountSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: ["checking", "savings"],
      required: true
    },
    accountNumber: {
      type: String,
      required: true,
      unique: true
    },
    balance: {
      type: Number,
      default: 0,
      min: 0
    },
    currency: {
      type: String,
      default: "INR"
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.models.Account || mongoose.model("Account", accountSchema);
