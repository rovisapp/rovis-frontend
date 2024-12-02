import { store } from "../store/init.js";
import { calculateroute } from "../services/calculateroute.js";
import { poisearch } from "../services/poisearch.js";
const METERTOMILE = 0.000621371;
const MILETOMETER = 1609.34;

class StopListByIndex extends HTMLElement {
  constructor() {
    super();
    this.unsubscribe = null;
    this._stopIdx = -1;
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

  radioselecthandler(){
      
    this.querySelectorAll('.stop-output-table-radio-click')?.forEach(radio => {
      radio.addEventListener('click', async (event)=>{
        const poiidxthatwasclicked =
        event.target.getAttribute("data-idx");
      
      // console.log(poiidxthatwasclicked);
      const offset = poiidxthatwasclicked.split("-")[1];
      const poiidx = poiidxthatwasclicked.split("-")[2];
      store.dispatch({
        type: "UPDATE_POISELECTIONFORSTOP",
        payload: {
          value: [Number(offset), Number(poiidx)],
          property: this._stopIdx,
        },
      });
      await  calculateroute(0);
    });
  })
  }

radiuschangehandler = async(event)=>{
    console.log('here')
        const state = store.getState();
        const currentdisplayradiusrequestedinmiles = event.target
          .closest(".stop-output-searchwithinmilesinputgroup")
          .querySelector(".stop-output-searchwithinmilesinputtxt").value;

        const newradius = parseInt(currentdisplayradiusrequestedinmiles);
        const changeinradius = newradius - state.stops[this._stopIdx].poisearchradiusinmiles;
      
        // update poisearchradiusinmiles in state.stops
        store.dispatch({
          type: "UPDATE_POISEARCHRADIUSFORSTOP",
          payload: {
            value: newradius,
            property: this._stopIdx,
          },
        });

        await poisearch(this._stopIdx,changeinradius);
      
  }

  loadmorehandler = async(event)=>{
    console.log('here')
        const state = store.getState();
        

        await poisearch(this._stopIdx,0,1);
      
  }

  bindEvents() {
    this.radioselecthandler();
    this.querySelector(".stop-output-table-searchwithinmilesbtn")?.addEventListener("click", (event)=>this.radiuschangehandler(event));
    this.querySelector(".stop-output-table-loadmorebtn")?.addEventListener("click", (event)=>this.loadmorehandler(event));

  }

  getStopTagBuilder(numericStopId){
    let optionsComponent = document.createElement('tag-builder');
        optionsComponent.stopId = numericStopId;
        // Create a container to temporarily hold the element
    let container = document.createElement('div');
    container.appendChild(optionsComponent);
       // Return the outer HTML of the container which includes the custom element
       return container.innerHTML;
  }

  getNumberofpoiOptions(thisStop){
    let numberofpoiOptions =  thisStop.poisearchbyoffsetarray.reduce(
      (accumulator, currentvalue) => {
        return accumulator + currentvalue.length;
      },
      0
    );

    return numberofpoiOptions;
  }

  getStopHeader(thisStop, numericStopId) {
    let stopHasOptions =
    thisStop.poiselected[0] >= 0 && thisStop.poiselected[1] >= 0;
  let numberofpoiOptions = this.getNumberofpoiOptions(thisStop);

  

  let stoplisthtml = (stopHasOptions && numberofpoiOptions >0)
    ? `<div class="text-primary justify-content-start font-size-7"> 
    Showing ${numberofpoiOptions} ${thisStop.type.join(' and ')} option(s) for stop ${numericStopId + 1} that are nearest to the route, within search radius of ${thisStop.poisearchradiusinmiles || 5 } miles.</fiv>`
    : (
      thisStop.type.includes('userdefined')? 
      `<div class="text-primary justify-content-start font-size-7"> You requested a stop at ${thisStop?.address?.freeformAddress}.</div>` :
    `<h6> No stop options found </h6>`);

  return stoplisthtml;
  }

  getSearchRadiusFilter(thisStop, numericStopId){
    
    return `
    <div class="stop-output-searchwithinmilesinputgroup input-group input-group-sm mt-1 mb-1">
    <span class='input-group-text' style='width:50%'>Search Radius</span>
    <input type='text' class='form-control stop-output-searchwithinmilesinputtxt' style='width:5%' value="${thisStop.poisearchradiusinmiles || 5}"/>
    <span class='input-group-text' style='width:20%'>miles</span>
    <button class='btn  btn-sm btn-outline-primary stop-output-table-searchwithinmilesbtn' style='width:20%'  data-idx="${numericStopId}">Update</button>
    </div>`
  }

  getLoadMoreEle(thisStop, numericStopId){
    let numberofpoiOptions = this.getNumberofpoiOptions(thisStop);
    
    return `<div>
    <button class="btn btn-sm btn-primary mb-1 stop-output-table-loadmorebtn" data-idx="${numericStopId}" >
    ${(numberofpoiOptions ==0 || thisStop.poisearchexpandradius == 1?'No results found. Expand search over next 5 miles':'Load More')}
    </button></div>`;
  }

  getStopListings(thisStop){
    let stoplisthtml = `<div class='col' id='stop-output'>
    <table class="table table-striped table-sm" id="stop-output-table"><tbody>`;
    thisStop.poisearchbyoffsetarray.map((poisInthisOffset, idx) => {
      poisInthisOffset.map((eachpoi, idx1) => {
        let radiochecked =
          thisStop.poiselected[0] == idx && thisStop.poiselected[1] == idx1
            ? "checked"
            : "";
        stoplisthtml += `
          <tr>
          <td width="10%">
            <div class="form-check">
              <input class="form-check-input stop-output-table-radio-click" style="border: 1px solid black;" type="radio" ${radiochecked} name="stop-output-table-radio-click" data-idx="poi-${idx}-${idx1}">
            </div>
          </td>
          <td width="60%">
            <div class="ms-2 me-auto" style="text-align:left">
            <div class="font-size-6">${eachpoi.name}</div>
            <div class="font-size-7">${eachpoi.location.display_address.join(
              " "
            )}</div>
            <div class="font-size-7">${eachpoi.categories.reduce(
              (accumulator, curr) => {
                return (
                  accumulator + (accumulator == "" ? "" : ", ") + curr.title
                );
              },
              ""
            )}</div>
           <span class="font-size-7">  ${
             eachpoi.rating || "0"
           }&nbsp;<i class="bi bi-star-fill"></i> (${
          eachpoi.review_count || "0"
        }) on <a href="${eachpoi.url}" target="_blank" >Yelp</a></span>
            </div>
          </td>
          <td style="text-align:right">
            <span class="ms-1 badge text-bg-secondary">${(
              eachpoi.distance * METERTOMILE
            ).toFixed(2)} miles </span>
          </td>
          <td style="text-align:right">
            <span class="badge text-bg-primary">${eachpoi.price || ""}</span>
          </td> 
        
          </tr>   
          `;
      });
    });

    stoplisthtml += "</table></div>";
    return stoplisthtml;
  }

  render() {
    
    const state = store.getState();
    
    let stoplisthtml='';
    if (state.stops.length <= 0) {
      return;
    }
    if (state.stopSelected==='-1'){
      return;
    }
    let numericStopId = Number(state.stopSelected);
    if (!Number.isInteger(numericStopId) || numericStopId < 0){
      return;
    }
    this._stopIdx = numericStopId;
    console.log("rendering StopListByIndex");
    let thisStop = state.stops[numericStopId];
    
    
    stoplisthtml += this.getStopHeader(thisStop, numericStopId);
    if (!thisStop.type.includes('userdefined')){
      stoplisthtml +=this.getSearchRadiusFilter(thisStop, numericStopId);
      stoplisthtml +=this.getStopTagBuilder(numericStopId);
      stoplisthtml +='<tag-builder-list></tag-builder-list>';
      stoplisthtml += this.getStopListings(thisStop);
      stoplisthtml += this.getLoadMoreEle(thisStop, numericStopId);
    }

    
    this.innerHTML = stoplisthtml;

    this.bindEvents();
  }

  subscribe() {
    this.unsubscribe = store.subscribe(() => this.render());
  }
}

customElements.define("stop-list-by-index", StopListByIndex);
