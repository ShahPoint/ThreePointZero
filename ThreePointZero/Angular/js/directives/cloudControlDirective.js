angular.module("CloudPcr").directive("teddyinput", ['$compile', function ($compile) {

    return {
        require: [/*'^cloudTab', '^cloudWidget'*/],
        scope: true,
        transclude: true,
        templateUrl: "/Angular/html/Templates/teddyInputTemplate.html",
        priority: 0,
        restrict: "E",
        link: function (scope, element, attrs) {
            var controlData = scope.data = pcrFormControls[attrs.name];
            scope.data.exportPath = scope.data.exportPath.replace(/\./g, '_').replace(/\//g, '.') + "." + scope.data.ngModel;
            if (controlData == null)
                throw "'" + attrs.name + "' is not a valid element";
            var $input = $("input", element);
            $input.attr("ng-model", scope.data.exportPath);

            $("input", element).each(function () { $compile(this)(scope); });

            if (!((controlData.minLength.length > 0 || controlData.maxLength.length > 0 || controlData.pattern.length > 0) && controlData.options.length == 0 && !controlData.isList))
                handleSelect2($input, controlData);

            delete controlData;
            //delete scope.data;

            //element.replaceWith(element.children());
        }
    };

    function handleSelect2($input, controlData) {

        var options = {
            multiple: controlData.isList,
            allowClear: true
        };

        if (options.multiple)
            options.tags = controlData.options;
        else
            options.data = controlData.options;

        if (controlData.maxLength.length > 0)
            options.maximumInputLength = parseInt(controlData.maxLength);

        if (controlData.minLength.length > 0)
            options.minimumInputLength = parseInt(controlData.minLength);

        if (controlData.pattern.length > 0) {
            options.formatNoMatches = "Please follow the pattern: " + controlData.pattern;
            options.createSearchChoice = function (term) {
                var regexp = new RegExp("^" + controlData.pattern + "$");
                if (regexp.test(term)) {
                    return {
                        id: term,
                        text: term
                    };
                }
            }
        }

        $input.select2(options);

    }

}]);

var timeRegex = /(\d{1,2}):(\d{2})/;
var dateRegex = /(\d{2})\/(\d{2})\/(\d{4})/;
angular.module("CloudPcr").directive("teddytime", ['$compile', '$parse', function ($compile, $parse) {

    return {
        require: [/*'^cloudTab', '^cloudWidget'*/],
        scope: true,
        transclude: true,
        templateUrl: "/Angular/html/Templates/teddyTimeTemplate.html",
        priority: 0,
        restrict: "E",
        link: function (scope, element, attrs) {
            var controlData = scope.data = pcrFormControls[attrs.name];
            scope.data.exportPath = scope.data.exportPath.replace(/\./g, '_').replace(/\//g, '.') + "." + scope.data.ngModel;
            if (controlData == null)
                throw "'" + attrs.name + "' is not a valid element";
            var $date = $("#date", element);
            var $time = $("#time", element);
            //$("input", $date).attr("ng-model", scope.data.exportPath + '.date');
            //$("input", $time).attr("ng-model", scope.data.exportPath + '.time');

            var model = $parse(scope.data.exportPath);

            $("input", $time).change(function () {
                if (timeRegex.test(scope.time) && dateRegex.test(scope.date)) {
                    var time = timeRegex.exec(scope.time);
                    var date = dateRegex.exec(scope.date);
                    alert(date + " " + time)
                    var dateOb = new Date(parseInt(date[3]), parseInt(date[1]), parseInt(date[2]), parseInt(time[1]), parseInt(time[2]), 0, 0);
                    model.assign(scope, dateOb.toNemsisString());
                } else
                    model.assign(scope, "");
            });

            //$("input", element).each(function () { $compile(this)(scope); });

            if (controlData.DataType == "DateTimeType") {
                handleDateTime($date, $time, controlData);
                scope.showInputIcon = true;
            }


            delete controlData;
            //delete scope.data;

            //element.replaceWith(element.children());
        }
    };

    function handleDateTime($date, $time, controlData) {

        $("input", $date).datepicker({
            startDate: new Date("1950-01-01T00:00:00-00:00"),
            endDate: new Date("2050-01-01T00:00:00-00:00"),
            autoclose: true,
            //todayBtn: true,
            todayHighlight: true,
        });
        $("span", $date).click(function () { $("input", $date).datepicker('show'); });
        $("input", $time).timepicker({
            minuteStep: 1,
            showMeridian: false,
            defaultTime: null,
            showInputs: false,
            disableMousewheel: true,
            explicitMode: true
        });
        $("span", $time).click(function () { $("input", $time).timepicker('showWidget'); });

    }
}]);

angular.module("CloudPcr").directive("teddytextarea", ['$compile', function ($compile) {

    return {
        require: [/*'^cloudTab', '^cloudWidget'*/],
        scope: true,
        transclude: true,
        templateUrl: "/Angular/html/Templates/teddyTextareaTemplate.html",
        priority: 0,
        restrict: "E",
        link: function (scope, element, attrs) {
            scope.data = pcrFormControls[attrs.name];
            scope.data.exportPath = scope.data.exportPath.replace(/\./g, '_').replace(/\//g, '.') + "." + scope.data.ngModel;
            if (scope.data == null)
                throw "'" + attrs.name + "' is not a valid element";

            var $input = $("textarea", element);
            $input.attr("ng-model", scope.data.exportPath);

            $("textarea", element).each(function () { $compile(this)(scope); });

            //element.replaceWith(element.children());
        }
    };

}]);

angular.module("CloudPcr").directive("teddyslider", ['$compile', function ($compile) {

    return {
        require: [/*'^cloudTab', '^cloudWidget'*/],
        scope: true,
        transclude: true,
        templateUrl: "/Angular/html/Templates/teddyTextareaTemplate.html",
        priority: 0,
        restrict: "E",
        link: function (scope, element, attrs) {
            scope.data = pcrFormControls[attrs.name];
            scope.data.exportPath = scope.data.exportPath.replace(/\./g, '_').replace(/\//g, '.') + "." + scope.data.ngModel;
            if (scope.data == null)
                throw "'" + attrs.name + "' is not a valid element";

            var $input = $("input", element);
            $input.attr("ng-model", scope.data.exportPath);

            $("input", element).each(function () { $compile(this)(scope); });
            //element.replaceWith(element.children());
        }
    };

}]);