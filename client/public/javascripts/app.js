angular.module('nodeKainos', ['ngRoute'])

.config(function($routeProvider) {
	$routeProvider
	
		.when('/', {
			templateUrl: 'home',
			controller : 'homeController'
		})
		
		.when('/search', {
			templateUrl: 'search',
			controller : 'searchController'
		})
		
		.when('/topGenre', {
			templateUrl: 'topGenre',
			controller : 'genresController'
		})
		
		.when('/movie/:id', {
			templateUrl: 'movie',
			controller : 'movieController'
		})
		
		.otherwise({
			redirectTo: '/'
		});
})

.controller('movieController', function($scope, $http, $routeParams) {
	
	$scope.movieData = {};
	$scope.genresData = {};
	$scope.movieData.plot = "Loading";
	//console.log($routeParams);
	
	// Get data about movie from database
    $http.get('/api/v1/movie/'+$routeParams.id)
        .success(function(data) {
            $scope.movieData = data[0];
			$scope.genresData = data[1];
            //console.log(data);
			
			// Get plot about movie from OMDb API
			$http.get('http://www.omdbapi.com/?y=&plot=full&r=json&t='+$scope.movieData.title)
				.success(function(data) {
					if(data.Response === 'True') {
						$scope.movieData.plot = data.Plot;
					} else {
						$scope.movieData.plot = data.Error;
					}
					//console.log(data);
				})
				.error(function(error) {
					console.log('Error: ' + error);
				});
		
        })
        .error(function(error) {
            console.log('Error: ' + error);
        });
		
	
		
})

.controller('searchController', function($scope, $http) {
	
	$scope.formData = {};
	$scope.genresData = {};
	$scope.selection = [];
	
	// Get all genres in database
    $http.get('/api/v1/genres')
        .success(function(data) {
            $scope.genresData = data;
            //console.log(data);
        })
        .error(function(error) {
            console.log('Error: ' + error);
        });

		
	// toggle selection for a given fruit by name
	$scope.toggleSelection = function toggleSelection(genreName) {	
		var idx = $scope.selection.indexOf(genreName);
		
		// is currently selected
		if(idx > -1) {
			$scope.selection.splice(idx, 1);
		} 
		else { // is newly selected 
			$scope.selection.push(genreName);
		}	
		//console.log($scope.selection);
	};
	
	// on clicked SearchButton
    $scope.findMovie = function() {   
		$http.get('/api/v1/search', {params: {score: $scope.formData.score, genres: $scope.selection}})
			.success(function(data) {
				$scope.moviesData = data;
				//console.log(data);
			})
			.error(function(error) {
				console.log('Error: ' + error);
			});
    };
		
})

.controller('homeController', function($scope, $http) {
	
	$scope.moviesData = {};
	
	// Get all movies
    $http.get('/api/v1/movies')
        .success(function(data) {
            $scope.moviesData = data;
            //console.log(data);
        })
        .error(function(error) {
            console.log('Error: ' + error);
        });
		
})

.controller('genresController', function($scope, $http) {
	
	$scope.genreData = {};
	
	// Get all data
    $http.get('/api/v1/topGenres')
        .success(function(data) {
            $scope.genreData = data;
            //console.log(data);
			
			for(var i in data) {
				data[i].y = parseFloat(data[i].y);
				//console.log(data[i]);
			}
			
			$('#chart').highcharts({
				chart: {
					plotBackgroundColor: null,
					plotBorderWidth: null,
					plotShadow: false,
					type: 'pie'
				},
				title: {
					text: 'Procentowy udział poszczególnych gatunków w bazie danych'
				},
				tooltip: {
					pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
				},
				plotOptions: {
					pie: {
						allowPointSelect: true,
						cursor: 'pointer',
						dataLabels: {
							enabled: true,
							format: '<b>{point.name}</b>: {point.percentage:.1f} %',
							style: {
								color: (Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black'
							}
						}
					}
				},
				series: [{
					name: "Udział",
					colorByPoint: true,
					data: data
				}]
			});
			
        })
        .error(function(error) {
            console.log('Error: ' + error);
        });
		
	
})

