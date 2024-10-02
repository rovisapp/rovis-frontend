import { store } from '../store/init.js';

class PlaceOptions extends HTMLElement {
    constructor() {
        super();
        this.unsubscribe = null;
        this._items =[];
    }
    set items(value) {
        this._items = value;
        this.render();
    }
    get items() {
        return this._items;
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
    bindEvents(){
        this.querySelectorAll('a').forEach(anchor => {
            anchor.addEventListener('click', (event)=>{this.selectPlace(event)});
        });
    }

    selectPlace(event){
        let placeId = event.currentTarget.getAttribute('data-idx'); // using event.target wont work because the click may be registered inside a div which is a child of the <a> tag and our eventlistener was on <a> tag
        this.dispatchEvent(new CustomEvent('EVT_PlaceList', { bubbles: true, detail: { placeId: placeId } })); // listener will see the event in event.detail.placeId
        this.remove();
    }

    render() {
        const state = store.getState();
        
        let listhtml =
            ' <div class="font-size-7 text-muted mb-1" style="text-align:left!important">Select one from results below</div><div class="list-group">';

        this._items.map((place) => {
            let poicat = "",
                poiname = "",
                poiphone = "",
                poiurl = "";
            state.places.set(place.id, place);
            if (typeof place.poi !== "undefined") {
                poicat = place.poi.categories.join(" ");
                poiname += place.poi?.name || "";
                poiphone += place.poi?.phone || "";
                poiurl += place.poi?.url || "";
            }
            listhtml += `
       
        <a href="#" class="list-group-item  border-dark-subtle list-group-item-action bg-primary  bg-opacity-25" 
        data-idx="${place.id}" 
        style="text-align:left!important">
        
        <div class="fw-bold">${place.address?.freeformAddress}</div>
        <p class="mb-1">${place.address?.country},&nbsp;${place.address?.countrySubdivisionName || place.address?.countrySubdivision
                }</p>
        <p class="mb-1">${poiname}</p>
        <div class="font-size-7 text-muted">${poicat}</div>
        <div class="font-size-7 text-muted">${poiphone}</div>
        <div class="font-size-7 text-muted">${poiurl}</div>
      </a>
        `;
        });
        listhtml = listhtml + "</div>";
        if (this._items.length>0){
            this.innerHTML = listhtml
        }
    this.bindEvents();
    }

    subscribe() {
        this.unsubscribe = store.subscribe(() => this.render());
    }
}

customElements.define('place-options', PlaceOptions);
