telling.config(function ($routeProvider) {
    $routeProvider
    //route for the home page
    .when('/', {
        templateUrl:
        './index.html',
            controller: 'SplashPageCtrl'
    })
});