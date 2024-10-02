

export function tomorrowsdate(){
    var tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate()+1);
  
  // let retdate = tomorrow.toISOString().substring(0,10);
  let year = tomorrow.toLocaleString("default", { year: "numeric" });
  let month = tomorrow.toLocaleString("default", { month: "2-digit" });
  let day = tomorrow.toLocaleString("default", { day: "2-digit" });
  
  let retdate = year + "-" + month + "-" + day;
  console.log(retdate);
  return retdate;
  }
// inputs, dt = 1996-12-19, time=16:39:57 or 16:39, 
export function concatdatetimewithT(dt, tm){
  if (tm.includes(':')){
    let splittm = tm.split(':');
    if (splittm.length ==2 ){
      // add seconds to time, since it has only hh:mm
      tm =tm+':00';
    }
    return dt+'T'+tm
  }else {
    return  dt+'T00:00:00'
  }
}


export function isObjectEmpty(objectName){
  return Object.keys(objectName).length === 0;
};