/**
 * One-time repair for a real data-desync bug: POST /api/communities used to
 * add the creator to Community.members[] directly without also creating a
 * Membership record (the actual source of truth for join/leave). That's now
 * fixed at the source, but any community created BEFORE the fix is still
 * missing Membership rows for its creator — this script finds and creates
 * them.
 *
 * Safe to run multiple times: it only inserts a Membership where one is
 * genuinely missing for an existing Community.members[] entry.
 *
 * Run with: npx tsx scripts/backfill-memberships.ts
 */
import "dotenv/config";
import mongoose from "mongoose";
import Community from "../src/models/Community";
import Membership from "../src/models/Membership";

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set");

  await mongoose.connect(uri);
  console.log("Connected to MongoDB Atlas");

  const communities = await Community.find({}).select("_id members createdBy").lean();

  let created = 0;
  let checked = 0;

  for (const community of communities) {
    for (const userId of community.members ?? []) {
      checked++;
      const exists = await Membership.exists({ user: userId, community: community._id });
      if (exists) continue;

      const isCreator = community.createdBy?.toString() === userId.toString();
      await Membership.create({
        user: userId,
        community: community._id,
        role: isCreator ? "admin" : "member",
      });
      created++;
      console.log(`  + created missing Membership: user ${userId} in community ${community._id}`);
    }
  }

  console.log(`\nChecked ${checked} membership entries, created ${created} missing Membership records.`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
