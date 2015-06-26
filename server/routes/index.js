var express = require('express');
var router = express.Router();
var path = require('path');
var pg = require('pg');



var connectionConfig = {
	user: 'postgres',
	password: 'postgres',
	database: 'postgres',
	host: 'localhost',
	port: 5432,
	ssl: true
};

/* GET main page. */
router.get('/', function(req, res, next) {
	res.sendFile(path.join(__dirname, '../', '../', 'client', 'views', 'index.html'));
});

/* GET home page. */
router.get('/home', function(req, res, next) {
	res.sendFile(path.join(__dirname, '../', '../', 'client', 'views', 'home.html'));
});

/* GET topGenre page. */
router.get('/topGenre', function(req, res, next) {
	res.sendFile(path.join(__dirname, '../', '../', 'client', 'views', 'genres.html'));
});

/* GET search page. */
router.get('/search', function(req, res, next) {
	res.sendFile(path.join(__dirname, '../', '../', 'client', 'views', 'search.html'));
});

/* GET movie page. */
router.get('/movie', function(req, res, next) {
	res.sendFile(path.join(__dirname, '../', '../', 'client', 'views', 'movie.html'));
});

/* API REQUESTS START HERE */

/* Returns title, vote_average and genres of specified movie ID */
router.get('/api/v1/movie/:id', function(req, res) {
	
	var results = [];
	var mId = req.params.id;
	
	pg.connect(connectionConfig, function(err, client, done) {
		
		// handle errors
		if(err) {
			console.log(err);
			return res.json(err);
		}
		
		// sql query | get title, vote_average from database
		var query = client.query("SELECT title, vote_average FROM movie \
								WHERE id = "+mId+" LIMIT 1 ;", function(err, response) { 
								
								if(err) {
									console.log(err);
								}
								
								done();
								results.push(response.rows[0]);
							});
		
		// sql query | get genres of our movie from database
		var query2 = client.query("SELECT genre.name FROM movie, genre, movie_genre \
								WHERE movie_genre.movie_id = movie.id AND movie_genre.genre_id = genre.id\
								AND movie.id = "+mId+" ORDER BY genre.name;", function(err, response) { 
								
								if(err) {
									console.log(err);
								}
								
								done();
								results.push(response.rows);
								return res.json(results);
							});	
	});
});

/* Returns TOP 20 movies in database based on vote_average */
router.get('/api/v1/movies', function(req, res) {
	
	var results = [];
	
	
	pg.connect(connectionConfig, function(err, client, done) {
		
		// handle errors
		if(err) {
			console.log(err);
			return res.json(err);
		}
		
		// sql query
		var query = client.query("SELECT id, title, original_title, vote_average, release_date FROM movie \
								ORDER BY vote_average DESC, release_date ASC LIMIT 20;");
		
		// stream results back one row at time
		query.on('row', function(row) {
			results.push(row);
		});
		
		// after all data is returned, close connection and return results
		query.on('end', function() {
			done();
			return res.json(results);
		});
		
		
	});
});

/* Returns name and number of occurs every genre in database */
router.get('/api/v1/topGenres', function(req, res) {
	
	var results = [];
	
	
	pg.connect(connectionConfig, function(err, client, done) {
		
		// handle errors
		if(err) {
			console.log(err);
			return res.json(err);
		}
		
		// sql query
		var query = client.query("SELECT genre.name, COUNT(*) as y  FROM movie, genre, movie_genre \
								WHERE movie_genre.movie_id = movie.id AND movie_genre.genre_id = genre.id \
								GROUP BY genre.name;");
		
		// stream results back one row at time
		query.on('row', function(row) {
			results.push(row);
		});
		
		// after all data is returned, close connection and return results
		query.on('end', function() {
			done();
			return res.json(results);
		});
		
		
	});
});

/* Returns all genres in database */
router.get('/api/v1/genres', function(req, res) {
	
	var results = [];
	
	pg.connect(connectionConfig, function(err, client, done) {
		
		// handle errors
		if(err) {
			console.log(err);
			return res.json(err);
		}
		
		// sql query
		var query = client.query("SELECT DISTINCT genre.name FROM genre;");
		
		// stream results back one row at time
		query.on('row', function(row) {
			results.push(row);
		});
		 
		// after all data is returned, close connection and return results
		query.on('end', function() {
			done();
			return res.json(results);
		});
		
		
	});
});

/* Returns all movies matching the criteria */
router.get('/api/v1/search', function(req, res) {
	 
	var results = [];
	var queryString = "SELECT DISTINCT ON (movie.title) movie.id, movie.title, genre.name, movie.vote_average FROM movie, genre, movie_genre \
						WHERE movie_genre.movie_id = movie.id AND movie_genre.genre_id = genre.id ";
	
	// add average score to find in query
	if(req.query.score != undefined) {
		queryString += "AND movie.vote_average >= "+req.query.score;
	}
	
	// add every selected genre to find in query
	if(req.query.genres != undefined) {
		queryString += " AND ( ";
		
		// #fix if we have one object instead of array
		if(typeof req.query.genres === 'string') {
			req.query.genres = [ req.query.genres ];
		}
		
		for(var g in req.query.genres) {
			queryString += " genre.name = \'"+req.query.genres[g]+"\' OR";
		}
		 
		// remove last OR from queryString
		queryString = queryString.substring(0, queryString.length-2);
		queryString += " )";
	}
	
	// finish the query
	queryString += " ORDER BY movie.title ASC, movie.vote_average DESC LIMIT 50;";
	
	//console.log(queryString);
	
	
	pg.connect(connectionConfig, function(err, client, done) {
		 
		// handle errors
		if(err) {
			console.log(err);
			return res.json(err);
		}
										
		var query = client.query(queryString);
		
		// stream results back one row at time
		query.on('row', function(row) {
			results.push(row);
		});
		
		// after all data is returned, close connection and return results
		query.on('end', function() {
			//client.end();
			done();
			return res.json(results);
		});
		
		
	});
});

module.exports = router;
