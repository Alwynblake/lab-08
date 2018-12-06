'use strict';

const express = require('express');
const superagent = require('superagent');
const app = express();
const cors = require('cors');
const PORT = process.env.PORT || 3000;

require('dotenv').config();

app.use(cors());

//location functions
app.get('/location', (request, response) => {
  searchToLatLong(request.query.data)
    .then(location => response.send(location))
    .catch(error => handleError(error, response));
});

function searchToLatLong(query) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${query}&key=${process.env.GEOCODE_API_KEY}`;

  return superagent.get(url)
    .then(res => {
      return new Location(query, res);
    })
    .catch(error => handleError(error));
}

function Location(query, res) {
  this.latitude = res.body.results[0].geometry.location.lat;
  this.longitude = res.body.results[0].geometry.location.lng;
  this.formatted_query = res.body.results[0].formatted_address;
  this.search_query = query;
};

//Weather functions
app.get('/weather', getWeather);

function Weather(day) {
  this.forecast = day.summary;
  this.time = new Date(day.time * 1000).toDateString();
};

function getWeather(request, response) {
  const url = `https://api.darksky.net/forecast/${process.env.WEATHER_API_KEY}/${request.query.data.latitude},${request.query.data.longitude}`;

  superagent.get(url)
    .then(result => {
      const weatherSummaries = result.body.daily.data.map(day => {
        return new Weather(day);
      });
      response.send(weatherSummaries);
    })
    .catch(error => handleError(error));
};

//Yelp functions
app.get('/yelp', getYelp);
function Yelp(data) {
  this.name = data.name;
  this.image_url = data.image_url;
  this.price = data.price;
  this.rating = data.rating;
  this.url = data.url;
}

//Build helper function for yelp
function getYelp(request, response) {
  superagent.get(`https://api.yelp.com/v3/businesses/search?location=${request.query.data.search_query}/${request.query.data.latitude},${request.query.data.longitude}`)
    .set('Authorization', `Bearer ${process.env.YELP_API_KEY}`)
    .then(result => {
      const yelpSummaries = result.body.businesses.map(data => {
        return new Yelp(data);
      });
      response.send(yelpSummaries);
    })
    .catch(error => handleError(error));
}


//Movie Functions
app.get('/movies', getMovies);
function Movies(data){
  this.title = data.title;
  this.overview = data.overview;
  this.average_votes = data.vote_average;
  this.total_votes = data.vote_count;
  this.image_url = 'https://image.tmdb.org/t/p/w370_and_h556_bestv2/' + data.poster_path;
  this.popularity = data.popularity;
  this.released_on = data.release_date;
}

function getMovies(request, response) {
  const url = `https://api.themoviedb.org/3/search/movie?api_key=${process.env.TMDB_API_KEY}&query=${request.query.data.search_query}`
  superagent.get(url)
    .then(ourResult => {
      const movieSummaries = ourResult.body.results.map(data => {
        return new Movies(data);
      });
      response.send(movieSummaries);
    })
    .catch(error => handleError(error));
}

function handleError(err, res) {
  console.error(err);
  if (res) res.status(500).send('Sorry - Something Broke');
}

app.listen(PORT, () => {
  console.log(`listening on ${PORT}`);
});
