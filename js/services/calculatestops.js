import { store } from "../store/init.js";
import * as util from "../util.js";

function setWatingMessage(){
  store.dispatch({
    type: "UPDATE_ISWAITING",
    payload: {
      value: 1,
      property: 'calculatestops',
    },
  });
}

function unsetWatingMessage(){
  store.dispatch({
    type: "UPDATE_ISWAITING",
    payload: {
      value: 0,
      property: 'calculatestops',
    },
  });
}

export async function calculatestops() {
  const state = store.getState();
  
  if (util.isObjectEmpty(state.route)) {
    console.log("No route in state");
    return;
  }
  // if (state.stopIntervals.length == 0) {
  //   console.log("No stop interval defined");
  //   return;
  // }
  try {
  if(state.placesSelected.length<2){
    console.log("not enough places to route between");
    return;
  }
    //find userdefinedstops
    let userdefinedstops =[]
    state.placesSelected.slice(1,state.placesSelected.length-1).forEach((stopId, key)=>{
      let stopcoordinate = state.places.get(stopId).position
      userdefinedstops.push({
        latitude: stopcoordinate.lat,
        longitude: stopcoordinate.lon,
        type: ['userdefined'],
        address: state.places.get(stopId).address
      });
    });

    //showLog('Locating Stops..');
    console.log('locating stops')
    setWatingMessage();
    const { data, error } = await axios.post(
      `${window.config.APIDOMAIN}/api/user/locatestoparray`,
      {
        routehash: state.route.routehash,
        routedefaults: state.routedefaults,
        routedefaultmealsearchtags: [...state.routedefaults.mealsearchtags],
        userdefinedstops: userdefinedstops

      }
    );
    // console.log('>>>>>>>>>>>>>>>>>>>>>')
    // console.log(data)
     let stopIntervals = [];
    // convert poisearchtags from array to set
    let stoparray = data.stoparray;
   
    stoparray.map((eachstop)=>{
      if (eachstop.hasOwnProperty('poisearchtags')){
        if (Array.isArray(eachstop.poisearchtags)){
          eachstop.poisearchtags = new Set(eachstop.poisearchtags);
        } 
      }
      if (eachstop.hasOwnProperty('intervalfraction')){
       stopIntervals.push(eachstop.intervalfraction);
      }
    })
   
    store.dispatch({type: 'UPDATE_STOPS',
    payload: {
      value: {
        stops: stoparray,
        stopIntervalsStartEndTimes: data.stopIntervalsStartEndTimes,
        stopIntervals: stopIntervals
      }
    }
  });
unsetWatingMessage();
    return data.stoparray;
  } catch (error) {
    console.error(JSON.stringify(error.stack));
    
    return {};
  }

}
