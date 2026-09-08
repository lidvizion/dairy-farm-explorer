// Visual briefs and feedback live beside content, not inside generic renderers.
// Existing photos are reused; illustrative environments are explicitly labeled.
export const LEARNING_EXPERIENCES = {
  cowcare: {
    role: 'You’re the cow-care team', mission: 'It’s a warm afternoon. Build a comfort plan for the herd.',
    image: 'assets/photos/cow-holstein.jpg', alt: 'A Holstein dairy cow', caption: 'Start with the animal’s needs.',
    takeaway: 'Clean water, a comfortable resting area, and cooling or shade support cow comfort.',
    feedback: ['Entertainment does not replace water, rest, and protection from heat.', 'Cooling or shade helps cows manage heat. Water and comfortable resting areas matter too.', 'Loud music is not a cow-comfort measure. Think about shelter and the animal’s physical needs.']
  },
  milking: {
    role: 'You’re the milk-route planner', mission: 'Connect the farm’s milk route, then run the cooling system before dispatch.',
    image: 'assets/environments/dairy-farm-morning.jpg', alt: 'Illustrative dairy farm with a refrigerated milk tanker', caption: 'Illustrative farm · Follow the cold chain.',
    takeaway: 'Sanitary equipment → clean pipes → refrigerated tank → refrigerated tanker.',
    feedback: ['Cooling slows bacterial growth and helps preserve milk quality. It does not replace sanitation or pasteurization.', 'Cooling is about controlling temperature, not adding sweetness.', 'The milk is being prepared for transport and processing, not served back to the cow.']
  },
  resource: {
    role: 'You’re the resource coordinator', mission: 'Give each resource another useful job around the farm.',
    image: 'assets/photos/farm-solar.jpg', alt: 'Solar panels at a dairy farm', caption: 'Different farms use different tools.',
    takeaway: 'Water, nutrients, captured gas, and solar energy can support different farm operations.',
    feedback: ['A digester can capture gas produced as manure breaks down. Practices vary by farm.', 'A digester captures methane from manure breakdown for renewable energy; not every farm has one.', 'A digester does not turn manure into milk. Its useful output includes gas that can supply energy.']
  },
  receiving: {
    role: 'You’re on the receiving team', mission: 'A tanker has arrived. Select the checks needed before the milk moves on.',
    image: 'assets/environments/processing-facility.jpg', alt: 'Illustrative dairy processing facility with tanks and a tanker', caption: 'Illustrative facility · Cold, clean, checked.',
    takeaway: 'Milk temperature, cleanliness, and quality checks matter at receiving.',
    feedback: ['Temperature, cleanliness, and appropriate quality checks help protect the milk supply.', 'Being on time does not establish milk temperature or quality. The receiving checks still matter.', 'A familiar supplier still needs the appropriate receiving checks. Familiarity does not replace checking the milk.']
  },
  products: {
    role: 'You’re the product explorer', mission: 'Compare at least two dairy products. Find where their paths diverge.',
    image: 'assets/photos/cheese-artisan.jpg', alt: 'An assortment of cheeses in different shapes and styles', caption: 'One starting ingredient, many different paths.',
    takeaway: 'Cheese forms curds; butter is made by churning cream. Product processes differ.',
    feedback: ['Cultures and curd formation belong to the simplified cheese path. Butter follows a cream-churning path.', 'Churning cream is the butter path. Cheese forms curds.', 'Freezing and whipping in air belongs to the simplified ice-cream path.']
  },
  cheese: {
    role: 'You’re the dispatch team', mission: 'Match each package to the buyer it is designed for.',
    image: 'assets/photos/cheese-plate.jpg', alt: 'Cheeses prepared for serving', caption: 'The same dairy can reach different buyers.',
    takeaway: 'Household and commercial buyers often need different package sizes and formats.',
    feedback: ['Foodservice and distributors supply formats suited to commercial kitchens.', 'A small household package is the grocery example. This order is for a commercial kitchen.', 'Restaurants can buy dairy in bulk. Package format follows how the buyer will use it.']
  },
  grocery: {
    role: 'You’re stocking the store', mission: 'Put each delivery in its correct storage area.',
    image: 'assets/environments/market-kitchen.jpg', alt: 'Illustrative market and kitchen storefronts', caption: 'Illustrative destination · Keep the cold chain connected.',
    takeaway: 'The perishable dairy items in this activity belong in refrigerated storage.',
    feedback: ['These perishable dairy items belong in the refrigerated dairy case. Follow their storage labels.', 'A dry shelf fits the boxed crackers in the lesson, not these perishable dairy items.', 'An ordinary checkout display does not provide the refrigeration these items need.']
  },
  seal: {
    role: 'You’re the label detective', mission: 'Inspect the labels. Choose the packages that actually show the seal.',
    image: 'assets/real-california-milk-logo-official.webp', alt: 'The Real California Milk seal', caption: 'Identify the seal—not the package color or product type.', contain: true,
    takeaway: 'The seal identifies dairy made with Real California milk. It is not an organic or sale label.',
    feedback: ['The seal identifies dairy made with milk from California dairy farms.', 'An organic claim is separate. This seal identifies the California milk connection.', 'A sale price is a separate store offer. This seal identifies the milk’s California origin.']
  },
  foodservice: {
    role: 'You’re preparing for dinner service', mission: 'Route the order to the kitchen station—or household order—it was packed for.',
    image: 'assets/photos/market-flatbread.jpg', alt: 'Flatbread topped with cheese and vegetables', caption: 'Think about how each ingredient will be used.',
    takeaway: 'Commercial kitchens choose package sizes and formats to match their menus and quantities.',
    feedback: ['Commercial kitchens often use larger quantities and formats suited to their work.', 'Restaurants can use the same kinds of dairy foods. The difference here is quantity and format, not a ban.', 'Buyers have different needs, so suppliers offer different formats and sizes.']
  }
};
