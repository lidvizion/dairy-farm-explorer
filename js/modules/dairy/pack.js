import { BRAND_ASSETS, EXTERNAL_LINKS, SCORING, COPY, LOCATIONS } from './content.js';
import { LEARNING_EXPERIENCES } from './learning.js';
import { WORLD_LABS } from './labs.js';
const DESTINATIONS = {
  farm: { title: 'The dairy farm', image: 'assets/environments/dairy-farm-morning.jpg', topic: 'Meet the cows. Follow the milk.', duration: 'Animal care · Cooling · Farm resources' },
  processor: { title: 'Processing & packaging', image: 'assets/environments/processing-facility.jpg', topic: 'Discover what milk becomes.', duration: 'Quality checks · Dairy products · Packaging' },
  market: { title: 'The market & kitchen', image: 'assets/environments/market-kitchen.jpg', topic: 'Bring California dairy to the table.', duration: 'The seal · Cold storage · Farm to flavor' }
};

const shell = {"#title .eyebrow": "A REAL CALIFORNIA MILK EXPERIENCE", "#title h1": "Every drop<br>has a story.", "#title .subtitle": "Meet the cows, people, and places behind California dairy.<br>Your farm-to-flavor journey starts here.", "#completeTitle": "YOU COMPLETED THE REAL CALIFORNIA DAIRY JOURNEY", "#completeTitle + p": "Official California Dairy Explorer Certificate", "#completeSeal + p": "You followed California dairy from cows and farm care to processing, packaging, grocery shelves, and restaurant kitchens.\n        <b>Now you know what to look for: the Real California Milk seal.</b>"};
const environments = [
 { template:'farmyard', labels:{"label0": "Ventilated Barn", "label1": "Milk House", "label2": "Refrigerated Tanker", "label3": "Solar", "label4": "Renewable Energy"}, buildings:[{kind:'shelter',size:[12,4.4,8],postsX:[-6,-2,2,6],postsZ:[-4,4],postColor:0xcfd3d6,roof:{size:[15,.3,10],position:[0,4.5,0],color:0xe2e6e9,tilt:.04}}], ground:'#929575', flecks:['#8c8b6a','#98977a','#a5a183'], pathColor:0xc6b590, fence:true, landscape:'fields', gate:'CALIFORNIA DAIRY · VISITOR TRAIL', contacts:[[-14,-2,8,5],[17,-3,4,3],[16,4,2,4],[-22,-8,2.2,2.2],...Array.from({length:4},(_,i)=>[-13+i*2.8,-10-(i%2)*2,1.6,.8])] },
 { template:'facility', labels:{"label0": "PROCESSING & PACKAGING", "label1": "Receiving Bay", "label2": "Consumer + Foodservice", "label3": "Cold Storage", "label4": "Shipping Dock"}, buildings:[{kind:'building',size:[24,7,16],color:0xeef1f4,position:[0,0,-6],roof:{size:[24.4,.4,16.4],position:[0,7.1,0],color:0xcfd6dc}}], landscape:'plaza', contacts:[[0,-6,13,9],[-16,6,2.4,4],[12,8,4,3]] },
 { template:'storefronts', labels:{"label0": "Grocery Dairy Aisle", "label1": "MARKET", "label2": "Commercial Kitchen", "label3": "KITCHEN", "label4": "Restaurant Receiving", "label5": "Refrigerated Storage"}, buildings:[{kind:'building',size:[12,6,10],color:0xf3efe3,position:[-12,0,-6]},{kind:'building',size:[12,6,10],color:0xe7ede9,position:[12,0,-6]}], landscape:'plaza', flowerColor:0xd8a261, contacts:[[-12,-6,7,6],[12,-6,7,6],[-2,3,1.4,1.2]] }
];
LOCATIONS.forEach((loc,i)=>{ loc.card=DESTINATIONS[loc.id]; loc.environment=environments[i]; loc.lab=WORLD_LABS[loc.id]; loc.audio=['birds','hum','chimes'][i];
 loc.spawn={x:0,z:[28,32,36][i],yaw:0};
 loc.drops=[[[-10,7],[12,2],[0,4]],[[-12,10],[14,2],[0,4]],[[-12,5],[16,5],[0,4]]][i];
});
LOCATIONS[1].lessons.find(l=>l.game.type==='branch').game.comparison='Compare the paths: cheese forms curds, butter uses churning, and ice cream is frozen with air. These are simplified overviews, not production instructions.';
LOCATIONS[2].lessons.find(l=>l.game.type==='seal').game.plainLabel='DAIRY<br>PRODUCT';
Object.assign(LOCATIONS[0].lessons[1].game,{routeLabel:'Your milk route'});
Object.assign(LOCATIONS[0].lessons[1].game.cool,{"html": "<div class=\"tank-illustration\" aria-hidden=\"true\"><span class=\"tank-fill\"></span></div><div class=\"cooling-copy\"><strong>Bulk tank cooling</strong><span id=\"coolTemp\">Waiting for a complete route</span><div class=\"cooling-track\"><div id=\"coolBar\"></div></div><small>Simplified demonstration—not a temperature or timing guide.</small></div>", "start": "Start cooling ❄️", "running": "Cooling in progress…", "connected": "Route connected. Cooling the bulk tank before the tanker leaves…", "finished": "Chilled · Ready for refrigerated transport"});
// Worked example stays scored; switching only mode to 'fact' displays this as an unscored card.
// See the first farm quiz item in content.js: mode is the only switch.
export default { id:'dairy', storageKey:'rcm_journey_v1', leaderboardKey:'rcm_leaderboard_v1',
 BRAND_ASSETS, EXTERNAL_LINKS, SCORING, COPY, LOCATIONS, learning:LEARNING_EXPERIENCES,
 shell, logoAlt:'Real California Milk', sealAlt:'Real California Milk seal',
 film:{src:'assets/california-intro.mp4',poster:'assets/environments/california-route.jpg',label:'Opening film: Earth to California',status:'A journey from farm to flavor'},
 help:'Follow California dairy from farm to flavor.',
 helpGoal:'Visit 3 California destinations. At each one, finish 3 short lessons and a quiz to earn a badge. You do not need to collect anything extra to finish.',
 mapReturn:'California', dropLabel:'💧 Golden milk drop!', dropHelp:'Optional golden milk drops are worth a few extra points, but they are never required.',
 fallbackTitle:'The Farm-to-Flavor Journey', completed:'You followed California dairy from farm to flavor.', resume:'CONTINUE THE CALIFORNIA JOURNEY',
 fallbackCtas:{products:'Find Products ↗',foodservice:'Foodservice ↗'},
 ctas:{products:'Find Real California Milk Products ↗',foodservice:'Explore Foodservice Resources ↗'},
mapHeading:"<p class=\"eyebrow\">THE CALIFORNIA FIELD GUIDE</p><h1>One ingredient.<br>Three extraordinary stops.</h1><p>Explore the places, people, and decisions behind dairy.<br>Three lessons and one badge at every stop.</p>", mapCredit:'Map imagery: Google Earth · Landsat / Copernicus · Data SIO, NOAA' };
