import { store } from '../store/init.js';

class DriveOptionsCheckBox extends HTMLElement {
    constructor() {
        super();
        this.unsubscribe = null;
        

    }

    

    
    connectedCallback() {
        this.render();
        this.subscribe();
        this.addEventListener('change', (event) => {
            store.dispatch({
                type: 'MODIFYROUTEDEFAULTS',
                payload : {
                    property: this.getAttribute('state-property'),
                    value: event.target.checked
                }
            });
        });

    }

    disconnectedCallback() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
    }

    render() {
        const state = store.getState();
        let newCheckedOrUnchecked = 'unchecked';
        if(state.routedefaults[this.getAttribute('state-property')]==true){
            newCheckedOrUnchecked = 'checked';
        }
        this.innerHTML = `
        <div class='input-group input-group-sm mb-2 mt-4'>
        <div class="input-group-text" style='width:100%'>
        <div class="form-check">
            <label class="form-check-label">
            ${this.getAttribute('label-end')}
            <input class="form-check-input" type="checkbox" value=""  ${newCheckedOrUnchecked}/>
            </label>
          </div>
        </div>
    </div>
    `;
    }

    subscribe() {
        this.unsubscribe = store.subscribe(() => this.render());
    }
}

customElements.define('drive-options-checkbox', DriveOptionsCheckBox);
