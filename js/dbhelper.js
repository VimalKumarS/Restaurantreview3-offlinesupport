
/**
 * Common database helper functions.
 */
class DBHelper {

  constructor() {
    this.dbPromise = DBHelper.openDatabase()
  }
  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337 // Change this to your server port
    return `http://localhost:${port}/restaurants/`;
  }

  static openDatabase() {
    return idb.open('resaurantdb', 1, (upgradeDatabase) => {
      //upgradeDatabase.deleteObjectStore();
      var store = upgradeDatabase.createObjectStore('restaurants', { keyPath: 'id' });
      store.createIndex('bycusine', 'cuisine_type');
      store.createIndex('byneighborhood', 'neighborhood');
      var storereview = upgradeDatabase.createObjectStore('review', { keyPath: 'id' });
      storereview.createIndex('restaurant_id', 'restaurant_id');
    
      upgradeDatabase.createObjectStore('reviewoffline',{ keyPath: 'updatedAt' });
      upgradeDatabase.createObjectStore('favupdate',{ keyPath: 'id' });
      
    })
  }

  static savedatatodb(restaurants) {
    return DBHelper.openDatabase().then(db => {
      //const restaurants = await DBHelper.fetchRestaurantsFromNetwork();
      const tx =
        db.transaction('restaurants', 'readwrite')
      const store = tx.objectStore('restaurants')
      restaurants.forEach((res) => store.put(res));
      let trxResult = tx.complete;
      return trxResult;
    })
  }

  static fetchAllRestaurant() {
    return fetch(DBHelper.DATABASE_URL)
      .then(response => {
        return response.json().then(res => {
          DBHelper.savedatatodb(res);
          return res;
        })
      }
      );
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    // let xhr = new XMLHttpRequest();
    // xhr.open('GET', DBHelper.DATABASE_URL);
    // xhr.onload = () => {
    //   if (xhr.status === 200) { // Got a success response from server!
    //     const json = JSON.parse(xhr.responseText);
    //     const restaurants = json.restaurants;
    //     callback(null, restaurants);
    //   } else { // Oops!. Got an error from server.
    //     const error = (`Request failed. Returned status of ${xhr.status}`);
    //     callback(error, null);
    //   }
    // };
    // xhr.send();

    return DBHelper.openDatabase().then(db => {
      const tx = db.transaction('restaurants');
      const store = tx.objectStore('restaurants');
      return store.getAll()



    }).then(result => {
      if (result.length) {
        return Promise.resolve(result);

      } else {
        return DBHelper.fetchAllRestaurant()
      }
    })
      .then(res =>

        callback(null, res)
      )
      .catch(error => callback(error, null))
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    // DBHelper.fetchRestaurants((error, restaurants) => {
    //   if (error) {
    //     callback(error, null);
    //   } else {
    //     // Filter restaurants to have only given cuisine type
    //     const results = restaurants.filter(r => r.cuisine_type == cuisine);
    //     callback(null, results);
    //   }
    // });
    DBHelper.openDatabase().then(db => {
      const tx = db.transaction('restaurants');
      const store = tx.objectStore('restaurants');
      const cusineIdx = store.index('by-cusine');
      return cusineIdx.getAll(cuisine)


    })
      .then(res => callback(null, res))
      .catch(error => callback(error, null))
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    // DBHelper.fetchRestaurants((error, restaurants) => {
    //   if (error) {
    //     callback(error, null);
    //   } else {
    //     // Filter restaurants to have only given neighborhood
    //     const results = restaurants.filter(r => r.neighborhood == neighborhood);
    //     callback(null, results);
    //   }
    // });
    return DBHelper.openDatabase().then(db => {
      const tx = db.transaction('restaurants');
      const store = tx.objectStore('restaurants');
      const cusineIdx = store.index('by-neighborhood');
      return cusineIdx.getAll(neighborhood)

    })
      .then(res => callback(null, res))
      .catch(error => callback(error, null))
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return (`/img/${restaurant.photograph}.jpg`);
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker  
    const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
      {
        title: restaurant.name,
        alt: restaurant.name,
        url: DBHelper.urlForRestaurant(restaurant)
      })
    marker.addTo(newMap);
    return marker;
  }
  /* static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  } */

  static addReview(data,cb){
    return fetch(`http://localhost:1337/reviews`,{
      body: JSON.stringify(data),
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      method: "POST"
    }).then(res=>{
      cb(null)
      return res.json().then(data=>{
        DBHelper.savedatatoIDB(data, "review");
        return data;
      })
      
    }).catch(err=>{
      cb(err)
      data["updatedAt"] = new Date().getTime();
      data["createdAt"] = new Date().getTime();
      DBHelper.savedatatoIDB(data,"reviewoffline")
      return data;
    })
  }

  static fetchReviewAPI(restaurantid,cb){
    return fetch(`http://localhost:1337/reviews?restaurant_id=${restaurantid}`).then(
      res=> res.json()
    ).then(data=>{
      for (let key in data) {
        DBHelper.savedatatoIDB(data[key], "review");
      }
      cb(null,data)
      return data;
    })
    .catch(err=> cb(err,null))
  }

  static fetchCachedReviews(id) {
    return DBHelper.openDatabase().then(db => {
      if (!db) {
        return;
      }
      const tx = db.transaction('review', "readonly");
      const store = tx.objectStore("review").index("restaurant_id");

      return store.getAll(id);
    });
  }

  static fetchReviews(id, cb) {
    return DBHelper.fetchCachedReviews(id)
      .then(reviews => {
        // IF IDB has value
        if (reviews.length) {
          cb(null, reviews);
          return Promise.resolve(reviews);
        } else {
          return DBHelper.fetchReviewAPI(id, cb);
        }
      })
      .catch(error => {
       
        cb(error, null);
      });
  }

  static savedatatoIDB(review,objectstore) {
    return DBHelper.openDatabase().then(db => {
      const tx =
        db.transaction(objectstore, 'readwrite')
      const store = tx.objectStore(objectstore)
      store.put(review)
      let trxResult = tx.complete;
      return trxResult;
    })
  }

  static processOfflineReview(){
    DBHelper.openDatabase().then(db => {
    const tx =
        db.transaction('reviewoffline', 'readwrite')
      const store = tx.objectStore('reviewoffline')
      store.openCursor().then(function postdata(cursor) {
        if (!cursor) return;
        DBHelper.addReview(cursor.value,err=>{
          console.log(err);
        })
        cursor.delete()
        return cursor.continue().then(postdata);
      });

    });
  }

  static processOfflinefav(){
    DBHelper.openDatabase().then(db => {
    const tx =
        db.transaction('favupdate', 'readwrite')
      const store = tx.objectStore('favupdate')
      store.openCursor().then(function postdata(cursor) {
        if (!cursor) return;
        DBHelper.PostFavAPI(cursor.key,cursor.value.fav,err=>{
          console.log(err);
        })
        cursor.delete()
        return cursor.continue().then(postdata);
      });

    });
  }

  static PostFavAPI(restaurantid,fav,cb){
    return fetch(`http://localhost:1337/restaurants/${restaurantid}/?is_favorite=${fav}`,{
      method:"PUT"
    }).then(
      res=> res.json()
    ).then(data=>{
      DBHelper.savedatatodb([data]);
      cb(null,data)
      return data;
    })
    .catch(err=> {
      DBHelper.fetchRestaurantById(restaurantid,(err,data)=>{
        data.is_favorite= fav;
        DBHelper.savedatatodb([data]);
      })
      DBHelper.savedatatoIDB({id:restaurantid,fav:fav},"favupdate")
      cb(err,null)
    })
  }
}

