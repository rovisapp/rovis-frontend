import { store } from "../store/init.js";
import { poisearch } from "../services/poisearch.js";

class TagBuilder extends HTMLElement {
  constructor() {
    super();
    this.unsubscribe = null;
    this._stopIdx = -1;
  }

  connectedCallback() {
    this.render();
    this.subscribe();
    this.addEventListener("EVT_TagBuilderList",  async (event) =>
       await this.handleChildEvent(event)
    );
  }

  disconnectedCallback() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
  async handleChildEvent(event) {
    console.log(event.detail);
    await this.updatePOISearchTagsinState(event.detail.selectedtag);
  }

  async updatePOISearchTagsinState(stoptagthatwasclicked) {
    if (this._stopIdx === -1){
      return;
    }
    const state = store.getState();
    let poisearchtags = state.stops[this._stopIdx].poisearchtags || new Set();
    if (poisearchtags.has(stoptagthatwasclicked)) {
      return;
    }

    store.dispatch({
      type: "UPDATE_SEARCHEDTAGINSTOP",
      payload: {
        value: stoptagthatwasclicked,
        property: this._stopIdx,
      },
    });
    await poisearch(this._stopIdx);
    this.render();
  }

  getPromptedTags(searchedTag) {
    const state = store.getState();

    let promptedtags = [];
    const allsearchcategories = [
      ...state.regularcategories,
      ...state.restaurantcategories,
    ];
    allsearchcategories.map((opt) => {
      if (searchedTag == "") {
        promptedtags.push(opt.title);
      } else if (
        opt.title.toLowerCase().search(searchedTag.toLowerCase()) >= 0
      ) {
        promptedtags.push(opt.title);
      }
    });
    return promptedtags;
  }

   bindNewTagSearchEvent(event) {
    const state = store.getState();
    let searchedtagstring = event.target.value;

    // Remove existing 'tag-builder-list' if it exists
    const existingTagBuilderList = this.querySelector("tag-builder-list");
    if (existingTagBuilderList) {
      this.removeChild(existingTagBuilderList);
    }

    // Create a new 'tag-builder-list'
    if (searchedtagstring != "") {
      let tagbuilderListComponent = document.createElement("tag-builder-list");
      tagbuilderListComponent.matchedelements =
        this.getPromptedTags(searchedtagstring);
      this.appendChild(tagbuilderListComponent);
    }

    
    
  }

  async bindDeleteTagEvent(event) {
    console.log('in bindDeleteTagEvent');
    const state = store.getState();
    let stoptagthatwasclicked = event.target.getAttribute("data-idx");
    console.log(stoptagthatwasclicked)
    if (state.stops[this._stopIdx].poisearchtags.size >= 0) {
      store.dispatch({
        type: "DELETE_SEARCHEDTAGINSTOP",
        payload: {
          value: stoptagthatwasclicked,
          property: this._stopIdx,
        },
      });
    }
    event.target.closest(".tagbadge")?.remove();

    await poisearch(this._stopIdx);
    this.render();
  }

  bindEvents() {
    this.querySelector(`input`).addEventListener("input", (event) => {
        this.bindNewTagSearchEvent(event);
    });
    this.querySelectorAll(".tagclosebtn").forEach((tag) => {
      tag.addEventListener("click", (event) => {
        this.bindDeleteTagEvent(event);
      });
    });
  }


  drawBadge(badgename) {

    let tbadge =
     `<span class="badge text-bg-primary tagbadge" style = "margin:0.5em">
    ${badgename} 
    <button type="button" class="btn-close tagclosebtn" data-idx="${badgename}" aria-label="Close"></button>
    </span>`;

    return tbadge;
  }

  getFilterByText(){
    const state = store.getState();
    let thistop = state.stops[this._stopIdx];
    thistop.poisearchtags = thistop.poisearchtags || new Set();

    let showallstring = 'Filtered by :  ';
    let showallarr = [];

    if ( thistop.type.includes('meal') && thistop.poisearchtags.size==0){
      showallarr.push('All Restaurants')
    } 
    if (thistop.type.includes('rest') && thistop.poisearchtags.size==0){
      showallarr.push('All Resting Places')
    }
    if (thistop.type.includes('day') && thistop.poisearchtags.size==0){
      showallarr.push('All Hotels')
    }

    if (thistop.poisearchtags.size>0 ){
      [...thistop.poisearchtags].map((t)=>{
        showallarr.push(t);
      })
    }
    
    let showallrestresults = showallstring+showallarr.join(' | ') ;
    return showallarr.length>0?showallrestresults:'';
  }

  render() {
    const state = store.getState();
    
    if (state.stopSelected === "-1") {
      return;
    }
    let numericStopId = Number(state.stopSelected);
    if (!Number.isInteger(numericStopId) || numericStopId < 0) {
      return;
    }
    this._stopIdx = numericStopId;

    let badgesHTML = '';
    //Draw badges
    let initbadges = state.stops[this._stopIdx].poisearchtags||new Set();
    if(initbadges.size>0){
      for (const tbadge of initbadges){
        badgesHTML+=this.drawBadge(tbadge);
      }
      
    }

    this.innerHTML = `
    <div class = "searchwithstops-div1" style="margin:0.5em 0 0.5em 0">
    <div class="searchwithstops-div2 justify-content-start" style="border: var(--bs-border-width) solid var(--bs-border-color); border-radius: 0.25em; padding:0.25em">
    ${badgesHTML}
    <input class="searchwithstops-input" style="border:0px; outline:none; width:100%" placeholder="Type to search..."></input>
    <button class='btn  btn-sm btn-outline-primary searchwithstops-updatebtn' style='width:20%; margin-bottom:0.5em'>Update</button>
    </div>
    </div>
    <div class="searchwithstops-div3 d-flex text-primary justify-content-start font-size-7">${this.getFilterByText()}</div>`;

    this.bindEvents();
  }

  subscribe() {
    this.unsubscribe = store.subscribe(() => this.render());
  }
}

customElements.define("tag-builder", TagBuilder);
