let restaurant;
var newMap;

/**
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {

  initMap();
});

/**
 * Initialize leaflet map
 */
initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.newMap = L.map('map', {
        center: [restaurant.latlng.lat, restaurant.latlng.lng],
        zoom: 16,
        scrollWheelZoom: false
      });
      L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
        mapboxToken: 'pk.eyJ1Ijoic2luZ2hhbHZpbWFsa3VtYXIiLCJhIjoiY2p4ODU0cHIwMDFsYjNvbXpwenprZ3dvNyJ9.K6jiam_5gn3GmNaORPFpMA',
        maxZoom: 18,
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
          '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
          'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        id: 'mapbox.streets'
      }).addTo(newMap);
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);
    }
  });
}

/* window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
} */

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant)
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img'
  image.alt = 'Image of ' + restaurant.name + ' restaurant';
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  const favBtn = document.getElementById("restaurant-markfav");
  if (restaurant.is_favorite && restaurant.is_favorite === "true") {
    favBtn.classList.add("star-selected");
    favBtn.setAttribute('data-fav', 'true');
  } else {
    favBtn.classList.add("star-unselected");
    favBtn.setAttribute('data-fav', 'false');
  }

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  fillReviews();
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}


fillReviews = () => {
  const id = parseInt(getParameterByName("id"))

  DBHelper.fetchReviews(id, (err, reviews) => {
    if (err || !reviews) {
      console.error(err)
      fillReviewsHTML()
      return;
    }
    fillReviewsHTML(reviews)
  })


}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h2');
  title.innerHTML = 'Reviews';
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');
  const name = document.createElement('p');
  name.innerHTML = review.name;
  li.appendChild(name);

  const date = document.createElement('p');
  date.innerHTML = (new Date(review.createdAt)).toLocaleDateString();
  li.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant = self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

const reviewForm = document.querySelector('#add-review-form');
reviewForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const id = getParameterByName("id")
  const name = reviewForm.querySelector('#name').value
  const comment = reviewForm.querySelector('#review-comment').value
  const rating = reviewForm.querySelector('#rating');
  DBHelper.addReview({
    "restaurant_id": parseInt(id),
    "name": name,
    "comments": comment,
    "rating": rating.options[rating.selectedIndex].value,
  }, err => {
    console.log(err)
  }).then(data => {
    console.log(data)
    const reviewList = document.querySelector('#reviews-list');
    reviewList.appendChild(createReviewHTML(data));
    reviewForm.reset()
  }).catch(err => {
    console.error(err)
  })

})

window.addEventListener('online', e => {
  e.preventDefault();
  DBHelper.processOfflineReview();
  DBHelper.processOfflinefav();
})


const favlink = document.querySelector('#restaurant-markfav');
favlink.addEventListener('click', (e) => {
  e.preventDefault();
  let fav = false;
  if (e.target.dataset.fav == "true") {
    e.target.classList.remove("star-selected");
    e.target.classList.add("star-unselected");
    e.target.dataset.fav = "false"
  } else {
    e.target.classList.remove("star-unselected");
    e.target.classList.add("star-selected");
    e.target.dataset.fav = "true"
    fav = true
  }
  const id = getParameterByName("id")
  DBHelper.PostFavAPI(parseInt(id), fav, (err, _) => {
    if (err) {
      console.log(err)
    }
  })
})