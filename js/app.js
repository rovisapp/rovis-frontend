// python3 -m http.server 80
import { placeSearch } from "./services/placesearch.js";
import { store } from "./store/init.js";
import { calculateroute } from "./services/calculateroute.js";
import { calculatestops } from "./services/calculatestops.js";
function bindEvents(){
  document.getElementById('template-userfilter-roadtrip-route-btn').addEventListener('click', async()=>{
   await  calculateroute(1);
  await calculatestops();
  await  calculateroute(0);
  })
}
//apply defaults - Start
async function applydefaults(){
  if (window.config.ISPROD==1){
  return;
  }
    const state = store.getState();
    let placeIdarray = [];
    let startplacestring = "134 Hartsville-New Marlboro Road, New Marlborough, MA 01230";
        let endplacestring = "26 E Chestnut St, Lancaster, PA 17602";
        await Promise.all(Array.from(document.querySelectorAll("place-search")).map(async (p) => {
        
        if (p.getAttribute("stop-label") == "Start") {
          p.querySelector("input").value = startplacestring;
          p.setAttribute("data-searchstr", startplacestring);
      
          let startplaces = await placeSearch(startplacestring);
          state.places.set(startplaces[0].id,startplaces[0]);
          
          p.setAttribute("data-placeidx", startplaces[0].id);
          placeIdarray.push(startplaces[0].id);
         p.render();
        }
      
        else if (p.getAttribute("stop-label") == "End") {
            console.log(p.querySelector("input"))
          p.querySelector("input").value = endplacestring;
          p.setAttribute("data-searchstr", endplacestring);
      
          let endplaces = await placeSearch(endplacestring);
          
          state.places.set(endplaces[0].id,endplaces[0]);
          p.setAttribute("data-placeidx", endplaces[0].id);
          placeIdarray.push(endplaces[0].id);
          
          p.render();
        }
      }));
      state.placesSelected = placeIdarray
      state.from =  placeIdarray.length>0?placeIdarray[0]:'' //first element
      state.to = placeIdarray.length>0?placeIdarray[placeIdarray.length-1]:''//last element
     console.log('applied defaults') 
     console.log(state)
}
//apply defaults - End

const getrestaurantcategories = async function () {
  try {
    const state = store.getState();
    const { data, error } = await axios.get(
      `${window.config.APIDOMAIN}/api/user/restaurantcategories`
    );

    state.restaurantcategories = data;
    return data;
  } catch (error) {
    console.error(JSON.stringify(error.stack));
   
    return {};
  }
};

const getregularcategories = async function () {
  try {
    const state = store.getState();
    const { data, error } = await axios.get(
      `${window.config.APIDOMAIN}/api/user/regularcategories`
    );
    state.regularcategories = data;
    return data;
  } catch (error) {
    console.error(JSON.stringify(error.stack));
 
    return {};
  }
};

await getregularcategories();
await getrestaurantcategories();
applydefaults()   
bindEvents();
      
