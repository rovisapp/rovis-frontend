import { store } from "../store/init.js";
import * as util from "../util.js";



// Returns  startlocation + userdefined stops + calculated stops + endlocation
function getCommaSeparatedRouteCoordinates(){
  let csroutecoordinates = [];
  const state = store.getState();
   
  // Fetch Starting location:
  let start = state.places.get(state.from);
  csroutecoordinates.push(start.position.lat + "," + start.position.lon);


  //Fetch all inbetween userdefined stops
  let userdefinedstops = state.placesSelected.slice(1, -1);
  
  if (userdefinedstops.length>0){
    userdefinedstops.map((placeId) => {
      let place = state.places.get(placeId);
      csroutecoordinates.push(place.position.lat + "," + place.position.lon);
    });
  }

//Fetch all non-userdefined stops
  state.stops.map((stop)=>{
    if(!stop.type.includes('userdefined')) {
      if(stop.poiselected[0]>-1 && stop.poiselected[1]>-1){
        let poilat = stop.poisearchbyoffsetarray[stop.poiselected[0]][stop.poiselected[1]].coordinates.latitude;
        let poilong = stop.poisearchbyoffsetarray[stop.poiselected[0]][stop.poiselected[1]].coordinates.longitude;

        let coordinateString = poilat + "," + poilong;
        if (csroutecoordinates.indexOf(coordinateString)==-1){
          csroutecoordinates.push(coordinateString);
        }
      } 
    }
  });


 // Fetch destination
  let end = state.places.get(state.to);
  csroutecoordinates.push(end.position.lat + "," + end.position.lon);
  
  return csroutecoordinates;
}







// Returns userdefined stops + calculated stops . This excludes start and end locations
function getWaypoints(){
  const state = store.getState();
  let detours = [];
  state.stops.map((stop) => {
    if (stop.poiselected[0] >= 0 && stop.poiselected[1] >= 0) {
      let poicoordinates =
        stop.poisearchbyoffsetarray[stop.poiselected[0]][stop.poiselected[1]]
          .coordinates;
      // console.log(poicoordinates)
      detours.push({
        type: stop.type,
        slat: poicoordinates.latitude,
        slong: poicoordinates.longitude,
      });
    } else {
      // must keep this for stops with no pois in search radius
      detours.push({
        type: stop.type,
        slat: stop.latitude,
        slong: stop.longitude,
      });
    }
  });
  return detours;
}


export async function calculateroute(USERENTEREDSTOPSONLY=1) {
  const state = store.getState();
  let commaseparatedroutecoordinates = [];
  let waypoints = []
  
  if(state.stops.length===0){
    USERENTEREDSTOPSONLY = 1; // When there is no automatically found stops, falls back into USERENTEREDSTOPSONLY mode
  }

  if (USERENTEREDSTOPSONLY===1){
    //Fetch ONLY userdefined stops
  state.stops.map((stop)=>{
    if(stop.type.includes('userdefined')) {
      waypoints.push({
        type: stop.type,
        slat: stop.latitude,
        slong: stop.longitude,
      });
    }
  });
  } else {
    waypoints = getWaypoints();
  }

  let start = state.places.get(state.from);
  commaseparatedroutecoordinates.push(start.position.lat + "," + start.position.lon);
  let end = state.places.get(state.to);
  commaseparatedroutecoordinates.push(end.position.lat + "," + end.position.lon);
  
  
// console.log(commaseparatedroutecoordinates)
if (commaseparatedroutecoordinates.length<=1){
  return;
}
  console.log('calculating route')
  
  let routecoordinates = commaseparatedroutecoordinates.join(":");
  let url = `http://localhost:3070/api/user/routing?routecoordinates=${routecoordinates}`;
  //Datetime must be in the form of 1996-12-19T16:39:57
  
  if (state.routedefaults.startenddatechoice == "Start at") {
    url += `&departAt=${util.concatdatetimewithT(
      state.routedefaults.tripstartenddate,
      state.routedefaults.tripstartendtime
    )}`;
  } else if (state.routedefaults.startenddatechoice == "End by") {
    url += `&arriveAt=${util.concatdatetimewithT(
      state.routedefaults.tripstartenddate,
      state.routedefaults.tripstartendtime
    )}`;
  }
  // console.log(url);
  const { data, error } = await axios.post(url, {
    routedefaults: state.routedefaults,
     waypoints: waypoints,
  });
  
  store.dispatch({type: 'UPDATE_ROUTE',
    payload: {
      value: {
        route: data,
        stopIntervalsStartEndTimes: data.stopIntervalsStartEndTimes
      }
    }
  });
  return ;
}



// Runs in two modes 
// USERENTEREDSTOPSONLY = 1 considers start+end+manually entered location
// USERENTEREDSTOPSONLY = 0 includes automatically found stops in state.stops
// export async function calculateroute(USERENTEREDSTOPSONLY=1) {
//   const state = store.getState();
//   let commaseparatedroutecoordinates = [];
//   let waypoints = []
  
//   if(state.stops.length===0){
//     USERENTEREDSTOPSONLY = 1; // When there is no automatically found stops, falls back into USERENTEREDSTOPSONLY mode
//   }

//   if (USERENTEREDSTOPSONLY===1){
//     // considers start+end+manually entered location
//     // No waypoints are passed.
//     state.placesSelected.map((placeId) => {
//       let place = state.places.get(placeId);
//       commaseparatedroutecoordinates.push(place.position.lat + "," + place.position.lon);
//     });
//   } else {
//     // includes automatically found stops in state.stops
//     commaseparatedroutecoordinates = getCommaSeparatedRouteCoordinates();
//     waypoints = getWaypoints();
//   }
  
  
  
// // console.log(commaseparatedroutecoordinates)
// if (commaseparatedroutecoordinates.length<=1){
//   return;
// }
//   console.log('calculating route')
  
//   let routecoordinates = commaseparatedroutecoordinates.join(":");
//   let url = `http://localhost:3070/api/user/routing?routecoordinates=${routecoordinates}`;
//   //Datetime must be in the form of 1996-12-19T16:39:57
  
//   if (state.routedefaults.startenddatechoice == "Start at") {
//     url += `&departAt=${util.concatdatetimewithT(
//       state.routedefaults.tripstartenddate,
//       state.routedefaults.tripstartendtime
//     )}`;
//   } else if (state.routedefaults.startenddatechoice == "End by") {
//     url += `&arriveAt=${util.concatdatetimewithT(
//       state.routedefaults.tripstartenddate,
//       state.routedefaults.tripstartendtime
//     )}`;
//   }
//   // console.log(url);
//   const { data, error } = await axios.post(url, {
//     routedefaults: state.routedefaults,
//      waypoints: waypoints,
//   });
  
//   store.dispatch({type: 'UPDATE_ROUTE',
//     payload: {
//       value: {
//         route: data,
//         stopIntervalsStartEndTimes: data.stopIntervalsStartEndTimes
//       }
//     }
//   });
//   return ;
// }
