const express = require("express");
const mongoose = require("mongoose");
const Account = require("../models/Account");
const authenticate = require("../middleware/auth");

const router = express.Router();

router.use(authenticate);

router.get("/me", async (req, res) => {
  try {
    const accounts = await Account.find({ user: req.user._id }).sort({ createdAt: 1 });

    return res.json({
      user: req.user,
      accounts
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load accounts." });
  }
});

router.get("/:accountId", async (req, res) => {
  try {
    const { accountId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(accountId)) {
      return res.status(400).json({ message: "Invalid account id." });
    }

    const account = await Account.findOne({
      _id: accountId,
      user: req.user._id
    });

    if (!account) {
      return res.status(404).json({ message: "Account not found for this user." });
    }

    return res.json(account);
  } catch (error) {
    return res.status(500).json({ message: "Failed to load account." });
  }
});

router.post("/transfer", async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { fromAccountId, toAccountId, amount } = req.body;
    const transferAmount = Number(amount);

    if (!fromAccountId || !toAccountId || !Number.isFinite(transferAmount) || transferAmount <= 0) {
      return res.status(400).json({ message: "Valid source, destination, and amount are required." });
    }

    await session.withTransaction(async () => {
      const source = await Account.findOne({
        _id: fromAccountId,
        user: req.user._id
      }).session(session);

      if (!source) {
        throw new Error("Source account not found.");
      }

      const destination = await Account.findOne({
        _id: toAccountId,
        user: req.user._id
      }).session(session);

      if (!destination) {
        throw new Error("Destination account not found.");
      }

      if (source._id.equals(destination._id)) {
        throw new Error("Choose different accounts.");
      }

      if (source.balance < transferAmount) {
        throw new Error("Insufficient balance.");
      }

      source.balance -= transferAmount;
      destination.balance += transferAmount;

      await source.save({ session });
      await destination.save({ session });
    });

    const accounts = await Account.find({ user: req.user._id }).sort({ createdAt: 1 });
    return res.json({
      message: "Transfer completed successfully.",
      accounts
    });
  } catch (error) {
    return res.status(400).json({
      message: error.message || "Transfer failed."
    });
  } finally {
    await session.endSession();
  }
});

module.exports = router;
