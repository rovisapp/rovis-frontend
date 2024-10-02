import { store } from '../store/init.js';

class DriveOptionsStartEndDateChoice extends HTMLElement {
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

    bindEvents(){
        this.querySelector('#template-userfilter-startenddate').addEventListener('change', (event) => {
            
            store.dispatch({
                type: 'MODIFYROUTEDEFAULTS',
                payload : {
                    property: 'tripstartenddate',
                    value: event.target.value
                }
            });
            
        });
    

    this.querySelector('#template-userfilter-startendtime').addEventListener('change', (event) => {
            
        store.dispatch({
            type: 'MODIFYROUTEDEFAULTS',
            payload : {
                property: 'tripstartendtime',
                value: event.target.value
            }
        });
     
    });
    
    this.querySelector('#template-userfilter-startenddatechoice').addEventListener('change', (event) => {
            
        store.dispatch({
            type: 'MODIFYROUTEDEFAULTS',
            payload : {
                property: 'startenddatechoice',
                value: event.target.value
            }
        });
     
    });
    }

    render() {
        const state = store.getState();
        
        this.innerHTML = `
        <div class='input-group input-group-sm mb-1'>
        <select class="form-select" id='template-userfilter-startenddatechoice' aria-label="Start / End Time">
            <option ${state.routedefaults.startenddatechoice=='Start at'?'Selected':''} value="Start at">Start at</option>
            <option ${state.routedefaults.startenddatechoice=='End by'?'Selected':''} value="End by">End by</option>
        </select>
        <input class='form-control' style='width:15%' type="date" id='template-userfilter-startenddate' value="${state.routedefaults.tripstartenddate}">
        <input class='form-control' style='width:17%' type="time" id='template-userfilter-startendtime' value="${state.routedefaults.tripstartendtime}">
        </div>
    `;
    this.bindEvents();
    }

    subscribe() {
        this.unsubscribe = store.subscribe(() => this.render());
    }
}

customElements.define('drive-options-start-end-choice', DriveOptionsStartEndDateChoice);
