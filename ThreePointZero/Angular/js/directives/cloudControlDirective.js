angular.module("CloudPcr").directive("teddyinput", [function () {

    return {
        require: [/*'^cloudTab', '^cloudWidget'*/],
        scope: true,
        transclude: true,
        templateUrl: "/Angular/html/Templates/teddyInputTemplate.html",
        priority: 0,
        restrict: "E",
        link: function (scope, element, attrs) {
            var controlData = scope.data = pcrFormControls[attrs.name];
            if (controlData == null)
                throw "'" + attrs.name + "' is not a valid element";
            var $input = $("input", element);

            if (!((controlData.minLength.length > 0 || controlData.maxLength.length > 0 || controlData.pattern.length > 0) && controlData.options.length == 0 && controlData.MaxOccurs == "1"))
                handleSelect2($input, controlData);

            delete controlData;
            //delete scope.data;

            //element.replaceWith(element.children());
        }
    };

    function handleSelect2($input, controlData) {

        var options = {
            multiple: controlData.MaxOccurs == "M",
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

angular.module("CloudPcr").directive("teddytime", [function () {

    return {
        require: [/*'^cloudTab', '^cloudWidget'*/],
        scope: true,
        transclude: true,
        templateUrl: "/Angular/html/Templates/teddyTimeTemplate.html",
        priority: 0,
        restrict: "E",
        link: function (scope, element, attrs) {
            var controlData = scope.data = pcrFormControls[attrs.name];
            if (controlData == null)
                throw "'" + attrs.name + "' is not a valid element";
            var $date = $("#date", element);
            var $time = $("#time", element);

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
            defaultTime: 'current',
            showInputs: false,
            disableMousewheel: true,
            explicitMode: true
        });
        $("span", $time).click(function () { $("input", $time).timepicker('showWidget'); });

    }
}]);

angular.module("CloudPcr").directive("teddytextarea", [function () {

    return {
        require: [/*'^cloudTab', '^cloudWidget'*/],
        scope: true,
        transclude: true,
        templateUrl: "/Angular/html/Templates/teddyTextareaTemplate.html",
        priority: 0,
        restrict: "E",
        link: function (scope, element, attrs) {
            scope.data = pcrFormControls[attrs.name];
            if (scope.data == null)
                throw "'" + attrs.name + "' is not a valid element";

            //element.replaceWith(element.children());
        }
    };

}]);

angular.module("CloudPcr").directive("teddyslider", [function () {

    return {
        require: [/*'^cloudTab', '^cloudWidget'*/],
        scope: true,
        transclude: true,
        templateUrl: "/Angular/html/Templates/teddyTextareaTemplate.html",
        priority: 0,
        restrict: "E",
        link: function (scope, element, attrs) {
            scope.data = pcrFormControls[attrs.name];
            if (scope.data == null)
                throw "'" + attrs.name + "' is not a valid element";

            //element.replaceWith(element.children());
        }
    };

}]);