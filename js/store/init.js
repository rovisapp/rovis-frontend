import { createStore } from './store.js';
import { reducerFunction } from './reducer.js';
import * as util from '../util.js';

const initialState  = {
  places: new Map(),
  placesSelected : new Map(),
  from_active: false,
  to_active: false,
  mandatorystop_active: false,
  from: "",
  to: "",
  mustStopAtIntervalsOfHrs: 3,
  stopIntervalDurationInHrs: 1.5,
  ttmap: {},
  route: {},
  routeWithStopDetours: {},
  // stopIntervals: [0.1, 0.3, 0.8], // [0.1,0.4,0.5,...1] array of fractions between 0 and 1
  stopIntervalsStartEndTimes :{}, //[{start:2024-01-15T13:28:21-05:00, end: 2024-01-15T13:28:21-05:00}, {start:, end:}, .....]
  routecenter: {}, // {latitude, longitude}
  mandatorystops: new Map(),
  stops: [], //[{latitude, longitude}, {latitude, longitude},....]
  stopSelected : "-1",
  markers: [],
  routedefaults: {
    startenddatechoice : 'Start at',
    tripstartenddate: util.tomorrowsdate(),//tomorrow's date
    tripstartendtime: '09:00:00', // default start tomorrow 9AM 
    localtimeatsourceordeststatictext : 'Enter local time at starting location',
    hrstodrivewithoutstopping: 2,
    hrstodriveperday: 5,
    mealintervalinhrs: 3,
    startinghungrypercent: 5,
    takefirstmealatmin: 30,
    mealbreaktimeinminutes: 90,
    userbreaktimeinminutes: 30,
    enablemealstops: true,
    enablefuelstops: true,
    startingfuelpercent: 98,
    mileageinmpg: 23,
    gastanksizeingal: 12,
    refuelbelowpercentage: 20,
    restbreaktimeinminutes: 20,
    fuelbreaktimeinminutes: 20,
    mealsearchtags : new Set()
  },
  iswaitingfor: {
    calculateroute : 0,
    calculatestops: 0,
  },
  regularcategories:{},
  restaurantcategories: {},
};

const config = {
  APIDOMAIN: window.location.host=='localhost'?`http://${window.location.host}:3070`: `${window.location.protocol}//${window.location.host}`,
  ISPROD: window.location.host=='localhost'?0:1,
  
};

window.config = config;

//init google maps
  const response = await fetch(`${window.config.APIDOMAIN}/api/user/getgsearchparam`);
  const data = await response.json();
  
  (g=>{var h,a,k,p="The Google Maps JavaScript API",c="google",l="importLibrary",q="__ib__",m=document,b=window;b=b[c]||(b[c]={});var d=b.maps||(b.maps={}),r=new Set,e=new URLSearchParams,u=()=>h||(h=new Promise(async(f,n)=>{await (a=m.createElement("script"));e.set("libraries",[...r]+"");for(k in g)e.set(k.replace(/[A-Z]/g,t=>"_"+t[0].toLowerCase()),g[k]);e.set("callback",c+".maps."+q);a.src=`https://maps.${c}apis.com/maps/api/js?`+e;d[q]=f;a.onerror=()=>h=n(Error(p+" could not load."));a.nonce=m.querySelector("script[nonce]")?.nonce||"";m.head.append(a)}));d[l]?console.warn(p+" only loads once. Ignoring:",g):d[l]=(f,...n)=>r.add(f)&&u().then(()=>d[l](f,...n))})({
    key: data.searchparam,
    v: "weekly",
  });


export const store = createStore(reducerFunction, initialState);
