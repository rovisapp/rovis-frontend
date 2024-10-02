import { store } from "../store/init.js";
import { calculateroute } from "../services/calculateroute.js";
import * as util from "../util.js";

const METERTOMILE = 0.000621371;
const MILETOMETER = 1609.34;



function forChangeInRadius(thisstop, data, changeinradius){
  let results = {};
  results.poisearchbyoffsetarray = thisstop.poisearchbyoffsetarray||[];
  if (changeinradius <=0 ){// If search radius shrunk then clear off existing array
    results.poisearchbyoffsetarray = [];
  }
 //  data was returned in new search
 if (data.length > 0) {
  
  results.poisearchbyoffsetarray.push(data);
  results.poiselected = [0, 0];
}
//  no data was returned in new search AND no POI existed in this stop before
else if (data.length ==0 && results.poisearchbyoffsetarray.length==0){
  results.poiselected = [-1, -1];
  results.poisearchexpandradius = 1;
  results.poisearchbyoffsetarray = [];
}
//  no data was returned in new search AND some POIs existed in this stop before
else if (data.length ==0 && results.poisearchbyoffsetarray.length>0){
  results.poiselected = [0, 0];
  
}

return results;
}



function forNoChangeInRadius(data){
  if (data.length  <=0){
    return {
      poisearchbyoffsetarray : [],
      poiselected : [-1,-1], // No search results found, therefore no POI should be shown/selected on screen.
      poisearchexpandradius :  1, // No search results found, therefore next time we might want to increase search radius
    }
  } else {
    return {
      poisearchbyoffsetarray : [data],
      poiselected : [0,0],
      poisearchexpandradius: 0,
    }  
  }
}


function forLoadMore(thisstop, data){
  if (data.length  <=0){
    return {
      poisearchbyoffsetarray : thisstop.poisearchbyoffsetarray, // just set it back to what it was
      poiselected : thisstop.poiselected, // No new search results found, therefore just set it back to what it was.
      poisearchexpandradius :  1, // No search results found, therefore next time we might want to increase search radius
    }
  } else {
    return {
      poisearchbyoffsetarray : [...thisstop.poisearchbyoffsetarray, data],
      poiselected : [0,0],
      poisearchexpandradius: 0,
    }  
  }
}


function getCountofexistingpoisforthisstop(thisstop){
  if (thisstop.poisearchbyoffsetarray.length==0){
    return 0;
  }
  return thisstop.poisearchbyoffsetarray.reduce((accumulator, currentvalue) => {
    return accumulator + currentvalue.length;
  }, 0);
}

export async function poisearch(stopId, changeinradius=0, loadmore=0) { 
  console.log('poisearch is called')
  // if changeInRadius!=0, then state.stops[stopId] shall contain new poisearchradiusinmiles value by now
  const state = store.getState();
  let thisstop = state.stops[stopId];
  let results = {};
  console.log(
    `Narrowing pois for stop ${stopId} with options ${thisstop.poisearchtags.join(' ') } within ${(thisstop.poisearchradiusinmiles || 5)} miles`
  );
  try{
    let countofexistingpoisforthisstop = getCountofexistingpoisforthisstop(thisstop);
    let poisearchradiusinmiles = Number(thisstop.poisearchradiusinmiles ||5);  //default to 5 miles
    let offsetparam = 0;

    //This call was a result of change in radius
    // if(changeinradius!=0){
    //   offsetparam= changeinradius > 0 ? countofexistingpoisforthisstop+1 : 0
    // }

    //This call was a result of pressing loadmore
    if(loadmore!=0){
      offsetparam = countofexistingpoisforthisstop>0?countofexistingpoisforthisstop+1:0;
      poisearchradiusinmiles = thisstop.poisearchexpandradius ==1 ? poisearchradiusinmiles+5 : poisearchradiusinmiles; // If expansion of radius was set to 1 in the previous search, increment radius by 5 
        
    }

    // find estimated arrival time (local time) at stop and search for only open pois
    let estlocationarrivaltime = 0;
    if(typeof state.stopIntervalsStartEndTimes!=='undefined' && typeof state.stopIntervalsStartEndTimes.stopIntervalsStartEndTimes[stopId].arrive !=='undefined'){
      estlocationarrivaltime = new Date(state.stopIntervalsStartEndTimes.stopIntervalsStartEndTimes[stopId].arrive).getTime()/1000; // Yelp needs ?open_at parameter to be EPOC integer time in secs
    }

    
  
  const { data, error } = await axios.post(
    `http://localhost:3070/api/user/poisearch`,
    {
      latitude: thisstop.latitude,
      longitude: thisstop.longitude,
      type: thisstop.type,
      
      radius: (poisearchradiusinmiles || 5) * MILETOMETER,
      tags: [...thisstop.poisearchtags||new Set()],
      offset: offsetparam,
      open_at: estlocationarrivaltime
    }
  );
   console.log(data)


  if (changeinradius==0 && loadmore==0){
    results = forNoChangeInRadius(data);
  } else if(changeinradius!=0) {
    results = forChangeInRadius(thisstop, data, changeinradius);
  } else if (loadmore!=0){
    results = forLoadMore(thisstop, data);
  }

  results.poisearchradiusinmiles = poisearchradiusinmiles;
  
  store.dispatch({
    type: "UPDATE_POISEARCHRESULTSINSTOP",
    payload: {
      value: results,
      property: stopId,
    },
  });


  await calculateroute(0);


  
}
catch(error){
console.log(`Failed to execute poisearch`);
console.log(error);

}

}