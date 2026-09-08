export const GAME_STATES = {
  LOADING:'loading', EARTH_INTRO:'earthIntro', MAP:'californiaMap',
  FARM:'farmScene', PROCESSOR:'processorScene', MARKET:'marketScene',
  COMPLETION:'completion', FALLBACK:'fallback'
};

// CLIENT: drop approved files at these paths (same names) to replace placeholders.
export const BRAND_ASSETS = {
  logo: 'assets/real-california-milk-logo-official.webp',
  seal: 'assets/real-california-milk-logo-official.webp'
};

// CLIENT: confirm/approve destination URLs.
export const EXTERNAL_LINKS = {
  products:    'https://www.realcaliforniamilk.com/',
  foodservice: 'https://realcaliforniamilkfoodservice.com/'
};

export const SCORING = { lesson:25, quizFirst:50, quizLater:20, collectible:10, location:100 };

/* ============================================================================
   2. CONTENT  — ALL PLAYER-FACING TEXT LIVES HERE
   Non-developers can revise copy in this block. Structured so a Spanish
   (or other) localization can be added later without touching scene logic:
   swap this object for a language-keyed lookup and set the active language.
   CLIENT: confirm final educational copy. Statistics, rankings, environmental
   goals, and nutrition/health claims are intentionally omitted pending
   client-approved sources.
============================================================================ */
export const COPY = {
  title:'REAL CALIFORNIA MILK: THE FARM-TO-FLAVOR JOURNEY',
  intro:{
    line1:'Every Real California dairy product begins a journey.',
    line2:'Follow the milk from California cows to processors, packages, grocery stores, and restaurant kitchens.'
  },
  map:{
    header:'Three Stops. One Real California Dairy Story.',
    status:'Visit each destination to follow dairy from farm to flavor.',
    disclaimer:'This interactive journey represents the California dairy supply chain. Locations and facilities are illustrative.'
  }
};

export const BADGES = {
  farm:      { id:'farm',      emoji:'🐄', name:'Cow Care Champion' },
  processor: { id:'processor', emoji:'🏭', name:'Processing Pro' },
  market:    { id:'market',    emoji:'🛒', name:'California Dairy Connector' }
};

/* Each location: 3 lessons + a 3-question quiz. Lesson "game" objects drive the
   shared DOM mini-game renderers (section 5). Stage labels use accurate
   supply-chain terminology. */
