/* ===================================================
   BREW & BEAN — Approved Client Menu & Product Dataset
   Total: 31 Products across 5 Categories
   All prices in Indian Rupees (INR - ₹)
   =================================================== */

const CATEGORIES_DATA = [
  { id: 1, name: "Hot Coffee", slug: "hot-coffee" },
  { id: 2, name: "Cold Coffee", slug: "cold-coffee" },
  { id: 3, name: "Tea & Refreshments", slug: "tea-refreshments" },
  { id: 4, name: "Snacks", slug: "snacks" },
  { id: 5, name: "Desserts", slug: "desserts" }
];

const PRODUCTS = [
  // --------------------------------------------------------------------------
  // CATEGORY A: HOT COFFEE (7 Products)
  // --------------------------------------------------------------------------
  {
    id: 1,
    name: "Espresso",
    category: "hot-coffee",
    categoryLabel: "Hot Coffee",
    description: "Intense, full-bodied single-origin espresso shot with a rich golden crema.",
    price: 180,
    variants: [
      { size: "Small", price: 180 }
    ],
    rating: 4.8,
    reviews: 312,
    badge: "classic",
    image: "https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=600&q=80",
    ingredients: "100% Single-Origin Arabica Espresso",
    calories: "5 kcal"
  },
  {
    id: 2,
    name: "Americano",
    category: "hot-coffee",
    categoryLabel: "Hot Coffee",
    description: "Rich espresso poured over hot purified water for a bold, clean, and smooth flavor profile.",
    price: 150,
    variants: [
      { size: "Small", price: 150 },
      { size: "Medium", price: 190 }
    ],
    rating: 4.7,
    reviews: 240,
    badge: "",
    image: "https://images.unsplash.com/photo-1551030173-122aabc4489c?w=600&q=80",
    ingredients: "Double Shot Espresso, Hot Purified Water",
    calories: "10 kcal"
  },
  {
    id: 3,
    name: "Cappuccino",
    category: "hot-coffee",
    categoryLabel: "Hot Coffee",
    description: "Equal parts dark espresso, velvety steamed milk, and dense foam dusting.",
    price: 170,
    variants: [
      { size: "Small", price: 170 },
      { size: "Medium", price: 200 },
      { size: "Large", price: 240 }
    ],
    rating: 4.9,
    reviews: 520,
    badge: "bestseller",
    image: "https://images.unsplash.com/photo-1534778101976-62847782c213?w=600&q=80",
    ingredients: "Espresso, Steamed Whole Milk, Velvety Foam",
    calories: "120 kcal"
  },
  {
    id: 4,
    name: "Latte",
    category: "hot-coffee",
    categoryLabel: "Hot Coffee",
    description: "Smooth espresso layered beneath silky textured steamed milk with delicate latte art.",
    price: 170,
    variants: [
      { size: "Small", price: 170 },
      { size: "Medium", price: 200 },
      { size: "Large", price: 240 }
    ],
    rating: 4.8,
    reviews: 415,
    badge: "popular",
    image: "https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?w=600&q=80",
    ingredients: "Espresso, Steamed Whole Milk, Light Foam",
    calories: "150 kcal"
  },
  {
    id: 5,
    name: "Café Mocha",
    category: "hot-coffee",
    categoryLabel: "Hot Coffee",
    description: "Espresso married with decadent chocolate ganache and creamy frothed milk.",
    price: 190,
    variants: [
      { size: "Small", price: 190 },
      { size: "Medium", price: 220 },
      { size: "Large", price: 260 }
    ],
    rating: 4.8,
    reviews: 380,
    badge: "rich",
    image: "https://images.unsplash.com/photo-1579888944880-d98341245702?w=600&q=80",
    ingredients: "Espresso, Belgian Dark Cocoa, Steamed Milk, Whipped Cream",
    calories: "280 kcal"
  },
  {
    id: 6,
    name: "Flat White",
    category: "hot-coffee",
    categoryLabel: "Hot Coffee",
    description: "Double ristretto espresso shots topped with micro-foamed whole milk for supreme silkiness.",
    price: 180,
    variants: [
      { size: "Small", price: 180 },
      { size: "Medium", price: 210 }
    ],
    rating: 4.7,
    reviews: 290,
    badge: "",
    image: "https://images.unsplash.com/photo-1577968897966-3d4325b36b61?w=600&q=80",
    ingredients: "Double Ristretto, Steamed Micro-Foam Milk",
    calories: "130 kcal"
  },
  {
    id: 7,
    name: "Macchiato",
    category: "hot-coffee",
    categoryLabel: "Hot Coffee",
    description: "Bold espresso stained with a dollop of warm, silky milk foam.",
    price: 170,
    variants: [
      { size: "Small", price: 170 },
      { size: "Medium", price: 200 }
    ],
    rating: 4.6,
    reviews: 195,
    badge: "",
    image: "https://images.unsplash.com/photo-1485808191679-5f86510681a2?w=600&q=80",
    ingredients: "Espresso, Dollop of Steamed Foam",
    calories: "20 kcal"
  },

  // --------------------------------------------------------------------------
  // CATEGORY B: COLD COFFEE (5 Products)
  // --------------------------------------------------------------------------
  {
    id: 8,
    name: "Iced Latte",
    category: "cold-coffee",
    categoryLabel: "Cold Coffee",
    description: "Freshly pulled espresso poured over chilled whole milk and crystal ice.",
    price: 200,
    variants: [
      { size: "Medium", price: 200 },
      { size: "Large", price: 240 }
    ],
    rating: 4.8,
    reviews: 340,
    badge: "refreshing",
    image: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=600&q=80",
    ingredients: "Espresso, Cold Milk, Ice",
    calories: "110 kcal"
  },
  {
    id: 9,
    name: "Iced Caramel Latte",
    category: "cold-coffee",
    categoryLabel: "Cold Coffee",
    description: "Espresso blended with artisanal caramel syrup, chilled milk, and caramel drizzle.",
    price: 220,
    variants: [
      { size: "Medium", price: 220 },
      { size: "Large", price: 260 }
    ],
    rating: 4.9,
    reviews: 580,
    badge: "bestseller",
    image: "https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?w=600&q=80",
    ingredients: "Espresso, House Caramel Sauce, Cold Milk, Ice",
    calories: "210 kcal"
  },
  {
    id: 10,
    name: "Iced Mocha",
    category: "cold-coffee",
    categoryLabel: "Cold Coffee",
    description: "Dark cocoa sauce blended with espresso, chilled milk, and served over ice.",
    price: 220,
    variants: [
      { size: "Medium", price: 220 },
      { size: "Large", price: 260 }
    ],
    rating: 4.7,
    reviews: 310,
    badge: "",
    image: "https://images.unsplash.com/photo-1559496417-e7f25cb247cd?w=600&q=80",
    ingredients: "Espresso, Dark Cocoa, Cold Milk, Ice",
    calories: "240 kcal"
  },
  {
    id: 11,
    name: "Classic Iced Coffee",
    category: "cold-coffee",
    categoryLabel: "Cold Coffee",
    description: "Bold brewed coffee chilled over ice with a hint of sweetness and cream.",
    price: 180,
    variants: [
      { size: "Medium", price: 180 },
      { size: "Large", price: 220 }
    ],
    rating: 4.7,
    reviews: 400,
    badge: "classic",
    image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600&q=80",
    ingredients: "Cold Brew Extract, Chilled Water, Ice",
    calories: "15 kcal"
  },
  {
    id: 12,
    name: "Chocolate Frappe",
    category: "cold-coffee",
    categoryLabel: "Cold Coffee",
    description: "Decadent blended ice frappe with chocolate sauce, espresso, and whipped topping.",
    price: 250,
    variants: [
      { size: "Medium", price: 250 },
      { size: "Large", price: 290 }
    ],
    rating: 4.9,
    reviews: 620,
    badge: "bestseller",
    image: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600&q=80",
    ingredients: "Espresso, Chocolate Sauce, Milk, Blended Ice, Whipped Cream",
    calories: "360 kcal"
  },

  // --------------------------------------------------------------------------
  // CATEGORY C: TEA & REFRESHMENTS (5 Products)
  // --------------------------------------------------------------------------
  {
    id: 13,
    name: "Masala Tea",
    category: "tea-refreshments",
    categoryLabel: "Tea & Refreshments",
    description: "Authentic Indian chai infused with fresh cardamom, cinnamon, cloves, and ginger.",
    price: 20,
    variants: [
      { size: "Regular", price: 20 }
    ],
    rating: 4.9,
    reviews: 750,
    badge: "popular",
    image: "https://images.unsplash.com/photo-1561047029-3000c68339ca?w=600&q=80",
    ingredients: "Assam Tea Leaves, Fresh Spices, Whole Milk, Sugar",
    calories: "85 kcal"
  },
  {
    id: 14,
    name: "Ginger Tea",
    category: "tea-refreshments",
    categoryLabel: "Tea & Refreshments",
    description: "Invigorating freshly crushed ginger steeped with premium Assam tea leaves.",
    price: 20,
    variants: [
      { size: "Regular", price: 20 }
    ],
    rating: 4.8,
    reviews: 480,
    badge: "",
    image: "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?w=600&q=80",
    ingredients: "Fresh Ginger Root, Assam Tea, Milk, Cane Sugar",
    calories: "80 kcal"
  },
  {
    id: 15,
    name: "Lemon Tea",
    category: "tea-refreshments",
    categoryLabel: "Tea & Refreshments",
    description: "Zesty black tea infused with freshly squeezed lemon juice and raw honey.",
    price: 20,
    variants: [
      { size: "Regular", price: 20 }
    ],
    rating: 4.6,
    reviews: 320,
    badge: "",
    image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&q=80",
    ingredients: "Black Tea, Fresh Lemon, Honey, Mint Leaves",
    calories: "45 kcal"
  },
  {
    id: 16,
    name: "Green Tea",
    category: "tea-refreshments",
    categoryLabel: "Tea & Refreshments",
    description: "Pure antioxidant-rich whole green tea leaves steeped to a delicate golden infusion.",
    price: 20,
    variants: [
      { size: "Regular", price: 20 }
    ],
    rating: 4.7,
    reviews: 260,
    badge: "healthy",
    image: "https://images.unsplash.com/photo-1627435601361-ec25f5b1d0e5?w=600&q=80",
    ingredients: "100% Whole Organic Green Tea Leaves",
    calories: "2 kcal"
  },
  {
    id: 17,
    name: "Hot Chocolate",
    category: "tea-refreshments",
    categoryLabel: "Tea & Refreshments",
    description: "Rich Dutch dark cocoa whisked into creamy hot milk and topped with chocolate curls.",
    price: 50,
    variants: [
      { size: "Regular", price: 50 }
    ],
    rating: 4.9,
    reviews: 610,
    badge: "bestseller",
    image: "https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=600&q=80",
    ingredients: "Dutch Dark Chocolate, Steamed Whole Milk, Marshmallows",
    calories: "220 kcal"
  },

  // --------------------------------------------------------------------------
  // CATEGORY D: SNACKS (7 Products)
  // --------------------------------------------------------------------------
  {
    id: 18,
    name: "Veg Sandwich",
    category: "snacks",
    categoryLabel: "Snacks",
    description: "Fresh cucumbers, tomatoes, bell peppers, and mint chutney in toasted bread.",
    price: 100,
    variants: [
      { size: "Regular", price: 100 }
    ],
    rating: 4.6,
    reviews: 350,
    badge: "fresh",
    image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&q=80",
    ingredients: "White/Brown Bread, Cucumber, Tomato, Mint Chutney, Butter",
    calories: "210 kcal"
  },
  {
    id: 19,
    name: "Chicken Sandwich",
    category: "snacks",
    categoryLabel: "Snacks",
    description: "Tender spiced roasted chicken breast with house herbs and garlic mayonnaise.",
    price: 150,
    variants: [
      { size: "Regular", price: 150 }
    ],
    rating: 4.8,
    reviews: 480,
    badge: "popular",
    image: "https://images.unsplash.com/photo-1603903631889-b5f3ba4d5b9b?w=600&q=80",
    ingredients: "Roasted Chicken Breast, Garlic Mayo, Lettuce, Toasted Bread",
    calories: "320 kcal"
  },
  {
    id: 20,
    name: "Grilled Cheese Sandwich",
    category: "snacks",
    categoryLabel: "Snacks",
    description: "Golden toasted sourdough stuffed with melted cheddar and mozzarella.",
    price: 170,
    variants: [
      { size: "Regular", price: 170 }
    ],
    rating: 4.9,
    reviews: 530,
    badge: "bestseller",
    image: "https://images.unsplash.com/photo-1528736235302-52922df5c122?w=600&q=80",
    ingredients: "Sourdough Bread, Aged Cheddar, Mozzarella, Butter",
    calories: "380 kcal"
  },
  {
    id: 21,
    name: "Paneer Sandwich",
    category: "snacks",
    categoryLabel: "Snacks",
    description: "Marinated tandoori cottage cheese paneer cubes grilled with crisp onions and capsicum.",
    price: 180,
    variants: [
      { size: "Regular", price: 180 }
    ],
    rating: 4.7,
    reviews: 390,
    badge: "",
    image: "https://images.unsplash.com/photo-1554433601-44787a22ef78?w=600&q=80",
    ingredients: "Tandoori Spiced Paneer, Capsicum, Onion, Mint Spread",
    calories: "310 kcal"
  },
  {
    id: 22,
    name: "French Fries",
    category: "snacks",
    categoryLabel: "Snacks",
    description: "Crispy golden salted potato fries served piping hot with ketchup.",
    price: 120,
    variants: [
      { size: "Regular", price: 120 }
    ],
    rating: 4.8,
    reviews: 620,
    badge: "crispy",
    image: "https://images.unsplash.com/photo-1576107232684-1279f3908594?w=600&q=80",
    ingredients: "Crispy Potatoes, Sea Salt, Dipping Sauces",
    calories: "280 kcal"
  },
  {
    id: 23,
    name: "Garlic Bread",
    category: "snacks",
    categoryLabel: "Snacks",
    description: "Toasted baguette slices smothered in herb-infused garlic butter.",
    price: 120,
    variants: [
      { size: "Regular", price: 120 }
    ],
    rating: 4.7,
    reviews: 440,
    badge: "",
    image: "https://images.unsplash.com/photo-1619535860434-ba1d8fa12536?w=600&q=80",
    ingredients: "Artisan Baguette, Roasted Garlic Butter, Oregano, Parsley",
    calories: "230 kcal"
  },
  {
    id: 24,
    name: "Nachos with Cheese",
    category: "snacks",
    categoryLabel: "Snacks",
    description: "Crisp Mexican corn tortilla chips served with warm gooey cheese dip and jalapeños.",
    price: 140,
    variants: [
      { size: "Regular", price: 140 }
    ],
    rating: 4.8,
    reviews: 380,
    badge: "",
    image: "https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=600&q=80",
    ingredients: "Corn Tortilla Chips, Melted Cheddar Dip, Sliced Jalapeños",
    calories: "340 kcal"
  },

  // --------------------------------------------------------------------------
  // CATEGORY E: DESSERTS (7 Products / 6 Menu Items)
  // --------------------------------------------------------------------------
  {
    id: 25,
    name: "Chocolate Brownie",
    category: "desserts",
    categoryLabel: "Desserts",
    description: "Fudgy, dense Belgian chocolate brownie baked to gooey perfection.",
    price: 120,
    variants: [
      { size: "Regular", price: 120 }
    ],
    rating: 4.9,
    reviews: 690,
    badge: "bestseller",
    image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&q=80",
    ingredients: "Belgian Dark Chocolate, Butter, Cocoa, Walnuts",
    calories: "320 kcal"
  },
  {
    id: 26,
    name: "Cheesecake",
    category: "desserts",
    categoryLabel: "Desserts",
    description: "Classic New York style baked cheesecake over a buttery graham cracker crust.",
    price: 160,
    variants: [
      { size: "Regular", price: 160 }
    ],
    rating: 4.9,
    reviews: 510,
    badge: "popular",
    image: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=600&q=80",
    ingredients: "Philadelphia Cream Cheese, Graham Cracker Crust, Vanilla",
    calories: "350 kcal"
  },
  {
    id: 27,
    name: "Chocolate Cookies",
    category: "desserts",
    categoryLabel: "Desserts",
    description: "Freshly baked soft-centered cookies loaded with melting dark chocolate chunks.",
    price: 80,
    variants: [
      { size: "Regular", price: 80 }
    ],
    rating: 4.7,
    reviews: 430,
    badge: "",
    image: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=600&q=80",
    ingredients: "Flour, Butter, Brown Sugar, Dark Chocolate Chunks",
    calories: "190 kcal"
  },
  {
    id: 28,
    name: "Muffin (Choco / Blueberry)",
    category: "desserts",
    categoryLabel: "Desserts",
    description: "Soft, fluffy bakery muffin available in rich Chocolate chip or wild Blueberry flavor.",
    price: 100,
    variants: [
      { size: "Choco", price: 100 },
      { size: "Blueberry", price: 100 }
    ],
    rating: 4.8,
    reviews: 360,
    badge: "fresh",
    image: "https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?w=600&q=80",
    ingredients: "Flour, Butter, Eggs, Fresh Blueberries / Dark Choco Chips",
    calories: "260 kcal"
  },
  {
    id: 29,
    name: "Choco Muffin",
    category: "desserts",
    categoryLabel: "Desserts",
    description: "Moist chocolate muffin packed with rich cocoa and dark chocolate chips.",
    price: 100,
    variants: [
      { size: "Regular", price: 100 }
    ],
    rating: 4.8,
    reviews: 220,
    badge: "",
    image: "https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?w=600&q=80",
    ingredients: "Cocoa, Choco Chips, Butter, Vanilla",
    calories: "270 kcal"
  },
  {
    id: 30,
    name: "Croissant",
    category: "desserts",
    categoryLabel: "Desserts",
    description: "Flaky, buttery French golden pastry baked fresh daily.",
    price: 110,
    variants: [
      { size: "Regular", price: 110 }
    ],
    rating: 4.8,
    reviews: 390,
    badge: "classic",
    image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&q=80",
    ingredients: "French Flour, Pure Butter, Yeast, Sea Salt",
    calories: "240 kcal"
  },
  {
    id: 31,
    name: "Donut",
    category: "desserts",
    categoryLabel: "Desserts",
    description: "Soft glazed ring donut with chocolate frosting and sweet colorful sprinkles.",
    price: 90,
    variants: [
      { size: "Regular", price: 90 }
    ],
    rating: 4.7,
    reviews: 310,
    badge: "",
    image: "https://images.unsplash.com/photo-1527515862127-a4fc05baf7a5?w=600&q=80",
    ingredients: "Enriched Flour, Milk, Chocolate Icing, Sprinkles",
    calories: "220 kcal"
  }
];

const REVIEWS = [
  {
    name: "Priya Sharma",
    initials: "PS",
    location: "Bangalore",
    rating: 5,
    text: "The Cappuccino and Chocolate Brownie are unmatched! Best coffee experience in the city.",
    date: "2 days ago"
  },
  {
    name: "Arjun Mehta",
    initials: "AM",
    location: "Bangalore",
    rating: 5,
    text: "Iced Caramel Latte is an absolute treat on a sunny afternoon. 30-minute delivery is super reliable.",
    date: "1 week ago"
  },
  {
    name: "Sneha Kapoor",
    initials: "SK",
    location: "Bangalore",
    rating: 5,
    text: "The Masala Tea and Grilled Cheese Sandwich are pure comfort. Loved that I didn't need to create an account!",
    date: "3 days ago"
  }
];
