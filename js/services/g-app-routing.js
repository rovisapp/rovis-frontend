const MAX_ROUTING_INPUTS = 20;
const METERTOMILE = 0.000621371;
const MILETOMETER = 1609.34;

class GRoutingService {
    constructor() {
        this.map = null;
        this.markers = [];
        this.bounds = null;
        this.routingInputs = [];
        this.markerInputs = [];
        this.routeId = null;
        this.routeColor = '#42f569';
        this.routeLayersToRemove = [];
        this.routePath = null;
    }

    async initMap() {
        try {
            const { Map } = await google.maps.importLibrary("maps");

            this.map = new Map(document.getElementById('usermap-output'), {
                zoom: 4,
                center: { lat: 39.8283, lng: -98.5795 },
                mapId: "rovis_map",
                // styles: [
                //     {
                //         featureType: "poi",
                //         elementType: "labels",
                //         stylers: [{ visibility: "off" }]
                //     }
                // ]
            });

            this.bounds = new google.maps.LatLngBounds();
            
            return this.map;
        } catch (error) {
            console.error('Error initializing Google Maps:', error);
            throw error;
        }
    }

    removeexistingmarkerhighlights(classname){
        document.querySelectorAll(`.${classname}`).forEach(element => {
            element.classList.remove(classname);
        });
    }
    highlightthiselement(ele, classname, keepExistingHighlights = 0) {
        if (keepExistingHighlights == 0) {
            this.removeexistingmarkerhighlights(classname)
        }

       
        ele.querySelector('svg').classList.add(classname);

    }
    addRoutingServiceInput(rInputs, mInputs = [], varRouteId = Date.now().toString(36), varRouteLayersToRemove = [], varRouteColor = '#42f569') {
        this.clearMarkers();
        this.routingInputs = rInputs;
        this.markerInputs = mInputs;
        this.routeId = varRouteId;
        this.routeLayersToRemove = varRouteLayersToRemove;
        this.routeColor = varRouteColor;
        return this.routeId;
    }

    clearMarkers() {
        this.markers.forEach(marker => {
            if (marker) marker.setMap(null);
        });
        this.markers = [];

        if (this.routePath) {
            this.routePath.setMap(null);
            this.routePath = null;
        }

        this.bounds = new google.maps.LatLngBounds();
    }

    async drawMarkers() {
        for (const input of this.markerInputs) {
            if (!input.position) continue;

            const position = {
                lat: input.position[1],
                lng: input.position[0]
            };

            const isSmall = input.markerClass?.includes('waypoint-marker-small-red');
            const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary(
                "marker",
              );
            // const marker = new google.maps.Marker({
            //     position: position,
            //     map: this.map,
            //     label: {
            //         text: input.markerText || '',
            //         color: 'white',
            //         fontSize: isSmall ? '10px' : '14px',
            //         fontWeight: 'bold'
            //     },
                
            //     icon: {
            //         path: google.maps.SymbolPath.CIRCLE,
            //         scale: isSmall ? 8 : 15,
            //         fillColor: isSmall ? '#e2824a' : '#4a90e2',
            //         fillOpacity: 1,
            //         strokeColor: isSmall ? '#ff2f2f' : '#2faaff',
            //         strokeWeight: isSmall ? 1 : 2
            //     }
            // });
            const pinTextGlyph = new PinElement({
                glyph: String(input.markerText) || '',
                glyphColor: "white",
              });

            const marker = new AdvancedMarkerElement({
                map: this.map,
                position: position,
                content: pinTextGlyph.element,
                gmpClickable: true
            });

            marker.markerData = input;

            marker.addListener('click', ({ domEvent, latLng }) => {
                const { target } = domEvent;
                // console.log(marker.content)
                this.highlightthiselement(marker.content, 'g-waypoint-marker-small-blue-highlight');
                // marker.setIcon({
                //     ...marker.getIcon(),
                //     strokeWeight: 4
                // });
                
                const headerElement = document.getElementById('usermap-output-header');
                if (headerElement && marker.markerData) {
                    headerElement.innerHTML = this.createWaypointMarkerHeaderHtml(marker.markerData);
                    headerElement.setAttribute('x-stopindex', marker.markerData.stopindex || '');
                    headerElement.setAttribute('x-poioffset', marker.markerData.poioffset || '');
                    headerElement.setAttribute('x-poiindex', marker.markerData.poiindex || '');

                    const closeBtn = headerElement.querySelector('.btn-close');
                    if (closeBtn) {
                        closeBtn.addEventListener('click', () => {
                            headerElement.innerHTML = '';
                            this.removeexistingmarkerhighlights('g-waypoint-marker-small-blue-highlight')
                            // marker.setIcon({
                            //     ...marker.getIcon(),
                            //     strokeWeight: isSmall ? 1 : 2
                            // });
                        });
                    }
                }
            });

            this.markers.push(marker);

            if (!input.excludefromMapBound) {
                this.bounds.extend(position);
            }
        }
    }

