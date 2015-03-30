var telling;
telling = angular.module('telling', ['ngRoute', 'auth0', 'angular-jwt', 'angular-storage'])

.run(function($rootScope, auth, store, jwtHelper) {
  // This events gets triggered on refresh or URL change
  $rootScope.$on('$locationChangeStart', function() {
    if (!auth.isAuthenticated) {
      var token = store.get('token');
      if (token) {
        if (!jwtHelper.isTokenExpired(token)) {
          auth.authenticate(store.get('profile'), token);
        } else {
          // Either show Login page or use the refresh token to get a new idToken
        }
      }
    }
  });
})
.config(function(authProvider, $routeProvider) {
    
    $routeProvider
    .when('/', {
        templateUrl: 'home.html',
        controller: 'HomeCtrl',
    })
    .when('/welcome', {
        templateUrl: 'welcome.html',
        controller: 'WelcomeCtrl'
    })
    .when('/profile', {
        templateUrl: 'profile.html',
        controller: 'ProfileCtrl'
      })
    .when('/pyramid', {
        templateUrl: 'pyramid.html',
        controller: 'PyramidCtrl'
      });

    authProvider.init({
      domain: 'tellingapp.auth0.com',
      clientID: 'fjmIE1wLmsV5YGII4nRMFdoZfvCr8txN',
      loginUrl: '/'
    });
  })
  .run(function(auth, $rootScope) {
    auth.hookEvents();
  });

  
telling.controller('MainCtrl',[ 'store', '$scope', '$location', '$rootScope', 'auth', function(store, $scope, $location, $rootScope, auth) {  
    $rootScope.profile = store.get('profile');
    $rootScope.token = store.get('token');
    if ($rootScope.token == null) 
        $rootScope.login = false;
    console.log($rootScope.profile, $rootScope.token);
    $scope.logIn = function () {
        window.location = 'http://localhost:8100'
    }
    $scope.logOut = function () {
        store.remove('token');
        store.remove('profile');
        $location.url('');
 window.location = 'https://tellingapp.auth0.com/logout?returnTo=http://localhost:8100';
    };
}]);

telling.controller('HomeCtrl',[ 'auth', '$location', 'store', '$scope', '$rootScope', function(auth, $location, store, $scope, $rootScope) {    
    $rootScope.profile = {name: "Guest User"}
    var lock = new Auth0Lock('fjmIE1wLmsV5YGII4nRMFdoZfvCr8txN', 'tellingapp.auth0.com');
    
    lock.show(function(err, profile, id_token) {
      if (err) {
        console.log("There was ane error :/", err);
        return;
      }
        $location.path('/welcome')
        store.set('profile', profile);
        store.set('token', id_token);
        $scope.userName = profile.name || 'Guest User';
        $scope.userImg = profile.picture;
        $scope.$apply();
    });
}]);

telling.controller('WelcomeCtrl',[ 'store', '$scope', function(store, $scope) {    

        
}]);

telling.controller('ProfileCtrl',[ 'store', '$scope', function(store, $scope) {    
    $scope.userStories = [{headline: 'This is a great Headline', lead: 'The begining of the story goes like this'}, {headline: 'This Headline is Less Good', lead: 'The middle of the story is exciting here'}]
        
}]);

telling.controller("PyramidCtrl", function($scope, $http){
    //CREATE THE SCOPE TO HOLD THE IMPORTANT EVENTS, STORY, RESULTS, TEST AND ANSWER 
    $scope.events=[];
    $scope.story="";
    $scope.submit = false;
    $scope.result = '';
    $scope.hint = '';
    $scope.test = ['ev1', 'ev2', 'ev3']
    $scope.answer = [];
    
    //GET A RANDOM STORY
    $http.get('http://localhost:3000')
        .success(function(data) {
            $scope.story = data[0].text;
            $scope.result = data[0].result;
            $scope.hint = data[0].hint;
            //get the events with this story id
            $scope.getEvents(data[0].id);
        })
        .error(function(data) {
            console.log('Error: ' + data);
        });
    
    //GET THE IMPORTANT EVENTS THAT BELONG TO THE STORY
    $scope.getEvents = function(id) {
        $http.get('http://localhost:3000/events?id='+id)
        .success(function(data) {
            $scope.events = data;
            $scope.randomize();            
        })
        .error(function(data) {
            console.log('Error: ' + data);
        });
    }
    
    //RANDOMIZE IMPORTANT NEWS EVENTS
    $scope.randomize = function() {
        //PICK AN EVENT FROM $SCOPE.EVENTS AT RANDOM
        $scope.ev1 = $scope.events[Math.floor(Math.random() * $scope.events.length)];
        //SET THE newIndex VALUE FOR THAT EVENT
        $scope.ev1.newIndex = 0;
        //FIND TAHT EVENT IN THE $SCOPE>EVENTS ARRAY
        var i1 = $scope.events.indexOf($scope.ev1);
        //REMOVE THAT EVENT FROM TEH ARRAY
        $scope.events.splice(i1,1)
        //PICK ANOTHER EVENT FROM $SCOPE.EVENTS AT RANDOM
        $scope.ev2 = $scope.events[Math.floor(Math.random() * $scope.events.length)];
        //SET THE newIndex VALUE FOR THAT EVENT
        $scope.ev2.newIndex = 1;
        //REMOVE THAT EVENT FROM THE ARRAY
        var i2 = $scope.events.indexOf($scope.ev2);
        //REMOVE THAT EVENT FROM THE ARRAY
        $scope.events.splice(i2,1)
        //ADD THE REMAINING EVENT
        $scope.ev3 = $scope.events[0];  
        $scope.ev3.newIndex = 2;
        
        //ADD THE EVENTS TO THE ANSWER ARRAY
        $scope.answer = [$scope.ev1,$scope.ev2,$scope.ev3];
        //SORT THE ARRAY BY THE EVENT VALUES
        $scope.answer.sort(function (a, b) {
            if (a.val > b.val) {
                return 1;
            }
            if (a.val < b.val) {
                return -1;
            }
            // a must be equal to b
            return 0;
        });
        //THIS SORTED LIST IS THE ANSWER KEY FOR THIS PROBLEM
        $scope.answer = ['ev'+($scope.answer[0].newIndex+1),'ev'+($scope.answer[1].newIndex+1),'ev'+($scope.answer[2].newIndex+1)];
        return
    };
    
    //CHECK THE TEST AGAINST THE ANSWER KEY AND ISSUE RESULTS
    $scope.go = function() {
        for (var i=0; i<2; i++){
            //IF ANY ANSWERS DON'T MATCH THAN IT IS WRONG    
            if ($scope.test[i] != $scope.answer[i]) {
                $scope.message = $scope.hint;
            } else {
                //IF ALL ANSWERS MATCH THEN IT IS CORRECT
                $scope.message = $scope.result;
            } 
            $scope.submit = true;
        }
    };
    
    //SORTABLE DRAG AND DROP FUNCTIONS
    var el = document.getElementById('items');
    var sortable = Sortable.create(el, {
        
        onUpdate: function (evt) {
            //SET THE NEW ORDER FOR THE TEST
            $scope.test = [evt.target.children[0].id,evt.target.children[1].id,evt.target.children[2].id];
            //CHANGE THE newIndex VALUE OF THE EVENT THAT WAS JUST MOVED
            if(evt.item.id == 'ev1')
                $scope.ev1.newIndex = evt.newIndex;
            if(evt.item.id == 'ev2')
                $scope.ev2.newIndex = evt.newIndex;
            if(evt.item.id == 'ev3')
                $scope.ev3.newIndex = evt.newIndex;
        }
    });
});
