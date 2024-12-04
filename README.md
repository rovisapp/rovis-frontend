This is the frontend code for the road-trip planning app. The backend is hosted at https://github.com/rovisapp/rovis-backend
It takes in location addresses from the user and suggests places to stop on the way based on various conditions such driving time, restaurant stops based on cuisine choices etc.
A live demo is available at https://tripmaker.inertia.cc


## Core Functionality

The Rovis app is a road trip planning tool that helps users plan optimal routes with intelligent stop scheduling.

### User Inputs
- Start and end locations
- Optional waypoints
- Trip parameters:
  - Maximum driving hours per day
  - Maximum hours between stops
  - Meal preferences and cuisine filters 
  - Trip start/end dates and times
## Route Planning System

### Route Calculation
- Uses TomTom's routing API for optimal path calculation
- Automatically determines necessary stops based on:
  - Meal times (considering driving duration and time of day)
  - Rest breaks (based on maximum continuous driving time)
  - Overnight stays (based on maximum daily driving hours)
  - User-defined waypoint locations

### Stop Selection Process
- For each calculated stop point:
  - Searches nearby businesses via Yelp or Google API, (based on environment variables)
  - Configurable search radius
  - Filters based on stop type:
    - Restaurants for meals
    - Rest areas for breaks
    - Hotels for overnight stays
  - Applies user's cuisine/category preferences
  - Displays business details:
    - Ratings & reviews
    - Distance from route
    - Operating hours
  - Allows manual selection of specific businesses

## Technical Architecture

### Frontend Architecture 
(This repo)
- Pure JavaScript implementation
- No frontend framework dependencies
- Key components:
  - Custom web components for UI
  - Custom state management (store.js)
  - Bootstrap 5.3 for styling
  - TomTom Maps for route visualization
  - Modular component system in `js/components/`

