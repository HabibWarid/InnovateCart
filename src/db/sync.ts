import { db } from "./index.ts";
import { products as productsTable } from "./schema.ts";

// এই কন্ডিশনটি ফাংশনগুলোর বাইরেও সেফটি হিসেবে রাখতে পারো
const isDbDisabled = process.env.NEXT_DISABLE_DB === "true";

export async function seedDefaultProducts() {
  // যদি ডাটাবেজ ডিজেবল থাকে, সরাসরি ফাংশন থেকে বের হয়ে যাও
  if (isDbDisabled) {
    console.log("Database Bypass: Skipping seedDefaultProducts...");
    return;
  }

  try {
    // তোমার আগের ডিফল্ট প্রোডাক্ট সিড করার কোড (যা আগে ছিল)
    // উদাহরণস্বরূপ:
    // await db.insert(productsTable).values(...);
  } catch (error) {
    console.error("Failed to insert default product:", error);
  }
}

export async function syncProducts() {
  // যদি ডাটাবেজ ডিজেবল থাকে, কোনো এপিআই কল বা ইনসার্ট কিচ্ছু করার দরকার নেই
  if (isDbDisabled) {
    console.log("Database Bypass Mode Active. Skipping product sync completely.");
    return;
  }

  try {
    console.log("Syncing products from external API...");
    // তোমার আগের এপিআই থেকে ডাটা এনে db.insert করার কোডটি এখানে থাকবে...
    
  } catch (error) {
    console.error("External product sync error:", error);
  }
}
