angular.module("CloudPcr").controller('PcrFormController', ['$scope', '$timeout', function ($scope, $timeout) {

    $scope.EMSDataSet = {};

    $scope.sendData = function () {

        $.ajax({
            type: "POST",
            url: "/api/PcrOperations/Pcr",
            data: JSON.stringify($scope.EMSDataSet),
            dataType: "json",
            contentType: 'application/json'
        }).done(function (data) {
            alert(data);
        });
    }

    $scope.export = function () {
        $scope.returnXml = "";
        $.ajax({
            type: "POST",
            url: "/api/PcrOperations/Export",
            data: JSON.stringify($scope.EMSDataSet),
            dataType: "json",
            contentType: 'application/json'
        }).done(function (msg) {
            $timeout(function () {
                $scope.returnXml = msg;
            });
        });
    }

    $scope.help = function (data) {
        $scope.helpData = data;
        $("#elementHelpModal").modal("show");
    }

    $scope.change = function (tab) {
        if (!tab)
            tab = $("[name='Some Tab'].active").length > 0 ? 'Some Other Tab' : 'Some Tab' // temp functionality
        $("cloud-tab.active").removeClass("active");
        $("[name='" + tab + "']").addClass("active");
    }

    $scope.importData = function (clear) {
        if (!$scope.import && !clear)
            return;
        if (!clear) {
            $scope.EMSDataSet = JSON.parse($scope.import);
        } else {
            $scope.EMSDataSet = {};
        }
        $scope.import = "";
        //$(".select2-offscreen").trigger("change");
    }
}]);