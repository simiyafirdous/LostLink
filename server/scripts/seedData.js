const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const Item = require("../models/Item");
const User = require("../models/User");
const connectDatabase = require("../config/db");
const { embed } = require("../services/embeddings");

const seedItemsData = [
  // Category 1: Wallet (2 Lost, 1 Found Match, 1 Near Miss)
  {
    type: "lost",
    name: "Fossil Brown Leather Bi-fold Wallet",
    description: "Brown leather bi-fold wallet lost near Student Union. Contains ID card and engraved initials J.D.",
    category: "wallet",
    color: "brown",
    brand: "Fossil",
    locationText: "Student Union 2nd floor",
    location: { type: "Point", coordinates: [-73.9851, 40.7488] },
    incidentDate: new Date("2026-08-01"),
    ai: {
      category: "wallet",
      primary_color: "brown",
      secondary_colors: ["dark brown"],
      brand: "Fossil",
      material: "leather",
      shape_or_form: "rectangular bi-fold",
      distinctive_features: ["engraved initials J.D.", "scratched corner"],
      text_visible: "J.D.",
      condition: "worn",
      description: "Brown leather Fossil wallet with visible initials J.D.",
      confidence: 0.95
    }
  },
  {
    type: "found",
    name: "Found Brown Leather Fossil Wallet",
    description: "Found brown leather wallet under coffee table. Engraved with initials J.D. on corner.",
    category: "wallet",
    color: "brown",
    brand: "Fossil",
    locationText: "Campus Coffee Shop",
    location: { type: "Point", coordinates: [-73.9855, 40.7485] },
    incidentDate: new Date("2026-08-02"),
    ai: {
      category: "wallet",
      primary_color: "brown",
      secondary_colors: ["dark brown"],
      brand: "Fossil",
      material: "leather",
      shape_or_form: "rectangular bi-fold",
      distinctive_features: ["engraved initials J.D.", "scratched corner"],
      text_visible: "J.D.",
      condition: "worn",
      description: "Found brown leather Fossil wallet with engraved initials J.D.",
      confidence: 0.96
    }
  },
  {
    type: "found",
    name: "Found Black Synthetic Nylon Tri-fold Wallet (Near Miss)",
    description: "Black Velcro nylon tri-fold wallet found in gymnasium.",
    category: "wallet",
    color: "black",
    brand: "Nike",
    locationText: "Gymnasium Locker Room",
    location: { type: "Point", coordinates: [-73.9810, 40.7420] },
    incidentDate: new Date("2026-08-03"),
    ai: {
      category: "wallet",
      primary_color: "black",
      secondary_colors: [],
      brand: "Nike",
      material: "nylon",
      shape_or_form: "tri-fold",
      distinctive_features: ["velcro strap"],
      text_visible: null,
      condition: "good",
      description: "Black sports nylon wallet with velcro closure.",
      confidence: 0.90
    }
  },

  // Category 2: Phone (1 Lost, 1 Found Match, 1 Near Miss)
  {
    type: "lost",
    name: "Space Grey iPhone 14 Pro",
    description: "Space Grey iPhone 14 Pro with clear silicone case and sticker of anime character on back.",
    category: "phone",
    color: "space grey",
    brand: "Apple",
    locationText: "Main Library Study Room 3B",
    location: { type: "Point", coordinates: [-73.9840, 40.7490] },
    incidentDate: new Date("2026-08-05"),
    ai: {
      category: "phone",
      primary_color: "space grey",
      secondary_colors: ["black"],
      brand: "Apple",
      material: "glass/aluminium",
      shape_or_form: "rectangular smartphone",
      distinctive_features: ["clear silicone case", "anime sticker"],
      text_visible: "IMEI 998271625",
      condition: "good",
      description: "Space Grey Apple iPhone 14 Pro in clear case with sticker.",
      confidence: 0.94
    }
  },
  {
    type: "found",
    name: "Found iPhone 14 Pro with Clear Case",
    description: "iPhone 14 Pro found on desk in Library. Has clear case and character sticker on back.",
    category: "phone",
    color: "space grey",
    brand: "Apple",
    locationText: "Main Library Desk",
    location: { type: "Point", coordinates: [-73.9842, 40.7492] },
    incidentDate: new Date("2026-08-05"),
    ai: {
      category: "phone",
      primary_color: "space grey",
      secondary_colors: ["black"],
      brand: "Apple",
      material: "glass/aluminium",
      shape_or_form: "rectangular smartphone",
      distinctive_features: ["clear silicone case", "anime sticker"],
      text_visible: "IMEI 998271625",
      condition: "good",
      description: "Found Apple smartphone with clear case and anime sticker.",
      confidence: 0.95
    }
  },
  {
    type: "found",
    name: "Found Blue Samsung Galaxy S23 (Near Miss)",
    description: "Blue Samsung Galaxy phone in thick black heavy duty case.",
    category: "phone",
    color: "blue",
    brand: "Samsung",
    locationText: "Science Lecture Hall A",
    location: { type: "Point", coordinates: [-73.9870, 40.7510] },
    incidentDate: new Date("2026-08-06"),
    ai: {
      category: "phone",
      primary_color: "blue",
      secondary_colors: ["black"],
      brand: "Samsung",
      material: "plastic",
      shape_or_form: "rectangular smartphone",
      distinctive_features: ["heavy duty armor case"],
      text_visible: null,
      condition: "good",
      description: "Blue Samsung smartphone with black armor case.",
      confidence: 0.88
    }
  },

  // Category 3: Bag (1 Lost, 1 Found Match, 1 Near Miss)
  {
    type: "lost",
    name: "Black North Face Recon Backpack",
    description: "Black North Face backpack with laptop sleeve. Attached blue carabiner clip on right strap.",
    category: "bag",
    color: "black",
    brand: "The North Face",
    locationText: "Dining Hall Patio",
    location: { type: "Point", coordinates: [-73.9820, 40.7470] },
    incidentDate: new Date("2026-08-04"),
    ai: {
      category: "bag",
      primary_color: "black",
      secondary_colors: ["blue"],
      brand: "The North Face",
      material: "canvas",
      shape_or_form: "backpack",
      distinctive_features: ["blue carabiner clip", "front mesh pocket"],
      text_visible: null,
      condition: "good",
      description: "Black North Face backpack with blue carabiner attached.",
      confidence: 0.92
    }
  },
  {
    type: "found",
    name: "Found Black North Face Backpack with Clip",
    description: "Found black canvas backpack at dining patio bench. Has blue carabiner on strap.",
    category: "bag",
    color: "black",
    brand: "The North Face",
    locationText: "Dining Hall Benches",
    location: { type: "Point", coordinates: [-73.9822, 40.7472] },
    incidentDate: new Date("2026-08-04"),
    ai: {
      category: "bag",
      primary_color: "black",
      secondary_colors: ["blue"],
      brand: "The North Face",
      material: "canvas",
      shape_or_form: "backpack",
      distinctive_features: ["blue carabiner clip", "front mesh pocket"],
      text_visible: null,
      condition: "good",
      description: "Black North Face backpack with blue clip.",
      confidence: 0.93
    }
  },
  {
    type: "found",
    name: "Found Grey Herschel Backpack (Near Miss)",
    description: "Grey Herschel canvas backpack found near bus stop.",
    category: "bag",
    color: "grey",
    brand: "Herschel",
    locationText: "Campus Bus Stop",
    location: { type: "Point", coordinates: [-73.9890, 40.7530] },
    incidentDate: new Date("2026-08-07"),
    ai: {
      category: "bag",
      primary_color: "grey",
      secondary_colors: ["brown leather strap"],
      brand: "Herschel",
      material: "canvas",
      shape_or_form: "backpack",
      distinctive_features: ["brown leather straps"],
      text_visible: null,
      condition: "worn",
      description: "Grey Herschel backpack with leather accent straps.",
      confidence: 0.89
    }
  },

  // Category 4: Watch (1 Lost, 1 Found Match)
  {
    type: "lost",
    name: "Silver Seiko Chronograph Watch",
    description: "Silver stainless steel Seiko wrist watch lost during sports practice.",
    category: "watch",
    color: "silver",
    brand: "Seiko",
    locationText: "Track and Field Stadium",
    location: { type: "Point", coordinates: [-73.9800, 40.7410] },
    incidentDate: new Date("2026-08-07"),
    ai: {
      category: "watch",
      primary_color: "silver",
      secondary_colors: ["blue dial"],
      brand: "Seiko",
      material: "stainless steel",
      shape_or_form: "circular wrist watch",
      distinctive_features: ["blue dial face", "metal link bracelet"],
      text_visible: "Seiko 100m",
      condition: "good",
      description: "Silver Seiko analog chronograph with blue dial.",
      confidence: 0.94
    }
  },
  {
    type: "found",
    name: "Found Silver Seiko Wristwatch",
    description: "Found silver stainless watch with blue face on stadium bleachers.",
    category: "watch",
    color: "silver",
    brand: "Seiko",
    locationText: "Stadium Bleachers",
    location: { type: "Point", coordinates: [-73.9802, 40.7412] },
    incidentDate: new Date("2026-08-07"),
    ai: {
      category: "watch",
      primary_color: "silver",
      secondary_colors: ["blue dial"],
      brand: "Seiko",
      material: "stainless steel",
      shape_or_form: "circular wrist watch",
      distinctive_features: ["blue dial face", "metal link bracelet"],
      text_visible: "Seiko 100m",
      condition: "good",
      description: "Silver Seiko wrist watch with blue dial face.",
      confidence: 0.95
    }
  },

  // Category 5: Keys (2 Lost, 2 Found Matches)
  {
    type: "lost",
    name: "Toyota Car Key Fob with Brass Keyring",
    description: "Black Toyota remote key fob with brass keyring and red bottle opener tool.",
    category: "keys",
    color: "black",
    brand: "Toyota",
    locationText: "Engineering Quad Walkway",
    location: { type: "Point", coordinates: [-73.9860, 40.7500] },
    incidentDate: new Date("2026-08-08"),
    ai: {
      category: "keys",
      primary_color: "black",
      secondary_colors: ["brass", "red"],
      brand: "Toyota",
      material: "plastic/metal",
      shape_or_form: "key fob set",
      distinctive_features: ["red bottle opener", "brass ring"],
      text_visible: "Toyota",
      condition: "good",
      description: "Black Toyota key fob with red bottle opener attachment.",
      confidence: 0.91
    }
  },
  {
    type: "found",
    name: "Found Toyota Key Fob & Keychain",
    description: "Found key set with Toyota remote button fob and red bottle opener.",
    category: "keys",
    color: "black",
    brand: "Toyota",
    locationText: "Engineering Lab Steps",
    location: { type: "Point", coordinates: [-73.9862, 40.7502] },
    incidentDate: new Date("2026-08-08"),
    ai: {
      category: "keys",
      primary_color: "black",
      secondary_colors: ["brass", "red"],
      brand: "Toyota",
      material: "plastic/metal",
      shape_or_form: "key fob set",
      distinctive_features: ["red bottle opener", "brass ring"],
      text_visible: "Toyota",
      condition: "good",
      description: "Found Toyota remote key fob with red tool attached.",
      confidence: 0.92
    }
  },
  {
    type: "lost",
    name: "Ray-Ban Aviator Sunglasses in Black Case",
    description: "Gold frame Ray-Ban aviator sunglasses inside black leather case.",
    category: "eyewear",
    color: "gold",
    brand: "Ray-Ban",
    locationText: "Campus Quad Lawn",
    location: { type: "Point", coordinates: [-73.9830, 40.7475] },
    incidentDate: new Date("2026-08-09"),
    ai: {
      category: "eyewear",
      primary_color: "gold",
      secondary_colors: ["black case"],
      brand: "Ray-Ban",
      material: "metal frame",
      shape_or_form: "aviator sunglasses",
      distinctive_features: ["green tinted lenses", "black snap case"],
      text_visible: "Ray-Ban",
      condition: "good",
      description: "Gold Ray-Ban aviator sunglasses with black case.",
      confidence: 0.93
    }
  },
  {
    type: "found",
    name: "Found Ray-Ban Sunglasses Case",
    description: "Black leather case containing gold frame Ray-Ban aviators found on grass.",
    category: "eyewear",
    color: "gold",
    brand: "Ray-Ban",
    locationText: "Quad Benches",
    location: { type: "Point", coordinates: [-73.9832, 40.7477] },
    incidentDate: new Date("2026-08-09"),
    ai: {
      category: "eyewear",
      primary_color: "gold",
      secondary_colors: ["black case"],
      brand: "Ray-Ban",
      material: "metal frame",
      shape_or_form: "aviator sunglasses",
      distinctive_features: ["green tinted lenses", "black snap case"],
      text_visible: "Ray-Ban",
      condition: "good",
      description: "Found gold Ray-Ban aviator sunglasses in snap case.",
      confidence: 0.94
    }
  }
];

const seedData = async () => {
  try {
    await connectDatabase();
    console.log("Seeding test dataset for AI matching quality evaluation...");

    // Find or create default admin/user for ownership
    let user = await User.findOne();
    if (!user) {
      user = await User.create({
        name: "Test Demo User",
        email: "demo@lostfound.edu",
        password: "$2a$10$abcdefghijklmnopqrstuuvwxyz1234567890",
        role: "user"
      });
    }

    // Delete existing seed items if needed or insert new
    await Item.deleteMany({ seed: true });

    for (const itemData of seedItemsData) {
      const descText = `${itemData.ai.description} ${itemData.name} ${itemData.category}`;
      const embedding = await embed(descText);

      await Item.create({
        ...itemData,
        owner: user._id,
        descEmbedding: embedding,
        aiStatus: "done",
        status: "open",
        imageUrl: "/uploads/sample-demo.jpg",
        image: "/uploads/sample-demo.jpg",
        seed: true
      });
    }

    console.log(`✅ Seeded ${seedItemsData.length} items across 5 categories with deliberate near-miss pairs!`);
    process.exit(0);
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  }
};

seedData();
