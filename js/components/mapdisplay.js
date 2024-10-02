import { store } from "../store/init.js";
import { RoutingService } from "../services/app-routing.js";
import { calculateroute } from "../services/calculateroute.js";
class MapDisplay extends HTMLElement {
  constructor() {
    super();
    this.unsubscribe = null;
    this.focusOnStop = -1;
  }

  connectedCallback() {
    this.render();
    this.subscribe();
  }

  disconnectedCallback() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }

  fetchAllpointsOnRoute() {
    let routepointarrays = [];
    const state = store.getState();
    state.route.legs.map((leg) => {
      leg.points.map((point) => {
        routepointarrays.push({ position: [point.longitude, point.latitude] });
      });
    });
    return routepointarrays;
  }

  fetchStopsToPlot() {
    const state = store.getState();
    let stopwaypointarray = [];
    state.stops.map((stop, index) => {
      // if (stop.poiselected[0] < 0 || stop.poiselected[1] < 0) {
      //   if (!stop.type.includes("userdefined")) {
      //     return;
      //   }
      // }

      if (index != this.focusOnStop) {
        // Plot only the pre-selected POI for a stop

        if (stop.type.includes("userdefined")) {
          stopwaypointarray.push({
            position: [stop.longitude, stop.latitude],
            markerText: index + 1,
            excludefromMapBound: this.focusOnStop == -1 ? 0 : 1,
            poi: {},
            wasThisPOISelected: false, // this is not applicable here,
            stopindex: index,
            poioffset: -1, // this is not applicable here,
            poiindex: -1, // this is not applicable here,
          });
        } else {
          let selectedPOI = {};
          if (stop.poiselected[0] < 0 || stop.poiselected[1] < 0) {
            selectedPOI.coordinates = {
              longitude: stop.longitude,
              latitude: stop.latitude,
            };
          } else {
            selectedPOI =
              stop.poisearchbyoffsetarray[stop.poiselected[0]][
                stop.poiselected[1]
              ];
          }

          stopwaypointarray.push({
            position: [
              selectedPOI.coordinates.longitude,
              selectedPOI.coordinates.latitude,
            ],
            markerText: index + 1,
            excludefromMapBound: this.focusOnStop == -1 ? 0 : 1,
            poi:
              stop.poiselected[0] < 0 || stop.poiselected[1] < 0
                ? {}
                : selectedPOI,
            wasThisPOISelected: false, // this is not applicable here,
            stopindex: index,
            poioffset: -1, // this is not applicable here,
            poiindex: -1, // this is not applicable here,
          });
        }
      } else {
        // Plot all POIs for stop whose index==this.focusOnStop

        if (stop.poiselected[0] < 0 || stop.poiselected[1] < 0) {
          // No poi exist to stop, just need to drive through
          let thispoi = {};
          thispoi.coordinates = {
            longitude: stop.longitude,
            latitude: stop.latitude,
          };
          stopwaypointarray.push({
            position: [
              thispoi.coordinates.longitude,
              thispoi.coordinates.latitude,
            ],
            markerText: "",
            markerClass: "waypoint-marker-small-red",
            excludefromMapBound: 0,
            poi: {},
            wasThisPOISelected: this.focusOnStop + 1,
            stopindex: index,
            poioffset: -1,
            poiindex: -1,
          });
        } else {
          // A poi exist to stop.
          stop.poisearchbyoffsetarray.map((poioffsetarray, poioffset) => {
            poioffsetarray.map((thispoi, poiindex) => {
              let wasThisPOISelected =
                stop.poiselected[0] == poioffset &&
                stop.poiselected[1] == poiindex;
              stopwaypointarray.push({
                position: [
                  thispoi.coordinates.longitude,
                  thispoi.coordinates.latitude,
                ],
                markerText: wasThisPOISelected ? this.focusOnStop + 1 : "",
                markerClass: wasThisPOISelected
                  ? "waypoint-marker"
                  : "waypoint-marker-small-red",
                excludefromMapBound: 0,
                poi: thispoi,
                wasThisPOISelected: wasThisPOISelected,
                stopindex: index,
                poioffset: poioffset,
                poiindex: poiindex,
              });
            });
          });
        }
      }
    });
    return stopwaypointarray;
  }

  dispatch;

  async bindPOIHeaderClick(event) {
    if (event.target.closest(".usermap-output-stopherebtn")) {
      // console.log('.usermap-output-stopherebtn was clicked')
      let stopheaderthatwasclicked = event.target.closest(
        "#usermap-output-header"
      );
      let stopindex = Number(
        stopheaderthatwasclicked.getAttribute("x-stopindex")
      );
      let poioffset = Number(
        stopheaderthatwasclicked.getAttribute("x-poioffset")
      );
      let poiindex = Number(
        stopheaderthatwasclicked.getAttribute("x-poiindex")
      );

      store.dispatch({
        type: "UPDATE_POISELECTIONFORSTOP",
        payload: {
          value: [poioffset, poiindex],
          property: stopindex,
        },
      });
      await calculateroute(0);
    }
  }

  bindEvents() {
    document
      .getElementById("usermap-output-header")
      .addEventListener("click", async (event) => {
        this.bindPOIHeaderClick(event);
      });
  }

  async renderMap() {
    const state = store.getState();
    let numericStopId = Number(state.stopSelected);
    if (!Number.isInteger(numericStopId)) {
      return;
    }

    // this.focusOnStop = this.getAttribute("focus-stop");
    this.focusOnStop = numericStopId;
    if (
      typeof state.route.legs === "undefined" ||
      state.route.legs.length == 0
    ) {
      console.log("No stop to draw routes with waypoints for.");
      return;
    }
    console.log(`Executing renderMap() with focus-stop= ${this.focusOnStop}`);
    let routingService = new RoutingService();
    let mapVar = await routingService.initMap();
    mapVar.on("load", () => {
      routingService.addRoutingServiceInput(
        this.fetchAllpointsOnRoute(),
        [
          {
            position: [
              state.places.get(state.from)?.position.lon,
              state.places.get(state.from)?.position.lat,
            ],
            markerText: ">",
            excludefromMapBound: this.focusOnStop == -1 ? 0 : 1,
          },
          ...this.fetchStopsToPlot(),
          {
            position: [
              state.places.get(state.to)?.position.lon,
              state.places.get(state.to)?.position.lat,
            ],
            markerText: "<",
            excludefromMapBound: this.focusOnStop == -1 ? 0 : 1,
          },
        ],
        "routeWithWayPoints",
        ["routeWithWayPoints"],
        "#2faaff"
      ); // routepointarrays or stoppointarrays accepts [{position:[long, lat], viewport:[topLeftPoint, btmRightPoint]}] as array of route points
      routingService.calculateRoute();
    });
  }

  render() {
    console.log("rendering MapDisplay");
    this.innerHTML = `
    <div class='col-md-8' >
    <div class='row' id='usermap-output-outer'>
        <div id='usermap-output-header'>

        </div>
        <div id='usermap-output'>

        </div>
    </div>
    
</div>
        `;
    this.renderMap();
    this.bindEvents();
  }

  subscribe() {
    this.unsubscribe = store.subscribe(() => this.render());
  }
}

customElements.define("map-display", MapDisplay);
