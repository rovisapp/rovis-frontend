import { store } from "../store/init.js";
import { calculateroute } from "../services/calculateroute.js";
import * as util from "../util.js";

const METERTOMILE = 0.000621371;
const MILETOMETER = 1609.34;

function forChangeInRadius(thisstop, data, changeinradius) {
  let results = {};
  results.poisearchbyoffsetarray = thisstop.poisearchbyoffsetarray || [];
  if (changeinradius <= 0) {
    // If search radius shrunk then clear off existing array
    results.poisearchbyoffsetarray = [];
  }
  //  data was returned in new search
  if (data.locations.length > 0) {
    results.poisearchbyoffsetarray.push(data.locations);
    results.poiselected = [0, 0];
  }
  //  no data was returned in new search AND no POI existed in this stop before
  else if (
    data.locations.length == 0 &&
    results.poisearchbyoffsetarray.length == 0
  ) {
    results.poiselected = [-1, -1];
    results.poisearchexpandradius = 1;
    results.poisearchbyoffsetarray = [];
  }
  //  no data was returned in new search AND some POIs existed in this stop before
  else if (
    data.locations.length == 0 &&
    results.poisearchbyoffsetarray.length > 0
  ) {
    results.poiselected = [0, 0];
  }

  return results;
}

function forNoChangeInRadius(data) {
  if (data.locations.length <= 0) {
    return {
      poisearchbyoffsetarray: [],
      poiselected: [-1, -1], // No search results found, therefore no POI should be shown/selected on screen.
      poisearchexpandradius: 1, // No search results found, therefore next time we might want to increase search radius
    };
  } else {
    return {
      poisearchbyoffsetarray: [data.locations],
      poiselected: [0, 0],
      poisearchexpandradius: 0,
    };
  }
}

function forLoadMore(thisstop, data) {
  if (data.locations.length <= 0) {
    return {
      poisearchbyoffsetarray: thisstop.poisearchbyoffsetarray, // just set it back to what it was
      poiselected: thisstop.poiselected, // No new search results found, therefore just set it back to what it was.
      poisearchexpandradius: 1, // No search results found, therefore next time we might want to increase search radius
    };
  } else {
    return {
      poisearchbyoffsetarray: [
        ...thisstop.poisearchbyoffsetarray,
        data.locations,
      ],
      poiselected: [0, 0],
      poisearchexpandradius: 0,
    };
  }
}

function getCountofexistingpoisforthisstop(thisstop) {
  if (thisstop.poisearchbyoffsetarray.length == 0) {
    return 0;
  }
  return thisstop.poisearchbyoffsetarray.reduce((accumulator, currentvalue) => {
    return accumulator + currentvalue.length;
  }, 0);
}