export const LOCATIONS = [
  {
    id:'farm',
    order:1,
    stage:'Stage 1 · Dairy Farms / Producers',
    title:'WHERE MILK BEGINS',
    region:'Central Valley (e.g., Tulare County)',
    intro:'Meet the cows, people, technology, and daily care behind California dairy.',
    // normalized map position (0..1: x east, y north)
    map:[0.48,0.40],
    color:0x2a9c53,
    badge:BADGES.farm,
    stationPos:[[-6,1],[2,-5],[12,-7]],
    quizPos:[0,-16],
    lessons:[
      {
        id:'cowcare', title:'Cow Care', icon:'🐄',
        intro:'Cows need good feed, clean water, comfortable resting areas, and daily care. Farmers watch cow comfort and health closely. California farms differ by region and climate, so cooling and comfort tools vary from farm to farm.',
        game:{
          type:'multiselect',
          prompt:'Cow Comfort Check: pick the THREE things a cow needs to stay comfortable.',
          need:3,
          options:[
            {t:'Clean water',ic:'💧',ok:true},
            {t:'A comfortable place to rest',ic:'🛏️',ok:true},
            {t:'Cooling or shade',ic:'⛱️',ok:true},
            {t:'Block airflow through the barn',ic:'🚪',ok:false},
            {t:'Skip water checks on cooler days',ic:'💧',ok:false},
            {t:'Leave wet bedding until tomorrow',ic:'🛏️',ok:false}
          ],
          success:'Great check! Water, rest, and cooling all help keep cows comfortable.'
        }
      },
      {
        id:'milking', title:'Milking & Cooling', icon:'🥛',
        intro:'Milk moves from the cow through clean, sanitary milking equipment. It is cooled quickly and stored in a refrigerated tank. A refrigerated tanker then carries it to a processor. Keeping milk cold matters at every step.',
        game:{
          type:'sequence',
          prompt:'Put the milk’s path in order, then start cooling.',
          steps:[
            {t:'Cow is milked with sanitary equipment',ic:'🐄'},
            {t:'Milk flows through clean pipes',ic:'➡️'},
            {t:'Milk is chilled in the refrigerated bulk tank',ic:'🧊'},
            {t:'A refrigerated tanker carries it to the processor',ic:'🚛'}
          ],
          cool:{from:'warm',to:'cold',label:'Cooling system'},
          success:'Nice work — milk stays cold from the farm all the way to the processor.'
        }
      },
      {
        id:'resource', title:'Farm Resource Cycle', icon:'♻️',
        intro:'Many California dairy farms use technology to work efficiently. Water may be reused for more than one job. Manure can become nutrients for crops, bedding, compost, or renewable energy. Sustainability practices vary by farm — not every farm uses every tool.',
        game:{
          type:'match',
          prompt:'Route each farm resource to a place it can go.',
          left:[
            {id:'water',t:'Reused water',ic:'💧'},
            {id:'manure',t:'Manure nutrients',ic:'🌱'},
            {id:'gas',t:'Captured gas',ic:'🔥'},
            {id:'solar',t:'Solar energy',ic:'☀️'}
          ],
          right:[
            {id:'water',t:'Crop irrigation'},
            {id:'manure',t:'Fields or compost'},
            {id:'gas',t:'Renewable energy'},
            {id:'solar',t:'Farm operations'}
          ],
          success:'Good routing! Farms can turn resources into more resources.'
        }
      }
    ],
    quiz:[
      { q:"Your herd needs relief on a warm afternoon. What belongs in the comfort plan?",
        a:['A television','Cooling or shade','Loud music'], correct:1, from:'cowcare',
        source:{label:'University of Minnesota Extension — Why Cow Comfort Matters', url:'https://extension.umn.edu/agriculture/animals-and-livestock/dairy/why-cow-comfort-matters'} },
      { q:"Milk has reached the bulk tank. Why turn on cooling right away?",
        a:['To keep it fresh and safe by slowing bacterial growth','To make it taste sweeter','Cows prefer their milk served cold'], correct:0, from:'milking',
        source:{label:'Virginia Cooperative Extension — Is Your Milk Cold Enough?', url:'https://sites.ext.vt.edu/newsletter-archive/dairy/2004-06/coldmilk.html'} },
      { q:"A farm has an anaerobic digester. What useful output can it capture from manure?",
        a:['Nothing — it always has to be thrown away','Capture the gas it produces to make renewable energy','Turn it directly back into milk'], correct:1, from:'resource',
        source:{label:'CDFA — Dairy Digester Research & Development Program', url:'https://www.cdfa.ca.gov/oars/ddrdp/'} }
    ],
    funFacts:[
      { from:'milking', text:'Myth or fact: All plant-based milks have less protein than dairy milk? Myth — soy milk has about as much protein as dairy milk; almond and rice milk have much less.',
        source:{label:'FDA — Milk and Plant-Based Milk Alternatives: Know the Nutrient Difference', url:'https://www.fda.gov/consumers/consumer-updates/milk-and-plant-based-milk-alternatives-know-nutrient-difference'} },
      { from:'resource', text:'Plant-based milks like almond, oat, and soy are usually fortified with calcium and vitamin D because they don’t naturally contain as much of those nutrients as real dairy milk.',
        source:{label:'FDA — Milk and Plant-Based Milk Alternatives: Know the Nutrient Difference', url:'https://www.fda.gov/consumers/consumer-updates/milk-and-plant-based-milk-alternatives-know-nutrient-difference'} }
    ],
    completeMsg:'The cooled milk is loaded into a refrigerated tanker, headed for a California processor.'
  },
  {
    id:'processor',
    order:2,
    stage:'Stage 2 · Processors / Dairy Product Manufacturers',
    title:'WHERE MILK BECOMES DAIRY PRODUCTS',
    region:'Central Valley',
    intro:'At California processing facilities, milk is checked, transformed, packaged, and prepared for customers.',
    map:[0.42,0.52],
    color:0x4aa3d8,
    badge:BADGES.processor,
    stationPos:[[-8,6],[0,4],[8,6]],
    quizPos:[17,0],
    lessons:[
      {
        id:'receiving', title:'Receiving & Quality', icon:'🔬',
        intro:'Milk arrives cold in a refrigerated tanker. Processors check incoming milk before it is used. Cleanliness, quality, and temperature control matter throughout the process.',
        game:{
          type:'multiselect',
          prompt:'Before you approve the shipment, choose the checks a processor would make.',
          need:3,
          options:[
            {t:'Is the milk still cold?',ic:'🌡️',ok:true},
            {t:'Is the tanker clean?',ic:'🧼',ok:true},
            {t:'Does the milk pass a quality check?',ic:'✅',ok:true},
            {t:'Approve it just because it arrived on time',ic:'🕒',ok:false},
            {t:'Skip checks for a familiar supplier',ic:'🤝',ok:false},
            {t:'Judge the milk by the truck’s paintwork',ic:'🚛',ok:false}
          ],
          success:'Approved! Cold, clean, and quality-checked milk is ready for the next step.'
        }
      },
      {
        id:'products', title:'Many Products, One Start', icon:'🧀',
        intro:'California milk is the starting point for many dairy products. Different products follow different paths — they do not all go through the same process. Pick a product to see a simple, high-level path.',
        game:{
          type:'branch',
          prompt:'Choose a product to see how it can be made (simplified).',
          products:[
            {name:'Fluid milk',ic:'🥛',steps:['Receive & check milk','Standardize','Pasteurize','Package & chill']},
            {name:'Cheese',ic:'🧀',steps:['Receive & check milk','Add cultures','Form curds & press','Age or package']},
            {name:'Butter',ic:'🧈',steps:['Separate cream','Churn cream','Work & shape','Package & chill']},
            {name:'Yogurt',ic:'🥣',steps:['Receive & check milk','Heat-treat milk','Cool & add cultures','Culture, then chill & package']},
            {name:'Ice cream',ic:'🍦',steps:['Blend mix','Pasteurize','Freeze & whip in air','Package & freeze']},
            {name:'Sour cream',ic:'🥛',steps:['Prepare & pasteurize cream','Cool & add cultures','Culture (ferment)','Package & chill']}
          ],
          success:'You explored a product path! Milk can become many different dairy foods.'
        }
      },
      {
        id:'cheese', title:'Cheese Shredding & Packaging', icon:'📦',
        intro:'On a safe, simplified cheese line, a finished cheese block is portioned. Some cheese stays in blocks or slices. Some goes through a shredder, then it is weighed and packaged. Packages are made in two channels: consumer packages for grocery, and larger foodservice packages for restaurants and other commercial buyers.',
        game:{
          type:'match',
          prompt:'Match each package format to the customer who usually buys it.',
          left:[
            {id:'grocery',t:'Small shredded-cheese bag',ic:'🧀'},
            {id:'food',t:'Large shredded-cheese case',ic:'📦'},
            {id:'grocery',t:'Milk carton or jug',ic:'🥛'},
            {id:'food',t:'Bulk dairy case',ic:'🗃️'}
          ],
          right:[
            {id:'grocery',t:'Grocery (household use)'},
            {id:'food',t:'Restaurant / foodservice / distributor'}
          ],
          multiTarget:true,
          success:'Packed and sorted! Consumer packages head to grocery; foodservice formats head to commercial kitchens.'
        }
      }
    ],
    quiz:[
      { q:"The delivery is on time. Which checks still matter before accepting its milk?",
        a:['Milk temperature, cleanliness, and quality checks','Only whether the truck arrived on time','Only whether it is the usual supplier'], correct:0, from:'receiving',
        source:{label:'FDA — Grade "A" Pasteurized Milk Ordinance (PMO) Centennial', url:'https://www.fda.gov/food/milk-guidance-documents-regulatory-information/pasteurized-milk-ordinance-centennial'} },
      { q:"You’ve switched the line from butter to cheese. Which process belongs to cheese?",
        a:['Adding cultures, then forming and pressing curds','Churning cream until it separates into butter and buttermilk','Freezing and whipping in air'], correct:0, from:'products',
        source:{label:'University of Guelph — Dairy Science and Technology', url:'https://books.lib.uoguelph.ca/dairyscienceandtechnologyebook/'} },
      { q:"A pizzeria orders a large case of shredded mozzarella. Which delivery channel fits?",
        a:['Foodservice / distributor','Grocery (household use)','Neither — restaurants can’t buy dairy in bulk'], correct:0, from:'cheese',
        source:{label:'USDA Agricultural Marketing Service — Dairy Market News', url:'https://www.ams.usda.gov/market-news/dairy'} }
    ],
    funFacts:[
      { from:'receiving', text:'True or False: Real dairy milk is a complete protein, naturally containing all 9 essential amino acids? True — and soy milk is one of the few plant milks that is also a complete protein.',
        source:{label:'American Academy of Family Physicians — Soy: A Complete Source of Protein', url:'https://www.aafp.org/pubs/afp/issues/2009/0101/p43.html'} },
      { from:'products', text:'Myth or fact: Hormones used on some dairy farms make milk unsafe? Myth — the FDA has found milk from treated cows safe, and hormone proteins are broken down during digestion like other proteins.',
        source:{label:'U.S. FDA — Bovine Somatotropin (bST)', url:'https://www.fda.gov/animal-veterinary/product-safety-information/bovine-somatotropin-bst'} },
      { from:'cheese', text:'Dairy milk actually uses more freshwater to produce than almond milk — about 628 liters vs. 371 liters per liter of milk.',
        source:{label:'Our World in Data — Environmental Impact of Milks (Poore & Nemecek, 2018, Science)', url:'https://ourworldindata.org/environmental-impact-milks'} }
    ],
    completeMsg:'Packaged products are loaded into a refrigerated delivery truck, headed for market.'
  },
  {
    id:'market',
    order:3,
    stage:'Stage 3 · Grocery, Restaurant, Foodservice & Other Buyers',
    title:'WHERE CALIFORNIA DAIRY MEETS ITS CUSTOMERS',
    region:'Southern California market',
    intro:'See how dairy products reach shoppers, chefs, restaurants, and other foodservice buyers.',
    map:[0.52,0.24],
    color:0xf5b21e,
    badge:BADGES.market,
    // Override the generic 3-beacon arc: the default positions sit inside the
    // grocery/kitchen storefront collision zones here, which blocks players
    // from ever getting close enough to trigger "press E" or the mobile
    // Interact button (only a direct tap on the beacon icon would work).
    // These sit in the open plaza, near their matching storefront.
    stationPos:[[-8,4],[0,-7],[8,4]],
    quizPos:[-1,-18],
    lessons:[
      {
        id:'grocery', title:'Grocery Journey', icon:'🛒',
        intro:'Dairy products move through refrigerated distribution and storage. Shoppers find them in the refrigerated dairy section. The Real California Milk seal helps shoppers spot qualifying California dairy products.',
        game:{
          type:'match',
          prompt:'Stock the store: send each item to where it belongs.',
          left:[
            {id:'dairy',t:'Milk jug',ic:'🥛'},
            {id:'dairy',t:'Yogurt cups',ic:'🥣'},
            {id:'dairy',t:'Butter',ic:'🧈'},
            {id:'dry',t:'Boxed crackers',ic:'🧃'}
          ],
          right:[
            {id:'dairy',t:'Refrigerated dairy case'},
            {id:'dry',t:'Dry-goods shelf'}
          ],
          multiTarget:true,
          success:'Stocked! These perishable dairy items go in the refrigerated case; the crackers go on the dry-goods shelf.'
        }
      },
      {
        id:'seal', title:'Look for the Seal', icon:'🔎',
        intro:'Look in the dairy section. Find the Real California Milk seal. Choosing products with the seal means choosing dairy made with Real California milk.',
        game:{
          type:'seal',
          prompt:'Seal Spotter: choose ONLY the packages that show the Real California Milk seal.',
          packages:[
            {name:'Milk',ic:'🥛',seal:true},
            {name:'Butter',ic:'🧈',seal:false},
            {name:'Yogurt',ic:'🥣',seal:true},
            {name:'Ice Cream',ic:'🍦',seal:false},
            {name:'Sour Cream',ic:'🥛',seal:true},
            {name:'Cheese',ic:'🧀',seal:false}
          ],
          success:'Sharp eyes! The seal helps you choose dairy made with Real California milk.'
        }
      },
      {
        id:'foodservice', title:'Restaurant & Foodservice Buyers', icon:'👩‍🍳',
        intro:'Restaurants and foodservice operators often buy dairy in larger formats. Chefs may use California dairy in pizzas, sauces, baked goods, beverages, and desserts. Distributors and purchasing teams move products from processors to commercial kitchens. Package size depends on how the product will be used.',
        game:{
          type:'match',
          prompt:'Complete the restaurant delivery — send each item to the right station.',
          left:[
            {id:'pizza',t:'Foodservice shredded mozzarella',ic:'🧀'},
            {id:'bake',t:'Butter',ic:'🧈'},
            {id:'bev',t:'Milk or cream',ic:'🥛'},
            {id:'shelf',t:'Small consumer package',ic:'🛍️'}
          ],
          right:[
            {id:'pizza',t:'Pizza prep'},
            {id:'bake',t:'Cooking / baking station'},
            {id:'bev',t:'Beverage / sauce / dessert station'},
            {id:'shelf',t:'Household grocery order'}
          ],
          success:'Delivered! Package size and format depend on how the dairy will be used.'
        }
      }
    ],
    quiz:[
      { q:"Milk, yogurt, and butter have arrived at the store. Where should this delivery go?",
        a:['The refrigerated dairy case','The dry-goods aisle','Next to the checkout register'], correct:0, from:'grocery',
        source:{label:'FDA — Food Code (cold-holding requirements for perishable foods)', url:'https://www.fda.gov/media/181882/download'} },
      { q:"You spot this seal on a dairy package. What does it tell you?",
        a:['The product is made with milk from California dairy farms','The product is organic','The product is on sale this week'], correct:0, from:'seal',
        source:{label:'Real California Milk — About Us', url:'https://www.realcaliforniamilk.com/about-us'} },
      { q:"Dinner service needs much more dairy than one family meal. Why order a larger format?",
        a:['Foodservice kitchens use larger quantities and different formats than a household','Restaurants aren’t allowed to buy the same dairy products','There’s no real difference — every buyer gets the same package'], correct:0, from:'foodservice',
        source:{label:'USDA Agricultural Marketing Service — Dairy Market News', url:'https://www.ams.usda.gov/market-news/dairy'} }
    ],
    funFacts:[
      { from:'grocery', text:'Myth or fact: Lactose-free real dairy milk is made by adding chemicals? Myth — an enzyme called lactase simply breaks lactose down into two simpler, more digestible sugars.',
        source:{label:'McGill University Office for Science and Society — How Do We Modify Dairy to Be Lactose-Free?', url:'https://www.mcgill.ca/oss/article/nutrition-you-asked/how-do-we-modify-dairy-be-lactose-free'} },
      { from:'seal', text:'Dairy milk naturally contains calcium; most plant-based milks need calcium added (fortified) to match it.',
        source:{label:'FDA — Milk and Plant-Based Milk Alternatives: Know the Nutrient Difference', url:'https://www.fda.gov/consumers/consumer-updates/milk-and-plant-based-milk-alternatives-know-nutrient-difference'} },
      { from:'foodservice', text:'Myth or fact: A glass of dairy milk has about the same carbon footprint as a glass of almond milk? Myth — research shows dairy milk has a notably higher carbon footprint per liter than almond milk.',
        source:{label:'Our World in Data — Environmental Impact of Milks (Poore & Nemecek, 2018, Science)', url:'https://ourworldindata.org/environmental-impact-milks'} }
    ],
    completeMsg:'You’ve followed California dairy all the way from farm to flavor!'
  }
];
export const LOC_BY_ID = Object.fromEntries(LOCATIONS.map(l=>[l.id,l]));
