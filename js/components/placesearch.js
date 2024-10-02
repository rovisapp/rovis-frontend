import { store } from '../store/init.js';
import {placeSearch} from '../services/placesearch.js'

class PlaceSearch extends HTMLElement {
    constructor() {
        super();
        this.unsubscribe = null;
        this.currentValue = null;
    }
   
  
    connectedCallback() {
        this.render();
        this.subscribe();
        this.addEventListener('EVT_PlaceList', (event)=>this.handleChildEvent(event));

       
    }

  

    disconnectedCallback() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
    }
    

    handleChildEvent(event){
        console.log(event.detail)
        this.setAttribute('data-placeidx', event.detail.placeId);
        this.render();
        this.updatePlaceinState()
    }


    addBlankPlace(){
    const newPlace = document.createElement('place-search');  
    newPlace.setAttribute('data-placeidx', '0');
    newPlace.setAttribute('stop-label','Through');
    newPlace.setAttribute('show-add','true');
    newPlace.setAttribute('show-remove','true');
    this.insertAdjacentElement('afterend', newPlace);
    }

    removePlace(){
        this.updatePlaceinState(this.getAttribute('data-placeidx'));
        this.remove();
    }

    updatePlaceinState(placeIdToRemove=null){
        let getAllSelectedPlaces = [];
        this.parentNode.querySelectorAll('place-search').forEach((p)=>{
            let placeId = p.getAttribute('data-placeidx');
            if (placeId !=='0' && placeId!=placeIdToRemove){
                getAllSelectedPlaces.push(placeId);
            }
        });
        
            store.dispatch({
                type: 'UPDATE_SELECTEDPLACES',
                payload : {
                    value: getAllSelectedPlaces
                }
            });

            store.dispatch({
                type: 'RESET_STOPS',
                
            });
    }

    async searchPlace(){
        let searchResults = await placeSearch(this.currentValue);
        searchResults.map(place=>{
            store.dispatch({
                type: 'UPDATE_KNOWNPLACES',
                payload : {
                    property: place.id,
                    value: place
                }
            });
        })
        
        let optionsComponent = document.createElement('place-options');
        optionsComponent.items = searchResults;
        this.appendChild(optionsComponent);
        
    }

    bindEvents(){
        this.querySelector(`input`).addEventListener('change', (event)=>this.currentValue=event.target.value);
        this.querySelector('.btn-searchplace').addEventListener('click', ()=>this.searchPlace());
        this.querySelector('.btn-addblankplace')?.addEventListener('click',()=>this.addBlankPlace());
        this.querySelector('.btn-removeplace')?.addEventListener('click',()=>this.removePlace());
        
    }

    render() {
        
        const state = store.getState();
        this.currentValue = state.places.get(this.getAttribute('data-placeidx'))?.address?.freeformAddress || '';
        this.innerHTML =
         `
        <div class='input-group input-group-sm mb-2'>
        <span class='input-group-text' style='width:15%'>${this.getAttribute('stop-label')}</span>
        <input type='text' class='form-control'  value="${this.currentValue}">
        <button class='btn  btn-sm btn-outline-secondary btn-searchplace me-1'  type='button'><i class='bi bi-search'></i></button>
        ${(this.getAttribute('show-add')=='true')?`<button class='btn  btn-sm btn-primary me-1 btn-addblankplace'  type='button'><i class='bi bi-plus-lg'></i></button>`:''}
        ${(this.getAttribute('show-remove')=='true')?`<button class='btn  btn-sm btn-primary me-1 btn-removeplace'  type='button'><i class='bi bi-dash-lg'></i></button>`:''}
        </div>
        `
        this.bindEvents()
    }

    subscribe() {
        this.unsubscribe = store.subscribe(() => this.render());
    }
}

customElements.define('place-search', PlaceSearch);