    async calculateRoute() {
        const locations = this.getLocations(this.routingInputs);
        if (locations.count < 2) return;

        // Clear any existing polyline
        if (this.routePath) {
            this.routePath.setMap(null);
            this.routePath = null;
        }

        // Create path coordinates
        const pathCoordinates = locations.arr.map(point => ({
            lat: point[1],
            lng: point[0]
        }));

        // Create and draw the polyline
        this.routePath = new google.maps.Polyline({
            path: pathCoordinates,
            geodesic: true,
            strokeColor: this.routeColor,
            strokeOpacity: 1.0,
            strokeWeight: 5,
        });

        // Add polyline to map
        this.routePath.setMap(this.map);

        // Draw markers
        await this.drawMarkers();

        // Fit bounds if we have markers
        if (!this.bounds.isEmpty()) {
            this.map.fitBounds(this.bounds);
        }
    }

    getLocations(locations) {
        let resultStr = '';
        let resultArr = [];
        let count = 0;

        locations.forEach(loc => {
            if (loc.position) {
                count += 1;
                resultArr.push(loc.position);
                resultStr += loc.position[1] + ',' + loc.position[0] + ':';
            }
        });

        resultStr = resultStr.substring(0, resultStr.length - 1);
        return { str: resultStr, count: count, arr: resultArr };
    }

    createWaypointMarkerHeaderHtml(thismarker) {
        let poi = thismarker.poi;
        if (typeof poi === 'undefined') {
            return `
                <div class="z-highlight mt-4 mb-2 p-2">
                    <table class="table table-sm table-borderless">
                        <tbody><tr></tr></tbody>
                        <td width="60%">
                            No stop found around this spot. You most probably have to drive through or search for stops with a different search criteria.
                        </td>
                        <td style="text-align:right" width="10%">
                            <button type="button" class="btn-close" aria-label="Close"></button>
                        </td>
                    </table>
                </div>
            `;
        }

        let buttonhtml = thismarker.wasThisPOISelected ?
            `<i class="bi bi-check-circle-fill text-success" style="font-size:2rem"></i>
             <span class="font-size-7">You have already selected this stop</span>` :
            `<button type="button" class="btn btn-primary mt-4 usermap-output-stopherebtn">Stop Here</button>`;

        return `
            <div class="z-highlight mt-4 mb-2 p-2">
                <table class="table table-sm table-borderless">
                    <tbody>
                        <tr>
                            <td width="60%">
                                <div class="ms-2 me-auto" style="text-align:left">
                                    <div class="font-size-6">${poi.name}</div>
                                    <div class="font-size-7">${poi.location?.display_address.join(" ")}</div>
                                    <div class="font-size-7">${poi.categories?.reduce((accumulator, curr) => {
                                        return (accumulator + (accumulator == "" ? "" : ", ") + curr.title);
                                    }, "")}</div>
                                    <span class="font-size-7">
                                        ${poi.rating || "0"}&nbsp;<i class="bi bi-star-fill"></i> 
                                        (${poi.review_count || "0"}) on 
                                        <a href="${poi.url}" target="_blank">Yelp</a>
                                    </span>
                                </div>
                            </td>
                            <td style="text-align:right" width="10%">
                                <span class="ms-1 badge text-bg-secondary">
                                    ${(poi.distance * METERTOMILE).toFixed(2)} miles
                                </span>
                            </td>
                            <td style="text-align:right" width="20%">
                                <span class="badge text-bg-primary">${poi.price || ""}</span>
                            </td>
                            <td style="text-align:right" width="10%">
                                <button type="button" class="btn-close" aria-label="Close"></button>
                            </td>
                        </tr>
                        <tr>
                            <td width="60%" style="text-align:left">${buttonhtml}</td>
                            <td width="10%"></td>
                            <td width="20%"></td>
                            <td width="10%"></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
    }
}

export { GRoutingService };