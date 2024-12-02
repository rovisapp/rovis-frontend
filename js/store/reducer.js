import { calculateroute } from "../services/calculateroute.js";
import { calculatestops } from "../services/calculatestops.js";
export function reducerFunction(state, action) {
  switch (action.type) {
    case "MODIFYROUTEDEFAULTS":
      console.log(action);
      return {
        routedefaults: {
          ...state.routedefaults,
          [action.payload.property]: action.payload.value,
        },
      };
    case "UPDATE_KNOWNPLACES":
      state.places.set(action.payload.property, action.payload.value);
      return {
        places: state.places,
      };

    case "UPDATE_SELECTEDPLACES":
      let placeSelectedArray = action.payload.value;
      return {
        from: placeSelectedArray.length > 0 ? placeSelectedArray[0] : "", //first element
        to:
          placeSelectedArray.length > 0
            ? placeSelectedArray[placeSelectedArray.length - 1]
            : "", //last element
        placesSelected: placeSelectedArray,
      };
    case "UPDATED_SELECTEDSTOP":
      state.stopSelected = action.payload.value;
      return {
        stopSelected: state.stopSelected,
      };
    case "UPDATE_ROUTE":
      return {
        route: action.payload.value.route,
        stopIntervalsStartEndTimes:
          action.payload.value.stopIntervalsStartEndTimes,
      };

    case "UPDATE_STOPS":
      return {
        stops: action.payload.value.stops,
        stopSelected: "-1",
        stopIntervalsStartEndTimes:
          action.payload.value.stopIntervalsStartEndTimes,
        stopIntervals: action.payload.value.stopIntervals,
      };

    case "RESET_STOPS":
      return {
        stops: [],
        stopIntervalsStartEndTimes: [],
        stopIntervals: [],
        stopSelected: "-1",
      };
    case "UPDATE_POISELECTIONFORSTOP":
      let stopindex = action.payload.property;
      state.stops[stopindex].poiselected = action.payload.value;
      return {
        stops: state.stops,
      };
    case "UPDATE_SEARCHEDTAGINSTOP":
      state.stops[action.payload.property].poisearchtags =
        state.stops[action.payload.property].poisearchtags || new Set();
      state.stops[action.payload.property].poisearchtags.add(
        action.payload.value
      );

      return {
        stops: state.stops,
      };

    case "DELETE_SEARCHEDTAGINSTOP":
      state.stops[action.payload.property].poisearchtags =
        state.stops[action.payload.property].poisearchtags || new Set();
      state.stops[action.payload.property].poisearchtags.delete(
        action.payload.value
      );

      return {
        stops: state.stops,
      };

    case "UPDATE_POISEARCHRESULTSINSTOP":
      state.stops[action.payload.property].poisearchbyoffsetarray =
        action.payload.value.poisearchbyoffsetarray;
      state.stops[action.payload.property].poiselected =
        action.payload.value.poiselected;
      state.stops[action.payload.property].poisearchexpandradius =
        action.payload.value.poisearchexpandradius;
      state.stops[action.payload.property].poisearchradiusinmiles =
        action.payload.value.poisearchradiusinmiles;
      state.stops[action.payload.property].nextPageToken = action.payload.value.nextPageToken;
      state.stops[action.payload.property].locationRestriction = action.payload.value.locationRestriction;

      return {
        stops: state.stops,
      };

    case "UPDATE_SEARCHEDTAGSINALLSTOPS":
      state.routedefaults.mealsearchtags =
        state.routedefaults.mealsearchtags || new Set();
      state.routedefaults.mealsearchtags.add(action.payload.value);
      return {
        routedefaults: {
          ...state.routedefaults,
        },
      };

    case "DELETE_SEARCHEDTAGSINALLSTOPS":
      state.routedefaults.mealsearchtags =
        state.routedefaults.mealsearchtags || new Set();
      state.routedefaults.mealsearchtags.delete(action.payload.value);

      return {
        routedefaults: {
          ...state.routedefaults,
        },
      };

    case "UPDATE_POISEARCHRADIUSFORSTOP":
      state.stops[action.payload.property].poisearchradiusinmiles =
        action.payload.value;
      return {
        stops: state.stops,
      };

    case "UPDATE_ISWAITING":
      state.iswaitingfor[action.payload.property] =
        action.payload.value;
      return {
        iswaitingfor: state.iswaitingfor,
      };

    default:
      return state;
  }


}
