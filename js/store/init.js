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
  APIDOMAIN: `http://${window.location.host}:3070` 
};

window.config = config;

export const store = createStore(reducerFunction, initialState);
