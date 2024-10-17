import { store } from "../store/init.js";
const METERTOMILE = 0.000621371;
const MILETOMETER = 1609.34;

class StopListAll extends HTMLElement {
  constructor() {
    super();
    this.unsubscribe = null;
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

  bindEvents() {
    this.querySelectorAll(".stop-output-table-allpagelist-select")?.forEach(
      (anchor) => {
        anchor.addEventListener("click", (event) => {
          let stopselectedpage = "-1";
          stopselectedpage = event.target
            .getAttribute("data-idx")
            .split("-")[1];
          store.dispatch({
            type: "UPDATED_SELECTEDSTOP",
            payload: {
              value: stopselectedpage,
            },
          });
        });
      }
    );
  }

  render() {
    const state = store.getState();

    if (state.places.size === 0) {
      return;
    }

    if (Object.keys(state.stopIntervalsStartEndTimes).length === 0) {
      return;
    }

    if (state.stopSelected !== "-1") {
      return;
    }
    console.log("rendering StopListAll");
    let stoplisthtml = '';
    if (state.iswaitingfor.calculateroute==1 || state.iswaitingfor.calculatestops==1){
      stoplisthtml = 'Calculating stops, please wait .. '
    } else {
      stoplisthtml = `<h6>You have ${
        state.stops.length <= 0 ? "no" : state.stops.length
      } stops </h6>`;
    }
    

    // Table header
    // Start Table Body
    // Display trip starting location
    stoplisthtml += `
    <table class="table table-striped table-sm"><tbody><tr>
    <td width="10%">
    <div class="ms-2 me-auto font-size-7" style="text-align:left"> Trip starting
    </div>
    </td>
    <td width="60%">
    <div class="ms-2 me-auto font-size-6" style="text-align:left"> ${
      state.places.get(state.from)?.address.freeformAddress
    } </div>
    <div class="ms-2 font-size-7-5 mt-2" style="text-align:left">
    Depart: ${new Date(
      state.stopIntervalsStartEndTimes.actual.start
    ).toLocaleString()} 
    </div>
    </td>
    <td></td>
    </tr></tbody></table>`;

    // Loop through each stop and add to table row
    stoplisthtml += `<table class="table table-striped table-sm"  id="stop-output-table"><tbody>`;

    state.stops.map((eachStop, idx) => {
      // console.log('Stop:', idx);
      let arriveDate = "";
      let departDate = "";
      // console.log('Arrive:', arriveDate.toLocaleString());
      // console.log('Depart:', departDate.toLocaleString());

      if (
        typeof state.stopIntervalsStartEndTimes.stopIntervalsStartEndTimes[
          idx
        ] !== "undefined" &&
        typeof state.stopIntervalsStartEndTimes.stopIntervalsStartEndTimes[idx]
          .arrive !== "undefined"
      ) {
        arriveDate = new Date(
          state.stopIntervalsStartEndTimes.stopIntervalsStartEndTimes[
            idx
          ].arrive
        );
        arriveDate = arriveDate.toLocaleString();
      }

      if (
        typeof state.stopIntervalsStartEndTimes.stopIntervalsStartEndTimes[
          idx
        ] !== "undefined" &&
        typeof state.stopIntervalsStartEndTimes.stopIntervalsStartEndTimes[idx]
          .depart !== "undefined"
      ) {
        departDate = new Date(
          state.stopIntervalsStartEndTimes.stopIntervalsStartEndTimes[
            idx
          ].depart
        );
        departDate = departDate.toLocaleString();
      }

      let stoptypehtml = "";
      eachStop.type.map((stoptype) => {
        if (stoptype == "meal") {
          stoptypehtml += 'Meal <i class="bi bi-cup-straw"></i>';
        } else if (stoptype == "day") {
          stoptypehtml += 'Night <i class="bi bi-moon-fill"></i>';
        } else if (stoptype == "rest") {
          stoptypehtml += 'Rest <i class="bi bi-stopwatch"></i>';
        } else if (stoptype == "userdefined") {
          stoptypehtml += "** You Requested **";
        }
        // console.log(stoptypehtml)
      });
      // If this stop is userdefined
      if (eachStop.type.includes("userdefined")) {
        stoplisthtml += `
          <tr>
          <td width="10%">
          <div class="ms-1 badge text-bg-secondary">${idx + 1}</div>
          
          </td>
          <td width="60%" style="text-align:left">
          <div class="font-size-6">${eachStop.address.freeformAddress}</div>
          <div class="font-size-7"><em>You requested a stop here</em></div>
          <div class="font-size-7-5 mt-2">
           ${arriveDate != "" ? "Arrive: " + arriveDate : ""} </div> 
          <div class="font-size-7-5">
          ${departDate != "" ? "Depart: " + departDate : ""}
         </div>
          </td>
          <td></td>
          <td></td>
          </tr>
          `;
      }
      // If this stop has POIs found, show the first POI for this stop
      else if (eachStop.poisearchbyoffsetarray.length > 0) {
        let selectedPoiOffsetForThisStop =
          eachStop.poisearchbyoffsetarray[eachStop.poiselected[0]];
        if (
          typeof selectedPoiOffsetForThisStop !== "undefined" &&
          selectedPoiOffsetForThisStop.length > 0
        ) {
          let selectedPoiForThisStop =
            selectedPoiOffsetForThisStop[eachStop.poiselected[1]];

          stoplisthtml += `
          <tr>
          <td width="10%">
          <div class="ms-1 badge text-bg-secondary">${idx + 1}</div>
          <a href='#' class="m-1  stop-output-table-allpagelist-select" data-idx="poiallpagelistselect-${idx}" >Edit</a>
          </td>
          <td width="60%">
            <div class="ms-2 me-auto" style="text-align:left">
            <div class="font-size-6">${selectedPoiForThisStop.name}</div>
            <div class="font-size-7">${selectedPoiForThisStop.location.display_address.join(
              " "
            )}</div>
            <div class="font-size-7">${selectedPoiForThisStop.categories.reduce(
              (accumulator, curr) => {
                return (
                  accumulator + (accumulator == "" ? "" : ", ") + curr.title
                );
              },
              ""
            )}</div>
           <span class="font-size-7">  ${
             selectedPoiForThisStop.rating || "0"
           }&nbsp;<i class="bi bi-star-fill"></i> (${
            selectedPoiForThisStop.review_count || "0"
          }) on <a href="${
            selectedPoiForThisStop.url
          }" target="_blank" >Yelp</a></span>
          <div class="font-size-7-5 mt-2">
           ${arriveDate != "" ? "Arrive: " + arriveDate : ""} </div> 
          <div class="font-size-7-5">
          ${departDate != "" ? "Depart: " + departDate : ""}
           </div>
            </div>
            
          </td>
          <td style="text-align:right">
            <span class="ms-1 badge text-bg-secondary">${(
              selectedPoiForThisStop.distance * METERTOMILE
            ).toFixed(2)} miles </span>
            <span>${stoptypehtml}</span>
          </td>
          <td style="text-align:right">
            <span class="badge text-bg-primary">${
              selectedPoiForThisStop.price || ""
            }</span>
          </td> 
        
          </tr>   
          `;
        }
      } else {
        // If this stop has no POI found, display message
        let stopNotFoundMessage = "";
        if (typeof eachStop.tags !== "undefined") {
          let searchtags = eachStop.tags.reduce((accumulator, curr) => {
            return accumulator + (accumulator == "" ? "" : ", ") + curr;
          }, "");
          stopNotFoundMessage = `A location of style ${searchtags}`;
        } else {
          stopNotFoundMessage = `A location`;
        }
        stopNotFoundMessage += ` was not found within ${
          eachStop.poisearchradiusinmiles
        } miles, at the estimated arrival time of ${new Date(
          state.stopIntervalsStartEndTimes.stopIntervalsStartEndTimes[
            idx
          ].arrive
        ).toLocaleString()}. It is possible that locations may be closed at this time. You can try again by editing the stop and expanding the search area.`;
        stoplisthtml += `
          <tr>
          <td width="10%">
          <div class="ms-1 badge text-bg-secondary">${idx + 1}</div>
          <a href='#' class="m-1  stop-output-table-allpagelist-select" data-idx="poiallpagelistselect-${idx}" >Edit</a>
          </td>
          <td width="60%">
          <div class="font-size-7-5 bg-warning p-1" style="text-align:left"> <em>${stopNotFoundMessage}</em></div>
          
          </td>
          <td style="text-align:right"><span>${stoptypehtml}</span></td>
          <td></td>
          </tr>
          `;
      }
    });

    stoplisthtml += "</tbody></table>";
    // End Table

    // Start new Table to display Trip ending location

    stoplisthtml += `
    <table class="table table-striped table-sm"><tbody><tr>
    <td width="10%">
    <div class="ms-2 me-auto font-size-7" style="text-align:left"> Trip ending
    </div>
    </td>
    <td width="60%">
    <div class="ms-2 me-auto font-size-6" style="text-align:left"> ${
      state.places.get(state.to)?.address.freeformAddress
    } </div>
    <div class="ms-2 font-size-7-5 mt-2" style="text-align:left">
    Depart: ${new Date(
      state.stopIntervalsStartEndTimes.actual.end
    ).toLocaleString()} 
    </div>
    </td>
    <td></td>
    </tr></tbody></table>`;

    this.innerHTML = stoplisthtml;

    this.bindEvents();
  }

  subscribe() {
    this.unsubscribe = store.subscribe(() => this.render());
  }
}

customElements.define("stop-list-all", StopListAll);
