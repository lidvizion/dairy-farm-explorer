// Curated combinations only; no service, personal data or profanity lottery.
const prefixes = ['Anonymous','Disco','Cosmic','Sneaky','Groovy','Udderly','Mighty','Mellow','Golden','Moo-nlit','Lucky','Velvet','Dapper','Dancing','Captain','Turbo'];
const herd = ['Holstein','Jersey','Cowbell','Milkshake','Moo','Hoof','Buttercup','Milkbeard'];
export function generateCowName(taken = [], random = Math.random) {
  const used = new Set(taken.map(name => name.toLocaleLowerCase('en-US')));
  const total = prefixes.length * herd.length;
  const start = Math.floor(random() * total) % total;
  for(let offset=0;offset<total;offset++) {
    const index=(start+offset)%total;
    const name=`${prefixes[Math.floor(index/herd.length)]} ${herd[index%herd.length]}`;
    if(!used.has(name.toLocaleLowerCase('en-US')))return name;
  }
  let suffix=2;
  while(used.has(`mystery moo ${suffix}`))suffix++;
  return `Mystery Moo ${suffix}`;
}
