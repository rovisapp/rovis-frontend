import { store } from '../store/init.js';
import {placeSearch} from '../services/placesearch.js'

class PlaceSearch extends HTMLElement {
    constructor() {
        super();
        this.unsubscribe = null;
        this.currentValue = null;
        this.inputElement = null; // Store reference to the input element

        // Create debounced search function with 500ms delay
        // debouncing to wait for the user to stop typing before making API calls.
        this.debouncedSearch = this.debounce(async (value) => {
            if (value && value.length > 3) {
                await this.searchPlace();
            }
        }, 500);
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
    
    debounce(func, wait) {
        let timeout;
        
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
    
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    handleChildEvent(event){
        const state = store.getState();
        console.log(event.detail);
        this.setAttribute('data-placeidx', event.detail.placeId);
        this.currentValue = state.places.get(event.detail.placeId)?.address?.freeformAddress || '';
        this.setAttribute('data-searchstr', this.currentValue);
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
        // Remove any existing place-options
    const existingOptions = this.querySelector('place-options');
    if (existingOptions) {
        this.removeChild(existingOptions);
    }

        let optionsComponent = document.createElement('place-options');
        optionsComponent.items = searchResults;
        this.appendChild(optionsComponent);
        
    }
    // async autocomplete(){
       
    //     if (this.currentValue.length>3){
    //         this.searchPlace();
    //     }
    // }

    bindEvents(){
        
        this.querySelector(`input`).addEventListener('input',  async(event)=>{
            this.currentValue=event.target.value; 
            this.setAttribute('data-searchstr', this.currentValue);
            
            //  await this.autocomplete();
            // Use debounced search instead of direct search
            this.debouncedSearch(this.currentValue);
             
        });
        this.querySelector('.btn-searchplace').addEventListener('click', ()=>this.searchPlace());
        this.querySelector('.btn-addblankplace')?.addEventListener('click',()=>this.addBlankPlace());
        this.querySelector('.btn-removeplace')?.addEventListener('click',()=>this.removePlace());
        
    }


    render() {
        
        const state = store.getState();
        this.currentValue = this.getAttribute('data-searchstr') || ''; 
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
        // this.unsubscribe = store.subscribe(() => this.render());
        this.unsubscribe = store.subscribe(()=>{});
    }
}

customElements.define('place-search', PlaceSearch);