/*
Google api Scenarios and expected results:
1 - No Results found ==> Prompt to expand search within next 5 miles
2 - Results found, all listed => Prompt to expand search within next 5 miles
3 - Results found, pageX of Y shown => Prompt to load more
4 - Results found, pageY of Y, ie last page shown => Prompt to expand search within next 5 miles
5 - Search Radius changed (increased) => Perform new search, recreate poisearchbyoffsetarray fully. 
      This is different in yelp, where you can just accumulate new pois safely in the new area covered by the expanded radius, because the existing pageToken becomes unusable.
      Unlike yelp,  google maps doesn't allow to bring in pois existing in-between r1 and r2 radii...
      ..If you have increased the radius from r1 to r2, you have to re-perform the search and google will assign new pageToken.)
6 - Search Radius changed (decreased) => Perform new search, recreate poisearchbyoffsetarray fully.
*/
async function poisearch_g(stopId, changeinradius = 0, loadmore = 0) {
  console.log("poisearch1 is called");
  // if changeInRadius!=0, then state.stops[stopId] shall contain new poisearchradiusinmiles value by now
  const state = store.getState();
  let thisstop = state.stops[stopId];
  let results = {};
  console.log(
    `Narrowing pois for stop ${stopId} with options ${thisstop.poisearchtags.join(
      " "
    )} within ${thisstop.poisearchradiusinmiles || 5} miles`
  );
  try {
    let countofexistingpoisforthisstop =
      getCountofexistingpoisforthisstop(thisstop);
    let poisearchradiusinmiles = Number(thisstop.poisearchradiusinmiles || 5); //default to 5 miles
    let offsetparam = 0;
    let locationRestriction = {};

    //This call was a result of change in radius
    // if(changeinradius!=0){
    //   offsetparam= changeinradius > 0 ? countofexistingpoisforthisstop+1 : 0
    // }

    //This call was a result of pressing loadmore
    if (loadmore != 0) {
      offsetparam = thisstop.nextPageToken;
      locationRestriction =
        (thisstop.poisearchexpandradius == 1
          ? {}
          : thisstop.locationRestriction) || {};
      poisearchradiusinmiles =
        thisstop.poisearchexpandradius == 1
          ? poisearchradiusinmiles + 5
          : poisearchradiusinmiles; // If expansion of radius was set to 1 in the previous search, increment radius by 5

      // If there is no more paginated results left to load more, expand search radius, do not search,
      // Instead wait for user to click again for a new search.
      if (
        typeof thisstop.nextPageToken === "undefined" &&
        thisstop.poisearchexpandradius == 0
      ) {
        store.dispatch({
          type: "UPDATE_POISEARCHRESULTSINSTOP",
          payload: {
            value: { ...state.stops[stopId], poisearchexpandradius: 1 },
            property: stopId,
          },
        });
        return;
      }
    }

    // find estimated arrival time (local time) at stop and search for only open pois
    let estlocationarrivaltime = 0;
    if (
      typeof state.stopIntervalsStartEndTimes !== "undefined" &&
      typeof state.stopIntervalsStartEndTimes.stopIntervalsStartEndTimes[stopId]
        .arrive !== "undefined"
    ) {
      estlocationarrivaltime =
        new Date(
          state.stopIntervalsStartEndTimes.stopIntervalsStartEndTimes[
            stopId
          ].arrive
        ).getTime() / 1000; // Yelp needs ?open_at parameter to be EPOC integer time in secs
    }

    const { data, error } = await axios.post(
      `${window.config.APIDOMAIN}/api/user/poisearch`,
      {
        latitude: thisstop.latitude,
        longitude: thisstop.longitude,
        type: thisstop.type,

        radius: (poisearchradiusinmiles || 5) * MILETOMETER,
        tags: [...(thisstop.poisearchtags || new Set())],
        offset: offsetparam,
        locationRestriction: locationRestriction,
        open_at: estlocationarrivaltime,
      }
    );
    //  console.log(data)
      
      // changeinradius / forChangeInRadius() is not applicable here since, 
      // unlike yelp,  google maps doesn't allow to bring in pois existing in-between r1 and r2 radii.
      // If you have increased the radius from r1 to r2, you have to search normally.
      // results = forChangeInRadius(thisstop, data, changeinradius);
      if (loadmore !== 0 && thisstop.poisearchexpandradius === 0) {
        results = forLoadMore(thisstop, data);
      } else {
          results = forNoChangeInRadius(data);
      }

    // if (changeinradius == 0 && loadmore == 0) {
    //   results = forNoChangeInRadius(data);
    // } else if (changeinradius != 0) {
    //   results = forNoChangeInRadius(data);
    // } else if (loadmore != 0 && thisstop.poisearchexpandradius == 1) {
    //   results = forNoChangeInRadius(data);
    // } else if (loadmore != 0 && thisstop.poisearchexpandradius == 0) {
    //   results = forLoadMore(thisstop, data);
    // }
      

 

    results.nextPageToken = data.nextPageToken;
    results.locationRestriction = data.locationRestriction;
    results.poisearchradiusinmiles = poisearchradiusinmiles;
    results.poisearchexpandradius =
      typeof data.nextPageToken === "undefined" ? 1 : 0; // no more results are there, therefore expand the search.

    store.dispatch({
      type: "UPDATE_POISEARCHRESULTSINSTOP",
      payload: {
        value: results,
        property: stopId,
      },
    });

    await calculateroute(0);
  } catch (error) {
    console.log(`Failed to execute poisearch`);
    console.log(error);
  }
}













