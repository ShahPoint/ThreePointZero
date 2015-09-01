angular.module("CloudPcr", ['ui.router', 'ui.utils', 'ngTouch', 'ui.bootstrap', 'ngSanitize', 'oc.lazyLoad'])
.config(function ($compileProvider, $stateProvider, $urlRouterProvider, $locationProvider) {

    $locationProvider.html5Mode({
        enabled:false,
        requireBase:false
    });

    $stateProvider.state('Login', {
        url: '/Login',
        templateUrl: "/Angular/html/Views/Login.html",
        controller: 'LoginController'
    })
    .state('ListView', {
        url: '/ListView',
        templateUrl: "/Angular/html/Views/ListView.html",
        controller: 'ListViewController'
    })
    .state('PcrForm', {
        url: '/PcrForm?pcrid',
        templateUrl: "/Angular/html/Views/PcrForm.html",
        controller: 'PcrFormController'
    });

    $urlRouterProvider.when('', 'PcrForm');
    $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|file|tel):/); // Fix for cordova builds
});