/** Static Temu-style category taxonomy used by the top tab bar and the sidebar. */

export const TOP_TABS = [
  "All",
  "Garden",
  "Household",
  "Pets",
  "Musical",
  "Appliances",
  "Food",
  "Books",
  "Industrial",
  "Beauty",
  "Crafts",
  "Toy",
  "Automotive",
  "Health",
  "Women",
  "Men",
  "Jewelry",
  "Sports",
  "Kids",
  "Bags",
  "Electronics",
] as const;

export type SidebarCategory = {
  name: string;
  subs: string[];
};

export const SIDEBAR_CATEGORIES: SidebarCategory[] = [
  { name: "Home & Kitchen", subs: ["Kitchen Tools", "Storage", "Bedding", "Bath", "Decor", "Cleaning"] },
  { name: "Women's Clothing", subs: ["Dresses", "Tops", "Bottoms", "Co-ords", "Outerwear", "Abayas"] },
  { name: "Women's Curve Clothing", subs: ["Plus Dresses", "Plus Tops", "Plus Bottoms", "Plus Sets"] },
  { name: "Women's Shoes", subs: ["Heels", "Flats", "Sneakers", "Sandals", "Boots"] },
  { name: "Women's Lingerie & Lounge", subs: ["Bras", "Panties", "Shapewear", "Sleepwear", "Robes"] },
  { name: "Men's Clothing", subs: ["Shirts", "T-Shirts", "Trousers", "Jackets", "Kurta"] },
  { name: "Men's Shoes", subs: ["Formal", "Sneakers", "Sandals", "Loafers"] },
  { name: "Men's Big & Tall", subs: ["Big Shirts", "Big Trousers", "Big Jackets"] },
  { name: "Men's Underwear & Sleepwear", subs: ["Boxers", "Briefs", "Vests", "Pajamas"] },
  { name: "Sports & Outdoors", subs: ["Fitness", "Cycling", "Camping", "Activewear", "Yoga"] },
  { name: "Jewelry & Accessories", subs: ["Earrings", "Necklaces", "Rings", "Watches", "Hair Accessories"] },
  { name: "Beauty & Personal Care", subs: ["Makeup", "Skincare", "Face Masks", "Nail Care", "Hair Removal", "Fragrance"] },
  { name: "Toys & Games", subs: ["Educational", "Dolls", "Puzzles", "Outdoor Play", "RC Toys"] },
  { name: "Automotive", subs: ["Car Care", "Interior", "Accessories", "Tools"] },
  { name: "Kid's Fashion", subs: ["Girls", "Boys", "Sets", "Winterwear"] },
  { name: "Kid's Shoes", subs: ["Sneakers", "Sandals", "School Shoes"] },
  { name: "Baby & Maternity", subs: ["Baby Care", "Diapering", "Feeding", "Maternity Wear"] },
  { name: "Bags & Luggage", subs: ["Handbags", "Backpacks", "Wallets", "Travel Bags"] },
  { name: "Patio, Lawn & Garden", subs: ["Planters", "Garden Tools", "Outdoor Decor", "Watering"] },
  { name: "Arts, Crafts & Sewing", subs: ["Painting", "Sewing", "Beads", "Stationery Crafts"] },
  { name: "Electronics", subs: ["Audio", "Wearables", "Cameras", "Gaming", "Chargers"] },
  { name: "Business, Industry & Science", subs: ["Lab Supplies", "Packaging", "Safety", "Measuring"] },
  { name: "Tools & Home Improvement", subs: ["Hand Tools", "Power Tools", "Hardware", "Lighting"] },
  { name: "Appliances", subs: ["Kitchen Appliances", "Home Appliances", "Personal Appliances"] },
  { name: "Office & School Supplies", subs: ["Stationery", "Notebooks", "Desk Organizers", "Backpacks"] },
  { name: "Health & Household", subs: ["Supplements", "First Aid", "Massagers", "Household Care"] },
  { name: "Pet Supplies", subs: ["Dog", "Cat", "Grooming", "Feeders", "Toys"] },
  { name: "Cell Phones & Accessories", subs: ["Cases", "Holders", "Cables", "Power Banks"] },
  { name: "Smart Home", subs: ["Smart Lights", "Smart Plugs", "Security", "Sensors"] },
  { name: "Musical Instruments", subs: ["Guitars", "Keyboards", "Percussion", "Accessories"] },
  { name: "Food & Grocery", subs: ["Snacks", "Beverages", "Pantry", "Dry Fruits"] },
  { name: "Books & Media", subs: ["Fiction", "Non-Fiction", "Kids Books", "Stationery"] },
  { name: "Beachwear", subs: ["Swimsuits", "Cover-ups", "Beach Accessories"] },
  { name: "Furniture", subs: ["Chairs", "Tables", "Shelves", "Storage Units"] },
];

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
