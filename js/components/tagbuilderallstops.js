import { store } from "../store/init.js";


class TagBuilderAllStops extends HTMLElement {
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
    const state = store.getState();
    let poisearchtags = state.routedefaults.mealsearchtags || new Set();
    if (poisearchtags.has(stoptagthatwasclicked)) {
      return;
    }

    store.dispatch({
      type: "UPDATE_SEARCHEDTAGSINALLSTOPS",
      payload: {
        
        value: stoptagthatwasclicked,
      },
    });
  
    this.render();
  }

  getPromptedTags(searchedTag) {
    const state = store.getState();

    let promptedtags = [];
    const foodsearchcategories = [
      ...state.restaurantcategories,
    ];
    foodsearchcategories.map((opt) => {
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
    if (state.routedefaults.mealsearchtags.size >= 0) {
      store.dispatch({
        type: "DELETE_SEARCHEDTAGSINALLSTOPS",
        payload: {
          value: stoptagthatwasclicked,
        
        },
      });
    }
    event.target.closest(".tagbadge")?.remove();

    
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

  render() {
    const state = store.getState();
    let tagsHTML = ''
    //Draw badges
    let initbadges = state.routedefaults.mealsearchtags||new Set();
    if(initbadges.size>0){
      for (const tbadge of initbadges){
        tagsHTML+=this.drawBadge(tbadge);
      }
      
    }

    this.innerHTML = `
    <div class = "searchwithstops-div1" style="margin:0.5em 0 0.5em 0">
    <div class="font-size-6-5 text-start bg-body-secondary border p-1">Dietary Preference</div>
    <div class="searchwithstops-div2 justify-content-start" style=" border: var(--bs-border-width) solid var(--bs-border-color); border-radius: 0.25em; padding-bottom:0.25em">
    ${tagsHTML}
    <input class="searchwithstops-input" style="border:0px; outline:none; width:100%" placeholder="eg, Indian, Chinese etc. Press Route to recalculate."/>
    <!--<button class='btn  btn-sm btn-outline-primary searchwithstops-updatebtn' style='width:20%; margin-bottom:0.5em' >Update</button>-->
    </div>
    </div>
    <div class="searchwithstops-div3 d-flex text-primary justify-content-start font-size-7"></div>`;

    this.bindEvents();
  }

  subscribe() {
    this.unsubscribe = store.subscribe(() => this.render());
  }
}

customElements.define("tag-builder-all-stops", TagBuilderAllStops);