/*
Yelp api Scenarios and expected results:
1 - No Results found ==> Prompt to expand search within next 5 miles
2 - Results found, all listed => Prompt to expand search within next 5 miles
3 - Results found, pageX of Y shown => Prompt to load more
4 - Results found, pageY of Y, ie last page shown => Prompt to expand search within next 5 miles
5 - Search Radius changed (increased) => Add to existing poisearchbyoffsetarray, since the pagination uses offset numbers and not unique pageTokens. 
We can safely use the offset number and go on expanding the radius and safely get the new pois covered under the new radius zone. 
 (This is different that GOOGLE api. See comments under poisearch_g) . 
6 - Search Radius changed (decreased) => Perform new search, recreate poisearchbyoffsetarray.
*/
async function poisearch_y(stopId, changeinradius = 0, loadmore = 0) {
  console.log("poisearch0 is called");
  // if changeInRadius!=0, then state.stops[stopId] shall contain new poisearchradiusinmiles value by now
  const state = store.getState();
  let thisstop = state.stops[stopId];
  let results = {};
  console.log(
    `Narrowing pois for stop ${stopId} with options ${thisstop.poisearchtags.join(
      " "
    )} within ${thisstop.poisearchradiusinmiles || 5} miles`
  );
  try {
    let countofexistingpoisforthisstop =
      getCountofexistingpoisforthisstop(thisstop);
    let poisearchradiusinmiles = Number(thisstop.poisearchradiusinmiles || 5); //default to 5 miles
    let offsetparam = 0;

    //This call was a result of change in radius
    // if(changeinradius!=0){
    //   offsetparam= changeinradius > 0 ? countofexistingpoisforthisstop+1 : 0
    // }

    //This call was a result of pressing loadmore
    if (loadmore != 0) {
      offsetparam =
        countofexistingpoisforthisstop > 0
          ? countofexistingpoisforthisstop + 1
          : 0;
      poisearchradiusinmiles =
        thisstop.poisearchexpandradius == 1
          ? poisearchradiusinmiles + 5
          : poisearchradiusinmiles; // If expansion of radius was set to 1 in the previous search, increment radius by 5
    }

    // find estimated arrival time (local time) at stop and search for only open pois
    let estlocationarrivaltime = 0;
    if (
      typeof state.stopIntervalsStartEndTimes !== "undefined" &&
      typeof state.stopIntervalsStartEndTimes.stopIntervalsStartEndTimes[stopId]
        .arrive !== "undefined"
    ) {
      estlocationarrivaltime =
        new Date(
          state.stopIntervalsStartEndTimes.stopIntervalsStartEndTimes[
            stopId
          ].arrive
        ).getTime() / 1000; // Yelp needs ?open_at parameter to be EPOC integer time in secs
    }

    console.log("offsetparam " + offsetparam);
    const { data, error } = await axios.post(
      `${window.config.APIDOMAIN}/api/user/poisearch`,
      {
        latitude: thisstop.latitude,
        longitude: thisstop.longitude,
        type: thisstop.type,

        radius: (poisearchradiusinmiles || 5) * MILETOMETER,
        tags: [...(thisstop.poisearchtags || new Set())],
        offset: offsetparam,
        open_at: estlocationarrivaltime,
      }
    );
    console.log(data);

    if (changeinradius == 0 && loadmore == 0) {
      results = forNoChangeInRadius(data);
    } else if (changeinradius != 0) {
      results = forChangeInRadius(thisstop, data, changeinradius);
    } else if (loadmore != 0) {
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
  } catch (error) {
    console.log(`Failed to execute poisearch`);
    console.log(error);
  }
}


/*
HERE api Scenarios and expected results:
1 - No Results found ==> Prompt to expand search within next 5 miles
2 - Results found, all listed => Prompt to expand search within next 5 miles
3 - Results found, pageX of Y shown => Prompt to load more
4 - Results found, pageY of Y, ie last page shown => Prompt to expand search within next 5 miles
5 - Search Radius changed (increased) => Add to existing poisearchbyoffsetarray (This is different that GOOGLE api) . 
6 - Search Radius changed (decreased) => Perform new search, recreate poisearchbyoffsetarray.
*/
async function poisearch_h(stopId, changeinradius = 0, loadmore = 0) {
  console.log("poisearch2 is called");
  // if changeInRadius!=0, then state.stops[stopId] shall contain new poisearchradiusinmiles value by now
  const state = store.getState();
  let thisstop = state.stops[stopId];
  let results = {};
  console.log(
    `Narrowing pois for stop ${stopId} with options ${thisstop.poisearchtags.join(
      " "
    )} within ${thisstop.poisearchradiusinmiles || 5} miles`
  );
  try {
    let countofexistingpoisforthisstop =
      getCountofexistingpoisforthisstop(thisstop);
    let poisearchradiusinmiles = Number(thisstop.poisearchradiusinmiles || 5); //default to 5 miles
    let offsetparam = 0;

    //This call was a result of change in radius
    // if(changeinradius!=0){
    //   offsetparam= changeinradius > 0 ? countofexistingpoisforthisstop+1 : 0
    // }

    //This call was a result of pressing loadmore
    if (loadmore != 0) {
      offsetparam =
        countofexistingpoisforthisstop > 0
          ? countofexistingpoisforthisstop // and not countofexistingpoisforthisstop + 1, specifically due to how HERE api indexing is.
          : 0;
  
      poisearchradiusinmiles =
        thisstop.poisearchexpandradius == 1
          ? poisearchradiusinmiles + 5
          : poisearchradiusinmiles; // If expansion of radius was set to 1 in the previous search, increment radius by 5
    }

    // find estimated arrival time (local time) at stop and search for only open pois
    let estlocationarrivaltime = 0;
    if (
      typeof state.stopIntervalsStartEndTimes !== "undefined" &&
      typeof state.stopIntervalsStartEndTimes.stopIntervalsStartEndTimes[stopId]
        .arrive !== "undefined"
    ) {
      estlocationarrivaltime =
        new Date(
          state.stopIntervalsStartEndTimes.stopIntervalsStartEndTimes[
            stopId
          ].arrive
        ).getTime() / 1000; // Yelp needs ?open_at parameter to be EPOC integer time in secs
    }

    console.log("offsetparam " + offsetparam);
    const { data, error } = await axios.post(
      `${window.config.APIDOMAIN}/api/user/poisearch`,
      {
        latitude: thisstop.latitude,
        longitude: thisstop.longitude,
        type: thisstop.type,

        radius: (poisearchradiusinmiles || 5) * MILETOMETER,
        tags: [...(thisstop.poisearchtags || new Set())],
        offset: offsetparam,
        open_at: estlocationarrivaltime,
      }
    );
    console.log(data);

    if (changeinradius == 0 && loadmore == 0) {
      results = forNoChangeInRadius(data);
    } else if (changeinradius != 0) {
      results = forChangeInRadius(thisstop, data, changeinradius);
    } else if (loadmore != 0) {
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
  } catch (error) {
    console.log(`Failed to execute poisearch`);
    console.log(error);
  }
}



export async function poisearch(stopId, changeinradius = 0, loadmore = 0) {
  const response = await fetch(
    `${window.config.APIDOMAIN}/api/user/getplacesprovider`
  );
  const data = await response.json();

  if (data.placesprovider == "YELP") {
    poisearch_y(stopId, changeinradius, loadmore);
  } else if (data.placesprovider == "GOOGLE") {
    poisearch_g(stopId, changeinradius, loadmore);
  } else if (data.placesprovider == "HERE") {
    poisearch_h(stopId, changeinradius, loadmore);
  }
}
