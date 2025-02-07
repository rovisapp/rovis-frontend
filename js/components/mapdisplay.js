import { store } from "../store/init.js";
import { RoutingService } from "../services/app-routing.js";
import { GRoutingService } from "../services/g-app-routing.js";
import { calculateroute } from "../services/calculateroute.js";
class MapDisplay extends HTMLElement {
  constructor() {
    super();
    this.unsubscribe = null;
    this.focusOnStop = -1;
    this.bounds = {};
    this.boundsChangeTimeout = null;
    this.lastBoundsString = '';
    this.weatherData = {};
    this.routingService = null;
  }

  updateBounds(bounds, provider) {
    if (!bounds) return;
    
    let sw, ne;
    let sw_lat, sw_lon, ne_lat, ne_lon;
    
    if (provider === 'GOOGLE') {
      sw = bounds.getSouthWest();
      sw_lat= sw.lat();
      sw_lon=sw.lng();
      ne = bounds.getNorthEast();
      ne_lat = ne.lat(); 
      ne_lon = ne.lng();
    } else { // TomTom or HERE
      sw = bounds.getSouthWest();
      sw_lat= sw.lat;
      sw_lon=sw.lng;
      ne = bounds.getNorthEast(); 
      ne_lat = ne.lat; 
      ne_lon = ne.lng;
      
    }
    
    this.bounds = {
      rectangle: {
        low: {
          latitude: sw_lat,
          longitude: sw_lon
        },
        high: {
          latitude: ne_lat, 
          longitude: ne_lon
        }
      }
    };
    console.log('Map bounds:', this.bounds);
    const newBoundsString = JSON.stringify(this.bounds);
    if (newBoundsString !== this.lastBoundsString) {
      this.lastBoundsString = newBoundsString;
      
      if (this.boundsChangeTimeout) {
        clearTimeout(this.boundsChangeTimeout);
      }
      
      this.boundsChangeTimeout = setTimeout(async () => {
        console.log('Calling weather api:', this.bounds);
        this.weatherData = await this.fetchWeather();
        await this.updateWeatherOverlay();
      }, 3000);
    }
  }

  connectedCallback() {
    this.render();
    this.subscribe();
  }

