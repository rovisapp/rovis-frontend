

const MAX_ROUTING_INPUTS = 20;
const METERTOMILE = 0.000621371;
const MILETOMETER = 1609.34;


  
// new Foldable('#foldable', 'top-right');
let routingInputs = []; //[{position:[long, lat], viewport:[topLeftPoint, btmRightPoint], excludefromMapBound:0}] 
let markerInputs = []; //[{position:[long, lat], viewport:[topLeftPoint, btmRightPoint], excludefromMapBound:0, markerText:'0'}] 
let route;
let routeId;
let routeColor;
let routeLayersToRemove = [];
let markers = [];
let state = {};
let map;
// var errorHint = new InfoHint('error', 'bottom-center', 5000).addTo(document.getElementById('map'));
// var loadingHint = new InfoHint('info', 'bottom-center').addTo(document.getElementById('map'));
class RoutingService {
     constructor() {
        this.map=null;
        
     }
    async initMap() {
        const response = await fetch(`${window.config.APIDOMAIN}/api/user/getsearchparam`);
        const data = await response.json();
        

        this.map = await tt.map({
            key: data.searchparam,
             style: 'https://api.tomtom.com/style/1/style/22.2.1-*?map=basic_main&poi=poi_dynamic',
            container: 'usermap-output',
            dragPan: !isMobileOrTablet()
        });
        const uid = function () { return Date.now().toString(36) + Math.random().toString(36).substring(2, 12).padStart(12, 0); };
        this.map.addControl(new tt.FullscreenControl());
        this.map.addControl(new tt.NavigationControl());
        return this.map;
    }
    highlightthiselement(ele, classname, keepExistingHighlights = 0) {
        if (keepExistingHighlights == 0) {
            document.querySelectorAll(`.${classname}`).forEach(element => {
                element.classList.remove(classname);
            });
        }

        ele.classList.add(classname);

    }
    addRoutingServiceInput(rInputs, mInputs = [], varRouteId = uid(), varRouteLayersToRemove = [], varRouteColor = '#42f569') {
        routingInputs = rInputs;
        markerInputs = mInputs;
        routeId = varRouteId;
        routeLayersToRemove = varRouteLayersToRemove;
        routeColor = varRouteColor;
        return routeId;
    }
    setState(ste) {
        state = ste;
    }
    getState() {
        return state;
    }
    removeLayers(varRouteLayersToRemove = []) {
        varRouteLayersToRemove.forEach(function (rId, index) {
            if (this.map.getLayer(rId)) {
                this.map.removeLayer(rId);
                this.map.removeSource(rId);
            }

        });
    }
    calculateRoute() {
        // showLog('Drawing Route..');
        
        this.clearMarkers();
        document.getElementById('usermap-output-header').innerHTML = '';
        // if (route ) {
        //     map.removeLayer('route');
        //     map.removeSource('route');
        //     route = undefined;
        // }
        // routeLayersToRemove.forEach(function (rId, index) {
        //     console.log(this)
        //     if (this.map.getLayer(rId)) {
        //         this.map.removeLayer(rId);
        //         this.map.removeSource(rId);
        //     }

        // });
        routeLayersToRemove.map((layer)=>{
            if (this.map.getLayer(layer)) {
                this.map.removeLayer(layer);
                this.map.removeSource(layer);
            }
        })
        let locations = this.getLocations(routingInputs);

        this.drawMarkers();
        if (locations.count < 2) {
            return;
        }
        
        route = this.map.addLayer({
            'id': routeId,
            'type': 'line',
            'source': {
                'type': 'geojson',
                'data': {
                    'type': 'Feature',
                    'properties': {},
                    'geometry': {
                        'type': 'LineString',
                        'coordinates': locations.arr
                    }
                }
            },
            'paint': {
                'line-color': routeColor,
                'line-width': 5
            }
        }, this.findFirstBuildingLayerId());



        this.updateRoutesBounds(locations.arr);
        this.drawMarkers();
        this.map.showTrafficFlow();
    }
    clearMarkers() {
        markers.forEach(function (marker) {
            marker.remove();
        });
    }
    getMarkers() {
        return markers;
    }
    // RoutingService.prototype.drawMarkers = function() {
    //     let bounds = new tt.LngLatBounds();
    //     let maxIndex = markerInputs.length - 1;
    //     if (markerInputs.length === 0) {
    //         return;
    //     }
    //     markerInputs.forEach(function(input, index) {
    //         if (input.position) {
    //             let marker = new tt.Marker(this.waypointMarker(index, maxIndex)).setLngLat(input.position).addTo(map);
    //             markers.push(marker);
    //             if (input.extendMapBound==1){
    //                 bounds.extend(tt.LngLat.convert(input.position));
    //                 if (input.viewport) {
    //                     input.viewport.forEach(function(viewport) {
    //                         bounds.extend(tt.LngLat.convert(viewport));
    //                     });
    //                 }
    //             }
    //         }
    //     }, this);
    //     map.fitBounds(bounds, { duration: 0, padding: 100 });
    // };
    drawMarkers() {
        let bounds = new tt.LngLatBounds();
        if (markerInputs.length === 0) {
            return;
        }
        let maxIndex = markerInputs.length - 1;
        
        markerInputs.forEach(function (input, index) {
            
            if (typeof input.position !="undefined" && input.position) {
                let marker = new tt.Marker(this.waypointMarker(index, maxIndex, input)).setLngLat(input.position).addTo(this.map);
                markers.push(marker);
                if ((input.excludefromMapBound || 0) == 0) {
                    bounds.extend(tt.LngLat.convert(input.position));
                    if (input.viewport) {
                        input.viewport.forEach(function (viewport) {
                            bounds.extend(tt.LngLat.convert(viewport));
                        });
                    }
                }

            }
        }, this);
        this.map.fitBounds(bounds, { duration: 0, padding: 100 });
    }
    findFirstBuildingLayerId() {
       
        var layers = this.map.getStyle().layers;
        for (var index in layers) {
            if (layers[index].type === 'fill-extrusion') {
                return layers[index].id;
            }
        }
        throw new Error('Map style does not contain any layer with fill-extrusion type.');
    }
    getLocations(locations) {
        let resultStr = '';
        let resultArr = [];
        let count = 0;
        locations.forEach(function (loc) {
            if (loc.position) {
                count += 1;
                resultArr.push(loc.position);
                resultStr += loc.position.lng + ',' + loc.position.lat + ':';
            }
        });
        resultStr = resultStr.substring(0, resultStr.length - 1);
        return {
            str: resultStr,
            count: count,
            arr: resultArr
        };
    }
    getMarkerLocations() {
        let resultStr = '';
        let resultArr = [];
        let count = 0;
        markerInputs.forEach(function (markerInput) {
            if (markerInput.position) {
                count += 1;
                resultArr.push(markerInput.position);
                resultStr += markerInput.position.lng + ',' + markerInput.position.lat + ':';
            }
        });
        resultStr = resultStr.substring(0, resultStr.length - 1);
        return {
            str: resultStr,
            count: count,
            arr: resultArr
        };
    }
    createWaypointMarkerHeaderHtml(thismarker) {
        let poi = thismarker.poi;
        if (typeof poi === 'undefined') {
            return '';
        }
       

        if (typeof poi.name === 'undefined' ) {
            return `
            <div class="z-highlight mt-4 mb-2 p-2">
            <table class="table table-sm table-borderless">
            <tbody>
            <tr>
            </tr>
            </tbody>
            <td width="60%">
            No stop found around this spot. You most probably have to drive through or search for stops with a different search criteria.
            </td>
            <td style="text-align:right"  width="10%">
            <button type="button" id="" class="btn-close"  aria-label="Close"></button>
            </td> 
            </div>
            `;
        }


        let buttonhtml = '';
        if (thismarker.wasThisPOISelected) {
            buttonhtml = `
        <i class="bi bi-check-circle-fill text-success" style="font-size:2rem"></i>
        <span class="font-size-7"> You have already selected this stop </span>
        `;
        } else {
            buttonhtml = `<button type="button" class="btn btn-primary mt-4 usermap-output-stopherebtn"> Stop Here</button>`;
        }

        return `
    <div class="z-highlight mt-4 mb-2 p-2"> 
    
    <table class="table table-sm table-borderless">
    <tbody>
    <tr>
    <td width="60%">
      <div class="ms-2 me-auto" style="text-align:left">
      <div class="font-size-6">${poi.name}</div>
      <div class="font-size-7">${poi.location?.display_address.join(
            " "
        )}</div>
      <div class="font-size-7">${poi.categories?.reduce(
            (accumulator, curr) => {
                return (
                    accumulator + (accumulator == "" ? "" : ", ") + curr.title
                );
            },
            ""
        )}</div>
     <span class="font-size-7">  ${poi.rating || "0"}&nbsp;<i class="bi bi-star-fill"></i> (${poi.review_count || "0"}) on <a href="${poi.url}" target="_blank" >Yelp</a></span>
      </div>
    </td>
    <td style="text-align:right" width="10%">
      <span class="ms-1 badge text-bg-secondary">${(
                poi.distance * METERTOMILE
            ).toFixed(2)} miles </span>
    </td>
    <td style="text-align:right"  width="20%">
      <span class="badge text-bg-primary">${poi.price || ""}</span>
    </td> 
    <td style="text-align:right"  width="10%">
    <button type="button" id="" class="btn-close"  aria-label="Close"></button>
    </td> 
    </tr>  


    <tr>
    <td width="60%" style="text-align:left">
    ${buttonhtml}
    </td>
    <td width="10%"></td>
    <td width="20%"></td>
    <td width="10%"></td>
    </tr>
    </tbody>
    </table> 
    </div>
    `;
    }
    waypointMarker(index, total, thismarker) {
        let container = document.createElement('div');
        container.className += markerInputs[index].markerClass || 'waypoint-marker';

        let number = document.createElement('div');
        number.innerText = markerInputs[index].markerText;
        container.addEventListener("click", (event) => {
            this.highlightthiselement(event.target, 'waypoint-marker-small-blue-highlight');
            if (event.target.closest("#usermap-output-outer")) {
                let maphead = event.target.closest("#usermap-output-outer").querySelector("#usermap-output-header");
                maphead.innerHTML = this.createWaypointMarkerHeaderHtml(thismarker);
                maphead.setAttribute('x-stopindex', thismarker.stopindex);
                maphead.setAttribute('x-poioffset', thismarker.poioffset);
                maphead.setAttribute('x-poiindex', thismarker.poiindex);
                maphead.querySelector('.btn-close').addEventListener('click', function (event) {
                    event.target.closest('#usermap-output-header').innerHTML = '';
                });
                //update state upon selection
                // maphead.querySelector('.usermap-output-stopherebtn').addEventListener('click', function(event){
                //     state.stops[thismarker.stopindex].poiselected[0]=thismarker.poioffset;
                //     state.stops[thismarker.stopindex].poiselected[1]=thismarker.poiindex;
                // });
            }

        });
        container.appendChild(number);

        // if (index === 0) {
        //     container.className += ' tt-icon -start -white';
        // } else if (index === total) {
        //     container.className += ' tt-icon -finish -white';
        // } else {
        //     var number = document.createElement('div');
        //     number.innerText = index;
        //     container.appendChild(number);
        // }
        return container;
    }
    updateRoutesBounds(coordinates) {
        var bounds = new tt.LngLatBounds();
        coordinates.forEach(function (point) {
            bounds.extend(tt.LngLat.convert(point));
        });
        if (!bounds.isEmpty()) {
            this.map.fitBounds(bounds, { duration: 0, padding: 100 });
        }
    }
}



