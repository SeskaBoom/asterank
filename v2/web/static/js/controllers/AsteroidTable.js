function AsteroidTableCtrl($scope, $http, pubsub) {
  'use strict';
  // Config
  $scope.rankings = [];
  $scope.sort_orders = [
    {
      text: 'most cost effective',
      search_value: 'score'
    },
    {
      text: 'most valuable',
      search_value: 'value'
    },
    {
      text: 'most accessible',
      search_value: 'accessibility'
    },
    {
      text: 'upcoming passes',
      search_value: 'upcoming'
    }
  ];
  $scope.limit_options = [100, 300, 500, 1000, 4000];

  // Functions

  $scope.Init = function() {
    // Initialization
    $scope.limit = $scope.limit_options[0];
    $scope.sort_by = $scope.sort_orders[0];

    $scope.UpdateRankings();
  }

  var rankings_cache = new SimpleCache(function(item) {
    return item.sort_by + '|' + item.limit;
  });

  $scope.UpdateRankings = function() {
    var params = {
      sort_by: $scope.sort_by.search_value,
      limit: $scope.limit
    };
    var cache_result = rankings_cache.Get(params);
    if (cache_result) {
      $scope.rankings = cache_result;
      // publish to subscribers (incl. 3d view)
      pubsub.publish('NewAsteroidRanking', [$scope.rankings]);
    }
    else {
      $('#results-table-loader').show();
      $scope.rankings = [];
      $http.get('/api/rankings?sort_by='
          + params.sort_by
          + '&limit='
          + params.limit)
        .success(function(data) {
        $scope.rankings = data;
        rankings_cache.Set(params, data);
        $('#results-table-loader').hide();

        // publish to subscribers (incl. 3d view)
        pubsub.publish('NewAsteroidRanking', [$scope.rankings]);
      });
    }

  } // end UpdateRankings

  $scope.AsteroidClick = function(obj) {
    $scope.selected = obj;
    pubsub.publish('AsteroidDetailsClick', [obj]);
  }

  pubsub.subscribe('UpdateRankingsWithFeaturedAsteroid', function(asteroid) {
    // normal rankings, except we insert a featured asteroid on top
    $scope.selected = asteroid;
    $scope.rankings.unshift(asteroid);

    // send new rankings to 3d view
    pubsub.publish('NewAsteroidRanking', [$scope.rankings]);
  });
}

