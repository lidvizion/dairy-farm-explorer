// Test-only topic: a fictional library visit. No dairy imports or engine customization.
const image='tests/fixtures/library/assets/library.svg';
const brief=(title)=>({image,alt:'Illustrated bookshelves',caption:'An illustrative library',role:'Library visitor',mission:title,takeaway:'Use the signs to find a shelf.',feedback:['The sign points to that shelf.','Try the shelf named on the sign.']});
const lesson=(id,title)=>({id,title,icon:'📚',intro:'Read the shelf signs.',experience:brief(title),game:{type:'card',prompt:'The blue sign marks the story shelf.',success:'Ready to explore.'}});
const question=(id,from,mode='quiz')=>({id,mode,from,q:'Which shelf does the blue sign mark?',a:['Stories','Maps'],correct:0,fact:'In this example, the blue sign marks stories.',source:{label:'Fixture description',url:'https://example.org/library-fixture'}});
const LOCATIONS=[
 {id:'courtyard',order:1,title:'A PLACE TO READ',stage:'Chapter 1 · Courtyard',intro:'Begin at the library courtyard.',color:0x43647a,
 card:{title:'Library courtyard',image,topic:'Find a place to read.',duration:'Signs and shelves'},badge:{emoji:'📚',name:'Shelf Finder'},
 lessons:[lesson('signs','Reading the signs')],stationPos:[[-6,1]],quizPos:[0,-8],drops:[],
 quiz:[question('shelf','signs'),{...question('extra','signs','fact'),attachedTo:'shelf',fact:'The sign is blue in this imaginary library.'},question('note','signs','fact')],
 completeMsg:'The reading room is ready to visit.',environment:{template:'kit',landscape:'plaza',ground:'#a5ac9c',
 buildings:[{kind:'shelter',size:[6,3,5],position:[-14,0,-5],roof:{color:0x43647a}}],
 props:[{kind:'fence',size:[8,1.4,1],segments:4,position:[12,0,-12]},{kind:'sign',text:'READING GARDEN',position:[-14,4,-5]},{kind:'tree',size:[3,3,3],color:0x6e8653,position:[18,0,0]}]},
 lab:{model:'steps',rule:'sequence',title:'Arrange a reading visit',kicker:'THE READING TABLE',lesson:'signs',intro:'Choose a book, then find a seat.',actions:['Choose a book','Find a seat'],labels:['BOOK','SEAT'],notes:['Book selected.','Seat found.'],retry:'Choose a book first.',finish:'Ready to read.'}},
 {id:'reading-room',order:2,title:'EXPLORE THE SHELVES',stage:'Chapter 2 · Reading room',intro:'Look around the reading room.',color:0x43647a,
 card:{title:'Reading room',image,topic:'Follow the shelf signs.',duration:'Explore and choose'},badge:{emoji:'📚',name:'Reading Explorer'},
 lessons:[lesson('browse','Browse the shelves'),lesson('choose','Choose a book')],stationPos:[[-6,1],[6,1]],quizPos:[0,-8],drops:[[0,4]],
 quiz:[question('shelf','browse')],completeMsg:'The library visit is complete.',environment:{template:'kit',landscape:'plaza',
 buildings:[{kind:'building',size:[10,5,6],color:0xdbe7eb,position:[0,0,-16],roof:{color:0x43647a}}],props:[{kind:'box',size:[2,.8,1],position:[12,0,0],color:0xf4ddaa}]}}
];
export default {id:'library-fixture',storageKey:'library_fixture_v1',leaderboardKey:'library_fixture_board_v1',LOCATIONS,learning:{},
 BRAND_ASSETS:{logo:image,seal:image},EXTERNAL_LINKS:{},SCORING:{lesson:5,quizFirst:10,quizLater:4,collectible:1,location:20},
 COPY:{title:'THE LIBRARY VISIT',intro:{line1:'A place for stories.',line2:'Explore a library.'},map:{header:'Two stops at the library',status:'Find the shelves.',disclaimer:'An imaginary library.'}},
 shell:{'#title .eyebrow':'A LIBRARY VISIT','#title h1':'Find your next story.','#title .subtitle':'Explore two places at an imaginary library.','#completeTitle':'LIBRARY VISIT COMPLETE','#completeTitle + p':'Library Explorer Certificate','#completeSeal + p':'The library shelves are ready to explore.'},
 logoAlt:'Library shelves',sealAlt:'Library explorer',film:{src:'',poster:image,label:'Library visit introduction',status:'A place for stories'},
 help:'Explore the library.',helpGoal:'Complete the lessons and field checks at both library stops.',mapReturn:'the library map',dropLabel:'Discovery token!',dropHelp:'Optional tokens are never required.',
 fallbackTitle:'The library visit',completed:'The library visit is complete.',resume:'CONTINUE THE LIBRARY VISIT',ctas:{},
 mapHeading:'<p class="eyebrow">THE LIBRARY GUIDE</p><h1>Two places to explore.</h1><p>Find a shelf and choose a book.</p>',mapCredit:''};