RoutingService.prototype.getLocations = function() {
    let resultStr = '';
    let resultArr = [];
    let count = 0;
    routingInputs.forEach(function(routingInput) {
        if (routingInput.position) {
            count += 1;
            resultArr.push(routingInput.position);
            resultStr += routingInput.position.lng + ',' + routingInput.position.lat + ':';
        }
    });
    resultStr = resultStr.substring(0, resultStr.length - 1);
    return {
        str: resultStr,
        count: count,
        arr: resultArr
    };
};









// function RoutingInput(options) {
//     this.index = options.index;
//     this.routingService = options.routingService;
//     this.onRemoveBtnClick = options.onRemove.bind(this);
//     this.container = this.createContainer();
//     this.searchBox = this.createSearchBox();
//     this.icon = this.createIconContainer();
//     this.removeButton = this.createRemoveButton();
//     this.container.appendChild(this.icon);
//     this.container.appendChild(this.searchBox);
//     this.container.appendChild(this.removeButton);
// }
// RoutingInput.prototype.createContainer = function() {
//     var container = document.createElement('div');
//     container.className = 'route-input-container';
//     return container;
// };
// RoutingInput.prototype.createSearchBox = function() {
//     var searchBox = new tt.plugins.SearchBox(tt.services, {
//         showSearchButton: false,
//         searchOptions: {
//             key: '<your-tomtom-maps-API-key>'
//         },
//         labels: {
//             placeholder: 'Query e.g. Washington'
//         }
//     });
//     var htmlSearchBox = searchBox.getSearchBoxHTML();
//     document.getElementById('searchBoxesPlaceholder').appendChild(htmlSearchBox);
//     searchBox.on('tomtom.searchbox.resultscleared', this.onResultCleared.bind(this));
//     searchBox.on('tomtom.searchbox.resultsfound', function(event) {
//         handleEnterSubmit(event, this.onResultSelected.bind(this), errorHint);
//     }.bind(this));
//     searchBox.on('tomtom.searchbox.resultselected', function(event) {
//         if (event.data && event.data.result) {
//             this.onResultSelected(event.data.result);
//         }
//     }.bind(this));
//     return htmlSearchBox;
// };
// RoutingInput.prototype.getIconType = function() {
//     var lastIdx = routingInputs.length - 1;
//     switch (this.index) {
//     case 0:
//         return 'start';
//     case lastIdx:
//         return 'finish';
//     default:
//         return 'number';
//     }
// };
// RoutingInput.prototype.getIconClassName = function(iconType) {
//     switch (iconType) {
//     case 'start':
//         return 'tt-icon tt-icon-size icon-spacing-right -start';
//     case 'finish':
//         return 'tt-icon tt-icon-size icon-spacing-right -finish';
//     case 'number':
//         return 'tt-icon-number tt-icon-size icon-spacing-right icon-number';
//     }
// };
// RoutingInput.prototype.createRemoveButton = function() {
//     var button = document.createElement('button');
//     button.className = 'tt-icon icon-spacing-left remove-btn -trash';
//     button.onclick = function(event) {
//         event.preventDefault();
//         this.container.parentNode.removeChild(this.container);
//         routingInputs.splice(this.index, 1);
//         this.onRemoveBtnClick();
//     }.bind(this);
//     return button;
// };
// RoutingInput.prototype.createIconContainer = function() {
//     var icon = document.createElement('div');
//     return icon;
// };
// RoutingInput.prototype.updateIcons = function() {
//     var icon = document.createElement('div');
//     var iconType = this.getIconType();
//     icon.className = this.getIconClassName(iconType);
//     if (iconType === 'number') {
//         var number = document.createElement('div');
//         number.innerText = this.index;
//         icon.appendChild(number);
//     }
//     this.container.replaceChild(icon, this.icon);
//     this.icon = icon;
//     if (routingInputs.length <= 2) {
//         this.removeButton.classList.add('hidden');
//     } else {
//         this.removeButton.classList.remove('hidden');
//     }
// };
// RoutingInput.prototype.onResultCleared = function() {
//     this.position = undefined;
//     this.viewport = undefined;
//     this.routingService.calculateRoute();
// };
// RoutingInput.prototype.onResultSelected = function(result) {
//     this.position = result.position;
//     this.viewport = [result.viewport.topLeftPoint, result.viewport.btmRightPoint];
//     this.routingService.calculateRoute();
// };
// function Panel(routingService) {
//     this.routingService = routingService;
//     this.container = document.getElementById('form');
//     this.createInput();
//     this.createInput();
//     this.createAddButton();
// }
// Panel.prototype.createWaypoint = function() {
//     var length = routingInputs.length;
//     if (length === MAX_ROUTING_INPUTS) {
//         errorHint.setMessage('You cannot add more waypoints in this example, but ' +
//         'the Routing service supports up to 150 waypoints.');
//         return;
//     }
//     var index = length - 1;
//     var routingInput = this.createRoutingInput(index);
//     this.container.insertBefore(routingInput.container, routingInputs[length - 1].container);
//     routingInputs.splice(index, 0, routingInput);
//     this.updateRoutingInputIndexes();
//     this.updateRoutingInputIcons();
// };
// Panel.prototype.createRoutingInput = function(index) {
//     return new RoutingInput({
//         index: index,
//         onRemove: this.onRemoveBtnClick.bind(this),
//         routingService: this.routingService
//     });
// };
// Panel.prototype.createInput = function() {
//     var index = routingInputs.length;
//     var routingInput = this.createRoutingInput(index);
//     this.container.appendChild(routingInput.container);
//     routingInputs.push(routingInput);
//     routingInput.updateIcons();
// };
// Panel.prototype.createAddButton = function() {
//     var button = document.createElement('button');
//     button.appendChild(document.createTextNode('ADD STOP'));
//     button.className = 'tt-button -primary add-stop-btn';
//     button.onclick = function(event) {
//         event.preventDefault();
//         this.createWaypoint();
//     }.bind(this);
//     this.container.appendChild(button);
// };
// Panel.prototype.onRemoveBtnClick = function() {
//     this.updateRoutingInputIndexes();
//     this.updateRoutingInputIcons();
//     this.routingService.calculateRoute();
// };
// Panel.prototype.updateRoutingInputIndexes = function() {
//     routingInputs.forEach(function(routingInput, index) {
//         routingInput.index = index;
//     });
// };
// Panel.prototype.updateRoutingInputIcons = function() {
//     routingInputs.forEach(function(routingInput) {
//         routingInput.updateIcons();
//     });
// };
// var routingService = new RoutingService();
// map.on('load', function() {
//     // routingService.calculateRoute();
// });
// new Panel(routingService);
export { RoutingService };