  disconnectedCallback() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    if (this.boundsChangeTimeout) {
      clearTimeout(this.boundsChangeTimeout);
    }
  }

  // async fetchWeather(){
  //   console.log('Fetching weather data for bounds:', this.bounds);
  // try {
  //   const response = await fetch(
  //     `${window.config.APIDOMAIN}/api/user/weather?` + 
  //     `low_lat=${this.bounds.rectangle.low.latitude}&` +
  //     `low_lon=${this.bounds.rectangle.low.longitude}&` +
  //     `high_lat=${this.bounds.rectangle.high.latitude}&` +
  //     `high_lon=${this.bounds.rectangle.high.longitude}`
  //   );
    
  //   if (!response.ok) {
  //     throw new Error(`HTTP error! status: ${response.status}`);
  //   }
    
  //   const weatherData= await response.json();
  //   console.log('Weather data:', weatherData);
  //   // Process weather data here
  //   return weatherData;
  // } catch (error) {
  //   console.error('Failed to fetch weather data:', error);
  // }
  // }


  async fetchWeather() {
    console.log('Fetching weather data for bounds:', this.bounds);
    try {
      // Align bounds to 0.25 grid
      // This is how it works:
      // If value = 12.67:
      // value * 4 = 12.67 * 4 = 50.68
      // Math.floor(50.68) = 50
      // 50 / 4 = 12.5
      // For eg, 12.67 becomes 12.50, 12.24 becomes 12.00 and 12.88 becomes 12.75
      const alignToGrid = (value) => Math.floor(value * 4) / 4;
      
      const alignedBounds = {
        rectangle: {
          low: {
            latitude: alignToGrid(this.bounds.rectangle.low.latitude)- 0.25,
            longitude: alignToGrid(this.bounds.rectangle.low.longitude) - 0.25
          },
          high: {
            latitude: alignToGrid(this.bounds.rectangle.high.latitude) + 0.25,
            longitude: alignToGrid(this.bounds.rectangle.high.longitude) + 0.25
          }
        }
      };
  
      const response = await fetch(
        `${window.config.APIDOMAIN}/api/user/weather?` + 
        `low_lat=${alignedBounds.rectangle.low.latitude}&` +
        `low_lon=${alignedBounds.rectangle.low.longitude}&` +
        `high_lat=${alignedBounds.rectangle.high.latitude}&` +
        `high_lon=${alignedBounds.rectangle.high.longitude}`
      );
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const weatherData = await response.json();
      console.log('Weather data:', weatherData);
      return weatherData;
    } catch (error) {
      console.error('Failed to fetch weather data:', error);
    }
  }

  async updateWeatherOverlay() {
    const response = await fetch(`${window.config.APIDOMAIN}/api/user/getplacesprovider`);
    const data = await response.json();
    
    // Only proceed for YELP and HERE providers
    if (data.placesprovider !== 'YELP' && data.placesprovider !== 'HERE') {
        return;
    }
    
    // Wait for weather data to be available
    if (!this.weatherData.points || !Array.isArray(this.weatherData.points)) {
        return;
    }

    
    
    if (this.routingService) {
      this.routingService.addWeatherOverlay(this.weatherData.points);
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

  async renderMap(provider = 'YELP') {
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
    let routingService = provider === 'GOOGLE' ? new GRoutingService() : new RoutingService();
    let mapVar = await routingService.initMap();

    // Add bounds listeners based on provider
  if (provider === 'GOOGLE') {
    mapVar.addListener('bounds_changed', () => {
      this.updateBounds(mapVar.getBounds(), 'GOOGLE');
    });
  } else if (provider === 'YELP' || provider === 'HERE') {
    mapVar.on('moveend', () => {
      this.updateBounds(mapVar.getBounds(), provider);
    });
    mapVar.on('resize', () => {
      this.updateBounds(mapVar.getBounds(), provider);
    });
    
  }
    
    const renderRoute = () => {
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
    };

    // TomTom map needs load event, Google Maps doesn't
    if (provider === 'YELP' || provider === 'HERE' && mapVar.on) {
      mapVar.on("load", ()=>{
        renderRoute();
        // Initial bounds
      this.updateBounds(mapVar.getBounds(), provider);
      });
      
    } else { // provider==GOOGLE
      renderRoute();
      // Initial bounds for Google
    if (provider === 'GOOGLE') {
      this.updateBounds(mapVar.getBounds(), 'GOOGLE');
    }
    }

    this.routingService = routingService;
  }

  async render() {
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
    
    const response = await fetch(`${window.config.APIDOMAIN}/api/user/getplacesprovider`);
    const data = await response.json();
    
    await this.renderMap(data.placesprovider);
    this.bindEvents();
  }

  // subscribe() {
  //   this.unsubscribe = store.subscribe(() => this.render());
  // }
  subscribe() {
    // Only these actions will trigger map re-renders
    const mapRelevantActions = [
        'UPDATE_ROUTE',
        'UPDATE_STOPS',
        'RESET_STOPS', 
        'UPDATED_SELECTEDSTOP',
        'UPDATE_POISELECTIONFORSTOP',
        'UPDATE_SELECTEDPLACES',
        'UPDATE_SEARCHEDTAGINSTOP',
        'DELETE_SEARCHEDTAGINSTOP',
        'UPDATE_POISEARCHRESULTSINSTOP',
        'UPDATE_SEARCHEDTAGSINALLSTOPS',
        'DELETE_SEARCHEDTAGSINALLSTOPS',
        'UPDATE_POISEARCHRADIUSFORSTOP'
    ];

    this.unsubscribe = store.subscribe(() => this.render(), mapRelevantActions);
}
}

customElements.define("map-display", MapDisplay);