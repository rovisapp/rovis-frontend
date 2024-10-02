import { store } from "../store/init.js";
const METERTOMILE = 0.000621371;
const MILETOMETER = 1609.34;

class StopList extends HTMLElement {
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

  redrawListAllStops(state){
    // Remove any existing stop-list-all elements if state.stopSelected != '-1'
    if (state.stopSelected != '-1') {
      const existingListAllEle = this.querySelector('stop-list-all');
      if (existingListAllEle) {
        this.removeChild(existingListAllEle);
      }
    } else {
      // Append the new stop-list-all element only if it's not already present
      if (!this.querySelector('stop-list-all')) {
        const listAllEle = document.createElement('stop-list-all');
        this.appendChild(listAllEle);
      }
    }
  }

  redrawListIndexedStops(state){
    // Remove any existing stop-list-by-index elements if state.stopSelected != '-1'
    if (state.stopSelected =='-1' ) {
      const existingListByIndexEle = this.querySelector('stop-list-by-index');
      if (existingListByIndexEle) {
        this.removeChild(existingListByIndexEle);
      }
    } else {
      // Append the new stop-list-by-index element only if it's not already present
      if (!this.querySelector('stop-list-by-index')) {
        const listByIndexEle = document.createElement('stop-list-by-index');
        this.appendChild(listByIndexEle);
      }
    }
  }

  bindEvents() {
    

  }

  render() {
    
    const state = store.getState();
    if (state.places.size===0){
      return;
    }

    if (Object.keys(state.stopIntervalsStartEndTimes).length ===0){
      return;
    }

    
    this.redrawListAllStops(state);
    this.redrawListIndexedStops(state);

    this.bindEvents();
  }

  subscribe() {
    this.unsubscribe = store.subscribe(() => this.render());
  }
}

customElements.define("stop-list", StopList);
