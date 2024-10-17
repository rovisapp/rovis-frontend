export async function placeSearch(locationStr) {
    try {
      if (typeof locationStr=='undefined' || locationStr.length <= 0 || locationStr=='') {
        throw "No search string";
      }
      console.log(locationStr)
      const { data, error } = await axios.get(
        `${window.config.APIDOMAIN}/api/user/search?q=${locationStr}`
      );
      
      return data;
    } catch (error) {
      console.error(JSON.stringify(error.stack));
      // showError(`Failed to fetch location.`);
      return [];
    }
  }