### Backend Architecture 
(repo: https://github.com/rovisapp/rovis-backend)
- Node.js server implementation
- Key features:
  - API integrations:
    - TomTom (geocoding/routing)
    - Google Places API (places search)
    - Yelp (business search)
  - Complex route calculations
  - Comprehensive error handling
  - API rate limiting system
  - Request/response validation

### Data Flow
1. User Input Flow:
   - UI interactions trigger state updates
   - State changes managed through central store
   - Components re-render based on state changes

2. Backend Processing Flow:
   - Location search/geocoding
   - Route optimization
   - Stop point calculations
   - Business search around stops
   - Data aggregation and response formatting

3. Display Flow:
   - List view of stops and businesses
   - Interactive map visualization
   - Real-time updates as selections change
  
4. # Frontend Implementation Details

## Core Architecture

### Component System
- Located in `/js/components/`
- Key components:
  ```javascript
  - drive-options-checkbox     // Trip parameter toggles
  - drive-options-text        // Text input parameters
  - drive-options-start-end-choice  // Trip timing options
  - map-display              // Route visualization
  - place-options           // Location selection
  - place-search            // Location search
  - stop-list              // Stop management
  - tag-builder            // Search tag management
  ```

### State Management
- Custom implementation in `/js/store/`
- Key files:
  ```javascript
  store.js      // Store implementation
  reducer.js    // State reducers
  init.js       // Initial state
  ```

### State Structure
```javascript
{
  // Map storing known locations (from API search) by their unique ID
  // Used to look up places when displaying routes and stops
  places: Map<string, {
    id: string,                // Unique identifier for the location
    position: {                // Geographic coordinates
      lat: number,
      lon: number
    },
    address: {                 // Formatted address components
      freeformAddress: string, // Full human-readable address
      countryCode: string,     // e.g., "US"
      countrySubdivision: string, // e.g., "NY"
      country: string          // Full country name
    },
    poi: {                     // Point of Interest details if applicable
      name: string,            // Business/location name
      phone: string,           // Contact number
      url: string,             // Website
      categories: Array<string> // Business categories
    }
  }>,

  // Ordered array of place IDs representing the route sequence
  // Includes start, waypoints, and end locations
  placesSelected: Array<string>,

  // UI state flags for location selection
  from_active: boolean,        // Whether start location selection is active
  to_active: boolean,          // Whether end location selection is active
  mandatorystop_active: boolean, // Whether mandatory stop selection is active

  // IDs referencing start and end locations in places Map
  from: string,                // Start location ID
  to: string,                  // End location ID

  // Stop interval configuration
  mustStopAtIntervalsOfHrs: number,  // How often stops are required
  stopIntervalDurationInHrs: number,  // How long each stop should last

  // Map rendering instance (TomTom)
  ttmap: Object,

  // Detailed route information from routing API
  route: {
    summary: {
      lengthInMeters: number,             // Total route distance
      travelTimeInSeconds: number,        // Total travel time
      trafficDelayInSeconds: number,      // Additional time due to traffic
      trafficLengthInMeters: number,      // Distance affected by traffic
      departureTime: string,              // When trip starts
      arrivalTime: string,                // When trip ends
      noTrafficTravelTimeInSeconds: number, // Ideal travel time
      historicTrafficTravelTimeInSeconds: number, // Time based on historic data
      liveTrafficIncidentsTravelTimeInSeconds: number // Time with current incidents
    },
    legs: Array<{                         // Route segments
      summary: {                          // Per-segment summary
        lengthInMeters: number,           // Segment length
        travelTimeInSeconds: number,      // Segment duration
        trafficDelayInSeconds: number,    // Segment traffic delay
        trafficLengthInMeters: number,    // Segment traffic distance
        departureTime: string,            // Segment start time
        arrivalTime: string,              // Segment end time
        noTrafficTravelTimeInSeconds: number,
        historicTrafficTravelTimeInSeconds: number,
        liveTrafficIncidentsTravelTimeInSeconds: number
      },
      points: Array<{                     // Geographic points along segment
        latitude: number,
        longitude: number
      }>
    }>,
    sections: Array<{                     // Route section types
      startPointIndex: number,            // Start index in points array
      endPointIndex: number,              // End index in points array
      sectionType: string,                // Type of section
      travelMode: string                  // Mode of travel
    }>,
    guidance: {                           // Turn-by-turn navigation
      instructions: Array<{
        routeOffsetInMeters: number,      // Distance from route start
        travelTimeInSeconds: number,      // Time from route start
        point: {                          // Location of instruction
          latitude: number,
          longitude: number
        },
        pointIndex: number,               // Index in points array
        instructionType: string,          // Type of instruction
        roadNumbers: Array<string>,       // Road identifiers
        street: string,                   // Street name
        countryCode: string,              // Country code
        possibleCombineWithNext: boolean, // Can merge with next instruction
        drivingSide: string,              // Which side to drive on
        maneuver: string,                 // Turn direction
        message: string                   // Human-readable instruction
      }>
    },
    progress: Array<{                     // Route progress tracking
      pointIndex: number,                 // Index in points array
      travelTimeInSeconds: number         // Time to reach this point
    }>,
    routehash: string                     // Unique route identifier
  },

  // Route including detours for stops
  routeWithStopDetours: Object,

  // Timing information for stops
  stopIntervalsStartEndTimes: {
    actual: {
      start: string,                      // Actual trip start time
      end: string                         // Actual trip end time
    },
    stopIntervalsStartEndTimes: Array<{   // Timing for each stop
      stoptype: Array<string>,            // Type of stop (meal/rest/etc)
      cummulativereachtimesinsecs: number, // Time to reach stop
      latitude: number,                   // Stop location
      longitude: number,
      arrive: string,                     // Arrival time at stop
      depart: string,                     // Departure time from stop
      traveltimebetweenstopsinsecs_calculatedfromsource: number // Travel time from previous stop
    }>
  },

  // Center point of route for map display
  routecenter: {
    latitude: number,
    longitude: number
  },

  // Map of mandatory stops that must be included
  mandatorystops: Map<string, {
    latitude: number,
    longitude: number,
    type: Array<string>
  }>,

  // Array of all coordinates that are "stop-centers" along route.
  // Stop centers are coordinates around which potential points of interests "poi"s ( such as restaurants, hotels) are searched.
  // stops[i].poisearchbyoffsetarray[0...n] holds these pois
  stops: Array<{
    // Geographic center where stop should occur
    latitude: number,
    longitude: number,

    // Type(s) of stop needed at this point
    // Can be meal, rest, day, fuel, or userdefined
    type: Array<string>,

    // Address details for stop location
    address: {
      routeNumbers: Array<string>,        // Road numbers
      countryCode: string,
      countrySubdivision: string,
      countrySecondarySubdivision: string,
      municipality: string,               // City/town
      postalCode: string,
      country: string,
      countryCodeISO3: string,
      freeformAddress: string,            // Full address
      boundingBox: {                      // Geographic bounds
        northEast: string,
        southWest: string,
        entity: string
      },
      countrySubdivisionName: string,
      localName: string
    },

    // 2D array of Points of Interest near this stop
    // First dimension: pages of results for pagination
    // Second dimension: POIs within each page
    poisearchbyoffsetarray: Array<Array<{
      name: string,                       // Business name
      id: string,                         // Unique identifier
      types: Array<string>,               // Business types/categories
      nationalPhoneNumber: string,        // Local format phone
      internationalPhoneNumber: string,   // International format phone
      formattedAddress: string,           // Full address
      location: {
        display_address: Array<string>,   // Address components
        latitude: number,
        longitude: number
      },
      rating: number,                     // User rating (e.g. 1-5)
      googleMapsUri: string,              // Maps link sent by google api responses
      websiteUri: string,                 // Business website
      regularOpeningHours: {              // Operating hours as returned by google api responses. This is absent for yelp api responses
        openNow: boolean,                 // Currently open
        periods: Array<{                  // Operating periods
          open: {
            day: number,                  // Day of week (0-6)
            hour: number,                 // Hour (0-23)
            minute: number                // Minute (0-59)
          },
          close: {
            day: number,
            hour: number,
            minute: number
          }
        }>,
        weekdayDescriptions: Array<string> // Human-readable hours as returned by google api responses. This is absent for yelp api responses
      },
      price: string,                      // Price level indicator
      userRatingCount: number,            // Number of ratings
      displayName: {                      // Localized name
        text: string,
        languageCode: string
      },
      distance: number,                   // Distance from stop center
      review_count: number,               // Number of reviews
      url: string,                        // Business URL
      coordinates: {                      // Precise location
        latitude: number,
        longitude: number
      },
      categories: Array<{                 // Business categories
        title: string
      }>
    }>>,

    
   // Selected POI from poisearchbyoffsetarray
    // Format: [page_number, poi_index]
    // e.g. [0,2] means 3rd POI from first page
    // [-1,-1] means no POI selected
    poiselected: [number, number],

    // POI search parameters
    poisearchradiusinmiles: number,       // Search radius in miles
    poisearchexpandradius: 0 or 1,        // Whether to expand radius in next search attempt
    totalpoisfound: number,               // Total POIs available
    nextPageToken: string,                // Token for next page, applicable for google api reponses
    locationRestriction: {                // Search area bounds, applicable for google api reponses
      rectangle: {
        low: {
          latitude: number,
          longitude: number
        },
        high: {
          latitude: number,
          longitude: number
        }
      }
    },
    poisearchtags: Set<string>            // Search filter tags
  }>,

  // ID of currently selected stop (-1 if none)
  stopSelected: string,

  // Map marker objects
  markers: Array<any>,

  // Trip configuration parameters
  routedefaults: {
    startenddatechoice: string,          // "Start at" or "End by"
    tripstartenddate: string,            // YYYY-MM-DD
    tripstartendtime: string,            // HH:mm:ss
    localtimeatsourceordeststatictext: string, // UI text
    hrstodrivewithoutstopping: number,   // Max continuous driving
    hrstodriveperday: number,            // Max daily driving
    mealintervalinhrs: number,           // Hours between meals
    startinghungrypercent: number,       // Initial hunger level
    takefirstmealatmin: number,          // Minimum time to first meal
    mealbreaktimeinminutes: number,      // Duration of meal stops
    userbreaktimeinminutes: number,      // Duration of custom stops
    enablemealstops: boolean,            // Whether to plan meals
    enablefuelstops: boolean,            // Whether to plan refueling
    startingfuelpercent: number,         // Initial fuel level
    mileageinmpg: number,                // Vehicle fuel efficiency
    gastanksizeingal: number,            // Vehicle tank capacity
    refuelbelowpercentage: number,       // Refuel threshold
    restbreaktimeinminutes: number,      // Duration of rest stops
    fuelbreaktimeinminutes: number,      // Duration of fuel stops
    mealsearchtags: Set<string>          // Dietary preferences
  },

  // Loading state indicators
  iswaitingfor: {
    calculateroute: number,               // Route calculation in progress
    calculatestops: number                // Stop calculation in progress
  },

  // Available stop categories
  regularcategories: Array<{             // Non-food categories
    alias: string,                        // Category ID
    title: string                         // Display name
  }>,
  restaurantcategories: Array<{          // Food categories
    alias: string,                        // Category ID
    title: string                         // Display name
  }>,

  // Fractions along route where stops should occur
  stopIntervals: Array<number>
}
```

## Component Implementation

### Custom Web Components
- Each component extends HTMLElement
- Lifecycle methods:
  ```javascript
  constructor()
  connectedCallback()
  disconnectedCallback()
  render()
  subscribe()
  ```

### Event Handling
- Custom events:
  ```javascript
  EVT_PlaceList        // Location selection
  EVT_TagBuilderList   // Tag selection
  ```
- Store subscriptions:
  ```javascript
  subscribe(listener, actionTypes)
  ```

## UI Implementation

### Map Integration
- TomTom and Google Maps implementation
- Features:
  - Route display
  - Stop markers
  - Interactive POI selection
  - Custom marker styling
  - Bounds management

### Search Implementation
- location search
- Autocomplete suggestions based on Tomtom Api

### Stop Management
- List view implementation
- Stop details display
- POI selection interface
- Distance calculations

## Service Integration

### API Services
Located in `/js/services/`:
```javascript
calculateroute.js     // Route calculation
calculatestops.js     // Stop determination
placesearch.js        // Location search
poisearch.js          // Business search
```

### Map Services
```javascript
app-routing.js        // TomTom map implementation
g-app-routing.js      // Google maps implementation
```

## Styling System

### Bootstrap Integration
- Bootstrap 5.3.0


## User Interaction Flow

### Location Input
1. User enters location in search box
2. Results displayed in dropdown
3. Selection updates state
4. Map updates with new marker

### Route Calculation
1. Start/end locations selected
2. Route parameters set
3. calculateroute() triggered
4. Stop points determined
5. POIs searched for each stop
6. UI updates with results

### Stop Management
1. Stop list displays all points
2. User can select stops
3. POI options displayed
4. Selection updates route
5. Map refreshes with new markers


