angular.module('CloudPcr').controller("ListViewController", ['$scope', '$filter', '$timeout', function ($scope, $filter, $timeout) {

    $scope.text = "json";
    $scope.textType = "pre";

    $.ajax({
        type: "GET",
        url: "/api/PcrOperations/xmlData"
    }).done(function (data) {
        $scope.ajaxObject = data;
        parse();
    });

    var json;
    $scope.nemsisJson = "";
    //parse();
    function parse() {
        var elements = [];
        var attributes = [];
        json = {};

        var lines = getElements().split("\n");
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            line = line.split("'|");
            var ob = {
                DatasetName: line[0].replace(/'/, ""),
                ElementNumber: line[1].replace(/'/, ""),
                ElementName: line[2].replace(/'/, ""),
                Code: line[3].replace(/'/, ""),
                CodeDescription: line[4].replace(/'/, ""),
            }
            elements.push(ob);
        }

        lines = getAttributes().split("\n");
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            line = line.split("'|");
            var ob = {
                DatasetName: line[0].replace(/'/g, ""),
                DatasetType: line[1].replace(/'/, ""),
                ElementNumber: line[2].replace(/'/, ""),
                ElementName: line[3].replace(/'/, ""),
                Attribute: line[4].replace(/'/, ""),
            }
            attributes.push(ob);
        }

        lines = getInfo().split("\n");
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            line = line.split("'|");
            var ob = {
                DatasetName: line[0].replace(/'/, ""),
                DatasetType: line[1].replace(/'/, ""),
                NemsisNumber: line[2].replace(/'/, ""),
                NemsisName: line[3].replace(/'/, ""),
                ElementTitle: line[3].replace(/'/, ""),
                ngModel: line[3].replace(/'/, "").replace(/[ '\\\/\(\)\[\],\-]*/g, "").replace(/^([0-9])/, "_$1"),
                V2Number: line[4].replace(/'/, ""),
                National: line[5].replace(/'/, ""),
                State: line[6].replace(/'/, ""),
                Definition: line[7].replace(/'/, ""),
                Usage: line[8].replace(/'/, ""),
                V3Changes: line[9].replace(/'/, ""),
                //MinOccurs: line[10].replace(/'/, ""),
                //MaxOccurs: line[11].replace(/'/, ""),
                isRequired: line[10].replace(/'/, "") == "1",
                isList: line[11].replace(/'/, "") == "M",
                IsNillable: line[12].replace(/'/, ""),
                DataType: line[13].replace(/'/, ""),
                NV: line[14].replace(/'/, ""),
                PN: line[15].replace(/'/, ""),
                PNNill: line[16].replace(/'/, ""),
                NVList: line[17].replace(/'/, ""),
                PNList: line[18].replace(/'/, ""),
                minLength: line[19].replace(/'/, ""),
                maxLength: line[20].replace(/'/, ""),
                length: line[21].replace(/'/, ""),
                minInclusive: line[22].replace(/'/, ""),
                maxInclusive: line[23].replace(/'/, ""),
                minExclusive: line[24].replace(/'/, ""),
                totalDigits: line[25].replace(/'/, ""),
                fractionDigits: line[26].replace(/'/, ""),
                pattern: line[27].replace(/'/, ""),
                options: getElementList(line[2].replace(/'/, "")),
                attributes: getAttributeList(line[2].replace(/'/, ""))
            }
            ob.exportPath = $scope.ajaxObject[ob.ngModel];
            //json.push(ob);
            json[ob.ngModel] = ob;
        }

        queryData(true);
        generateObjects();

        function getElementList(elementNumber) {
            var ret = [];
            for (var p = 0; p < elements.length; p++) {
                if (elements[p].ElementNumber == elementNumber) {
                    ret.push({
                        id: elements[p].Code,
                        text: elements[p].CodeDescription
                    });
                }
            }
            return ret;
        }


        function getAttributeList(elementNumber) {
            var ret = [];
            for (var p = 0; p < attributes.length; p++) {
                if (attributes[p].ElementNumber == elementNumber) {
                    ret.push(attributes[p].Attribute);
                }
            }
            return ret;
        }
    }

    $scope.queryData = queryData;
    function queryData(ob) {
        if (ob === true) {
            $timeout(function () {
                $scope.nemsisJson = JSON.parse(JSON.stringify(json));
                if (!$scope.query) {
                    if ($scope.cs)
                        $scope.nemsisJson = "#region json string\n@\"" + $filter("json")($scope.nemsisJson).replace(/"(.*)":/g, "\"\"$1\"\":").replace(/: "(.*)"/g, ": \"\"$1\"\"").replace(/\\"(.*)\\"/g, "\\\"\"$1\\\"\"").replace(/ "([^"]*[^"])"([,\r\n])/g, " \"\"$1\"\"$2") + "\";\n#endregion";
                    else
                        $scope.nemsisJson = $filter("json")($scope.nemsisJson);
                    return;
                }
                $scope.nemsisJson = queryData($scope.nemsisJson);
                if ($scope.cs)
                    $scope.nemsisJson = "#region json string\n@\"" + $filter("json")($scope.nemsisJson).replace(/"(.*)":/g, "\"\"$1\"\":").replace(/: "(.*)"/g, ": \"\"$1\"\"").replace(/\\"(.*)\\"/g, "\\\"\"$1\\\"\"").replace(/ "([^"]*[^"])"([,\r\n])/g, " \"\"$1\"\"$2") + "\";\n#endregion";
                else
                    $scope.nemsisJson = $filter("json")($scope.nemsisJson);
            });
        } else if (!angular.isObject(ob)) {
            if (ob.toLowerCase().indexOf($scope.query.toLowerCase()) != -1)
                return ob;
            return null;
        } else {
            var hasAttrs = false;
            for (var attr in ob) {
                if (attr.toLowerCase().indexOf($scope.query.toLowerCase()) != -1) {
                    ob[attr] = ob[attr];
                    hasAttrs = true;
                } else {
                    ob[attr] = queryData(ob[attr]);
                    hasAttrs |= ob[attr] != null;
                }
                if (ob[attr] == null)
                    delete ob[attr];
            }
            return hasAttrs ? ob : null;
        }
    }

    var typeMap = {
        "string": "string",
        "boolean": "bool"
    }

    function generateObjects() {
        var NemsisDataElement;
        var optionsClass;
        var masterClass = "public class NemsisMasterObject\n{";
        
        var generatedSubclasses = false;
        for (var attr in json) {
            if (!generatedSubclasses) {
                if (json[attr].options.length > 0) {
                    NemsisDataElement = "public class NemsisDataElement\n{";
                    for (var subattr in json[attr]) {
                        if (typeMap[typeof json[attr][subattr]])
                            NemsisDataElement += "\n\tpublic " + typeMap[typeof json[attr][subattr]] + " " + subattr + "{ get; set; }";
                    }
                    NemsisDataElement += "\n\tpublic List<object> options { get; set; }";
                    NemsisDataElement += "\n\tpublic List<string> attributes { get; set; }";
                    NemsisDataElement += "\n}";
                    optionsClass = "public class NemsisOptions\n{";
                    for (var subattr in json[attr].options[0]) {
                        optionsClass += "\n\tpublic string " + subattr + "{ get; set; }";
                    }
                    optionsClass += "\n}";
                    generatedSubclasses = true;
                }
            }
            masterClass += "\n\tpublic NemsisDataElement " + attr + " { get; set; }";
        }
        masterClass += "\n}";
        $scope.objects = optionsClass + "\n\n" + NemsisDataElement + "\n\n" + masterClass;
    }
}]);



function getInfo() {
    return "'DEMDataSet'|'element'|'dState.01'|'State Required Element'|''|''|''|'Indicates which elements are required by the state.'|'Optional'|''|'0'|'M'|''|'StateRequiredElement'|''|''|''|''|''|'1'|'100'|''|''|''|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dCustomConfiguration.01'|'Custom Data Element Title'|''|''|''|'This is the title of the custom data element created to collect information that is not defined formally in NEMSIS Version 3.'|'Mandatory'|'Added to allow customized data elements to be inserted and collected from within the NEMSIS Version 3 standard.'|'1'|'1'|''|'CustomTitle'|''|''|''|''|''|'2'|'100'|''|''|''|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dCustomConfiguration.02'|'Custom Definition'|''|''|''|'The definition of the custom element and how it should be used.'|'Mandatory'|''|'1'|'1'|''|'CustomDefinition'|''|''|''|''|''|'0'|'255'|''|''|''|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dCustomConfiguration.03'|'Custom Data Type'|''|''|''|'The data type of the custom element.'|'Mandatory'|''|'1'|'1'|''|'CustomDataType'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dCustomConfiguration.04'|'Custom Data Element Recurrence'|''|''|''|'Indication if the data element will accept multiple values.'|'Mandatory'|'Added to allow customized data elements to be inserted and collected from within the NEMSIS Version 3 standard.'|'1'|'1'|''|'YesNoValues'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dCustomConfiguration.05'|'Custom Data Element Usage'|''|''|''|'The Usage (Mandatory, Required, Recommended, or Optional) for the Custom Data Element.'|'Mandatory'|'Added to allow customized data elements to be inserted and collected from within the NEMSIS Version 3 standard.'|'1'|'1'|''|'ElementUsage'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dCustomConfiguration.06'|'Custom Data Element Potential Values'|''|''|''|'The values which are associated with the Custom Data Element. Values would be the choices provided to the user when they document the Custom Data Element'|'Optional'|'Added to allow customized data elements to be inserted and collected from within the NEMSIS Version 3 standard.'|'0'|'M'|''|'CustomValue'|''|''|''|''|''|'1'|'100'|''|''|''|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dCustomConfiguration.07'|'Custom Data Element Potential NOT Values (NV)'|''|''|''|'NOT Values (NV) associated with the custom element'|'Optional'|''|'0'|'M'|''|'NV'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dCustomConfiguration.08'|'Custom Data Element Potential Pertinent Negative Values (PN)'|''|''|''|'Pertinent Negative Values (PN) associated with the custom element'|'Optional'|''|'0'|'M'|''|'PN'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dCustomConfiguration.09'|'Custom Data Element Grouping ID'|''|''|''|'ID for custom element grouping.'|'Optional'|''|'0'|'1'|''|'CorrelationID'|''|''|''|''|''|'0'|'255'|''|''|''|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dAgency.01'|'EMS Agency Unique State ID'|''|'National'|'State'|'The unique ID assigned to the EMS Agency which is associated with all state licensure numbers and information.'|'Mandatory'|''|'1'|'1'|''|'EMSAgencyStateID'|''|''|''|''|''|'1'|'50'|''|''|''|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dAgency.02'|'EMS Agency Number'|'D01_01'|'National'|'State'|'The state-assigned provider number of the responding agency'|'Mandatory'|''|'1'|'1'|''|'EMSAgencyNumber'|''|''|''|''|''|'1'|'15'|''|''|''|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dAgency.03'|'EMS Agency Name'|'D01_02'|''|'State'|'The formal name of the agency.'|'Recommended'|''|'0'|'1'|'Nillable'|'EMSAgencyName'|'NV'|''|''|'NV.NotReporting; NV.NotRecorded; NV.NotApplicable; '|''|'2'|'100'|''|''|''|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dAgency.04'|'EMS Agency State'|'D01_03'|'National'|'State'|'The state/territory which assigned the EMS agency number.'|'Mandatory'|''|'1'|'1'|''|'ANSIStateCode'|''|''|''|''|''|''|''|''|''|''|''|''|''|'[0-9]{2}'|\n" +
        "'DEMDataSet'|'element'|'dAgency.05'|'EMS Agency Service Area States'|''|'National'|'State'|'The states in which the EMS Agency provides services including the state associated with the EMS Agency Number.'|'Mandatory'|''|'1'|'1'|''|'ANSIStateCode'|''|''|''|''|''|''|''|''|''|''|''|''|''|'[0-9]{2}'|\n" +
        "'DEMDataSet'|'element'|'dAgency.06'|'EMS Agency Service Area County(ies)'|'D01_04'|'National'|'State'|'The county(ies) within each state for which the agency formally provides service.'|'Mandatory'|''|'1'|'M'|''|'ANSICountyCode'|''|''|''|''|''|''|''|''|''|''|''|''|''|'[0-9]{5}'|\n" +
        "'DEMDataSet'|'element'|'dAgency.07'|'EMS Agency Census Tracts'|''|'National'|'State'|'The US census tracts in which the EMS agency formally provides service.'|'Required'|''|'1'|'M'|'Nillable'|'CensusTracts'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|'[0-9]{11}'|\n" +
        "'DEMDataSet'|'element'|'dAgency.08'|'EMS Agency Service Area ZIP Codes'|''|'National'|'State'|'The ZIP codes for the EMS Agency's service area.'|'Required'|''|'1'|'M'|'Nillable'|'ZIP'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|'[0-9]{5}|[0-9]{5}-[0-9]{4}|[0-9]{5}-[0-9]{5}|[A-Z][0-9][A-Z] [0-9][A-Z][0-9]'|\n" +
        "'DEMDataSet'|'element'|'dAgency.09'|'Primary Type of Service'|'D01_05'|'National'|'State'|'The primary service type provided by the agency.'|'Mandatory'|''|'1'|'1'|''|'TypeOfService'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dAgency.10'|'Other Types of Service'|'D01_06'|''|'State'|'The other service type(s) which are provided by the agency.'|'Recommended'|''|'0'|'M'|'Nillable'|'TypeOfService'|'NV'|''|''|'NV.NotReporting; NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dAgency.11'|'Level of Service'|'D01_07'|'National'|'State'|'The level of service which the agency provides EMS care for every request for service (the minimum certification level). This may be the license level granted by the state EMS office.'|'Mandatory'|''|'1'|'1'|''|'StateCertificationLicensureLevels'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dAgency.12'|'Organization Status'|'D01_09'|'National'|'State'|'The primary organizational status of the agency. The definition of Volunteer or Non-Volunteer is based on state or local definitions.'|'Mandatory'|''|'1'|'1'|''|'OrganizationStatus'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dAgency.13'|'Organizational Type'|'D01_08'|'National'|'State'|'The organizational structure from which EMS services are delivered (fire, hospital, county, etc.)'|'Mandatory'|''|'1'|'1'|''|'OrganizationalType'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dAgency.14'|'EMS Agency Organizational Tax Status'|''|'National'|'State'|'The EMS Agencies business/corporate organizational tax status'|'Mandatory'|''|'1'|'1'|''|'AgencyOrganizationalTaxStatus'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dAgency.15'|'Statistical Calendar Year'|'D01_10'|'National'|'State'|'The calendar year to which the information pertains for the EMS Agency and the specific EMS Agency Number (dAgency.02).'|'Mandatory'|''|'1'|'1'|''|'Year'|''|''|''|''|''|''|''|''|'1900'|'2050'|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dAgency.16'|'Total Primary Service Area Size'|'D01_12'|'National'|'State'|'The total square miles in the agency's service area.'|'Required'|''|'1'|'1'|'Nillable'|'AnnualAgencyStatistics'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|'1'|'4000000'|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dAgency.17'|'Total Service Area Population'|'D01_13'|'National'|'State'|'The total population in the agency's service area based if possible on year 2010 census data.'|'Required'|''|'1'|'1'|'Nillable'|'AnnualAgencyStatistics'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|'1'|'4000000'|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dAgency.18'|'911 EMS Call Center Volume per Year'|'D01_14'|'National'|'State'|'The number of 911 calls received by the call center during the last calendar year'|'Required'|'Name Clarified with \"Call Center\"'|'1'|'1'|'Nillable'|'AnnualAgencyStatistics'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|'1'|'4000000'|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dAgency.19'|'EMS Dispatch Volume per Year'|'D01_15'|'National'|'State'|'The number of EMS dispatches during the last calendar year'|'Required'|''|'1'|'1'|'Nillable'|'AnnualAgencyStatistics'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|'1'|'4000000'|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dAgency.20'|'EMS Patient Transport Volume per Year'|'D01_16'|'National'|'State'|'The number of EMS transports per year based on last calendar year.'|'Required'|''|'1'|'1'|'Nillable'|'AnnualAgencyStatistics'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|'1'|'4000000'|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dAgency.21'|'EMS Patient Contact Volume per Year'|'D01_17'|'National'|'State'|'The number of EMS patient contacts per year based on last calendar year.'|'Required'|''|'1'|'1'|'Nillable'|'AnnualAgencyStatistics'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|'1'|'4000000'|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dAgency.22'|'EMS Billable Calls per Year'|'D01_18'|''|'State'|'The number of EMS patient encounters which are billable based on the last calendar year.'|'Recommended'|''|'0'|'1'|'Nillable'|'AnnualAgencyStatistics'|'NV'|''|''|'NV.NotReporting; NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|'1'|'4000000'|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dAgency.23'|'EMS Agency Time Zone'|'D01_19'|''|''|'The time zone for the EMS Agency.'|'Optional'|''|'0'|'1'|''|'EMSAgencyTimeZone'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dAgency.24'|'EMS Agency Daylight Savings Time Use'|'D01_20'|''|''|'Indicate if the EMS Agency conforms to Daylight Savings Time.'|'Optional'|''|'0'|'1'|''|'YesNoValues'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dAgency.25'|'National Provider Identifier'|'D01_21'|'National'|'State'|'The National Provider Identifier issued by CMS.'|'Required'|''|'1'|'M'|'Nillable'|'NationalProviderIdentifier'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|'10'|''|''|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dAgency.26'|'Fire Department ID Number'|''|'National'|'State'|'The state assigned Fire Department ID Number for EMS Agency(ies) operating within a Fire Department.'|'Required'|'Added to better associate Fire and EMS licensure and operational identifiers.'|'1'|'M'|'Nillable'|'FireDepartmentIDNumber'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|'1'|'20'|''|''|''|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dContact.01'|'Agency Contact Type'|''|''|'State'|'The contact type within the EMS agency.'|'Recommended'|''|'0'|'1'|'Nillable'|'AgencyContactType'|'NV'|''|''|'NV.NotReporting; NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dContact.02'|'Agency Contact Last Name'|'D02_01'|''|'State'|'The Last Name of the agency's primary contact.'|'Recommended'|''|'0'|'1'|'Nillable'|'PersonLastName'|'NV'|''|''|'NV.NotReporting; NV.NotRecorded; NV.NotApplicable; '|''|'1'|'60'|''|''|''|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dContact.03'|'Agency Contact First Name'|'D02_03'|''|'State'|'The first name of the agency's primary contact.'|'Recommended'|''|'0'|'1'|'Nillable'|'PersonFirstName'|'NV'|''|''|'NV.NotReporting; NV.NotRecorded; NV.NotApplicable; '|''|'1'|'50'|''|''|''|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dContact.04'|'Agency Contact Middle Name/Initial'|'D02_02'|''|''|'The middle name or initial of the agency's primary contact.'|'Optional'|''|'0'|'1'|''|'PersonMiddleName'|''|''|''|''|''|'1'|'50'|''|''|''|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dContact.05'|'Agency Contact Address'|'D02_04'|''|'State'|'The street address of the agency contact's mailing address.'|'Recommended'|''|'0'|'1'|'Nillable'|'StreetAddress'|'NV'|''|''|'NV.NotReporting; NV.NotRecorded; NV.NotApplicable; '|''|'1'|'255'|''|''|''|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dContact.06'|'Agency Contact City'|'D02_05'|''|'State'|'The city of the EMS contact's mailing address.'|'Recommended'|''|'0'|'1'|'Nillable'|'CityGnisCode'|'NV'|''|''|'NV.NotReporting; NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dContact.07'|'Agency Contact State'|'D02_06'|''|'State'|'The state of the Agency contact's mailing address.'|'Recommended'|''|'0'|'1'|'Nillable'|'ANSIStateCode'|'NV'|''|''|'NV.NotReporting; NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|'[0-9]{2}'|\n" +
        "'DEMDataSet'|'element'|'dContact.08'|'Agency Contact ZIP Code'|'D02_07'|''|'State'|'The ZIP code of the Agency's contact's mailing address.'|'Recommended'|''|'0'|'1'|'Nillable'|'ZIP'|'NV'|''|''|'NV.NotReporting; NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|'[0-9]{5}|[0-9]{5}-[0-9]{4}|[0-9]{5}-[0-9]{5}|[A-Z][0-9][A-Z] [0-9][A-Z][0-9]'|\n" +
        "'DEMDataSet'|'element'|'dContact.09'|'Agency Contact Country'|''|''|''|'The Country code of the Agency's contact's mailing address.'|'Optional'|''|'0'|'1'|''|'ANSICountryCodesCAMXUS'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dContact.10'|'Agency Contact Phone Number'|'D02_08'|''|'State'|'Agency contact phone number.'|'Recommended'|''|'0'|'M'|'Nillable'|'PhoneNumber'|'NV'|''|''|'NV.NotReporting; NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|'[2-9][0-9][0-9]-[2-9][0-9][0-9]-[0-9][0-9][0-9][0-9]'|\n" +
        "'DEMDataSet'|'element'|'dContact.11'|'Agency Contact Email Address'|'D02_10'|''|'State'|'The primary email address of the Agency contact.'|'Recommended'|''|'0'|'M'|'Nillable'|'EmailAddress'|'NV'|''|''|'NV.NotReporting; NV.NotRecorded; NV.NotApplicable; '|''|'3'|'100'|''|''|''|''|''|''|'.+@.+'|\n" +
        "'DEMDataSet'|'element'|'dContact.12'|'EMS Agency Contact Web Address'|'D02_11'|''|'State'|'The primary website address of the agency.'|'Recommended'|''|'0'|'1'|'Nillable'|'WebAddress'|'NV'|''|''|'NV.NotReporting; NV.NotRecorded; NV.NotApplicable; '|''|'3'|'255'|''|''|''|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dContact.13'|'Agency Medical Director Degree'|''|''|'State'|'The medical school degree type of the EMS Medical Director.'|'Recommended'|''|'0'|'1'|'Nillable'|'AgencyMedicalDirectorDegree'|'NV'|''|''|'NV.NotReporting; NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dContact.14'|'Agency Medical Director Board Certification Type'|''|''|'State'|'Documentation of the type of board certification of the EMS Agency Medical Director.'|'Recommended'|''|'0'|'M'|'Nillable'|'AgencyMedicalDirectorBoardCertificationType'|'NV'|''|''|'NV.NotReporting; NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dContact.15'|'Medical Director Compensation'|''|''|''|'Indication of Medical Director's Compensation.'|'Optional'|''|'0'|'1'|''|'MedicalDirectorCompensation'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dContact.16'|'EMS Medical Director Fellowship Trained Status'|''|''|''|'Indication if the EMS Medical Director is Fellowship trained.'|'Optional'|''|'0'|'1'|''|'YesNoValues'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dConfiguration.01'|'State Associated with the Certification/Licensure Levels'|''|'National'|'State'|'The state associated with the state certification/licensure levels.'|'Mandatory'|''|'1'|'1'|''|'ANSIStateCode'|''|''|''|''|''|''|''|''|''|''|''|''|''|'[0-9]{2}'|\n" +
        "'DEMDataSet'|'element'|'dConfiguration.02'|'State Certification/Licensure Levels'|'D04_01'|'National'|'State'|'All of the potential levels of certification/licensure for EMS personnel recognized by the state.'|'Mandatory'|''|'1'|'M'|''|'LicensureLevels'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dConfiguration.03'|'Procedures Permitted by the State'|''|'National'|'State'|'A list of all of the procedures permitted by the EMS Agency's licensing state.'|'Required'|''|'1'|'M'|'Nillable'|'snomed'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|'100000'|'1000000000'|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dConfiguration.04'|'Medications Permitted by the State'|''|'National'|'State'|'A list of all of the medications permitted by the state to be used by each EMS state certification/licensure level.'|'Required'|'State EMS systems which have regulatory authority to identify medications to be administered within the state may identify specific RxNorm codes based on medical direction and their own need. 										<br/><br/>List of medications based on RxNorm (RXCUI) code.  										<br/><br/>Reference the NEMSIS Suggested Lists at: http://nemsis.org/v3/resources.html											 										<br/><br/>RxNorm 										<br/>Website - http://uts.nlm.nih.gov 										 										<br/><br/>Product - UMLS Metathesaurus 										<br/>Website - http://www.nlm.nih.gov/research/umls/rxnorm/docs/rxnormfiles.html 										<br/>Product - RxNorm Full Monthly Release'|'1'|'M'|'Nillable'|'Medication'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|'2'|'7'|''|''|''|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dConfiguration.05'|'Protocols Permitted by the State'|''|'National'|'State'|'A list of all of the protocols permitted by the state.'|'Required'|'Added to better identify states with statewide protocols and define state EMS capability and care.'|'1'|'M'|'Nillable'|'ProtocolsUsed'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dConfiguration.06'|'EMS Certification Levels Permitted to Perform Each Procedure'|'D04_05'|'National'|'State'|'EMS certification levels which are permitted to perform the procedure listed in dConfiguration.07.'|'Mandatory'|''|'1'|'1'|''|'StateCertificationLicensureLevels'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dConfiguration.07'|'EMS Agency Procedures'|'D04_04'|'National'|'State'|'A list of all procedures that the agency has implemented and available for use by any/all EMS certification levels.'|'Mandatory'|''|'1'|'M'|''|'snomed'|''|''|''|''|''|''|''|''|'100000'|'1000000000'|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dConfiguration.08'|'EMS Certification Levels Permitted to Administer Each Medication'|'D04_07'|'National'|'State'|'All EMS certification levels which are permitted to administer the medications listed in dConfiguration.09 (EMS Agency Medications).'|'Mandatory'|''|'1'|'1'|''|'StateCertificationLicensureLevels'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dConfiguration.09'|'EMS Agency Medications'|'D04_06'|'National'|'State'|'A list of all medications the agency has implemented and have available for use.'|'Mandatory'|''|'1'|'M'|''|'Medication'|''|''|''|''|''|'2'|'7'|''|''|''|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dConfiguration.10'|'EMS Agency Protocols'|'D04_08'|'National'|'State'|'A list of all of the EMS field protocols that the agency has in place and available for use.'|'Mandatory'|''|'1'|'M'|''|'ProtocolsUsed'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dConfiguration.11'|'EMS Agency Specialty Service Capability'|''|'National'|'State'|'Special training or services provided by the EMS Agency and available to the EMS service area/community.'|'Mandatory'|''|'1'|'M'|''|'AgencySpecialtyServiceCapability'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dConfiguration.12'|'Billing Status'|'D04_10'|''|''|'Indication of whether the EMS agency routinely bills for any segment of the patient population.'|'Optional'|''|'0'|'1'|''|'YesNoValues'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dConfiguration.13'|'Emergency Medical Dispatch (EMD) Provided to EMS Agency Service Area'|''|'National'|'State'|'Indication as to whether Emergency Medical Dispatch is provided to the EMS Agency's service area.'|'Mandatory'|''|'1'|'1'|''|'EMDtoAgencyServiceArea'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dConfiguration.14'|'EMD Vendor'|'D04_17'|''|'State'|'The vendor or company associated with the EMD Card set and algorithms.'|'Recommended'|''|'0'|'M'|'Nillable'|'EMDVendorType'|'NV'|''|''|'NV.NotReporting; NV.NotRecorded; NV.NotApplicable; '|''|'2'|'100'|''|''|''|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dConfiguration.15'|'Patient Monitoring Capability(ies)'|''|'National'|'State'|'The EMS Agency's patient monitoring capability which can be provided to any/all patients presenting to EMS.'|'Mandatory'|''|'1'|'M'|''|'PatientMonitoringCapability'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dConfiguration.16'|'Crew Call Sign'|'D04_02'|'National'|'State'|'The EMS crew call sign used to dispatch and communicate with the unit.  This may be the same as the EMS Unit/Vehicle Number in many agencies.'|'Mandatory'|''|'1'|'M'|''|'AgencyCallSign'|''|''|''|''|''|'1'|'50'|''|''|''|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dConfiguration.17'|'Dispatch Center (CAD) Name or ID'|''|''|''|'The name or ID of the dispatch center (Primary or Secondary Service Answering Point - PSAP) that dispatches the EMS agency.'|'Optional'|'Added to the dataset to assist in identifying the CAD / dispatch center providing information to the EMS agency and ePCR when there are multiple dispatch centers sending resources to the same EMS incident.'|'0'|'M'|''|'DispatchCenterCADNameorID'|''|''|''|''|''|'2'|'100'|''|''|''|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dLocation.01'|'EMS Location Type'|''|''|''|'The type of EMS Location which could be a fixed station or a pre-determined staging area.'|'Optional'|'Added to allow multiple locations to be documented for an EMS Agency.'|'0'|'1'|''|'LocationType'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dLocation.02'|'EMS Location Name'|'D05_01'|''|''|'The name of the EMS Location.'|'Optional'|''|'0'|'1'|''|'StationName'|''|''|''|''|''|'2'|'100'|''|''|''|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dLocation.03'|'EMS Location Number'|'D05_02'|''|''|'The ID number of the EMS Location.'|'Optional'|''|'0'|'1'|''|'StationNumber'|''|''|''|''|''|'1'|'50'|''|''|''|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dLocation.04'|'EMS Location GPS'|'D05_04'|''|''|'The GPS coordinate of  the EMS location.'|'Optional'|''|'0'|'1'|''|'GPSLocation'|''|''|''|''|''|''|''|''|''|''|''|''|''|'(\\+|-)?(90(\\.[0]{1,6})?|([1-8][0-9]|[0-9])(\\.[0-9]{1,6})?),(\\+|-)?(180(\\.[0]{1,6})?|(1[0-7][0-9]|[1-9][0-9]|[0-9])(\\.[0-9]{1,6})?)'|\n" +
        "'DEMDataSet'|'element'|'dLocation.05'|'EMS Location US National Grid Coordinates'|''|''|''|'The US National Grid Coordinates of the EMS location.'|'Optional'|''|'0'|'1'|''|'USNG'|''|''|''|''|''|''|''|''|''|''|''|''|''|'[1][0-9][RSTU][ABCDEFGHJKLMNPQRSTUVWXYZ][ABCDEFGHJKLMNPQRSTUV][0-9]{8}'|\n" +
        "'DEMDataSet'|'element'|'dLocation.06'|'EMS Location Address'|'D05_05'|''|''|'The address of the EMS Location.'|'Optional'|''|'0'|'1'|''|'StreetAddress'|''|''|''|''|''|'1'|'255'|''|''|''|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dLocation.07'|'EMS Location City'|'D05_06'|''|''|'The city of the EMS location type (e.g., Fixed station, sub-station, staging area, etc.).'|'Optional'|''|'0'|'1'|''|'CityGnisCode'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dLocation.08'|'EMS Location State'|'D05_07'|''|''|'The state of the EMS Location.'|'Optional'|''|'0'|'1'|''|'ANSIStateCode'|''|''|''|''|''|''|''|''|''|''|''|''|''|'[0-9]{2}'|\n" +
        "'DEMDataSet'|'element'|'dLocation.09'|'EMS Station or Location ZIP Code'|'D05_08'|''|''|'The ZIP code of the EMS Location.'|'Optional'|''|'0'|'1'|''|'ZIP'|''|''|''|''|''|''|''|''|''|''|''|''|''|'[0-9]{5}|[0-9]{5}-[0-9]{4}|[0-9]{5}-[0-9]{5}|[A-Z][0-9][A-Z] [0-9][A-Z][0-9]'|\n" +
        "'DEMDataSet'|'element'|'dLocation.10'|'EMS Location County'|''|''|''|'The county of the EMS Location'|'Optional'|''|'0'|'1'|''|'ANSICountyCode'|''|''|''|''|''|''|''|''|''|''|''|''|''|'[0-9]{5}'|\n" +
        "'DEMDataSet'|'element'|'dLocation.11'|'EMS Location Country'|''|''|''|'The country of the EMS location.'|'Optional'|'Added to improve international implementations.'|'0'|'1'|''|'ANSICountryCodesCAMXUS'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dLocation.12'|'EMS Location Phone Number'|'D05_09'|''|''|'The phone number of the EMS Location.'|'Optional'|''|'0'|'M'|''|'PhoneNumber'|''|''|''|''|''|''|''|''|''|''|''|''|''|'[2-9][0-9][0-9]-[2-9][0-9][0-9]-[0-9][0-9][0-9][0-9]'|\n" +
        "'DEMDataSet'|'element'|'dVehicle.01'|'Unit/Vehicle Number'|'D06_01'|''|'State'|'The unique ID number for the unit which is specific for each vehicle. This ID number may be the state's vehicle's permit number.'|'Recommended'|''|'0'|'1'|'Nillable'|'VehicleNumber'|'NV'|''|''|'NV.NotReporting; NV.NotRecorded; NV.NotApplicable; '|''|'1'|'25'|''|''|''|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dVehicle.02'|'Vehicle Identification Number'|''|''|''|'The manufacturer's VIN associated with the vehicle.'|'Optional'|''|'0'|'1'|''|'VehicleIdentificationNumber'|''|''|''|''|''|'17'|'17'|''|''|''|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dVehicle.03'|'EMS Unit Call Sign'|''|''|''|'The EMS unit number used to dispatch and communicate with the unit. This may be the same as the EMS Unit/Vehicle Number in many agencies.'|'Optional'|''|'0'|'1'|''|'EMSUnitCallSign'|''|''|''|''|''|'1'|'50'|''|''|''|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dVehicle.04'|'Vehicle Type'|'D06_03'|''|'State'|'The vehicle type of the unit (ambulance, fire, truck, etc.).'|'Recommended'|''|'0'|'1'|'Nillable'|'VehicleType'|'NV'|''|''|'NV.NotReporting; NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dVehicle.05'|'Crew State Certification/Licensure Levels'|'D06_04'|''|''|'The certification/licensure level of the ambulance by the state or the certification/licensure level at which the vehicle is most commonly staffed.'|'Optional'|''|'0'|'1'|''|'StateCertificationLicensureLevels'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dVehicle.06'|'Number of Each EMS Personnel Level on Normal 911 Ambulance Response'|'D06_05'|''|''|'The number of each personnel level associated with the vehicle crew.'|'Optional'|''|'0'|'1'|''|'NumberofPersonnel'|''|''|''|''|''|''|''|''|'1'|'12'|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dVehicle.07'|'Number of Each EMS Personnel Level on Normal 911 Response (Non-Transport) Vehicle'|''|''|''|'The number of each personnel level for your EMS Agency's Medical (Non-911) Non-Transport Ambulance.'|'Optional'|''|'0'|'1'|''|'NumberofPersonnel'|''|''|''|''|''|''|''|''|'1'|'12'|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dVehicle.08'|'Number of Each EMS Personnel Level on Normal Medical (Non-911) Transport Ambulance'|''|''|''|'The number of each personnel level for your EMS Agency's Medical (Non-911) Transport Ambulance.'|'Optional'|''|'0'|'1'|''|'NumberofPersonnel'|''|''|''|''|''|''|''|''|'1'|'12'|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dVehicle.09'|'Vehicle Initial Cost'|'D06_06'|''|''|'Initial costs of vehicles held by agency excluding all medical and other equipment not associated with the vehicle. This cost should be inclusive of all sources of funding including grants, donations, and any other capital.'|'Optional'|''|'0'|'1'|''|'VehicleInitialCost'|''|''|''|''|''|''|''|''|'1'|'10000000'|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dVehicle.10'|'Vehicle Model Year'|'D06_07'|''|'State'|'The year the vehicle was manufactured.'|'Recommended'|''|'0'|'1'|'Nillable'|'Year'|'NV'|''|''|'NV.NotReporting; NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|'1900'|'2050'|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dVehicle.11'|'Year Miles/Kilometers Hours Accrued'|'D06_08'|''|''|'The year the hours and miles/kilometers were accumulated.'|'Optional'|''|'0'|'1'|''|'Year'|''|''|''|''|''|''|''|''|'1900'|'2050'|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dVehicle.12'|'Annual Vehicle Hours'|'D06_09'|''|''|'The number of hours the vehicle was in service for the agency for the defined year.'|'Optional'|''|'0'|'1'|''|'VehicleHours'|''|''|''|''|''|''|''|''|'1'|'10000'|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dVehicle.13'|'Annual Vehicle Miles/Kilometers'|'D06_10'|''|''|'The number of miles/kilometers the vehicle accumulated in service for the agency for the defined year (Odometer Reading).'|'Optional'|''|'0'|'1'|''|'AnnualOdometerReading'|''|''|''|''|''|''|''|''|''|''|''|'7'|'1'|''|\n" +
        "'DEMDataSet'|'element'|'dPersonnel.01'|'EMS Personnel's Last Name'|'D08_01'|''|'State'|'The last name of the personnel.'|'Recommended'|''|'0'|'1'|'Nillable'|'PersonLastName'|'NV'|''|''|'NV.NotReporting; NV.NotRecorded; NV.NotApplicable; '|''|'1'|'60'|''|''|''|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dPersonnel.02'|'EMS Personnel's First Name'|'D08_03'|''|'State'|'The first name of the personnel.'|'Recommended'|''|'0'|'1'|'Nillable'|'PersonFirstName'|'NV'|''|''|'NV.NotReporting; NV.NotRecorded; NV.NotApplicable; '|''|'1'|'50'|''|''|''|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dPersonnel.03'|'EMS Personnel's Middle Name/Initial'|'D08_02'|''|'State'|'The middle name or initial of the personnel.'|'Recommended'|''|'0'|'1'|'Nillable'|'PersonMiddleName'|'NV'|''|''|'NV.NotReporting; NV.NotRecorded; NV.NotApplicable; '|''|'1'|'50'|''|''|''|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dPersonnel.04'|'EMS Personnel's Mailing Address'|'D08_04'|''|''|'The Street or PO Box of the personnel's mailing address.'|'Optional'|''|'0'|'1'|''|'StreetAddress'|''|''|''|''|''|'1'|'255'|''|''|''|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dPersonnel.05'|'EMS Personnel's City of Residence'|'D08_05'|''|''|'The city of the personnel's mailing address.'|'Optional'|''|'0'|'1'|''|'CityGnisCode'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dPersonnel.06'|'EMS Personnel's State'|'D08_06'|''|''|'The state of the personnel's mailing address.'|'Optional'|''|'0'|'1'|''|'ANSIStateCode'|''|''|''|''|''|''|''|''|''|''|''|''|''|'[0-9]{2}'|\n" +
        "'DEMDataSet'|'element'|'dPersonnel.07'|'EMS Personnel's ZIP Code'|'D08_07'|''|''|'The ZIP code of the personnel's mailing address.'|'Optional'|''|'0'|'1'|''|'ZIP'|''|''|''|''|''|''|''|''|''|''|''|''|''|'[0-9]{5}|[0-9]{5}-[0-9]{4}|[0-9]{5}-[0-9]{5}|[A-Z][0-9][A-Z] [0-9][A-Z][0-9]'|\n" +
        "'DEMDataSet'|'element'|'dPersonnel.08'|'EMS Personnel's Country'|''|''|''|'The country of the personnel mailing address.'|'Optional'|''|'0'|'1'|''|'ANSICountryCodesCAMXUS'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dPersonnel.09'|'EMS Personnel's Phone Number'|'D08_08'|''|''|'The phone number for the personnel.'|'Optional'|''|'0'|'M'|''|'PhoneNumber'|''|''|''|''|''|''|''|''|''|''|''|''|''|'[2-9][0-9][0-9]-[2-9][0-9][0-9]-[0-9][0-9][0-9][0-9]'|\n" +
        "'DEMDataSet'|'element'|'dPersonnel.10'|'EMS Personnel's Email Address'|'D08_10'|''|''|'The primary email address of the personnel.'|'Optional'|''|'0'|'M'|''|'EmailAddress'|''|''|''|''|''|'3'|'100'|''|''|''|''|''|''|'.+@.+'|\n" +
        "'DEMDataSet'|'element'|'dPersonnel.11'|'EMS Personnel's Date of Birth'|'D08_11'|''|'State'|'The personnel's date of birth.'|'Recommended'|''|'0'|'1'|'Nillable'|'DateType'|'NV'|''|''|'NV.NotReporting; NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|'1900-01-01'|'2050-01-01'|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dPersonnel.12'|'EMS Personnel's Gender'|'D08_12'|''|'State'|'The personnel's gender.'|'Recommended'|''|'0'|'1'|'Nillable'|'Gender'|'NV'|''|''|'NV.NotReporting; NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dPersonnel.13'|'EMS Personnel's Race'|'D08_13'|''|'State'|'The personnel's race as defined by the OMB (US Office of Management and Budget).'|'Recommended'|''|'0'|'M'|'Nillable'|'DemographicRace'|'NV'|''|''|'NV.NotReporting; NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dPersonnel.14'|'EMS Personnel's Citizenship'|''|''|''|'The documentation of the personnel's citizenship.'|'Optional'|''|'0'|'1'|''|'ANSICountryCode'|''|''|''|''|''|''|''|'2'|''|''|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dPersonnel.15'|'EMS Personnel's Highest Educational Degree'|''|''|''|'The highest educational degree completed by the personnel.'|'Optional'|''|'0'|'1'|''|'PersonnelHighestEducationalDegree'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dPersonnel.16'|'EMS Personnel's Degree Subject/Field of Study'|''|''|''|'The area of the personnel's post high-school (post-secondary) degree.'|'Optional'|''|'0'|'M'|''|'PersonnelDegreeFieldofStudy'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dPersonnel.17'|'EMS Personnel's Motor Vehicle License Type'|''|''|''|'The type of motor vehicle license (i.e. Class A, B, Pilot, etc.) of the EMS personnel.'|'Optional'|''|'0'|'M'|''|'PersonnelVehicleLicenseType'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dPersonnel.18'|'EMS Personnel's Immunization Status'|''|''|''|'The type of immunization status.'|'Optional'|''|'0'|'1'|''|'ImmunizationType'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dPersonnel.19'|'EMS Personnel's Immunization Year'|''|''|''|'The year associated with each immunization type.'|'Optional'|''|'0'|'1'|''|'Year'|''|''|''|''|''|''|''|''|'1900'|'2050'|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dPersonnel.20'|'EMS Personnel's Foreign Language Ability'|''|''|''|'The languages spoken (other than English) by the personnel with at least an elementary level of proficiency.'|'Optional'|'Added to better describe the EMS workforce.'|'0'|'M'|''|'PersonnelForeignLanguageAbility'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dPersonnel.21'|'EMS Personnel's Agency ID Number'|'D07_01'|''|''|'The local agency ID number for the personnel.'|'Optional'|''|'0'|'1'|''|'PersonnelAgencyIDNumber'|''|''|''|''|''|'2'|'50'|''|''|''|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dPersonnel.22'|'EMS Personnel's State of Licensure'|''|''|'State'|'The state of the certification/licensure ID number assigned to the personnel member.'|'Recommended'|''|'0'|'1'|'Nillable'|'ANSIStateCode'|'NV'|''|''|'NV.NotReporting; NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|'[0-9]{2}'|\n" +
        "'DEMDataSet'|'element'|'dPersonnel.23'|'EMS Personnel's State's Licensure ID Number'|'D07_02'|''|'State'|'The state's licensure/certification ID number for the personnel.'|'Recommended'|''|'0'|'1'|'Nillable'|'StateLicensureID'|'NV'|''|''|'NV.NotReporting; NV.NotRecorded; NV.NotApplicable; '|''|'2'|'50'|''|''|''|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dPersonnel.24'|'EMS Personnel's State EMS Certification Licensure Level'|'D08_15'|''|'State'|'The personnel's state EMS certification level.'|'Recommended'|''|'0'|'1'|'Nillable'|'MemberLevel'|'NV'|''|''|'NV.NotReporting; NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dPersonnel.25'|'EMS Personnel's State EMS Current Certification Date'|'D08_17'|''|''|'The date of the personnel's current EMS certification/licensure.'|'Optional'|''|'0'|'1'|''|'DateType'|''|''|''|''|''|''|''|''|'1900-01-01'|'2050-01-01'|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dPersonnel.26'|'EMS Personnel's Initial State's Licensure Issue Date'|'D08_18'|''|''|'The date on which the EMS personnel's state's EMS certification/licensure was originally issued. This is the date of the first certification/licensure for the EMS level.'|'Optional'|''|'0'|'1'|''|'DateType'|''|''|''|''|''|''|''|''|'1900-01-01'|'2050-01-01'|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dPersonnel.27'|'EMS Personnel's Current State's Licensure Expiration Date'|''|''|''|'The date on which the EMS personnel's (highest) state EMS certification/licensure expires.'|'Optional'|''|'0'|'1'|''|'DateType'|''|''|''|''|''|''|''|''|'1900-01-01'|'2050-01-01'|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dPersonnel.28'|'EMS Personnel's National Registry Number'|''|''|''|'The National Registry number associated with the level of certification/licensure obtained through NREMT.'|'Optional'|''|'0'|'1'|''|'NationalRegistryNumber'|''|''|''|''|''|''|''|''|''|''|''|''|''|'[A-Z][A-Z0-9][0-9]{6}'|\n" +
        "'DEMDataSet'|'element'|'dPersonnel.29'|'EMS Personnel's National Registry Certification Level'|''|''|''|'The level of the current National Registry of Emergency Medical Technicians (NREMT) certification.'|'Optional'|''|'0'|'1'|''|'NationalRegistryCertificationLevel'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dPersonnel.30'|'EMS Personnel's Current National Registry Expiration Date'|''|''|''|'The date on which the EMS Personnel's National Registry of EMTs certification/licensure expires'|'Optional'|''|'0'|'1'|''|'DateType'|''|''|''|''|''|''|''|''|'1900-01-01'|'2050-01-01'|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dPersonnel.31'|'EMS Personnel's Employment Status'|'D07_03'|''|'State'|'The personnel's primary employment status for this agency.'|'Recommended'|''|'0'|'1'|'Nillable'|'EmploymentStatus'|'NV'|''|''|'NV.NotReporting; NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dPersonnel.32'|'EMS Personnel's Employment Status Date'|'D07_04'|''|'State'|'The personnel's employment status date.'|'Recommended'|''|'0'|'1'|'Nillable'|'DateType'|'NV'|''|''|'NV.NotReporting; NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|'1900-01-01'|'2050-01-01'|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dPersonnel.33'|'EMS Personnel's Hire Date'|''|''|''|'The date the employee was hired by the EMS agency for this current job.'|'Optional'|''|'0'|'1'|''|'DateType'|''|''|''|''|''|''|''|''|'1900-01-01'|'2050-01-01'|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dPersonnel.34'|'EMS Personnel's Primary EMS Job Role'|''|''|'State'|'The individuals primary/main EMS role at the EMS agency. This is the function which is performed the majority of the time for the EMS personnel.'|'Recommended'|''|'0'|'1'|'Nillable'|'JobResponsibilities'|'NV'|''|''|'NV.NotReporting; NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dPersonnel.35'|'EMS Personnel's Other Job Responsibilities'|''|''|'State'|'The EMS personnel's other job responsibilities at the agency beyond their primary role documented in dPersonnel.34 (EMS Personnel's Primary EMS Job Role).'|'Recommended'|''|'0'|'M'|'Nillable'|'JobResponsibilities'|'NV'|''|''|'NV.NotReporting; NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dPersonnel.36'|'EMS Personnel's Total Length of Service in Years'|'D08_19'|''|''|'The personnel's total length of EMS service at any level (years).'|'Optional'|''|'0'|'1'|''|'TotalService'|''|''|''|''|''|''|''|''|'0'|'80'|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dPersonnel.37'|'EMS Personnel's Date Length of Service Documented'|'D08_20'|''|''|'The date which the length of EMS service was documented.'|'Optional'|''|'0'|'1'|''|'DateType'|''|''|''|''|''|''|''|''|'1900-01-01'|'2050-01-01'|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dPersonnel.38'|'EMS Personnel's Practice Level'|'D07_05'|''|''|'The EMS certification level at which the individual is providing patient care services for the EMS agency.'|'Optional'|''|'0'|'1'|''|'MemberLevel'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dPersonnel.39'|'Date of Personnel's Certification or Licensure for Agency'|'D07_06'|''|''|'The date that the Certification/Licensure was achieved for the local EMS agency.'|'Optional'|''|'0'|'1'|''|'DateType'|''|''|''|''|''|''|''|''|'1900-01-01'|'2050-01-01'|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dDevice.01'|'Medical Device Serial Number'|'D09_01'|''|''|'The unique manufacturer's serial number associated with a medical device.'|'Optional'|''|'0'|'1'|''|'DeviceSerialNumber'|''|''|''|''|''|'2'|'50'|''|''|''|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dDevice.02'|'Medical Device Name or ID'|'D09_02'|''|''|'The local number or configurable Name/ID of the medical device.'|'Optional'|''|'0'|'1'|''|'DeviceNameorID'|''|''|''|''|''|'2'|'50'|''|''|''|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dDevice.03'|'Medical Device Type'|''|''|''|'The type of medical device.'|'Optional'|''|'0'|'M'|''|'MedicalDeviceType'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dDevice.04'|'Medical Device Manufacturer'|'D09_03'|''|''|'The manufacturer of the medical device.'|'Optional'|''|'0'|'1'|''|'DeviceManufacturer'|''|''|''|''|''|'2'|'50'|''|''|''|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dDevice.05'|'Medical Device Model Number'|'D09_04'|''|''|'The specific manufacturer's model number associated with medical device.'|'Optional'|''|'0'|'1'|''|'ModelNumber'|''|''|''|''|''|'2'|'50'|''|''|''|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dDevice.06'|'Medical Device Purchase Date'|'D09_05'|''|''|'The date the device was purchased or placed in service by the EMS agency.'|'Optional'|''|'0'|'1'|''|'DateType'|''|''|''|''|''|''|''|''|'1900-01-01'|'2050-01-01'|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dFacility.01'|'Type of Facility'|'D04_15'|''|''|'The type of facility (healthcare or other) that the EMS agency transports patients to or from.'|'Optional'|''|'0'|'1'|''|'TypeOfFacility'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dFacility.02'|'Facility Name'|'D04_11'|''|''|'The name of the facility.'|'Optional'|''|'0'|'1'|''|'FacilityName'|''|''|''|''|''|'2'|'100'|''|''|''|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dFacility.03'|'Facility Location Code'|'D04_12'|''|''|'The code of the facility as assigned by the state or the EMS agency.'|'Optional'|''|'0'|'1'|''|'FacilityCode'|''|''|''|''|''|'2'|'50'|''|''|''|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dFacility.04'|'Hospital Designations'|''|''|''|'The designation(s) associated with the hospital (e.g., Trauma, STEMI, Peds, etc.)'|'Optional'|''|'0'|'M'|''|'HospitalDesignation'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dFacility.05'|'Facility National Provider Identifier'|''|''|''|'The facility National Provider Identifier associated with National Provider System (NPS).'|'Optional'|''|'0'|'M'|''|'NationalProviderIdentifier'|''|''|''|''|''|''|''|'10'|''|''|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dFacility.06'|'Facility Room, Suite, or Apartment'|''|''|''|'The number of the specific room, suite, or apartment of the facility.'|'Optional'|''|'0'|'1'|''|'FacilityRoom'|''|''|''|''|''|'1'|'15'|''|''|''|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dFacility.07'|'Facility Street Address'|''|''|''|'The address where the facility is located.'|'Optional'|''|'0'|'1'|''|'StreetAddress'|''|''|''|''|''|'1'|'255'|''|''|''|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dFacility.08'|'Facility City'|''|''|''|'The city where the facility is located (physical address).'|'Optional'|''|'0'|'1'|''|'CityGnisCode'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dFacility.09'|'Facility State'|''|''|''|'The state where the facility is located.'|'Optional'|''|'0'|'1'|''|'ANSIStateCode'|''|''|''|''|''|''|''|''|''|''|''|''|''|'[0-9]{2}'|\n" +
        "'DEMDataSet'|'element'|'dFacility.10'|'Facility ZIP Code'|''|''|''|'The zip code where the facility is located.'|'Optional'|''|'0'|'1'|''|'ZIP'|''|''|''|''|''|''|''|''|''|''|''|''|''|'[0-9]{5}|[0-9]{5}-[0-9]{4}|[0-9]{5}-[0-9]{5}|[A-Z][0-9][A-Z] [0-9][A-Z][0-9]'|\n" +
        "'DEMDataSet'|'element'|'dFacility.11'|'Facility County'|''|''|''|'The county where the facility is located.'|'Optional'|''|'0'|'1'|''|'ANSICountyCode'|''|''|''|''|''|''|''|''|''|''|''|''|''|'[0-9]{5}'|\n" +
        "'DEMDataSet'|'element'|'dFacility.12'|'Facility Country'|''|''|''|'The country where the facility is located.'|'Optional'|''|'0'|'1'|''|'ANSICountryCodesCAMXUS'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dFacility.13'|'Facility GPS Location'|''|''|''|'The facility GPS Coordinates.'|'Optional'|''|'0'|'1'|''|'GPSLocation'|''|''|''|''|''|''|''|''|''|''|''|''|''|'(\\+|-)?(90(\\.[0]{1,6})?|([1-8][0-9]|[0-9])(\\.[0-9]{1,6})?),(\\+|-)?(180(\\.[0]{1,6})?|(1[0-7][0-9]|[1-9][0-9]|[0-9])(\\.[0-9]{1,6})?)'|\n" +
        "'DEMDataSet'|'element'|'dFacility.14'|'Facility US National Grid Coordinates'|''|''|''|'Facility US National Grid Coordinates'|'Optional'|''|'0'|'1'|''|'USNG'|''|''|''|''|''|''|''|''|''|''|''|''|''|'[1][0-9][RSTU][ABCDEFGHJKLMNPQRSTUVWXYZ][ABCDEFGHJKLMNPQRSTUV][0-9]{8}'|\n" +
        "'DEMDataSet'|'element'|'dFacility.15'|'Facility Phone Number'|''|''|''|'Facility phone number.'|'Optional'|''|'0'|'M'|''|'PhoneNumber'|''|''|''|''|''|''|''|''|''|''|''|''|''|'[2-9][0-9][0-9]-[2-9][0-9][0-9]-[0-9][0-9][0-9][0-9]'|\n" +
        "'DEMDataSet'|'element'|'dCustomResults.01'|'Custom Data Element Result'|''|''|''|'The actual value or values chosen (if values listed in dCustomConfiguration.06) or result (free text, Date/Time, or number) documented for the Custom Data Element'|'Mandatory'|'Added to allow customized data elements to be inserted and collected from within the NEMSIS Version 3 standard.'|'1'|'M'|'Nillable'|'CustomResults'|'NV'|'PN'|''|''|''|'1'|'100000'|''|''|''|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dCustomResults.02'|'Custom Element ID Referenced'|''|''|''|'References the CustomElementID attribute for dCustomConfiguration.CustomGroup'|'Mandatory'|''|'1'|'1'|''|'CorrelationID'|''|''|''|''|''|'0'|'255'|''|''|''|''|''|''|''|\n" +
        "'DEMDataSet'|'element'|'dCustomResults.03'|'CorrelationID of DemographicReport Element or Group'|''|''|''|'References the CorrelationID attribute of an element or group in the DemographicReport section'|'Optional'|''|'0'|'1'|''|'CorrelationID'|''|''|''|''|''|'0'|'255'|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eState.01'|'State Required Element'|''|''|''|'Indicates which elements are required by the state'|'Optional'|''|'0'|'M'|''|'StateRequiredElement'|''|''|''|''|''|'1'|'100'|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'dAgency.01'|'EMS Agency Unique State ID'|''|'National'|'State'|'The unique ID assigned to the EMS Agency which is associated with all state licensure numbers and information.'|'Mandatory'|''|'1'|'1'|''|'EMSAgencyStateID'|''|''|''|''|''|'1'|'50'|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'dAgency.02'|'EMS Agency Number'|'D01_01'|'National'|'State'|'The state-assigned provider number of the responding agency'|'Mandatory'|''|'1'|'1'|''|'EMSAgencyNumber'|''|''|''|''|''|'1'|'15'|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'dAgency.04'|'EMS Agency State'|'D01_03'|'National'|'State'|'The state/territory which assigned the EMS agency number.'|'Mandatory'|''|'1'|'1'|''|'ANSIStateCode'|''|''|''|''|''|''|''|''|''|''|''|''|''|'[0-9]{2}'|\n" +
        "'EMSDataSet'|'element'|'eCustomConfiguration.01'|'Custom Data Element Title'|''|''|''|'This is the title of the custom data element created to collect information that is not defined formally in NEMSIS Version 3.'|'Mandatory'|'Added to allow customized data elements to be inserted and collected from within the NEMSIS Version 3 standard.'|'1'|'1'|''|'CustomTitle'|''|''|''|''|''|'2'|'100'|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eCustomConfiguration.02'|'Custom Definition'|''|''|''|'The definition of the custom element and how it should be used.'|'Mandatory'|''|'1'|'1'|''|'CustomDefinition'|''|''|''|''|''|'0'|'255'|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eCustomConfiguration.03'|'Custom Data Type'|''|''|''|'The data type of the custom element.'|'Mandatory'|''|'1'|'1'|''|'CustomDataType'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eCustomConfiguration.04'|'Custom Data Element Recurrence'|''|''|''|'Indication if the data element will accept multiple values.'|'Mandatory'|'Added to allow customized data elements to be inserted and collected from within the NEMSIS Version 3 standard.'|'1'|'1'|''|'YesNoValues'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eCustomConfiguration.05'|'Custom Data Element Usage'|''|''|''|'The Usage (Mandatory, Required, Recommended or Optional) for the Custom Data Element.'|'Mandatory'|'Added to allow customized data elements to be inserted and collected from within the NEMSIS Version 3 standard.'|'1'|'1'|''|'ElementUsage'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eCustomConfiguration.06'|'Custom Data Element Potential Values'|''|''|''|'The values which are associated with the Custom Data Element. Values would be the choices provided to the user when they document the Custom Data Element'|'Optional'|'Added to allow customized data elements to be inserted and collected from within the NEMSIS Version 3 standard.'|'0'|'M'|''|'CustomValue'|''|''|''|''|''|'1'|'100'|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eCustomConfiguration.07'|'Custom Data Element Potential NOT Values (NV)'|''|''|''|'NOT Values (NV) associated with the custom element'|'Optional'|''|'0'|'M'|''|'NV'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eCustomConfiguration.08'|'Custom Data Element Potential Pertinent Negative Values (PN)'|''|''|''|'Pertinent Negative Values (PN) associated with the custom element'|'Optional'|''|'0'|'M'|''|'PN'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eCustomConfiguration.09'|'Custom Data Element Grouping ID'|''|''|''|'ID for custom element grouping.'|'Optional'|''|'0'|'1'|''|'CorrelationID'|''|''|''|''|''|'0'|'255'|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eRecord.01'|'Patient Care Report Number'|'E01_01'|'National'|'State'|'The unique number automatically assigned by the EMS agency for each Patient Care Report (PCR). This should be a unique number for the EMS agency for all of time.'|'Mandatory'|''|'1'|'1'|''|'PatientCareReportNumber'|''|''|''|''|''|'3'|'50'|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eRecord.02'|'Software Creator'|'E01_02'|'National'|'State'|'The name of the vendor, manufacturer, and developer who designed the application that created this record.'|'Mandatory'|''|'1'|'1'|''|'SoftwareCreator'|''|''|''|''|''|'1'|'50'|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eRecord.03'|'Software Name'|'E01_03'|'National'|'State'|'The name of the application used to create this record.'|'Mandatory'|''|'1'|'1'|''|'SoftwareName'|''|''|''|''|''|'1'|'50'|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eRecord.04'|'Software Version'|'E01_04'|'National'|'State'|'The version of the application used to create this record.'|'Mandatory'|''|'1'|'1'|''|'SoftwareVersion'|''|''|''|''|''|'1'|'50'|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eResponse.01'|'EMS Agency Number'|'E02_01'|'National'|'State'|'The state-assigned provider number of the responding agency'|'Mandatory'|''|'1'|'1'|''|'EMSAgencyNumber'|''|''|''|''|''|'1'|'15'|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eResponse.02'|'EMS Agency Name'|''|''|'State'|'EMS Agency Name'|'Recommended'|''|'0'|'1'|'Nillable'|'EMSAgencyName'|'NV'|''|''|'NV.NotReporting; NV.NotRecorded; NV.NotApplicable; '|''|'2'|'100'|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eResponse.03'|'Incident Number'|'E02_02'|'National'|'State'|'The incident number assigned by the 911 Dispatch System'|'Required'|''|'1'|'1'|'Nillable'|'EMSIncidentNumber'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|'3'|'50'|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eResponse.04'|'EMS Response Number'|'E02_03'|'National'|'State'|'The internal EMS response number which is unique for each EMS Vehicle's (Unit) response to an incident within an EMS Agency.'|'Required'|''|'1'|'1'|'Nillable'|'EMSResponseNumber'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|'3'|'50'|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eResponse.05'|'Type of Service Requested'|'E02_04'|'National'|'State'|'The type of service or category of service requested of the EMS Agency responding for this specific EMS event'|'Mandatory'|''|'1'|'1'|''|'EMSServiceCat'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eResponse.06'|'Standby Purpose'|''|''|''|'The main reason the EMS Unit is on Standby as the Primary Type of Service for the EMS event.'|'Optional'|''|'0'|'1'|''|'EMSStandByReason'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eResponse.07'|'Primary Role of the Unit'|'E02_05'|'National'|'State'|'The primary role of the EMS Unit which responded to this specific EMS event'|'Mandatory'|''|'1'|'1'|''|'PrimaryRoleOfUnit'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eResponse.08'|'Type of Dispatch Delay'|'E02_06'|'National'|'State'|'The dispatch delays, if any, associated with the dispatch of the EMS unit to the EMS event.'|'Required'|''|'1'|'M'|'Nillable'|'EMSDispatchDelayReason'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eResponse.09'|'Type of Response Delay'|'E02_07'|'National'|'State'|'The response delays, if any, of the EMS unit associated with the EMS event.'|'Required'|''|'1'|'M'|'Nillable'|'EMSUnitDelayReason'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eResponse.10'|'Type of Scene Delay'|'E02_08'|'National'|'State'|'The scene delays, if any, of the EMS unit associated with the EMS event.'|'Required'|''|'1'|'M'|'Nillable'|'EMSSceneUnitDelayReason'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eResponse.11'|'Type of Transport Delay'|'E02_09'|'National'|'State'|'The transport delays, if any, of the EMS unit associated with the EMS event.'|'Required'|''|'1'|'M'|'Nillable'|'EMSTransportUnitDelayReason'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eResponse.12'|'Type of Turn-Around Delay'|'E02_10'|'National'|'State'|'The turn-around delays, if any, of EMS unit associated with the EMS event.'|'Required'|''|'1'|'M'|'Nillable'|'EMSTurnaroundUnitDelayReason'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eResponse.13'|'EMS Vehicle (Unit) Number'|'E02_11'|'National'|'State'|'The unique physical vehicle number of the responding unit.'|'Mandatory'|''|'1'|'1'|''|'EMSVehicleNumber'|''|''|''|''|''|'1'|'25'|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eResponse.14'|'EMS Unit Call Sign'|'E02_12'|'National'|'State'|'The EMS unit number used to dispatch and communicate with the unit. This may be the same as the EMS Unit/Vehicle Number in many agencies.'|'Mandatory'|''|'1'|'1'|''|'EMSUnitCallSign'|''|''|''|''|''|'1'|'50'|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eResponse.15'|'Level of Care of This Unit'|''|'National'|'State'|'The level of care (BLS or ALS) the unit is able to provide based on the units' treatment capabilities for this EMS response.'|'Mandatory'|''|'1'|'1'|''|'UnitLevelOfCare'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eResponse.16'|'Vehicle Dispatch Location'|'E02_13'|''|''|'The EMS location or healthcare facility representing the geographic location of the unit or crew at the time of dispatch.'|'Optional'|''|'0'|'1'|''|'VehicleDispatchLocation'|''|''|''|''|''|'2'|'100'|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eResponse.17'|'Vehicle Dispatch GPS Location'|'E02_15'|''|''|'The GPS coordinates associated with the EMS unit at the time of dispatch documented in decimal degrees.'|'Optional'|''|'0'|'1'|''|'GPSLocation'|''|''|''|''|''|''|''|''|''|''|''|''|''|'(\\+|-)?(90(\\.[0]{1,6})?|([1-8][0-9]|[0-9])(\\.[0-9]{1,6})?),(\\+|-)?(180(\\.[0]{1,6})?|(1[0-7][0-9]|[1-9][0-9]|[0-9])(\\.[0-9]{1,6})?)'|\n" +
        "'EMSDataSet'|'element'|'eResponse.18'|'Vehicle Dispatch Location US National Grid Coordinates'|''|''|''|'The US National Grid Coordinates for the EMS Vehicle's Dispatch Location.'|'Optional'|''|'0'|'1'|''|'USNG'|''|''|''|''|''|''|''|''|''|''|''|''|''|'[1][0-9][RSTU][ABCDEFGHJKLMNPQRSTUVWXYZ][ABCDEFGHJKLMNPQRSTUV][0-9]{8}'|\n" +
        "'EMSDataSet'|'element'|'eResponse.19'|'Beginning Odometer Reading of Responding Vehicle'|'E02_16'|''|'State'|'The mileage (counter or odometer reading) of the vehicle at the beginning of the call (when the wheels begin moving). If EMS vehicle/unit is via water or air travel document the number in \"hours\" as it relates to the documentation of Boat, Fixed Wing, or Rotor Craft in eDisposition.16 (EMS Transport Method)'|'Optional'|''|'0'|'1'|''|'EMSMileageOdometer'|''|''|''|''|''|''|''|''|''|''|''|'8'|'2'|''|\n" +
        "'EMSDataSet'|'element'|'eResponse.20'|'On-Scene Odometer Reading of Responding Vehicle'|'E02_17'|''|'State'|'The mileage (counter or odometer reading) of the vehicle when it arrives at the scene. If EMS vehicle/unit is via water or air travel document the number in \"hours\" as it relates to the documentation of Boat, Fixed Wing, or Rotor Craft in eDisposition.16 (EMS Transport Method)'|'Optional'|''|'0'|'1'|''|'EMSMileageOdometer'|''|''|''|''|''|''|''|''|''|''|''|'8'|'2'|''|\n" +
        "'EMSDataSet'|'element'|'eResponse.21'|'Patient Destination Odometer Reading of Responding Vehicle'|'E02_18'|''|'State'|'The mileage (counter or odometer reading) of the vehicle when it arrives at the patient's destination. If EMS vehicle/unit is via water or air travel document the number in \"hours\" as it relates to the documentation of Boat, Fixed Wing, or Rotor Craft in eDisposition.16 (EMS Transport Method)'|'Optional'|''|'0'|'1'|''|'EMSMileageOdometer'|''|''|''|''|''|''|''|''|''|''|''|'8'|'2'|''|\n" +
        "'EMSDataSet'|'element'|'eResponse.22'|'Ending Odometer Reading of Responding Vehicle'|'E02_19'|''|'State'|'If using a counter, this is the mileage traveled beginning with dispatch through the transport of the patient to their destination and ending when back in service, starting from 0. If EMS vehicle/unit is via water or air travel document the number in \"hours\" as it relates to the documentation of boat, Fixed Wing, or Rotor Craft in eDisposition.16'|'Optional'|''|'0'|'1'|''|'EMSMileageOdometer'|''|''|''|''|''|''|''|''|''|''|''|'8'|'2'|''|\n" +
        "'EMSDataSet'|'element'|'eResponse.23'|'Response Mode to Scene'|'E02_20'|'National'|'State'|'The indication whether the response was emergent or non-emergent. An emergent response is an immediate response (typically using lights and sirens).'|'Mandatory'|''|'1'|'1'|''|'EMSResponseMode'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eResponse.24'|'Additional Response Mode Descriptors'|''|'National'|'State'|'The documentation of response mode techniques used for this EMS response.'|'Required'|''|'1'|'M'|'Nillable'|'EMSAdditionalResponseMode'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eDispatch.01'|'Complaint Reported by Dispatch'|'E03_01'|'National'|'State'|'The complaint dispatch reported to the responding unit.'|'Mandatory'|''|'1'|'1'|''|'ComplaintReportedByDispatch'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eDispatch.02'|'EMD Performed'|'E03_02'|'National'|'State'|'Indication of whether Emergency Medical Dispatch was performed for this EMS event.'|'Required'|''|'1'|'1'|'Nillable'|'EMDPerformed'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eDispatch.03'|'EMD Card Number'|'E03_03'|''|''|'The EMD card number reported by dispatch, consisting of the card number, dispatch level, and dispatch mode'|'Optional'|''|'0'|'1'|''|'EMDCardNumber'|''|''|''|''|''|'1'|'10'|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eDispatch.04'|'Dispatch Center Name or ID'|''|''|''|'The name or ID of the dispatch center providing electronic data to the PCR for the EMS agency, if applicable.'|'Optional'|'Added to the dataset to assist in identifying the CAD / dispatch center providing information to the EMS agency and ePCR when there are multiple dispatch centers sending resources to the same EMS incident.'|'0'|'1'|''|'ComputerAidedDispatchCADNameorID'|''|''|''|''|''|'2'|'100'|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eDispatch.05'|'Dispatch Priority (Patient Acuity)'|''|''|''|'The actual, apparent, or potential acuity of the patient's condition as determined through information obtained during the EMD process.'|'Optional'|''|'0'|'1'|''|'DispatchPriority'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eDispatch.06'|'Unit Dispatched CAD Record ID'|''|''|''|'The unique ID assigned by the CAD system for the specific unit response.'|'Optional'|''|'0'|'1'|''|'UnitDispatchedCADRecordID'|''|''|''|''|''|'3'|'50'|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eCrew.01'|'Crew Member ID'|'E04_01'|''|'State'|'The state certification/licensure ID number assigned to the crew member.'|'Recommended'|''|'0'|'1'|'Nillable'|'CrewMemberID'|'NV'|''|''|'NV.NotReporting; NV.NotRecorded; NV.NotApplicable; '|''|'2'|'50'|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eCrew.02'|'Crew Member Level'|'E04_03'|''|'State'|'The functioning level of the crew member ID during this EMS patient encounter.'|'Recommended'|''|'0'|'1'|'Nillable'|'MemberLevel'|'NV'|''|''|'NV.NotReporting; NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eCrew.03'|'Crew Member Response Role'|'E04_02'|''|'State'|'The role(s) of the role member during response, at scene treatment, and/or transport.'|'Recommended'|''|'0'|'M'|'Nillable'|'CrewMemberRoles'|'NV'|''|''|'NV.NotReporting; NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eTimes.01'|'PSAP Call Date/Time'|'E05_02'|'National'|'State'|'The date/time the phone rings (911 call to public safety answering point or other designated entity) requesting EMS services.'|'Required'|''|'1'|'1'|'Nillable'|'DateTimeType'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|'1950-01-01T00:00:00-00:00'|'2050-01-01T00:00:00-00:00'|''|''|''|'[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\\.\\d+)?(\\+|-)[0-9]{2}:[0-9]{2}'|\n" +
        "'EMSDataSet'|'element'|'eTimes.02'|'Dispatch Notified Date/Time'|'E05_03'|''|''|'The date/time dispatch was notified by the 911 call taker (if a separate entity).'|'Optional'|''|'0'|'1'|''|'DateTimeType'|''|''|''|''|''|''|''|''|'1950-01-01T00:00:00-00:00'|'2050-01-01T00:00:00-00:00'|''|''|''|'[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\\.\\d+)?(\\+|-)[0-9]{2}:[0-9]{2}'|\n" +
        "'EMSDataSet'|'element'|'eTimes.03'|'Unit Notified by Dispatch Date/Time'|'E05_04'|'National'|'State'|'The date/time the responding unit was notified by dispatch.'|'Mandatory'|''|'1'|'1'|''|'DateTimeType'|''|''|''|''|''|''|''|''|'1950-01-01T00:00:00-00:00'|'2050-01-01T00:00:00-00:00'|''|''|''|'[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\\.\\d+)?(\\+|-)[0-9]{2}:[0-9]{2}'|\n" +
        "'EMSDataSet'|'element'|'eTimes.04'|'Dispatch Acknowledged Date/Time'|''|''|''|'The date/time the dispatch was acknowledged by the EMS Unit.'|'Optional'|''|'0'|'1'|''|'DateTimeType'|''|''|''|''|''|''|''|''|'1950-01-01T00:00:00-00:00'|'2050-01-01T00:00:00-00:00'|''|''|''|'[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\\.\\d+)?(\\+|-)[0-9]{2}:[0-9]{2}'|\n" +
        "'EMSDataSet'|'element'|'eTimes.05'|'Unit En Route Date/Time'|'E05_05'|'National'|'State'|'The date/time the unit responded; that is, the time the vehicle started moving.'|'Required'|''|'1'|'1'|'Nillable'|'DateTimeType'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|'1950-01-01T00:00:00-00:00'|'2050-01-01T00:00:00-00:00'|''|''|''|'[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\\.\\d+)?(\\+|-)[0-9]{2}:[0-9]{2}'|\n" +
        "'EMSDataSet'|'element'|'eTimes.06'|'Unit Arrived on Scene Date/Time'|'E05_06'|'National'|'State'|'The date/time the responding unit arrived on the scene; that is, the time the vehicle stopped moving at the scene.'|'Required'|''|'1'|'1'|'Nillable'|'DateTimeType'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|'1950-01-01T00:00:00-00:00'|'2050-01-01T00:00:00-00:00'|''|''|''|'[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\\.\\d+)?(\\+|-)[0-9]{2}:[0-9]{2}'|\n" +
        "'EMSDataSet'|'element'|'eTimes.07'|'Arrived at Patient Date/Time'|'E05_07'|'National'|'State'|'The date/time the responding unit arrived at the patient's side.'|'Required'|''|'1'|'1'|'Nillable'|'DateTimeType'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|'1950-01-01T00:00:00-00:00'|'2050-01-01T00:00:00-00:00'|''|''|''|'[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\\.\\d+)?(\\+|-)[0-9]{2}:[0-9]{2}'|\n" +
        "'EMSDataSet'|'element'|'eTimes.08'|'Transfer of EMS Patient Care Date/Time'|'E05_08'|''|'State'|'The date/time the patient was transferred from this EMS agency to another EMS agency for care.'|'Recommended'|''|'0'|'1'|'Nillable'|'DateTimeType'|'NV'|''|''|'NV.NotReporting; NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|'1950-01-01T00:00:00-00:00'|'2050-01-01T00:00:00-00:00'|''|''|''|'[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\\.\\d+)?(\\+|-)[0-9]{2}:[0-9]{2}'|\n" +
        "'EMSDataSet'|'element'|'eTimes.09'|'Unit Left Scene Date/Time'|'E05_09'|'National'|'State'|'The date/time the responding unit left the scene with a patient (started moving).'|'Required'|''|'1'|'1'|'Nillable'|'DateTimeType'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|'1950-01-01T00:00:00-00:00'|'2050-01-01T00:00:00-00:00'|''|''|''|'[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\\.\\d+)?(\\+|-)[0-9]{2}:[0-9]{2}'|\n" +
        "'EMSDataSet'|'element'|'eTimes.10'|'Arrival at Destination Landing Area Date/Time'|''|''|''|'The date/time the Air Medical vehicle arrived at the destination landing area.'|'Optional'|''|'0'|'1'|''|'DateTimeType'|''|''|''|''|''|''|''|''|'1950-01-01T00:00:00-00:00'|'2050-01-01T00:00:00-00:00'|''|''|''|'[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\\.\\d+)?(\\+|-)[0-9]{2}:[0-9]{2}'|\n" +
        "'EMSDataSet'|'element'|'eTimes.11'|'Patient Arrived at Destination Date/Time'|'E05_10'|'National'|'State'|'The date/time the responding unit arrived with the patient at the destination or transfer point.'|'Required'|''|'1'|'1'|'Nillable'|'DateTimeType'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|'1950-01-01T00:00:00-00:00'|'2050-01-01T00:00:00-00:00'|''|''|''|'[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\\.\\d+)?(\\+|-)[0-9]{2}:[0-9]{2}'|\n" +
        "'EMSDataSet'|'element'|'eTimes.12'|'Destination Patient Transfer of Care Date/Time'|''|'National'|'State'|'The date/time that patient care was transferred to the destination healthcare facilities staff.'|'Required'|''|'1'|'1'|'Nillable'|'DateTimeType'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|'1950-01-01T00:00:00-00:00'|'2050-01-01T00:00:00-00:00'|''|''|''|'[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\\.\\d+)?(\\+|-)[0-9]{2}:[0-9]{2}'|\n" +
        "'EMSDataSet'|'element'|'eTimes.13'|'Unit Back in Service Date/Time'|'E05_11'|'National'|'State'|'The date/time the unit back was back in service and available for response (finished with call, but not necessarily back in home location).'|'Mandatory'|''|'1'|'1'|''|'DateTimeType'|''|''|''|''|''|''|''|''|'1950-01-01T00:00:00-00:00'|'2050-01-01T00:00:00-00:00'|''|''|''|'[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\\.\\d+)?(\\+|-)[0-9]{2}:[0-9]{2}'|\n" +
        "'EMSDataSet'|'element'|'eTimes.14'|'Unit Canceled Date/Time'|'E05_12'|''|'State'|'The date/time the unit was canceled.'|'Optional'|''|'0'|'1'|''|'DateTimeType'|''|''|''|''|''|''|''|''|'1950-01-01T00:00:00-00:00'|'2050-01-01T00:00:00-00:00'|''|''|''|'[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\\.\\d+)?(\\+|-)[0-9]{2}:[0-9]{2}'|\n" +
        "'EMSDataSet'|'element'|'eTimes.15'|'Unit Back at Home Location Date/Time'|'E05_13'|''|''|'The date/time the responding unit was back in their service area. With agencies who utilized Agency Status Management, home location means the service area as assigned through the agency status management protocol.'|'Optional'|''|'0'|'1'|''|'DateTimeType'|''|''|''|''|''|''|''|''|'1950-01-01T00:00:00-00:00'|'2050-01-01T00:00:00-00:00'|''|''|''|'[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\\.\\d+)?(\\+|-)[0-9]{2}:[0-9]{2}'|\n" +
        "'EMSDataSet'|'element'|'eTimes.16'|'EMS Call Completed Date/Time'|''|''|''|'The date/time the responding unit completed all tasks associated with the event including transfer of the patient, and such things as cleaning and restocking.'|'Optional'|''|'0'|'1'|''|'DateTimeType'|''|''|''|''|''|''|''|''|'1950-01-01T00:00:00-00:00'|'2050-01-01T00:00:00-00:00'|''|''|''|'[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\\.\\d+)?(\\+|-)[0-9]{2}:[0-9]{2}'|\n" +
        "'EMSDataSet'|'element'|'ePatient.01'|'EMS Patient ID'|''|''|''|'The unique ID for the patient within the Agency'|'Optional'|''|'0'|'1'|''|'PatientID'|''|''|''|''|''|'2'|'100'|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'ePatient.02'|'Last Name'|'E06_01'|''|'State'|'The patient's last (family) name'|'Recommended'|''|'0'|'1'|'Nillable'|'PersonLastName'|'NV'|'PN'|'PNNill'|'NV.NotReporting; NV.NotRecorded; NV.NotApplicable; '|'PN.UnableToComplete; PN.Refused; '|'1'|'60'|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'ePatient.03'|'First Name'|'E06_02'|''|'State'|'The patient's first (given) name'|'Recommended'|''|'0'|'1'|'Nillable'|'PersonFirstName'|'NV'|'PN'|'PNNill'|'NV.NotReporting; NV.NotRecorded; NV.NotApplicable; '|'PN.UnableToComplete; PN.Refused; '|'1'|'50'|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'ePatient.04'|'Middle Initial/Name'|'E06_03'|''|''|'The patient's middle name, if any'|'Optional'|''|'0'|'1'|''|'PersonMiddleName'|''|''|''|''|''|'1'|'50'|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'ePatient.05'|'Patient's Home Address'|'E06_04'|''|'State'|'Patient's address of residence'|'Optional'|''|'0'|'1'|''|'StreetAddress'|''|''|''|''|''|'1'|'255'|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'ePatient.06'|'Patient's Home City'|'E06_05'|''|'State'|'The patient's primary city or township of residence.'|'Optional'|''|'0'|'1'|''|'CityGnisCode'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'ePatient.07'|'Patient's Home County'|'E06_06'|'National'|'State'|'The patient's home county or parish of residence.'|'Required'|''|'1'|'1'|'Nillable'|'ANSICountyCode'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|'[0-9]{5}'|\n" +
        "'EMSDataSet'|'element'|'ePatient.08'|'Patient's Home State'|'E06_07'|'National'|'State'|'The state, territory, or province where the patient resides.'|'Required'|''|'1'|'1'|'Nillable'|'ANSIStateCode'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|'[0-9]{2}'|\n" +
        "'EMSDataSet'|'element'|'ePatient.09'|'Patient's Home ZIP Code'|'E06_08'|'National'|'State'|'The patient's ZIP code of residence.'|'Required'|''|'1'|'1'|'Nillable'|'ZIP'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|'[0-9]{5}|[0-9]{5}-[0-9]{4}|[0-9]{5}-[0-9]{5}|[A-Z][0-9][A-Z] [0-9][A-Z][0-9]'|\n" +
        "'EMSDataSet'|'element'|'ePatient.10'|'Patient's Country of Residence'|'E06_09'|''|'State'|'The country of residence of the patient.'|'Optional'|''|'0'|'1'|''|'ANSICountryCode'|''|''|''|''|''|''|''|'2'|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'ePatient.11'|'Patient Home Census Tract'|''|''|''|'The census tract in which the patient lives'|'Optional'|''|'0'|'1'|''|'CensusTracts'|''|''|''|''|''|''|''|''|''|''|''|''|''|'[0-9]{11}'|\n" +
        "'EMSDataSet'|'element'|'ePatient.12'|'Social Security Number'|'E06_10'|''|''|'The patient's social security number'|'Optional'|''|'0'|'1'|''|'SocialSecurityNumber'|''|''|''|''|''|''|''|''|''|''|''|''|''|'[0-9]{9}'|\n" +
        "'EMSDataSet'|'element'|'ePatient.13'|'Gender'|'E06_11'|'National'|'State'|'The Patient's Gender'|'Required'|''|'1'|'1'|'Nillable'|'Gender'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'ePatient.14'|'Race'|'E06_12'|'National'|'State'|'The patient's race as defined by the OMB (US Office of Management and Budget)'|'Required'|''|'1'|'M'|'Nillable'|'Race'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'ePatient.15'|'Age'|'E06_14'|'National'|'State'|'The patient's age (either calculated from date of birth or best approximation)'|'Required'|''|'1'|'1'|'Nillable'|'Age'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|'1'|'120'|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'ePatient.16'|'Age Units'|'E06_15'|'National'|'State'|'The unit used to define the patient's age'|'Required'|''|'1'|'1'|'Nillable'|'AgeUnits'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'ePatient.17'|'Date of Birth'|'E06_16'|''|'State'|'The patient's date of birth'|'Recommended'|''|'0'|'1'|'Nillable'|'DateOfBirth'|'NV'|'PN'|'PNNill'|'NV.NotReporting; NV.NotRecorded; NV.NotApplicable; '|'PN.UnableToComplete; PN.Refused; '|''|''|''|'1890-01-01'|'2050-01-01'|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'ePatient.18'|'Patient's Phone Number'|'E06_17'|''|''|'The patient's phone number'|'Optional'|''|'0'|'M'|''|'PhoneNumber'|''|''|''|''|''|''|''|''|''|''|''|''|''|'[2-9][0-9][0-9]-[2-9][0-9][0-9]-[0-9][0-9][0-9][0-9]'|\n" +
        "'EMSDataSet'|'element'|'ePatient.19'|'Patient's Email Address'|''|''|''|'The email address of the patient'|'Optional'|''|'0'|'M'|''|'EmailAddress'|''|''|''|''|''|'3'|'100'|''|''|''|''|''|''|'.+@.+'|\n" +
        "'EMSDataSet'|'element'|'ePatient.20'|'State Issuing Driver's License'|'E06_18'|''|''|'The state that issued the drivers license'|'Optional'|''|'0'|'1'|''|'ANSIStateCode'|''|''|''|''|''|''|''|''|''|''|''|''|''|'[0-9]{2}'|\n" +
        "'EMSDataSet'|'element'|'ePatient.21'|'Driver's License Number'|'E06_19'|''|''|'The patient's drivers license number'|'Optional'|''|'0'|'1'|''|'DriversLicenseNumber'|''|''|''|''|''|'1'|'30'|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'ePayment.01'|'Primary Method of Payment'|'E07_01'|'National'|'State'|'The primary method of payment or type of insurance associated with this EMS encounter'|'Required'|''|'1'|'1'|'Nillable'|'PrimaryMethodOfPayment'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'ePayment.02'|'Physician Certification Statement'|'E07_02'|''|''|'Indication of whether a physician certification statement (PCS) is available documenting the medical necessity or the EMS encounter.'|'Optional'|''|'0'|'1'|''|'YesNoUnkValues'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'ePayment.03'|'Date Physician Certification Statement Signed'|''|''|''|'The date the Physician Certification Statement was signed'|'Optional'|''|'0'|'1'|''|'DateTimeType'|''|''|''|''|''|''|''|''|'1950-01-01T00:00:00-00:00'|'2050-01-01T00:00:00-00:00'|''|''|''|'[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\\.\\d+)?(\\+|-)[0-9]{2}:[0-9]{2}'|\n" +
        "'EMSDataSet'|'element'|'ePayment.04'|'Reason for Physician Certification Statement'|''|''|''|'The reason for EMS transport noted on the Physician Certification Statement'|'Optional'|''|'0'|'M'|''|'Reason'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'ePayment.05'|'Healthcare Provider Type Signing Physician Certification Statement'|''|''|''|'The type of healthcare provider who signed the Physician Certification Statement'|'Optional'|''|'0'|'1'|''|'HealthcareProviderType'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'ePayment.06'|'Last Name of Individual Signing Physician Certification Statement'|''|''|''|'The last name of the healthcare provider who signed the Physician Certification Statement.'|'Optional'|''|'0'|'1'|''|'PersonLastName'|''|''|''|''|''|'1'|'60'|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'ePayment.07'|'First Name of Individual Signing Physician Certification Statement'|''|''|''|'The first name of the healthcare provider who signed the Physician Certification Statement.'|'Optional'|''|'0'|'1'|''|'PersonFirstName'|''|''|''|''|''|'1'|'50'|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'ePayment.08'|'Patient Resides in Service Area'|''|''|''|'An indication of whether the patient's current residence is within the EMS agency service area.'|'Optional'|''|'0'|'1'|''|'ResidencyStatusOfThePatient'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'ePayment.09'|'Insurance Company ID'|'E07_03'|''|''|'The ID Number of the patient's insurance company.'|'Optional'|''|'0'|'1'|''|'InsuranceCompanyID'|''|''|''|''|''|'2'|'60'|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'ePayment.10'|'Insurance Company Name'|''|''|''|'The name of the patient's insurance company.'|'Optional'|''|'0'|'1'|''|'InsuranceCompanyName'|''|''|''|''|''|'2'|'60'|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'ePayment.11'|'Insurance Company Billing Priority'|'E07_04'|''|''|'The billing priority or order for the insurance company.'|'Optional'|''|'0'|'1'|''|'InsuranceCompanyBillingPriority'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'ePayment.12'|'Insurance Company Address'|'E07_05'|''|''|'The mailing address of the Insurance Company'|'Optional'|''|'0'|'1'|''|'StreetAddress'|''|''|''|''|''|'1'|'255'|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'ePayment.13'|'Insurance Company City'|'E07_06'|''|''|'The insurance company's city or township used for mailing purposes.'|'Optional'|''|'0'|'1'|''|'CityGnisCodePayment'|''|''|''|''|''|'2'|'30'|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'ePayment.14'|'Insurance Company State'|'E07_07'|''|''|'The insurance company's state, territory, or province, or District of Columbia.'|'Optional'|''|'0'|'1'|''|'ANSIStateCode'|''|''|''|''|''|''|''|''|''|''|''|''|''|'[0-9]{2}'|\n" +
        "'EMSDataSet'|'element'|'ePayment.15'|'Insurance Company ZIP Code'|'E07_08'|''|''|'The insurance company's ZIP Code'|'Optional'|''|'0'|'1'|''|'ZIP'|''|''|''|''|''|''|''|''|''|''|''|''|''|'[0-9]{5}|[0-9]{5}-[0-9]{4}|[0-9]{5}-[0-9]{5}|[A-Z][0-9][A-Z] [0-9][A-Z][0-9]'|\n" +
        "'EMSDataSet'|'element'|'ePayment.16'|'Insurance Company Country'|''|''|''|'The insurance company's country'|'Optional'|'Added to better document international addresses.'|'0'|'1'|''|'ANSICountryCode'|''|''|''|''|''|''|''|'2'|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'ePayment.17'|'Insurance Group ID'|'E07_09'|''|''|'The ID number of the patient's insurance group.'|'Optional'|''|'0'|'1'|''|'InsuranceGroupID'|''|''|''|''|''|'2'|'30'|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'ePayment.18'|'Insurance Policy ID Number'|'E07_10'|''|''|'The ID number of the patient's insurance policy'|'Optional'|''|'0'|'1'|''|'InsurancePolicyIDNumber'|''|''|''|''|''|'2'|'30'|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'ePayment.19'|'Last Name of the Insured'|'E07_11'|''|''|'The last (family) name of the person insured by the insurance company.'|'Optional'|''|'0'|'1'|''|'PersonLastName'|''|''|''|''|''|'1'|'60'|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'ePayment.20'|'First Name of the Insured'|'E07_12'|''|''|'The first (given) name of the person insured by the insurance company'|'Optional'|''|'0'|'1'|''|'PersonFirstName'|''|''|''|''|''|'1'|'50'|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'ePayment.21'|'Middle Initial/Name of the Insured'|'E07_13'|''|''|'The middle name, if any, of the person insured by the insurance company.'|'Optional'|''|'0'|'1'|''|'PersonMiddleName'|''|''|''|''|''|'1'|'50'|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'ePayment.22'|'Relationship to the Insured'|'E07_14'|''|''|'The relationship of the patient to the primary insured person'|'Optional'|''|'0'|'1'|''|'RelationshipToInsured'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'ePayment.58'|'Insurance Group Name'|''|''|''|'The name of the patient's insurance group.'|'Optional'|''|'0'|'1'|''|'InsuranceGroupName'|''|''|''|''|''|'2'|'30'|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'ePayment.23'|'Closest Relative/Guardian Last Name'|'E07_18'|''|''|'The last (family) name of the patient's closest relative or guardian'|'Optional'|''|'0'|'1'|''|'PersonLastName'|''|''|''|''|''|'1'|'60'|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'ePayment.24'|'Closest Relative/ Guardian First Name'|'E07_19'|''|''|'The first (given) name of the patient's closest relative or guardian'|'Optional'|''|'0'|'1'|''|'PersonFirstName'|''|''|''|''|''|'1'|'50'|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'ePayment.25'|'Closest Relative/ Guardian Middle Initial/Name'|'E07_20'|''|''|'The middle name/initial, if any, of the closest patient's relative or guardian.'|'Optional'|''|'0'|'1'|''|'PersonMiddleName'|''|''|''|''|''|'1'|'50'|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'ePayment.26'|'Closest Relative/ Guardian Street Address'|'E07_21'|''|''|'The street address of the residence of the patient's closest relative or guardian.'|'Optional'|''|'0'|'1'|''|'StreetAddress'|''|''|''|''|''|'1'|'255'|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'ePayment.27'|'Closest Relative/ Guardian City'|'E07_22'|''|''|'The primary city or township of residence of the patient's closest relative or guardian.'|'Optional'|''|'0'|'1'|''|'CityGnisCodePayment'|''|''|''|''|''|'2'|'30'|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'ePayment.28'|'Closest Relative/ Guardian State'|'E07_23'|''|''|'The state of residence of the patient's closest relative or guardian.'|'Optional'|''|'0'|'1'|''|'ANSIStateCode'|''|''|''|''|''|''|''|''|''|''|''|''|''|'[0-9]{2}'|\n" +
        "'EMSDataSet'|'element'|'ePayment.29'|'Closest Relative/ Guardian ZIP Code'|'E07_24'|''|''|'The ZIP Code of the residence of the patient's closest relative or guardian.'|'Optional'|''|'0'|'1'|''|'ZIP'|''|''|''|''|''|''|''|''|''|''|''|''|''|'[0-9]{5}|[0-9]{5}-[0-9]{4}|[0-9]{5}-[0-9]{5}|[A-Z][0-9][A-Z] [0-9][A-Z][0-9]'|\n" +
        "'EMSDataSet'|'element'|'ePayment.30'|'Closest Relative/ Guardian Country'|''|''|''|'The country of residence of the patient's closest relative or guardian.'|'Optional'|'Added to improve international compatibility.'|'0'|'1'|''|'ANSICountryCode'|''|''|''|''|''|''|''|'2'|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'ePayment.31'|'Closest Relative/ Guardian Phone Number'|'E07_25'|''|''|'The phone number of the patient's closest relative or guardian'|'Optional'|''|'0'|'M'|''|'PhoneNumber'|''|''|''|''|''|''|''|''|''|''|''|''|''|'[2-9][0-9][0-9]-[2-9][0-9][0-9]-[0-9][0-9][0-9][0-9]'|\n" +
        "'EMSDataSet'|'element'|'ePayment.32'|'Closest Relative/ Guardian Relationship'|'E07_26'|''|''|'The relationship of the patient's closest relative or guardian'|'Optional'|''|'0'|'1'|''|'ClosestRelativeGuardianRelationship'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'ePayment.33'|'Patient's Employer'|'E07_27'|''|''|'The patient's employers Name'|'Optional'|''|'0'|'1'|''|'EmployerName'|''|''|''|''|''|'2'|'60'|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'ePayment.34'|'Patient's Employer's Address'|'E07_28'|''|''|'The street address of the patient's employer'|'Optional'|''|'0'|'1'|''|'StreetAddress'|''|''|''|''|''|'1'|'255'|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'ePayment.35'|'Patient's Employer's City'|'E07_29'|''|''|'The city or township of the patient's employer used for mailing purposes.'|'Optional'|''|'0'|'1'|''|'CityGnisCodePayment'|''|''|''|''|''|'2'|'30'|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'ePayment.36'|'Patient's Employer's State'|'E07_30'|''|''|'The state of the patient's employer'|'Optional'|''|'0'|'1'|''|'ANSIStateCode'|''|''|''|''|''|''|''|''|''|''|''|''|''|'[0-9]{2}'|\n" +
        "'EMSDataSet'|'element'|'ePayment.37'|'Patient's Employer's ZIP Code'|'E07_31'|''|''|'The ZIP Code of the patient's employer'|'Optional'|''|'0'|'1'|''|'ZIP'|''|''|''|''|''|''|''|''|''|''|''|''|''|'[0-9]{5}|[0-9]{5}-[0-9]{4}|[0-9]{5}-[0-9]{5}|[A-Z][0-9][A-Z] [0-9][A-Z][0-9]'|\n" +
        "'EMSDataSet'|'element'|'ePayment.38'|'Patient's Employer's Country'|''|''|''|'The country of the patient's employer'|'Optional'|'Added to improve international compatibility.'|'0'|'1'|''|'ANSICountryCode'|''|''|''|''|''|''|''|'2'|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'ePayment.39'|'Patient's Employer's Primary Phone Number'|'E07_32'|''|''|'The employer's primary phone number.'|'Optional'|''|'0'|'1'|''|'PhoneNumber'|''|''|''|''|''|''|''|''|''|''|''|''|''|'[2-9][0-9][0-9]-[2-9][0-9][0-9]-[0-9][0-9][0-9][0-9]'|\n" +
        "'EMSDataSet'|'element'|'ePayment.40'|'Response Urgency'|'E07_33'|''|''|'The urgency in which the EMS agency began to mobilize resources for this EMS encounter.'|'Optional'|''|'0'|'1'|''|'ResponseUrgency'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'ePayment.41'|'Patient Transport Assessment'|''|''|''|'Documentation of the patient's transport need based on mobility and/or physical capability.'|'Optional'|''|'0'|'M'|''|'TransportAssessment'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'ePayment.42'|'Specialty Care Transport Care Provider'|''|''|''|'Documentation to show the patient care provided to the patient met the Specialty Care Transport Base Rate requirements.'|'Optional'|''|'0'|'M'|''|'TransportCareProvider'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'ePayment.44'|'Ambulance Transport Reason Code'|''|''|''|'The CMS Ambulance Transport Reason Code for the transport.'|'Optional'|''|'0'|'M'|''|'AmbulanceReasonCode'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'ePayment.45'|'Round Trip Purpose Description'|''|''|''|'Free text description providing the purpose of the round trip EMS transport based on CR109 field for CMS.'|'Optional'|'Added to improve billing with electronic claims using X12'|'0'|'1'|''|'TripPurposeDesciption'|''|''|''|''|''|'2'|'80'|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'ePayment.46'|'Stretcher Purpose Description'|''|''|''|'Free Text Documentation providing the reason for use of a stretcher in the EMS patient transport.'|'Optional'|''|'0'|'1'|''|'StretcherPurposeDesciption'|''|''|''|''|''|'2'|'80'|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'ePayment.47'|'Ambulance Conditions Indicator'|''|''|''|'Documentation of the CRC03 through CRC07 requirements for CMS billing using X12 transactions.'|'Optional'|'Added to improve billing with electronic claims using X12. The Codes and Descriptors updated Sept 2013 to meet the X12 5010 standard.'|'0'|'M'|''|'AmbulanceConditionsIndicator'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'ePayment.48'|'Mileage to Closest Hospital Facility'|''|''|''|'The mileage to the closest hospital facility from the scene. Documented only if the patient was transported to a facility farther away than the closest hospital.'|'Optional'|'Added for improved billing documentation.'|'0'|'1'|''|'Mileage'|''|''|''|''|''|''|''|''|'1'|'1000'|''|''|'2'|''|\n" +
        "'EMSDataSet'|'element'|'ePayment.49'|'ALS Assessment Performed and Warranted'|''|''|''|'Documentation that the patient required an ALS assessment and it was performed.'|'Optional'|'Added to improve billing justification'|'0'|'1'|''|'YesNoValues'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'ePayment.50'|'CMS Service Level'|'E07_34'|'National'|'State'|'The CMS service level for this EMS encounter.'|'Required'|''|'1'|'1'|'Nillable'|'CMSServiceLevel'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'ePayment.51'|'EMS Condition Code'|'E07_35'|''|''|'The condition code associated with the CMS EMS negotiated rule-making process.'|'Optional'|''|'0'|'M'|''|'icd10Code'|''|''|''|''|''|''|''|''|''|''|''|''|''|'[A-Z][0-9][0-9A-Z]((\\.[0-9A-Z]{1,3})?)'|\n" +
        "'EMSDataSet'|'element'|'ePayment.52'|'CMS Transportation Indicator'|'E07_37'|''|''|'The CMS Ambulance Fee Schedule Transportation and Air Medical Transportation Indicators are used to better describe why it was necessary for the patient to be transported in a particular way or circumstance.'|'Optional'|'Name changed from Condition Code Modifier to CMS Transportation Indicator'|'0'|'M'|''|'CMSTransportationIndicator'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'ePayment.53'|'Transport Authorization Code'|''|''|''|'Prior authorization code provided by the insurance carrier/payer.'|'Optional'|'Added to improve billing documentation.'|'0'|'1'|''|'AuthorizationCode'|''|''|''|''|''|'2'|'50'|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'ePayment.54'|'Prior Authorization Code Payer'|''|''|''|'The Payer who has provided the Prior Authorization Code.'|'Optional'|'Added to improve billing documentation.'|'0'|'1'|''|'PersonName'|''|''|''|''|''|'1'|'255'|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'ePayment.55'|'Supply Item Used Name'|''|''|''|'The name of the supply used on the patient by the EMS Crew during the EMS event.'|'Optional'|'Added to track EMS supplies for billing.'|'0'|'1'|''|'SupplyUsed'|''|''|''|''|''|'2'|'80'|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'ePayment.56'|'Number of Supply Item(s) Used'|''|''|''|'The number of the specific supply item used on the patient by the EMS Crew during the EMS event.'|'Optional'|'Added to track EMS supplies for billing.'|'0'|'1'|''|'SupplyCount'|''|''|''|''|''|''|''|''|'1'|'100000000'|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'ePayment.57'|'Payer Type'|''|''|''|'Payer type according to X12 standard.'|'Optional'|''|'0'|'1'|''|'PayerType'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eScene.01'|'First EMS Unit on Scene'|''|'National'|'State'|'Documentation that this EMS Unit was the first EMS Unit for the EMS Agency on the Scene'|'Required'|''|'1'|'1'|'Nillable'|'YesNoValues'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eScene.02'|'Other EMS or Public Safety Agencies at Scene'|'E08_01'|''|''|'Other EMS agency names that were at the scene, if any'|'Optional'|''|'0'|'1'|''|'OtherEMSAgenciesAtScene'|''|''|''|''|''|'2'|'100'|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eScene.03'|'Other EMS or Public Safety Agency ID Number'|''|''|''|'The ID number for the EMS Agency or Other Public Safety listed in eScene.02'|'Optional'|''|'0'|'1'|''|'EMSAgencyID'|''|''|''|''|''|'1'|'25'|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eScene.04'|'Type of Other Service at Scene'|'E08_02'|''|''|'The type of public safety or EMS service associated with Other Agencies on Scene'|'Optional'|''|'0'|'1'|''|'OtherServicesAtScene'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eScene.05'|'Date/Time Initial Responder Arrived on Scene'|'E08_04'|''|''|'The time that the initial responder arrived on the scene, if applicable.'|'Optional'|''|'0'|'1'|''|'DateTimeType'|''|''|''|''|''|''|''|''|'1950-01-01T00:00:00-00:00'|'2050-01-01T00:00:00-00:00'|''|''|''|'[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\\.\\d+)?(\\+|-)[0-9]{2}:[0-9]{2}'|\n" +
        "'EMSDataSet'|'element'|'eScene.06'|'Number of Patients at Scene'|'E08_05'|'National'|'State'|'Indicator of how many total patients were at the scene'|'Required'|''|'1'|'1'|'Nillable'|'NumberOfPatientsAtScene'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eScene.07'|'Mass Casualty Incident'|'E08_06'|'National'|'State'|'Indicator if this event would be considered a mass casualty incident (overwhelmed existing EMS resources)'|'Required'|''|'1'|'1'|'Nillable'|'YesNoValues'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eScene.08'|'Triage Classification for MCI Patient'|''|'National'|'State'|'The color associated with the initial triage assessment/classification of the MCI patient.'|'Required'|''|'1'|'1'|'Nillable'|'TriageClassification'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eScene.09'|'Incident Location Type'|'E08_07'|'National'|'State'|'The kind of location where the incident happened'|'Required'|''|'1'|'1'|'Nillable'|'IncidentLocationType'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|'Y92\\.[0-9]{1,3}'|\n" +
        "'EMSDataSet'|'element'|'eScene.10'|'Incident Facility Code'|'E08_08'|''|'State'|'The state, regulatory, or other unique number (code) associated with the facility if the Incident is a Healthcare Facility.'|'Recommended'|''|'0'|'1'|'Nillable'|'IncidentFacilityCode'|'NV'|''|''|'NV.NotReporting; NV.NotRecorded; NV.NotApplicable; '|''|'2'|'50'|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eScene.11'|'Scene GPS Location'|'E08_10'|''|'State'|'The GPS coordinates associated with the Scene.'|'Optional'|''|'0'|'1'|''|'GPSLocation'|''|''|''|''|''|''|''|''|''|''|''|''|''|'(\\+|-)?(90(\\.[0]{1,6})?|([1-8][0-9]|[0-9])(\\.[0-9]{1,6})?),(\\+|-)?(180(\\.[0]{1,6})?|(1[0-7][0-9]|[1-9][0-9]|[0-9])(\\.[0-9]{1,6})?)'|\n" +
        "'EMSDataSet'|'element'|'eScene.12'|'Scene US National Grid Coordinates'|''|''|'State'|'The US National Grid Coordinates for the Scene.'|'Optional'|''|'0'|'1'|''|'USNG'|''|''|''|''|''|''|''|''|''|''|''|''|''|'[1][0-9][RSTU][ABCDEFGHJKLMNPQRSTUVWXYZ][ABCDEFGHJKLMNPQRSTUV][0-9]{8}'|\n" +
        "'EMSDataSet'|'element'|'eScene.13'|'Incident Facility or Location Name'|''|''|'State'|'The name of the facility, business, building, etc. associated with the scene of the EMS event.'|'Optional'|''|'0'|'1'|''|'IncidentFacilityName'|''|''|''|''|''|'2'|'100'|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eScene.14'|'Mile Post or Major Roadway'|''|''|'State'|'The mile post or major roadway associated with the incident locations'|'Recommended'|''|'0'|'1'|'Nillable'|'MilePostOrMajorRoadway'|'NV'|''|''|'NV.NotReporting; NV.NotRecorded; NV.NotApplicable; '|''|'1'|'35'|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eScene.15'|'Incident Street Address'|'E08_11'|''|'State'|'The street address where the patient was found, or, if no patient, the address to which the unit responded.'|'Recommended'|''|'0'|'1'|'Nillable'|'StreetAddress'|'NV'|''|''|'NV.NotReporting; NV.NotRecorded; NV.NotApplicable; '|''|'1'|'255'|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eScene.16'|'Incident Apartment, Suite, or Room'|''|''|'State'|'The number of the specific apartment, suite, or room where the incident occurred.'|'Recommended'|''|'0'|'1'|'Nillable'|'SceneApartment'|'NV'|''|''|'NV.NotReporting; NV.NotRecorded; NV.NotApplicable; '|''|'1'|'15'|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eScene.17'|'Incident City'|'E08_12'|''|'State'|'The city or township (if applicable) where the patient was found or to which the unit responded (or best approximation)'|'Recommended'|''|'0'|'1'|'Nillable'|'CityGnisCode'|'NV'|''|''|'NV.NotReporting; NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eScene.18'|'Incident State'|'E08_14'|'National'|'State'|'The state, territory, or province where the patient was found or to which the unit responded (or best approximation)'|'Required'|''|'1'|'1'|'Nillable'|'ANSIStateCode'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|'[0-9]{2}'|\n" +
        "'EMSDataSet'|'element'|'eScene.19'|'Incident ZIP Code'|'E08_15'|'National'|'State'|'The ZIP code of the incident location'|'Required'|''|'1'|'1'|'Nillable'|'ZIP'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|'[0-9]{5}|[0-9]{5}-[0-9]{4}|[0-9]{5}-[0-9]{5}|[A-Z][0-9][A-Z] [0-9][A-Z][0-9]'|\n" +
        "'EMSDataSet'|'element'|'eScene.20'|'Scene Cross Street or Directions'|''|''|'State'|'The nearest cross street to the incident address or directions from a recognized landmark or the second street name of an intersection.'|'Recommended'|'Added to better locate/document the scene (incident) location.'|'0'|'1'|'Nillable'|'SceneCrossStreet'|'NV'|''|''|'NV.NotReporting; NV.NotRecorded; NV.NotApplicable; '|''|'2'|'50'|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eScene.21'|'Incident County'|'E08_13'|'National'|'State'|'The county or parish where the patient was found or to which the unit responded (or best approximation)'|'Required'|''|'1'|'1'|'Nillable'|'ANSICountyCode'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|'[0-9]{5}'|\n" +
        "'EMSDataSet'|'element'|'eScene.22'|'Incident Country'|''|''|''|'The country of the incident location.'|'Optional'|'Added for international compatibility.'|'0'|'1'|''|'ANSICountryCode'|''|''|''|''|''|''|''|'2'|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eScene.23'|'Incident Census Tract'|''|''|''|'The census tract in which the incident occurred.'|'Optional'|'Added to improve the ability to use census and other demographic information within EMS research.'|'0'|'1'|''|'CensusTracts'|''|''|''|''|''|''|''|''|''|''|''|''|''|'[0-9]{11}'|\n" +
        "'EMSDataSet'|'element'|'eSituation.01'|'Date/Time of Symptom Onset'|'E05_01'|'National'|'State'|'The date and time the symptom began (or was discovered) as it relates to this EMS event. This is described or estimated by the patient, family, and/or healthcare professionals.'|'Required'|'Added to better define the EMS patient event.'|'1'|'1'|'Nillable'|'DateTimeType'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|'1950-01-01T00:00:00-00:00'|'2050-01-01T00:00:00-00:00'|''|''|''|'[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\\.\\d+)?(\\+|-)[0-9]{2}:[0-9]{2}'|\n" +
        "'EMSDataSet'|'element'|'eSituation.02'|'Possible Injury'|'E09_04'|'National'|'State'|'Indication whether or not there was an injury'|'Required'|''|'1'|'1'|'Nillable'|'YesNoUnkValues'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eSituation.03'|'Complaint Type'|''|''|'State'|'The type of patient healthcare complaint being documented.'|'Recommended'|'Added to improve data integrity.'|'0'|'1'|'Nillable'|'ComplaintType'|'NV'|''|''|'NV.NotReporting; NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eSituation.04'|'Complaint'|'E09_05'|''|'State'|'The statement of the problem by the patient or the history provider.'|'Recommended'|''|'0'|'1'|'Nillable'|'Complaint'|'NV'|''|''|'NV.NotReporting; NV.NotRecorded; NV.NotApplicable; '|''|'1'|'255'|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eSituation.05'|'Duration of Complaint'|'E09_06'|''|'State'|'The duration of the complaint'|'Recommended'|''|'0'|'1'|'Nillable'|'DurationComplaint'|'NV'|''|''|'NV.NotReporting; NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|'1'|'365'|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eSituation.06'|'Time Units of Duration of Complaint'|'E09_07'|''|'State'|'The time units of the duration of the patient's complaint'|'Recommended'|''|'0'|'1'|'Nillable'|'TimeUnitsOfChiefComplaint'|'NV'|''|''|'NV.NotReporting; NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eSituation.07'|'Chief Complaint Anatomic Location'|'E09_11'|'National'|'State'|'The primary anatomic location of the chief complaint as identified by EMS personnel'|'Required'|''|'1'|'1'|'Nillable'|'ComplaintAnatomicLocation'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eSituation.08'|'Chief Complaint Organ System'|'E09_12'|'National'|'State'|'The primary organ system of the patient injured or medically affected.'|'Required'|''|'1'|'1'|'Nillable'|'ComplaintOrganSystem'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eSituation.09'|'Primary Symptom'|'E09_13'|'National'|'State'|'The primary sign and symptom present in the patient or observed by EMS personnel'|'Required'|''|'1'|'1'|'Nillable'|'AssociatedSymptoms'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|'(R[0-6][0-9](\\.[0-9]{1,4})?|(R73\\.9)|(R99))|([A-QSTZ][0-9][0-9A-Z])((\\.[0-9A-Z]{1,4})?)'|\n" +
        "'EMSDataSet'|'element'|'eSituation.10'|'Other Associated Symptoms'|'E09_14'|'National'|'State'|'Other symptoms identified by the patient or observed by EMS personnel'|'Required'|''|'1'|'M'|'Nillable'|'AssociatedSymptoms'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|'(R[0-6][0-9](\\.[0-9]{1,4})?|(R73\\.9)|(R99))|([A-QSTZ][0-9][0-9A-Z])((\\.[0-9A-Z]{1,4})?)'|\n" +
        "'EMSDataSet'|'element'|'eSituation.11'|'Provider's Primary Impression'|'E09_15'|'National'|'State'|'The EMS personnel's impression of the patient's primary problem or most significant condition which led to the management given to the patient (treatments, medications, or procedures).'|'Required'|''|'1'|'1'|'Nillable'|'ProvidersImpression'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|'(R[0-6][0-9](\\.[0-9]{1,4})?|(R73\\.9)|(R99))|([A-QSTZ][0-9][0-9A-Z])((\\.[0-9A-Z]{1,4})?)'|\n" +
        "'EMSDataSet'|'element'|'eSituation.12'|'Provider's Secondary Impressions'|'E09_16'|'National'|'State'|'The EMS personnel's impression of the patient's secondary problem or most significant condition which led to the management given to the patient (treatments, medications, or procedures).'|'Required'|''|'1'|'M'|'Nillable'|'ProvidersImpression'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|'(R[0-6][0-9](\\.[0-9]{1,4})?|(R73\\.9)|(R99))|([A-QSTZ][0-9][0-9A-Z])((\\.[0-9A-Z]{1,4})?)'|\n" +
        "'EMSDataSet'|'element'|'eSituation.13'|'Initial Patient Acuity'|''|'National'|'State'|'The acuity of the patient's condition upon EMS arrival at the scene.'|'Required'|''|'1'|'1'|'Nillable'|'InitialPatientAcuity'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eSituation.14'|'Work-Related Illness/Injury'|'E07_15'|''|'State'|'Indication of whether or not the illness or injury is work related.'|'Recommended'|''|'0'|'1'|'Nillable'|'YesNoUnkValues'|'NV'|''|''|'NV.NotReporting; NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eSituation.15'|'Patient's Occupational Industry'|'E07_16'|''|''|'The occupational industry of the patient's work.'|'Optional'|''|'0'|'1'|''|'OccupationIndustry'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eSituation.16'|'Patient's Occupation'|'E07_17'|''|''|'The occupation of the patient.'|'Optional'|'Added to better describe work related injury.'|'0'|'1'|''|'PatientsOccupation'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eSituation.17'|'Patient Activity'|''|''|'State'|'The activity the patient was involved in at the time the patient experienced the onset of symptoms or experienced an injury.'|'Recommended'|''|'0'|'M'|'Nillable'|'icd10Activity'|'NV'|''|''|'NV.NotReporting; NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|'Y93\\.[A-Za-z0-9]{1,4}'|\n" +
        "'EMSDataSet'|'element'|'eSituation.18'|'Date/Time Last Known Well'|''|''|''|'The estimated date and time the patient was last known to be well or in their usual state of health. This is described or estimated by the patient, family, and/or bystanders.'|'Optional'|''|'0'|'1'|''|'DateTimeType'|''|''|''|''|''|''|''|''|'1950-01-01T00:00:00-00:00'|'2050-01-01T00:00:00-00:00'|''|''|''|'[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\\.\\d+)?(\\+|-)[0-9]{2}:[0-9]{2}'|\n" +
        "'EMSDataSet'|'element'|'eInjury.01'|'Cause of Injury'|'E10_01'|'National'|'State'|'The category of the reported/suspected external cause of the injury.'|'Required'|''|'1'|'M'|'Nillable'|'icd10CodeInjury'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|'([TV-Y][0-9]{2})((\\.[0-9A-Z]{1,4})?)'|\n" +
        "'EMSDataSet'|'element'|'eInjury.02'|'Mechanism of Injury'|'E10_03'|''|'State'|'The mechanism of the event which caused the injury'|'Recommended'|''|'0'|'M'|'Nillable'|'MechanismOfInjury'|'NV'|''|''|'NV.NotReporting; NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eInjury.03'|'Trauma Center Criteria'|''|'National'|'State'|'Field Triage Criteria for transport to a trauma center as defined by the Centers for Disease Control and Prevention and the American College of Surgeons-Committee on Trauma.'|'Required'|'Added to better evaluate the CDC-ACS 2011 Guidelines for the Field Triage of Injured Patients. <br/>Website: http://www.cdc.gov/FieldTriage/'|'1'|'M'|'Nillable'|'TraumaCenterCriteria'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eInjury.04'|'Vehicular, Pedestrian, or Other Injury Risk Factor'|'E10_04'|'National'|'State'|'Field Triage Criteria for transport to a trauma center as defined by the Centers for Disease Control and Prevention and the American College of Surgeons-Committee on Trauma.'|'Required'|'Added to better evaluate the CDC-ACS 2011 Guidelines for the Field Triage of Injured Patients.  							<br/>Website: http://www.cdc.gov/FieldTriage/'|'1'|'M'|'Nillable'|'VehicularInjuryIndicators'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eInjury.05'|'Main Area of the Vehicle Impacted by the Collision'|'E10_05'|''|'State'|'The area or location of initial impact on the vehicle based on 12-point clock diagram.'|'Optional'|''|'0'|'1'|''|'AreaOfVehicleImpact'|''|''|''|''|''|''|''|''|'1'|'12'|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eInjury.06'|'Location of Patient in Vehicle'|'E10_06'|''|'State'|'The seat row location of the vehicle at the time of the crash with the front seat numbered as 1'|'Optional'|''|'0'|'1'|''|'SeatRowLocation'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eInjury.07'|'Use of Occupant Safety Equipment'|'E10_08'|''|'State'|'Safety equipment in use by the patient at the time of the injury'|'Recommended'|''|'0'|'M'|'Nillable'|'UseOfOccupantSafetyEquipment'|'NV'|''|''|'NV.NotReporting; NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eInjury.08'|'Airbag Deployment'|'E10_09'|''|'State'|'Indication of Airbag Deployment'|'Optional'|''|'0'|'M'|''|'AirbagDeployment'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eInjury.09'|'Height of Fall (feet)'|'E10_10'|''|'State'|'The distance in feet the patient fell, measured from the lowest point of the patient to the ground'|'Optional'|''|'0'|'1'|''|'HeightOfFall'|''|''|''|''|''|''|''|''|'0'|'10000'|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eInjury.10'|'OSHA Personal Protective Equipment Used'|''|''|''|'Documentation of the use of OSHA required protective equipment used by the patient at the time of injury.'|'Optional'|'Added to better document personal protection equipment used by the patient associated with an injury.'|'0'|'M'|''|'EquipmentUsed'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eInjury.11'|'ACN System/Company Providing ACN Data'|''|''|''|'The agency providing the Automated Collision Notification (ACN) Data.'|'Optional'|'Added to better incorporate advanced automated collision notification information.'|'0'|'1'|''|'Company'|''|''|''|''|''|'1'|'30'|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eInjury.12'|'ACN Incident ID'|''|''|''|'The Automated Collision Notification Incident ID.'|'Optional'|'Added to better incorporate advanced automated collision notification information.'|'0'|'1'|''|'IncidentID'|''|''|''|''|''|'2'|'100'|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eInjury.13'|'ACN Call Back Phone Number'|''|''|''|'The Automated Collision Notification Call Back Phone Number (US Only).'|'Optional'|'Added to better incorporate advanced automated collision notification information.'|'0'|'M'|''|'PhoneNumber'|''|''|''|''|''|''|''|''|''|''|''|''|''|'[2-9][0-9][0-9]-[2-9][0-9][0-9]-[0-9][0-9][0-9][0-9]'|\n" +
        "'EMSDataSet'|'element'|'eInjury.14'|'Date/Time of ACN Incident'|''|''|''|'The Automated Collision Notification Incident Date and Time.'|'Optional'|'Added to better incorporate advanced automated collision notification information.'|'0'|'1'|''|'DateTimeType'|''|''|''|''|''|''|''|''|'1950-01-01T00:00:00-00:00'|'2050-01-01T00:00:00-00:00'|''|''|''|'[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\\.\\d+)?(\\+|-)[0-9]{2}:[0-9]{2}'|\n" +
        "'EMSDataSet'|'element'|'eInjury.15'|'ACN Incident Location'|''|''|''|'The Automated Collision Notification GPS Location.'|'Optional'|'Added to better incorporate advanced automated collision notification information.'|'0'|'1'|''|'GPSLocation'|''|''|''|''|''|''|''|''|''|''|''|''|''|'(\\+|-)?(90(\\.[0]{1,6})?|([1-8][0-9]|[0-9])(\\.[0-9]{1,6})?),(\\+|-)?(180(\\.[0]{1,6})?|(1[0-7][0-9]|[1-9][0-9]|[0-9])(\\.[0-9]{1,6})?)'|\n" +
        "'EMSDataSet'|'element'|'eInjury.16'|'ACN Incident Vehicle Body Type'|''|''|''|'The Automated Collision Notification Vehicle Body Type.'|'Optional'|'Added to better incorporate advanced automated collision notification information.'|'0'|'1'|''|'BodyType'|''|''|''|''|''|'2'|'100'|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eInjury.17'|'ACN Incident Vehicle Manufacturer'|''|''|''|'The Automated Collision Notification Vehicle Manufacturer (e.g., General Motors, Ford, BMW, etc.).'|'Optional'|'Added to better incorporate advanced automated collision notification information.'|'0'|'1'|''|'Manufacturer'|''|''|''|''|''|'2'|'100'|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eInjury.18'|'ACN Incident Vehicle Make'|''|''|''|'The Automated Collision Notification Vehicle Make (e.g., Cadillac, Ford, BMW, etc.).'|'Optional'|'Added to better incorporate advanced automated collision notification information.'|'0'|'1'|''|'Make'|''|''|''|''|''|'2'|'100'|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eInjury.19'|'ACN Incident Vehicle Model'|''|''|''|'The Automated Collision Notification Vehicle Model (e.g., Escalade, Taurus, X6M, etc.).'|'Optional'|'Added to better incorporate advanced automated collision notification information.'|'0'|'1'|''|'Model'|''|''|''|''|''|'1'|'100'|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eInjury.20'|'ACN Incident Vehicle Model Year'|''|''|''|'The Automated Collision Notification Vehicle Model Year (e.g., 2010).'|'Optional'|'Added to better incorporate advanced automated collision notification information.'|'0'|'1'|''|'Year'|''|''|''|''|''|''|''|''|'1900'|'2050'|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eInjury.21'|'ACN Incident Multiple Impacts'|''|''|''|'The Automated Collision Notification Indication of Multiple Impacts associated with the collision.'|'Optional'|'Added to better incorporate advanced automated collision notification information.'|'0'|'1'|''|'YesNoValues'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eInjury.22'|'ACN Incident Delta Velocity'|''|''|''|'The Automated Collision Notification Delta Velocity (Delta V) force associated with the crash.'|'Optional'|'Added to better incorporate advanced automated collision notification information.'|'0'|'M'|''|'DeltaVelocity'|''|''|''|''|''|''|''|''|'0'|'999'|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eInjury.23'|'ACN High Probability of Injury'|''|''|''|'The Automated Collision Notification of the High Probability of Injury.'|'Optional'|'Added to better incorporate advanced automated collision notification information.'|'0'|'1'|''|'YesNoValues'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eInjury.24'|'ACN Incident PDOF'|''|''|''|'The Automated Collision Notification Principal Direction of Force (PDOF).'|'Optional'|'Added to better incorporate advanced automated collision notification information.'|'0'|'1'|''|'PDOF'|''|''|''|''|''|''|''|''|'1'|'12'|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eInjury.25'|'ACN Incident Rollover'|''|''|''|'The Automated Collision Notification Indication that the Vehicle Rolled Over.'|'Optional'|'Added to better incorporate advanced automated collision notification information.'|'0'|'1'|''|'ACNYesNoType'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eInjury.26'|'ACN Vehicle Seat Location'|''|''|''|'The Automated Collision Notification Indication of the Occupant(s) Seat Location(s) within the vehicle.'|'Optional'|'Added to better incorporate advanced automated collision notification information.'|'0'|'1'|''|'SeatLocation'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eInjury.27'|'Seat Occupied'|''|''|''|'Indication if seat is occupied based on seat sensor data.'|'Optional'|'Added to better incorporate advanced automated collision notification information.'|'0'|'1'|''|'ACNYesNoType'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eInjury.28'|'ACN Incident Seatbelt Use'|''|''|''|'The Automated Collision Notification Indication of Seatbelt use by the occupant(s).'|'Optional'|'Added to better incorporate advanced automated collision notification information.'|'0'|'1'|''|'ACNYesNoType'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eInjury.29'|'ACN Incident Airbag Deployed'|''|''|''|'The Automated Collision Notification Indication of Airbag Deployment.'|'Optional'|'Added to better incorporate advanced automated collision notification information.'|'0'|'1'|''|'ACNYesNoType'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eArrest.01'|'Cardiac Arrest'|'E11_01'|'National'|'State'|'Indication of the presence of a cardiac arrest at any time during this EMS event.'|'Required'|''|'1'|'1'|'Nillable'|'CardiacArrest'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eArrest.02'|'Cardiac Arrest Etiology'|'E11_02'|'National'|'State'|'Indication of the etiology or cause of the cardiac arrest (classified as cardiac, non-cardiac, etc.)'|'Required'|''|'1'|'1'|'Nillable'|'CardiacArrestEtiology'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eArrest.03'|'Resuscitation Attempted By EMS'|'E11_03'|'National'|'State'|'Indication of an attempt to resuscitate the patient who is in cardiac arrest (attempted, not attempted due to DNR, etc.)'|'Required'|''|'1'|'M'|'Nillable'|'ResuscitationAttempted'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eArrest.04'|'Arrest Witnessed By'|'E11_04'|'National'|'State'|'Indication of who the cardiac arrest was witnessed by'|'Required'|''|'1'|'M'|'Nillable'|'ArrestWitnessedBy'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eArrest.05'|'CPR Care Provided Prior to EMS Arrival'|''|'National'|'State'|'Documentation of the CPR provided prior to EMS arrival'|'Required'|''|'1'|'1'|'Nillable'|'YesNoValues'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eArrest.06'|'Who Provided CPR Prior to EMS Arrival'|''|''|'State'|'Documentation of who performed CPR prior to this EMS unit's arrival.'|'Optional'|''|'0'|'M'|''|'WhoProvided'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eArrest.07'|'AED Use Prior to EMS Arrival'|''|'National'|'State'|'Documentation of AED use Prior to EMS Arrival'|'Required'|''|'1'|'1'|'Nillable'|'AEDUse'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eArrest.08'|'Who Used AED Prior to EMS Arrival'|''|''|'State'|'Documentation of who used the AED prior to this EMS unit's arrival.'|'Optional'|''|'0'|'M'|''|'WhoUsedAED'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eArrest.09'|'Type of CPR Provided'|''|'National'|'State'|'Documentation of the type/technique of CPR used by EMS.'|'Required'|''|'1'|'M'|'Nillable'|'CPRType'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eArrest.11'|'First Monitored Arrest Rhythm of the Patient'|'E11_05'|'National'|'State'|'Documentation of what the first monitored arrest rhythm which was noted'|'Required'|''|'1'|'1'|'Nillable'|'FirstMonitoredRhythm'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eArrest.12'|'Any Return of Spontaneous Circulation'|'E11_06'|'National'|'State'|'Indication whether or not there was any return of spontaneous circulation.'|'Required'|''|'1'|'M'|'Nillable'|'ReturnOfSpontaneousCirculation'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eArrest.13'|'Neurological Outcome at Hospital Discharge'|'E11_07'|''|''|'The level of cerebral performance of the patient at the time of discharge from the Hospital'|'Optional'|''|'0'|'1'|''|'NeurologicalOutcomeAtDischarge'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eArrest.14'|'Date/Time of Cardiac Arrest'|'E11_08'|'National'|'State'|'The date/time of the cardiac arrest (if not known, please estimate).'|'Required'|''|'1'|'1'|'Nillable'|'DateTimeType'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|'1950-01-01T00:00:00-00:00'|'2050-01-01T00:00:00-00:00'|''|''|''|'[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\\.\\d+)?(\\+|-)[0-9]{2}:[0-9]{2}'|\n" +
        "'EMSDataSet'|'element'|'eArrest.15'|'Date/Time Resuscitation Discontinued'|'E11_09'|''|'State'|'The date/time resuscitation was discontinued.'|'Recommended'|''|'0'|'1'|'Nillable'|'DateTimeType'|'NV'|''|''|'NV.NotReporting; NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|'1950-01-01T00:00:00-00:00'|'2050-01-01T00:00:00-00:00'|''|''|''|'[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\\.\\d+)?(\\+|-)[0-9]{2}:[0-9]{2}'|\n" +
        "'EMSDataSet'|'element'|'eArrest.16'|'Reason CPR/Resuscitation Discontinued'|'E11_10'|'National'|'State'|'The reason that CPR or the resuscitation efforts were discontinued.'|'Required'|''|'1'|'1'|'Nillable'|'ReasonCPRDiscontinued'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eArrest.17'|'Cardiac Rhythm on Arrival at Destination'|'E11_11'|'National'|'State'|'The patient's cardiac rhythm upon delivery or transfer to the destination'|'Required'|''|'1'|'M'|'Nillable'|'CardiacRhythm'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eArrest.18'|'End of EMS Cardiac Arrest Event'|''|'National'|'State'|'The patient's outcome at the end of the EMS event.'|'Required'|'Added to better identify the outcome of EMS cardiac arrest patients.'|'1'|'1'|'Nillable'|'CardiacArrestOutcome'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eArrest.19'|'Date/Time of Initial CPR'|''|''|''|'The initial date and time that CPR was started by anyone.'|'Optional'|''|'0'|'1'|''|'DateTimeType'|''|''|''|''|''|''|''|''|'1950-01-01T00:00:00-00:00'|'2050-01-01T00:00:00-00:00'|''|''|''|'[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\\.\\d+)?(\\+|-)[0-9]{2}:[0-9]{2}'|\n" +
        "'EMSDataSet'|'element'|'eHistory.01'|'Barriers to Patient Care'|'E12_01'|'National'|'State'|'Indication of whether or not there were any patient specific barriers to serving the patient at the scene'|'Required'|''|'1'|'M'|'Nillable'|'BarriersToPatientCare'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eHistory.02'|'Last Name of Patient's Practitioner'|'E12_06'|''|''|'The last name of the patient's practitioner'|'Optional'|''|'0'|'1'|''|'PersonLastName'|''|''|''|''|''|'1'|'60'|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eHistory.03'|'First Name of Patient's Practitioner'|'E12_04'|''|''|'The first name of the patient's practitioner'|'Optional'|''|'0'|'1'|''|'PersonFirstName'|''|''|''|''|''|'1'|'50'|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eHistory.04'|'Middle Name/Initial of Patient's Practitioner'|'E12_05'|''|''|'The middle name or initial of the patient's practitioner.'|'Optional'|''|'0'|'1'|''|'PersonMiddleName'|''|''|''|''|''|'1'|'50'|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eHistory.05'|'Advance Directives'|'E12_07'|''|'State'|'The presence of a valid DNR form, living will, or document directing end of life or healthcare treatment decisions.'|'Recommended'|''|'0'|'M'|'Nillable'|'AdvanceDirectives'|'NV'|''|''|'NV.NotReporting; NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eHistory.06'|'Medication Allergies'|'E12_08'|''|'State'|'The patient's medication allergies'|'Recommended'|''|'0'|'M'|'Nillable'|'MedicationAllergies'|'NV'|'PN'|'PNNill'|'NV.NotReporting; NV.NotRecorded; NV.NotApplicable; '|'PN.Unresponsive; PN.UnableToComplete; PN.Refused; PN.NoKnownDrugAllergy; '|''|''|''|''|''|''|''|''|'(Z88\\.[0-9])|([a-zA-Z0-9]{2,7})'|\n" +
        "'EMSDataSet'|'element'|'eHistory.07'|'Environmental/Food Allergies'|'E12_09'|''|''|'The patient's known allergies to food or environmental agents.'|'Optional'|''|'0'|'M'|''|'snomed'|''|''|''|''|''|''|''|''|'100000'|'1000000000'|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eHistory.08'|'Medical/Surgical History'|'E12_10'|''|'State'|'The patient's pre-existing medical and surgery history of the patient'|'Recommended'|''|'0'|'M'|'Nillable'|'icd10MedSurge'|'NV'|'PN'|'PNNill'|'NV.NotReporting; NV.NotRecorded; NV.NotApplicable; '|'PN.Unresponsive; PN.UnableToComplete; PN.Refused; PN.NoneReported; '|''|''|''|''|''|''|''|''|'([A-QRSTZ][0-9][0-9A-Z])((\\.[0-9A-Z]{1,3})?)|[0-9A-HJ-NP-Z]{3,7}'|\n" +
        "'EMSDataSet'|'element'|'eHistory.09'|'Medical History Obtained From'|'E12_11'|''|''|'Type of person medical history obtained from'|'Optional'|''|'0'|'M'|''|'MedicalHistoryObtainedFrom'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eHistory.10'|'The Patient's Type of Immunization'|'E12_12'|''|''|'The immunization type of the patient.'|'Optional'|''|'0'|'1'|''|'ImmunizationType'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eHistory.11'|'Immunization Year'|'E12_13'|''|''|'The year associated with each immunization type'|'Optional'|''|'0'|'1'|''|'Year'|''|''|''|''|''|''|''|''|'1900'|'2050'|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eHistory.12'|'Current Medications'|'E12_14'|''|'State'|'The medications the patient currently takes'|'Recommended'|''|'0'|'1'|'Nillable'|'Medication'|'NV'|'PN'|'PNNill'|'NV.NotReporting; NV.NotRecorded; NV.NotApplicable; '|'PN.UnableToComplete; PN.Unresponsive; PN.Refused; PN.NoneReported; '|'2'|'7'|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eHistory.13'|'Current Medication Dose'|'E12_15'|''|''|'The numeric dose or amount of the patient's current medication'|'Optional'|''|'0'|'1'|''|'CurrentMedicationDose'|''|''|''|''|''|''|''|''|''|''|''|'8'|'2'|''|\n" +
        "'EMSDataSet'|'element'|'eHistory.14'|'Current Medication Dosage Unit'|'E12_16'|''|''|'The dosage unit of the patient's current medication'|'Optional'|''|'0'|'1'|''|'CurrentMedicationDosageUnit'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eHistory.15'|'Current Medication Administration Route'|'E12_17'|''|''|'The administration route (po, SQ, etc.) of the patient's current medication'|'Optional'|''|'0'|'1'|''|'CurrentMedicationAdministrationRoute'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eHistory.16'|'Presence of Emergency Information Form'|'E12_18'|''|''|'Indication of the presence of the Emergency Information Form associated with patient's with special healthcare needs.'|'Optional'|''|'0'|'1'|''|'YesNoValues'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eHistory.17'|'Alcohol/Drug Use Indicators'|'E12_19'|'National'|'State'|'Indicators for the potential use of alcohol or drugs by the patient related to the patient's current illness or injury.'|'Required'|''|'1'|'M'|'Nillable'|'AlcoholDrugUseIndicators'|'NV'|'PN'|'PNNill'|'NV.NotRecorded; NV.NotApplicable; '|'PN.UnableToComplete; PN.Refused; PN.NoneReported; '|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eHistory.18'|'Pregnancy'|'E12_20'|''|''|'Indication of the possibility by the patient's history of current pregnancy.'|'Optional'|''|'0'|'1'|'Nillable'|'Pregnancy'|''|'PN'|'PNNill'|''|'PN.UnableToComplete; PN.Refused; '|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eHistory.19'|'Last Oral Intake'|''|''|''|'Date and Time of last oral intake.'|'Optional'|'Added to better document last oral intake.'|'0'|'1'|''|'DateTimeType'|''|''|''|''|''|''|''|''|'1950-01-01T00:00:00-00:00'|'2050-01-01T00:00:00-00:00'|''|''|''|'[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\\.\\d+)?(\\+|-)[0-9]{2}:[0-9]{2}'|\n" +
        "'EMSDataSet'|'element'|'eNarrative.01'|'Patient Care Report Narrative'|'E13_01'|''|'State'|'The narrative of the patient care report (PCR).'|'Recommended'|''|'0'|'1'|'Nillable'|'PCRNarrative'|'NV'|''|''|'NV.NotReporting; NV.NotRecorded; NV.NotApplicable; '|''|'1'|'10000'|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eVitals.01'|'Date/Time Vital Signs Taken'|'E14_01'|'National'|'State'|'The date/time vital signs were taken on the patient.'|'Required'|''|'1'|'1'|'Nillable'|'DateTimeType'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|'1950-01-01T00:00:00-00:00'|'2050-01-01T00:00:00-00:00'|''|''|''|'[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\\.\\d+)?(\\+|-)[0-9]{2}:[0-9]{2}'|\n" +
        "'EMSDataSet'|'element'|'eVitals.02'|'Obtained Prior to this Unit's EMS Care'|'E14_02'|'National'|'State'|'Indicates that the information which is documented was obtained prior to the documenting EMS units care.'|'Required'|''|'1'|'1'|'Nillable'|'YesNoValues'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eVitals.03'|'Cardiac Rhythm / Electrocardiography (ECG)'|'E14_03'|'National'|'State'|'The cardiac rhythm / ECG and other electrocardiography findings of the patient as interpreted by EMS personnel.'|'Required'|''|'1'|'M'|'Nillable'|'CardiacRhythm'|'NV'|'PN'|'PNNill'|'NV.NotRecorded; NV.NotApplicable; '|'PN.UnableToComplete; PN.Refused; '|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eVitals.04'|'ECG Type'|''|'National'|'State'|'The type of ECG associated with the cardiac rhythm.'|'Required'|'Added to better document ECG results.'|'1'|'1'|'Nillable'|'ECGType'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eVitals.05'|'Method of ECG Interpretation'|''|'National'|'State'|'The method of ECG interpretation.'|'Required'|'Added to better document ECG results.'|'1'|'M'|'Nillable'|'ECGMethod'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eVitals.06'|'SBP (Systolic Blood Pressure)'|'E14_04'|'National'|'State'|'The patient's systolic blood pressure.'|'Required'|''|'1'|'1'|'Nillable'|'SBP'|'NV'|'PN'|'PNNill'|'NV.NotRecorded; NV.NotApplicable; '|'PN.UnableToComplete; PN.Refused; PN.ExamFindingNotPresent; '|''|''|''|'0'|'500'|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eVitals.07'|'DBP (Diastolic Blood Pressure)'|'E14_05'|''|'State'|'The patient's diastolic blood pressure.'|'Recommended'|''|'0'|'1'|'Nillable'|'DBP'|'NV'|'PN'|'PNNill'|'NV.NotReporting; NV.NotRecorded; NV.NotApplicable; '|'PN.UnableToComplete; PN.Refused; PN.ExamFindingNotPresent; '|''|''|''|''|''|''|''|''|'[5][0][0]|[1-4][0-9][0-9]|[0]|[1-9][0-9]|P|p'|\n" +
        "'EMSDataSet'|'element'|'eVitals.08'|'Method of Blood Pressure Measurement'|'E14_06'|'National'|'State'|'Indication of method of blood pressure measurement.'|'Required'|''|'1'|'1'|'Nillable'|'BloodPressureMethod'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eVitals.09'|'Mean Arterial Pressure'|''|''|''|'The patient's mean arterial pressure.'|'Optional'|'Added for additional patient monitoring capability.'|'0'|'1'|''|'MAP'|''|''|''|''|''|''|''|''|'1'|'500'|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eVitals.10'|'Heart Rate'|'E14_07'|'National'|'State'|'The patient's heart rate expressed as a number per minute.'|'Required'|''|'1'|'1'|'Nillable'|'HeartRate'|'NV'|'PN'|'PNNill'|'NV.NotRecorded; NV.NotApplicable; '|'PN.UnableToComplete; PN.Refused; PN.ExamFindingNotPresent; '|''|''|''|'0'|'500'|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eVitals.11'|'Method of Heart Rate Measurement'|''|''|''|'The method in which the Heart Rate was measured. Values include auscultated, palpated, electronic monitor).'|'Optional'|'This data element was added when Pulse Rate and Electronic Monitor Rate were merged as EVitals.10.'|'0'|'1'|''|'MethodMeasureHeartRate'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eVitals.12'|'Pulse Oximetry'|'E14_09'|'National'|'State'|'The patient's oxygen saturation.'|'Required'|''|'1'|'1'|'Nillable'|'PulseOximetry'|'NV'|'PN'|'PNNill'|'NV.NotRecorded; NV.NotApplicable; '|'PN.UnableToComplete; PN.Refused; PN.ExamFindingNotPresent; '|''|''|''|'0'|'100'|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eVitals.13'|'Pulse Rhythm'|'E14_10'|''|''|'The clinical rhythm of the patient's pulse.'|'Optional'|''|'0'|'1'|''|'PulseRhythm'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eVitals.14'|'Respiratory Rate'|'E14_11'|'National'|'State'|'The patient's respiratory rate expressed as a number per minute.'|'Required'|''|'1'|'1'|'Nillable'|'RespiratoryRate'|'NV'|'PN'|'PNNill'|'NV.NotRecorded; NV.NotApplicable; '|'PN.UnableToComplete; PN.Refused; PN.ExamFindingNotPresent; '|''|''|''|'0'|'300'|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eVitals.15'|'Respiratory Effort'|'E14_12'|''|''|'The patient's respiratory effort.'|'Optional'|''|'0'|'1'|''|'RespiratoryEffort'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eVitals.16'|'End Tidal Carbon Dioxide (ETCO2)'|'E14_13'|'National'|'State'|'The numeric value of the patient's exhaled end tidal carbon dioxide (ETCO2) level measured as a unit of pressure in millimeters of mercury (mmHg).'|'Required'|''|'1'|'1'|'Nillable'|'CO2'|'NV'|'PN'|'PNNill'|'NV.NotRecorded; NV.NotApplicable; '|'PN.UnableToComplete; PN.Refused; '|''|''|''|'0'|'200'|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eVitals.17'|'Carbon Monoxide (CO)'|''|''|'State'|'The numeric value of the patient's carbon monoxide level measured as a percentage (%) of carboxyhemoglobin (COHb).'|'Recommended'|'Added to allow use of new patient monitoring devices.'|'0'|'1'|'Nillable'|'CarbonMonoxideLevel'|'NV'|'PN'|'PNNill'|'NV.NotReporting; NV.NotRecorded; NV.NotApplicable; '|'PN.UnableToComplete; PN.Refused; '|''|''|''|'0'|'100'|''|'3'|'1'|''|\n" +
        "'EMSDataSet'|'element'|'eVitals.18'|'Blood Glucose Level'|'E14_14'|'National'|'State'|'The patient's blood glucose level.'|'Required'|''|'1'|'1'|'Nillable'|'BloodGlucoseLevel'|'NV'|'PN'|'PNNill'|'NV.NotRecorded; NV.NotApplicable; '|'PN.UnableToComplete; PN.Refused; '|''|''|''|'0'|'2000'|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eVitals.19'|'Glasgow Coma Score-Eye'|'E14_15'|'National'|'State'|'The patient's Glasgow Coma Score Eye opening.'|'Required'|''|'1'|'1'|'Nillable'|'GlasgowComaScoreEyes'|'NV'|'PN'|'PNNill'|'NV.NotRecorded; NV.NotApplicable; '|'PN.UnableToComplete; PN.Refused; '|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eVitals.20'|'Glasgow Coma Score-Verbal'|'E14_16'|'National'|'State'|'The patient's Glasgow Coma Score Verbal.'|'Required'|''|'1'|'1'|'Nillable'|'GlasgowComaScoreVerbal'|'NV'|'PN'|'PNNill'|'NV.NotRecorded; NV.NotApplicable; '|'PN.UnableToComplete; PN.Refused; '|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eVitals.21'|'Glasgow Coma Score-Motor'|'E14_17'|'National'|'State'|'The patient's Glasgow Coma Score Motor'|'Required'|''|'1'|'1'|'Nillable'|'GlasgowComaScoreMotor'|'NV'|'PN'|'PNNill'|'NV.NotRecorded; NV.NotApplicable; '|'PN.UnableToComplete; PN.Refused; '|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eVitals.22'|'Glasgow Coma Score-Qualifier'|'E14_18'|'National'|'State'|'Documentation of factors which make the GCS score more meaningful.'|'Required'|''|'1'|'M'|'Nillable'|'GCSScoreQualifier'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eVitals.23'|'Total Glasgow Coma Score'|'E14_19'|''|'State'|'The patient's total Glasgow Coma Score.'|'Recommended'|''|'0'|'1'|'Nillable'|'TotalGCS'|'NV'|'PN'|'PNNill'|'NV.NotReporting; NV.NotRecorded; NV.NotApplicable; '|'PN.UnableToComplete; PN.Refused; '|''|''|''|'3'|'15'|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eVitals.24'|'Temperature'|'E14_20'|''|'State'|'The patient's body temperature in degrees Celsius/centigrade.'|'Recommended'|''|'0'|'1'|'Nillable'|'BodyTemperature'|'NV'|'PN'|'PNNill'|'NV.NotReporting; NV.NotRecorded; NV.NotApplicable; '|'PN.UnableToComplete; PN.Refused; '|''|''|''|'0'|'50'|''|'3'|'1'|''|\n" +
        "'EMSDataSet'|'element'|'eVitals.25'|'Temperature Method'|'E14_21'|''|''|'The method used to obtain the patient's body temperature.'|'Optional'|''|'0'|'1'|''|'MethodBodyTemp'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eVitals.26'|'Level of Responsiveness (AVPU)'|'E14_22'|'National'|'State'|'The patient's highest level of responsiveness.'|'Required'|''|'1'|'1'|'Nillable'|'PatientsHighestLevelResponsiveness'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eVitals.27'|'Pain Scale Score'|'E14_23'|'National'|'State'|'The patient's indication of pain from a scale of 0-10.'|'Required'|''|'1'|'1'|'Nillable'|'PainScale'|'NV'|'PN'|'PNNill'|'NV.NotRecorded; NV.NotApplicable; '|'PN.UnableToComplete; PN.Refused; '|''|''|''|'0'|'10'|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eVitals.28'|'Pain Scale Type'|''|''|'State'|'The type of pain scale used.'|'Recommended'|'Added to better document the patient's pain level.'|'0'|'1'|'Nillable'|'TypeOfPainScale'|'NV'|''|''|'NV.NotReporting; NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eVitals.29'|'Stroke Scale Score'|'E14_24'|'National'|'State'|'The findings or results of the Stroke Scale Type (eVitals.30) used to assess the patient exhibiting stroke-like symptoms.'|'Required'|''|'1'|'1'|'Nillable'|'StrokeScale'|'NV'|'PN'|'PNNill'|'NV.NotRecorded; NV.NotApplicable; '|'PN.UnableToComplete; PN.Refused; '|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eVitals.30'|'Stroke Scale Type'|''|'National'|'State'|'The type of stroke pain scale used.'|'Required'|'Added to include additional detail on the stroke scale used.'|'1'|'1'|'Nillable'|'TypeOfStrokeScale'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eVitals.31'|'Reperfusion Checklist'|'E14_25'|'National'|'State'|'The results of the patient's Reperfusion Checklist for potential Thrombolysis use.'|'Required'|''|'1'|'1'|'Nillable'|'ReperfusionChecklist'|'NV'|'PN'|'PNNill'|'NV.NotRecorded; NV.NotApplicable; '|'PN.UnableToComplete; PN.Refused; '|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eVitals.32'|'APGAR'|'E14_26'|''|''|'The patient's total APGAR score (0-10).'|'Optional'|''|'0'|'1'|'Nillable'|'APGAR'|''|'PN'|'PNNill'|''|'PN.UnableToComplete; '|''|''|''|'0'|'10'|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eVitals.33'|'Revised Trauma Score'|'E14_27'|''|''|'The patient's Revised Trauma Score.'|'Optional'|''|'0'|'1'|'Nillable'|'RTS'|''|'PN'|'PNNill'|''|'PN.UnableToComplete; PN.Refused; '|''|''|''|'0'|'12'|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eLabs.01'|'Date/Time of Laboratory or Imaging Result'|''|''|''|'The data and time for the specific laboratory result'|'Optional'|'Added to better document patient care.'|'0'|'1'|''|'DateTimeType'|''|''|''|''|''|''|''|''|'1950-01-01T00:00:00-00:00'|'2050-01-01T00:00:00-00:00'|''|''|''|'[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\\.\\d+)?(\\+|-)[0-9]{2}:[0-9]{2}'|\n" +
        "'EMSDataSet'|'element'|'eLabs.02'|'Study/Result Prior to this Unit's EMS Care'|''|''|''|'Indicates that the laboratory result occurred prior to this EMS units care.'|'Optional'|'Added to better document EMS care.'|'0'|'1'|''|'YesNoValues'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eLabs.03'|'Laboratory Result Type'|''|''|''|'The type of the laboratory value.'|'Optional'|'Added to provide for the documentation of laboratory results obtained prior to or during and EMS patient encounter.'|'0'|'1'|''|'LaboratoryResultType'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eLabs.04'|'Laboratory Result'|''|''|''|'The value or result of the laboratory test (Units may vary).'|'Optional'|'Added to better document EMS care.'|'0'|'1'|''|'LaboratoryResult'|''|''|''|''|''|'1'|'50'|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eLabs.05'|'Imaging Study Type'|''|''|''|'The type of x-ray or imaging study.'|'Optional'|'Added to better describe the EMS patient care.'|'0'|'1'|''|'ImagingStudyType'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eLabs.06'|'Imaging Study Results'|''|''|''|'The description or interpretation of the results of the imaging study.'|'Optional'|'Added to better describe the EMS Patient Care'|'0'|'1'|''|'ImagingStudyResults'|''|''|''|''|''|'3'|'5000'|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eLabs.07'|'Imaging Study File or Waveform Graphic Type'|''|''|''|'The description of the image study file or waveform graphic stored in Imaging Study File or Waveform Graphic (eLabs.08).'|'Optional'|''|'0'|'1'|''|'GraphicType'|''|''|''|''|''|'1'|'255'|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eLabs.08'|'Imaging Study File or Waveform Graphic'|''|''|''|'The imaging study file.'|'Optional'|''|'0'|'1'|''|'WaveformGraphic'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eExam.01'|'Estimated Body Weight in Kilograms'|'E16_01'|''|'State'|'The patient's body weight in kilograms either measured or estimated'|'Recommended'|''|'0'|'1'|'Nillable'|'EstimatedBodyWeight'|'NV'|'PN'|'PNNill'|'NV.NotReporting; NV.NotRecorded; NV.NotApplicable; '|'PN.UnableToComplete; '|''|''|''|'0.1'|'999.9'|''|'4'|'1'|''|\n" +
        "'EMSDataSet'|'element'|'eExam.02'|'Length Based Tape Measure'|'E16_02'|''|'State'|'The length-based color as taken from the tape.'|'Recommended'|''|'0'|'1'|'Nillable'|'BroselowLutenColor'|'NV'|'PN'|'PNNill'|'NV.NotReporting; NV.NotRecorded; NV.NotApplicable; '|'PN.UnableToComplete; PN.Refused; '|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eExam.03'|'Date/Time of Assessment'|'E16_03'|''|''|'The date/time of the assessment'|'Optional'|''|'0'|'1'|''|'DateTimeType'|''|''|''|''|''|''|''|''|'1950-01-01T00:00:00-00:00'|'2050-01-01T00:00:00-00:00'|''|''|''|'[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\\.\\d+)?(\\+|-)[0-9]{2}:[0-9]{2}'|\n" +
        "'EMSDataSet'|'element'|'eExam.04'|'Skin Assessment'|'E16_04'|''|''|'The assessment findings associated with the patient's skin.'|'Optional'|''|'0'|'M'|''|'SkinAssessment'|''|'PN'|''|''|'PN.ExamFindingNotPresent; '|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eExam.05'|'Head Assessment'|'E16_05'|''|''|'The assessment findings associated with the patient's head.'|'Optional'|''|'0'|'M'|''|'HeadAssessment'|''|'PN'|''|''|'PN.ExamFindingNotPresent; '|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eExam.06'|'Face Assessment'|''|''|''|'The assessment findings associated with the patient's face.'|'Optional'|''|'0'|'M'|''|'FaceAssessment'|''|'PN'|''|''|'PN.ExamFindingNotPresent; '|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eExam.07'|'Neck Assessment'|'E16_06'|''|''|'The assessment findings associated with the patient's neck.'|'Optional'|''|'0'|'M'|''|'NeckAssessment'|''|'PN'|''|''|'PN.ExamFindingNotPresent; '|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eExam.08'|'Chest/Lungs Assessment'|'E16_07'|''|''|'The assessment findings associated with the patient's chest/lungs.'|'Optional'|''|'0'|'M'|''|'ChestLungsAssessment'|''|'PN'|''|''|'PN.ExamFindingNotPresent; '|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eExam.09'|'Heart Assessment'|'E16_08'|''|''|'The assessment findings associated with the patient's heart.'|'Optional'|''|'0'|'M'|''|'HeartAssessment'|''|'PN'|''|''|'PN.ExamFindingNotPresent; '|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eExam.10'|'Abdominal Assessment Finding Location'|''|''|''|'The location of the patient's abdomen assessment findings.'|'Optional'|''|'0'|'1'|''|'AbdominalExamFindingLocation'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eExam.11'|'Abdomen Assessment'|'E16_09'|''|''|'The assessment findings associated with the patient's abdomen.'|'Optional'|''|'0'|'M'|''|'AbdomenAssessment'|''|'PN'|''|''|'PN.ExamFindingNotPresent; '|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eExam.12'|'Pelvis/Genitourinary Assessment'|'E16_13'|''|''|'The assessment findings associated with the patient's pelvis/genitourinary.'|'Optional'|''|'0'|'M'|''|'GUAssessment'|''|'PN'|''|''|'PN.ExamFindingNotPresent; '|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eExam.13'|'Back and Spine Assessment Finding Location'|''|''|''|'The location of the patient's back and spine assessment findings.'|'Optional'|''|'0'|'1'|''|'BackAndSpineAssessmentLocation'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eExam.14'|'Back and Spine Assessment'|'E16_14'|''|''|'The assessment findings associated with the patient's spine (Cervical, Thoracic, Lumbar, and Sacral) and back exam.'|'Optional'|''|'0'|'M'|''|'BackAndSpineAssessment'|''|'PN'|''|''|'PN.ExamFindingNotPresent; '|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eExam.15'|'Extremity Assessment Finding Location'|''|''|''|'The location of the patient's extremity assessment findings.'|'Optional'|''|'0'|'1'|''|'ExtremityAssessmentLocation'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eExam.16'|'Extremities Assessment'|'E16_17'|''|''|'The assessment findings associated with the patient's extremities.'|'Optional'|''|'0'|'M'|''|'ExtremitiesAssessment'|''|'PN'|''|''|'PN.ExamFindingNotPresent; '|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eExam.17'|'Eye Assessment Finding Location'|''|''|''|'The location of the patient's eye assessment findings.'|'Optional'|''|'0'|'1'|''|'EyesAssessmentLocation'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eExam.18'|'Eye Assessment'|'E16_21'|''|''|'The assessment findings of the patient's eye examination.'|'Optional'|''|'0'|'M'|''|'EyesAssessment'|''|'PN'|''|''|'PN.ExamFindingNotPresent; '|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eExam.19'|'Mental Status Assessment'|'E16_23'|''|''|'The assessment findings of the patient's mental status examination.'|'Optional'|''|'0'|'M'|''|'MentalStatusAssessment'|''|'PN'|''|''|'PN.ExamFindingNotPresent; '|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eExam.20'|'Neurological Assessment'|'E16_24'|''|''|'The assessment findings of the patient's neurological examination.'|'Optional'|''|'0'|'M'|''|'NeurologicalAssessment'|''|'PN'|''|''|'PN.ExamFindingNotPresent; '|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eExam.21'|'Stroke/CVA Symptoms Resolved'|''|''|'State'|'Indication if the Stroke/CVA Symptoms resolved and when.'|'Recommended'|''|'0'|'1'|'Nillable'|'StrokeCVASymptomsResolved'|'NV'|'PN'|'PNNill'|'NV.NotReporting; NV.NotRecorded; NV.NotApplicable; '|'PN.UnableToComplete; '|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eProtocols.01'|'Protocols Used'|'E17_01'|'National'|'State'|'The protocol used by EMS personnel to direct the clinical care of the patient'|'Required'|''|'1'|'1'|'Nillable'|'ProtocolsUsed'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eProtocols.02'|'Protocol Age Category'|''|'National'|'State'|'The age group the protocol is written to address'|'Required'|'Added to better document protocol use.'|'1'|'1'|'Nillable'|'ProtocolAgeCategory'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eMedications.01'|'Date/Time Medication Administered'|'E18_01'|'National'|'State'|'The date/time medication administered to the patient'|'Required'|''|'1'|'1'|'Nillable'|'DateTimeType'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|'1950-01-01T00:00:00-00:00'|'2050-01-01T00:00:00-00:00'|''|''|''|'[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\\.\\d+)?(\\+|-)[0-9]{2}:[0-9]{2}'|\n" +
        "'EMSDataSet'|'element'|'eMedications.02'|'Medication Administered Prior to this Unit's EMS Care'|'E18_02'|'National'|'State'|'Indicates that the medication administration which is documented was administered prior to this EMS units care'|'Required'|''|'1'|'1'|'Nillable'|'YesNoValues'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eMedications.03'|'Medication Given'|'E18_03'|'National'|'State'|'The medication given to the patient'|'Required'|''|'1'|'1'|'Nillable'|'Medication'|'NV'|'PN'|''|'NV.NotRecorded; NV.NotApplicable; '|'PN.UnableToComplete; PN.Refused; PN.MedicationAlreadyTaken; PN.MedicationAllergy; PN.DeniedByOrder; PN.ContraindicationNoted; '|'2'|'7'|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eMedications.04'|'Medication Administered Route'|'E18_04'|''|'State'|'The route medication was administered to the patient'|'Optional'|''|'0'|'1'|''|'CurrentMedicationAdministrationRoute'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eMedications.05'|'Medication Dosage'|'E18_05'|'National'|'State'|'The dose or amount of the medication given to the patient'|'Required'|''|'1'|'1'|'Nillable'|'MedicationDosage'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|'9'|'3'|''|\n" +
        "'EMSDataSet'|'element'|'eMedications.06'|'Medication Dosage Units'|'E18_06'|'National'|'State'|'The unit of medication dosage given to patient'|'Required'|''|'1'|'1'|'Nillable'|'MedicationDosageUnits'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eMedications.07'|'Response to Medication'|'E18_07'|'National'|'State'|'The patient's response to the medication'|'Required'|''|'1'|'1'|'Nillable'|'Response'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eMedications.08'|'Medication Complication'|'E18_08'|'National'|'State'|'Any complication (abnormal effect on the patient) associated with the administration of the medication to the patient by EMS'|'Required'|''|'1'|'M'|'Nillable'|'MedicationComplication'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eMedications.09'|'Medication Crew (Healthcare Professionals) ID'|'E18_09'|''|'State'|'The statewide assigned ID number of the EMS crew member giving the treatment to the patient'|'Recommended'|''|'0'|'1'|'Nillable'|'CrewMemberID'|'NV'|''|''|'NV.NotReporting; NV.NotRecorded; NV.NotApplicable; '|''|'2'|'50'|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eMedications.10'|'Role/Type of Person Administering Medication'|''|'National'|'State'|'The type (level) of EMS or Healthcare Professional Administering the Medication. For medications administered prior to EMS arrival, this may be a non-EMS healthcare professional.'|'Required'|'Added to better document the type of healthcare professional who administered the medication.'|'1'|'1'|'Nillable'|'EMSCaregiverLevel'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eMedications.11'|'Medication Authorization'|'E18_10'|''|''|'The type of treatment authorization obtained'|'Optional'|''|'0'|'1'|''|'TxAuthorization'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eMedications.12'|'Medication Authorizing Physician'|'E18_11'|''|''|'The name of the authorizing physician ordering the medication administration if the order was provided by any manner other than protocol (standing order) in EMedications.11'|'Optional'|''|'0'|'1'|''|'PersonName'|''|''|''|''|''|'1'|'255'|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eProcedures.01'|'Date/Time Procedure Performed'|'E19_01'|'National'|'State'|'The date/time the procedure was performed on the patient'|'Required'|''|'1'|'1'|'Nillable'|'DateTimeType'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|'1950-01-01T00:00:00-00:00'|'2050-01-01T00:00:00-00:00'|''|''|''|'[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\\.\\d+)?(\\+|-)[0-9]{2}:[0-9]{2}'|\n" +
        "'EMSDataSet'|'element'|'eProcedures.02'|'Procedure Performed Prior to this Unit's EMS Care'|'E19_02'|'National'|'State'|'Indicates that the procedure which was performed and documented was performed prior to this EMS units care.'|'Required'|''|'1'|'1'|'Nillable'|'YesNoValues'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eProcedures.03'|'Procedure'|'E19_03'|'National'|'State'|'The procedure performed on the patient.'|'Required'|''|'1'|'1'|'Nillable'|'snomed'|'NV'|'PN'|''|'NV.NotRecorded; NV.NotApplicable; '|'PN.UnableToComplete; PN.Refused; PN.DeniedByOrder; PN.ContraindicationNoted; '|''|''|''|'100000'|'1000000000'|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eProcedures.04'|'Size of Procedure Equipment'|'E19_04'|''|''|'The size of the equipment used in the procedure on the patient'|'Optional'|''|'0'|'1'|''|'SizeOfProcedureEquipment'|''|''|''|''|''|'1'|'20'|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eProcedures.05'|'Number of Procedure Attempts'|'E19_05'|'National'|'State'|'The number of attempts taken to complete a procedure or intervention regardless of success.'|'Required'|''|'1'|'1'|'Nillable'|'NumberOfProcedureAttempts'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|'1'|'10'|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eProcedures.06'|'Procedure Successful'|'E19_06'|'National'|'State'|'Indicates that this individual procedure attempt which was performed on the patient was successful.'|'Required'|''|'1'|'1'|'Nillable'|'YesNoValues'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eProcedures.07'|'Procedure Complication'|'E19_07'|'National'|'State'|'Any complication (abnormal effect on the patient) associated with the performance of the procedure on the patient'|'Required'|''|'1'|'M'|'Nillable'|'ProcedureComplication'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eProcedures.08'|'Response to Procedure'|'E19_08'|'National'|'State'|'The patient's response to the procedure'|'Required'|''|'1'|'1'|'Nillable'|'Response'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eProcedures.09'|'Procedure Crew Members ID'|'E19_09'|''|'State'|'The statewide assigned ID number of the EMS crew member performing the procedure on the patient'|'Recommended'|''|'0'|'1'|'Nillable'|'CrewMemberID'|'NV'|''|''|'NV.NotReporting; NV.NotRecorded; NV.NotApplicable; '|''|'2'|'50'|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eProcedures.10'|'Role/Type of Person Performing the Procedure'|''|'National'|'State'|'The type (level) of EMS or Healthcare Professional performing the procedure. For procedures performed prior to EMS arrival, this may be a non-EMS healthcare professional.'|'Required'|'Added to document the type of healthcare professional performing the procedure.'|'1'|'1'|'Nillable'|'EMSCaregiverLevel'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eProcedures.11'|'Procedure Authorization'|'E19_10'|''|''|'The type of treatment authorization obtained'|'Optional'|''|'0'|'1'|''|'TxAuthorization'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eProcedures.12'|'Procedure Authorizing Physician'|'E19_11'|''|''|'The name of the authorizing physician ordering the procedure, if the order was provided by any manner other than protocol (standing order) in eProcedures.11'|'Optional'|''|'0'|'1'|''|'PersonName'|''|''|''|''|''|'1'|'255'|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eProcedures.13'|'Vascular Access Location'|'E19_12'|''|'State'|'The location of the vascular access site attempt on the patient, if applicable.'|'Recommended'|''|'0'|'1'|'Nillable'|'VascularAccessLocation'|'NV'|''|''|'NV.NotReporting; NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eAirway.01'|'Indications for Invasive Airway'|''|''|'State'|'The clinical indication for performing invasive airway management.'|'Recommended'|'Added to better document airway management.'|'0'|'M'|'Nillable'|'AirwayIndications'|'NV'|''|''|'NV.NotReporting; NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eAirway.02'|'Date/Time Airway Device Placement Confirmation'|''|''|'State'|'The date and time the airway device placement was confirmed.'|'Recommended'|'Added to better document airway management.'|'0'|'1'|'Nillable'|'DateTimeType'|'NV'|''|''|'NV.NotReporting; NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|'1950-01-01T00:00:00-00:00'|'2050-01-01T00:00:00-00:00'|''|''|''|'[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\\.\\d+)?(\\+|-)[0-9]{2}:[0-9]{2}'|\n" +
        "'EMSDataSet'|'element'|'eAirway.03'|'Airway Device Being Confirmed'|''|''|'State'|'The airway device in which placement is being confirmed.'|'Recommended'|'Added to better document airway management. SAD means Supraglottic Airway  Device.'|'0'|'1'|'Nillable'|'DeviceBeingConfirmed'|'NV'|''|''|'NV.NotReporting; NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eAirway.04'|'Airway Device Placement Confirmed Method'|''|''|'State'|'The method used to confirm the airway device placement.'|'Recommended'|'Added to better document airway management.'|'0'|'M'|'Nillable'|'DeviceConfirmedMethods'|'NV'|''|''|'NV.NotReporting; NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eAirway.05'|'Tube Depth'|''|''|''|'The measurement at the patient's teeth/lip of the tube depth in centimeters (cm) of the invasive airway placed.'|'Optional'|''|'0'|'1'|''|'TubeDepth'|''|''|''|''|''|''|''|''|'8'|'32'|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eAirway.06'|'Type of Individual Confirming Airway Device Placement'|''|''|'State'|'The type of individual who confirmed the airway device placement.'|'Recommended'|'Added to better document airway management.'|'0'|'1'|'Nillable'|'IndividualDetails'|'NV'|''|''|'NV.NotReporting; NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eAirway.07'|'Crew Member ID'|''|''|'State'|'The statewide assigned ID number of the EMS crew member confirming the airway placement.'|'Recommended'|'Added to better document airway management.'|'0'|'1'|'Nillable'|'CrewMemberID'|'NV'|''|''|'NV.NotReporting; NV.NotRecorded; NV.NotApplicable; '|''|'2'|'50'|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eAirway.08'|'Airway Complications Encountered'|''|''|'State'|'The airway management complications encountered during the patient care episode.'|'Recommended'|'Added to better document airway management.'|'0'|'M'|'Nillable'|'ComplicationsEncountered'|'NV'|''|''|'NV.NotReporting; NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eAirway.09'|'Suspected Reasons for Failed Airway Management'|''|''|'State'|'The reason(s) the airway was unable to be successfully managed.'|'Optional'|'Added to better document airway management.'|'0'|'M'|''|'ReasonsForFailure'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eAirway.10'|'Date/Time Decision to Manage the Patient with an Invasive Airway'|''|''|''|'The date and time the decision was made to manage the patient's airway with an invasive airway device.'|'Optional'|'Added to better document airway management.'|'0'|'1'|''|'DateTimeType'|''|''|''|''|''|''|''|''|'1950-01-01T00:00:00-00:00'|'2050-01-01T00:00:00-00:00'|''|''|''|'[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\\.\\d+)?(\\+|-)[0-9]{2}:[0-9]{2}'|\n" +
        "'EMSDataSet'|'element'|'eAirway.11'|'Date/Time Invasive Airway Placement Attempts Abandoned'|''|''|''|'The date and time that the invasive airway attempts were abandoned for the patient.'|'Optional'|'Added to better document airway management.'|'0'|'1'|''|'DateTimeType'|''|''|''|''|''|''|''|''|'1950-01-01T00:00:00-00:00'|'2050-01-01T00:00:00-00:00'|''|''|''|'[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\\.\\d+)?(\\+|-)[0-9]{2}:[0-9]{2}'|\n" +
        "'EMSDataSet'|'element'|'eDevice.01'|'Medical Device Serial Number'|''|''|''|'The unique manufacturer's serial number associated with a medical device.'|'Optional'|''|'0'|'1'|''|'DeviceSerialNumber'|''|''|''|''|''|'2'|'50'|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eDevice.02'|'Date/Time of Event (per Medical Device)'|'E21_01'|''|''|'The time of the event recorded by the device's internal clock'|'Optional'|''|'0'|'1'|''|'DateTimeType'|''|''|''|''|''|''|''|''|'1950-01-01T00:00:00-00:00'|'2050-01-01T00:00:00-00:00'|''|''|''|'[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\\.\\d+)?(\\+|-)[0-9]{2}:[0-9]{2}'|\n" +
        "'EMSDataSet'|'element'|'eDevice.03'|'Medical Device Event Type'|'E21_02'|''|''|'The type of event documented by the medical device.'|'Optional'|''|'0'|'M'|''|'MedicalDeviceEventType'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eDevice.04'|'Medical Device Waveform Graphic Type'|'E21_03'|''|''|'The description of the waveform file stored in Waveform Graphic (eDevice.05).'|'Optional'|''|'0'|'1'|''|'GraphicType'|''|''|''|''|''|'1'|'255'|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eDevice.05'|'Medical Device Waveform Graphic'|'E21_04'|''|''|'The graphic waveform file.'|'Optional'|''|'0'|'1'|''|'WaveformGraphic'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eDevice.06'|'Medical Device Mode (Manual, AED, Pacing, CO2, O2, etc)'|'E21_05'|''|''|'The mode of operation the device is operating in during the defibrillation, pacing, or rhythm analysis by the device (if appropriate for the event)'|'Optional'|''|'0'|'1'|''|'AEDPacingOrCO2Mode'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eDevice.07'|'Medical Device ECG Lead'|'E21_06'|''|''|'The lead or source which the medical device used to obtain the rhythm (if appropriate for the event)'|'Optional'|''|'0'|'M'|''|'ECGLead'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eDevice.08'|'Medical Device ECG Interpretation'|'E21_07'|''|''|'The interpretation of the rhythm by the device (if appropriate for the event)'|'Optional'|''|'0'|'1'|''|'ECGInterpretation'|''|''|''|''|''|'1'|'2000'|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eDevice.09'|'Type of Shock'|'E21_08'|''|''|'The type of shock used by the device for the defibrillation (if appropriate for the event)'|'Optional'|''|'0'|'1'|''|'TypeOfShock'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eDevice.10'|'Shock or Pacing Energy'|'E21_09'|''|''|'The energy (in joules) used for the shock or pacing (if appropriate for the event)'|'Optional'|''|'0'|'1'|''|'ShockOrPacingEnergy'|''|''|''|''|''|''|''|''|'1'|'9000'|''|'5'|'1'|''|\n" +
        "'EMSDataSet'|'element'|'eDevice.11'|'Total Number of Shocks Delivered'|'E21_10'|''|''|'The number of times the patient was defibrillated, if the patient was defibrillated during the patient encounter.'|'Optional'|''|'0'|'1'|''|'TotalNumberOfShocks'|''|''|''|''|''|''|''|''|'1'|'100'|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eDevice.12'|'Pacing Rate'|'E21_11'|''|''|'The rate the device was calibrated to pace during the event, if appropriate.'|'Optional'|''|'0'|'1'|''|'PacingRate'|''|''|''|''|''|''|''|''|'1'|'1000'|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eDisposition.01'|'Destination/Transferred To, Name'|'E20_01'|''|'State'|'The destination the patient was delivered or transferred to.'|'Recommended'|''|'0'|'1'|'Nillable'|'DestinationTransferredToName'|'NV'|''|''|'NV.NotReporting; NV.NotRecorded; NV.NotApplicable; '|''|'2'|'100'|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eDisposition.02'|'Destination/Transferred To, Code'|'E20_02'|''|'State'|'The code of the destination the patient was delivered or transferred to.'|'Recommended'|''|'0'|'1'|'Nillable'|'DestinationTransferredToCode'|'NV'|''|''|'NV.NotReporting; NV.NotRecorded; NV.NotApplicable; '|''|'2'|'50'|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eDisposition.03'|'Destination Street Address'|'E20_03'|''|'State'|'The street address of the destination the patient was delivered or transferred to.'|'Optional'|''|'0'|'1'|''|'StreetAddress'|''|''|''|''|''|'1'|'255'|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eDisposition.04'|'Destination City'|'E20_04'|''|'State'|'The city of the destination the patient was delivered or transferred to (physical address).'|'Optional'|''|'0'|'1'|''|'CityGnisCode'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eDisposition.05'|'Destination State'|'E20_05'|'National'|'State'|'The state of the destination the patient was delivered or transferred to.'|'Required'|''|'1'|'1'|'Nillable'|'ANSIStateCode'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|'[0-9]{2}'|\n" +
        "'EMSDataSet'|'element'|'eDisposition.06'|'Destination County'|'E20_06'|'National'|'State'|'The destination county in which  the patient was delivered or transferred to.'|'Required'|''|'1'|'1'|'Nillable'|'ANSICountyCode'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|'[0-9]{5}'|\n" +
        "'EMSDataSet'|'element'|'eDisposition.07'|'Destination ZIP Code'|'E20_07'|'National'|'State'|'The destination ZIP code in which  the patient was delivered or transferred to.'|'Required'|''|'1'|'1'|'Nillable'|'ZIP'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|'[0-9]{5}|[0-9]{5}-[0-9]{4}|[0-9]{5}-[0-9]{5}|[A-Z][0-9][A-Z] [0-9][A-Z][0-9]'|\n" +
        "'EMSDataSet'|'element'|'eDisposition.08'|'Destination Country'|''|''|''|'The country of the destination.'|'Optional'|'Added for improved international compatibility.'|'0'|'1'|''|'ANSICountryCode'|''|''|''|''|''|''|''|'2'|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eDisposition.09'|'Destination GPS Location'|'E20_08'|''|''|'The destination GPS Coordinates to which  the patient was delivered or transferred to.'|'Optional'|''|'0'|'1'|''|'GPSLocation'|''|''|''|''|''|''|''|''|''|''|''|''|''|'(\\+|-)?(90(\\.[0]{1,6})?|([1-8][0-9]|[0-9])(\\.[0-9]{1,6})?),(\\+|-)?(180(\\.[0]{1,6})?|(1[0-7][0-9]|[1-9][0-9]|[0-9])(\\.[0-9]{1,6})?)'|\n" +
        "'EMSDataSet'|'element'|'eDisposition.10'|'Destination Location US National Grid Coordinates'|''|''|''|'The US National Grid Coordinates for the Destination Location. This may be the Healthcare Facility US National Grid Coordinates.'|'Optional'|''|'0'|'1'|''|'USNG'|''|''|''|''|''|''|''|''|''|''|''|''|''|'[1][0-9][RSTU][ABCDEFGHJKLMNPQRSTUVWXYZ][ABCDEFGHJKLMNPQRSTUV][0-9]{8}'|\n" +
        "'EMSDataSet'|'element'|'eDisposition.11'|'Number of Patients Transported in this EMS Unit'|''|''|'State'|'The number of patients transported by this EMS crew and unit.'|'Recommended'|'Added to document multiple patients being transported with the same vehicle and crew.'|'0'|'1'|'Nillable'|'NumberOfPatients'|'NV'|''|''|'NV.NotReporting; NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|'1'|'100'|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eDisposition.12'|'Incident/Patient Disposition'|'E20_10'|'National'|'State'|'Type of disposition treatment and/or transport of the patient by this EMS Unit.'|'Mandatory'|''|'1'|'1'|''|'IncidentPatientDisposition'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eDisposition.13'|'How Patient Was Moved to Ambulance'|'E20_11'|''|''|'The method the patient was moved to the ambulance from the scene'|'Optional'|''|'0'|'M'|''|'HowPatientWasMovedToFromAmbulance'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eDisposition.14'|'Position of Patient During Transport'|'E20_12'|''|''|'The position of the patient during transport from the scene'|'Optional'|''|'0'|'M'|''|'PositionOfPatientDuringTransport'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eDisposition.15'|'How Patient Was Transported From Ambulance'|'E20_13'|''|''|'The method the patient was moved from the ambulance to the destination'|'Optional'|''|'0'|'1'|''|'HowPatientWasMovedToFromAmbulance'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eDisposition.16'|'EMS Transport Method'|''|'National'|'State'|'Transport method by this EMS Unit.'|'Required'|'Added to better describe Air and Ground Transport methods.'|'1'|'1'|'Nillable'|'EMSTransportMethod'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eDisposition.17'|'Transport Mode from Scene'|'E20_14'|'National'|'State'|'Indication whether the transport was emergent or non-emergent.'|'Required'|''|'1'|'1'|'Nillable'|'TransportModeFromScene'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eDisposition.18'|'Additional Transport Mode Descriptors'|''|'National'|'State'|'The documentation of transport mode techniques for this EMS response.'|'Required'|''|'1'|'M'|'Nillable'|'AdditionalTransportModeDescriptors'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eDisposition.19'|'Final Patient Acuity'|'E20_15'|'National'|'State'|'The acuity of the patient's condition after EMS care.'|'Required'|''|'1'|'1'|'Nillable'|'FinalPatientAcuity'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eDisposition.20'|'Reason for Choosing Destination'|'E20_16'|'National'|'State'|'The reason the unit chose to deliver or transfer the patient to the destination'|'Required'|''|'1'|'M'|'Nillable'|'ReasonForChoosingDestination'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eDisposition.21'|'Type of Destination'|'E20_17'|'National'|'State'|'The type of destination the patient was delivered or transferred to'|'Required'|''|'1'|'1'|'Nillable'|'TypeOfDestination'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eDisposition.22'|'Hospital In-Patient Destination'|''|'National'|'State'|'The location within the hospital that the patient was taken directly by EMS (e.g., Cath Lab, ICU, etc.).'|'Required'|'Added to identify the location within the hospital that the patient was directly taken to by EMS.'|'1'|'1'|'Nillable'|'HospitalInPatientDestination'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eDisposition.23'|'Hospital Capability'|''|'National'|'State'|'The primary hospital capability associated with the patient's condition for this transport (e.g., Trauma, STEMI, Peds, etc.).'|'Required'|'Added to aid in determining if patients are transported to the appropriate hospital based on provider impression, assessment, and treatment.'|'1'|'1'|'Nillable'|'HospitalDesignation'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eDisposition.24'|'Destination Team Pre-Arrival Alert or Activation'|''|'National'|'State'|'Indication that an alert (or activation) was called by EMS to the appropriate destination healthcare facility team. The alert (or activation) should occur prior to the EMS Unit arrival at the destination with the patient.'|'Required'|'Added to better document performance measure for acute time dependent illness and injury systems of care.'|'1'|'1'|'Nillable'|'DestinationPrearrivalActivation'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eDisposition.25'|'Date/Time of Destination Prearrival Alert or Activation'|''|'National'|'State'|'The Date/Time EMS alerted, notified, or activated the Destination Healthcare Facility prior to EMS arrival. The EMS assessment identified the patient as acutely ill or injured based on exam and possibly specified alert criteria.'|'Required'|'Added to better document performance measure for acute time dependent illness and injury systems of care.'|'1'|'1'|'Nillable'|'DateTimeType'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|'1950-01-01T00:00:00-00:00'|'2050-01-01T00:00:00-00:00'|''|''|''|'[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\\.\\d+)?(\\+|-)[0-9]{2}:[0-9]{2}'|\n" +
        "'EMSDataSet'|'element'|'eDisposition.26'|'Disposition Instructions Provided'|''|''|''|'Information provided to patient during disposition for patients not transported or treated.'|'Optional'|'Added to better document instructions given to patients not transported by EMS.'|'0'|'M'|''|'DispositionInstruction'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eOutcome.01'|'Emergency Department Disposition'|'E22_01'|'National'|'State'|'The known disposition of the patient from the Emergency Department (ED)'|'Required'|''|'1'|'1'|'Nillable'|'EmergencyDepartmentDisposition'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eOutcome.02'|'Hospital Disposition'|'E22_02'|'National'|'State'|'The known disposition of the patient from the hospital, if admitted.'|'Required'|''|'1'|'1'|'Nillable'|'HospitalDisposition'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eOutcome.03'|'External Report ID/Number Type'|''|''|''|'The Type of External Report or Record associated with the Report/ID Number.'|'Optional'|'Added to allow documentation of external record and identification numbers.'|'0'|'1'|''|'ExternalReportIDType'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eOutcome.04'|'External Report ID/Number'|''|''|''|'The ID or Number of the external report or record in eOutcome.03.'|'Optional'|'Added to allow documentation of external record and identification numbers.'|'0'|'1'|''|'ExternalReportID'|''|''|''|''|''|'2'|'100'|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eOutcome.05'|'Other Report Registry Type'|''|''|''|'The type of external report/registry that was documented as \"other\" in eOutcome.03'|'Optional'|''|'0'|'1'|''|'OtherReportRegistryType'|''|''|''|''|''|'2'|'50'|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eOutcome.06'|'Emergency Department Chief Complaint'|''|''|''|'The patient's reason for seeking care or attention, expressed in the terms as close as possible to those used by the patient or responsible informant.'|'Optional'|'Added to better evaluate EMS patient care.'|'0'|'1'|''|'EmergencyDepartmentChiefComplaint'|''|''|''|''|''|'2'|'100'|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eOutcome.07'|'First ED Systolic Blood Pressure'|''|''|''|'The first recorded Emergency Department Systolic Blood Pressure.'|'Optional'|'Added to better evaluate the outcome of EMS care.'|'0'|'1'|''|'SBP'|''|''|''|''|''|''|''|''|'0'|'500'|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eOutcome.08'|'Emergency Department Recorded Cause of Injury'|''|''|''|'The documented cause of injury from the emergency department record.'|'Optional'|'Added to better evaluate EMS care.'|'0'|'M'|''|'icd10CodeInjury'|''|''|''|''|''|''|''|''|''|''|''|''|''|'([TV-Y][0-9]{2})((\\.[0-9A-Z]{1,4})?)'|\n" +
        "'EMSDataSet'|'element'|'eOutcome.09'|'Emergency Department Procedures'|''|''|''|'The procedures performed on the patient during the emergency department visit.'|'Optional'|'Added to better evaluate EMS care.'|'0'|'M'|''|'icd10CodeOutcomeProcedures'|''|''|''|''|''|''|''|''|''|''|''|''|''|'[0-9A-HJ-NP-Z]{3,7}'|\n" +
        "'EMSDataSet'|'element'|'eOutcome.10'|'Emergency Department Diagnosis'|''|''|''|'The practitioner's description of the condition or problem for which Emergency Department services were provided.'|'Optional'|'Added to better evaluate EMS care.'|'0'|'M'|''|'icd10Code'|''|''|''|''|''|''|''|''|''|''|''|''|''|'[A-Z][0-9][0-9A-Z]((\\.[0-9A-Z]{1,3})?)'|\n" +
        "'EMSDataSet'|'element'|'eOutcome.11'|'Date/Time of Hospital Admission'|''|''|''|'The date and time the patient was admitted to the hospital.'|'Optional'|'Added to better evaluate EMS care.'|'0'|'1'|''|'DateTimeType'|''|''|''|''|''|''|''|''|'1950-01-01T00:00:00-00:00'|'2050-01-01T00:00:00-00:00'|''|''|''|'[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\\.\\d+)?(\\+|-)[0-9]{2}:[0-9]{2}'|\n" +
        "'EMSDataSet'|'element'|'eOutcome.12'|'Hospital Procedures'|''|''|''|'Hospital Procedures performed on the patient during the hospital admission.'|'Optional'|'Added to better evaluate EMS care.'|'0'|'M'|''|'icd10CodeOutcomeProcedures'|''|''|''|''|''|''|''|''|''|''|''|''|''|'[0-9A-HJ-NP-Z]{3,7}'|\n" +
        "'EMSDataSet'|'element'|'eOutcome.13'|'Hospital Diagnosis'|''|''|''|'The hospital diagnosis of the patient associated with the hospital admission.'|'Optional'|'Added to better evaluate EMS care.'|'0'|'M'|''|'icd10CodeOutcomeDiagnosis'|''|''|''|''|''|''|''|''|''|''|''|''|''|'[A-Z][0-9][0-9A-Z]((\\.[0-9A-Z]{1,4})?)'|\n" +
        "'EMSDataSet'|'element'|'eOutcome.14'|'Total ICU Length of Stay'|''|''|''|'The total number of patient days in any ICU (including all ICU episodes).'|'Optional'|'Added to better measure patient outcomes.'|'0'|'1'|''|'LengthOfStay'|''|''|''|''|''|''|''|''|'1'|'400'|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eOutcome.15'|'Total Ventilator Days'|''|''|''|'The total number of patient days spend on a mechanical ventilator (excluding time in the operating room).'|'Optional'|'Added to better measure and define patient outcome.'|'0'|'1'|''|'TotalVentilatorDays'|''|''|''|''|''|''|''|''|'1'|'400'|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eOutcome.16'|'Date/Time of Hospital Discharge'|''|''|''|'The date the patient was discharged from the hospital.'|'Optional'|'Added to better measure patient outcome.'|'0'|'1'|''|'DateTimeType'|''|''|''|''|''|''|''|''|'1950-01-01T00:00:00-00:00'|'2050-01-01T00:00:00-00:00'|''|''|''|'[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\\.\\d+)?(\\+|-)[0-9]{2}:[0-9]{2}'|\n" +
        "'EMSDataSet'|'element'|'eOutcome.17'|'Outcome at Hospital Discharge'|''|''|''|'The patient's functional status at time of hospital discharge.'|'Optional'|''|'0'|'1'|''|'OutcomeAtHospitalDischarge'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eCustomResults.01'|'Custom Data Element Result'|''|''|''|'The actual value or values chosen (if values listed in eCustomConfiguration.06) or result (free text, Date/Time, or number) documented for the Custom Data Element'|'Mandatory'|'Added to allow customized data elements to be inserted and collected from within the NEMSIS Version 3 standard.'|'1'|'M'|'Nillable'|'CustomResults'|'NV'|'PN'|''|''|''|'1'|'100000'|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eCustomResults.02'|'Custom Element ID Referenced'|''|''|''|'References the CustomElementID attribute for eCustomConfiguration.CustomGroup'|'Mandatory'|''|'1'|'1'|''|'CorrelationID'|''|''|''|''|''|'0'|'255'|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eCustomResults.03'|'CorrelationID of PatientCareReport Element or Group'|''|''|''|'References the CorrelationID attribute of an element or group in the PatientCareReport section'|'Optional'|''|'0'|'1'|''|'CorrelationID'|''|''|''|''|''|'0'|'255'|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eOther.01'|'Review Requested'|'E23_01'|''|''|'Indication of whether the PCR needs review by anyone.'|'Optional'|''|'0'|'1'|''|'YesNoValues'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eOther.02'|'Potential System of Care/Specialty/Registry Patient'|'E23_02'|''|''|'An indication if the patient may meet the entry criteria for an injury or illness specific registry'|'Optional'|''|'0'|'M'|''|'PotentialRegistryCandidate'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eOther.03'|'Personal Protective Equipment Used'|'E23_03'|''|''|'The personal protective equipment which was used by EMS personnel during this EMS patient contact.'|'Optional'|''|'0'|'M'|''|'PersonalProtectiveEquipmentUsed'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eOther.04'|'EMS Professional (Crew Member) ID'|''|''|''|'The ID number of the EMS Crew Member associated with eOther.03, eOther.05, eOther.06.'|'Optional'|'Added to better document EMS workplace health and safety issues.'|'0'|'1'|''|'CrewMemberID'|''|''|''|''|''|'2'|'50'|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eOther.05'|'Suspected EMS Work Related Exposure, Injury, or Death'|'E23_05'|'National'|'State'|'Indication of an EMS work related exposure, injury, or death associated with this EMS event.'|'Required'|''|'1'|'1'|'Nillable'|'YesNoValues'|'NV'|''|''|'NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eOther.06'|'The Type of Work-Related Injury, Death or Suspected Exposure'|'E23_06'|''|'State'|'The type of exposure or unprotected contact with blood or body fluids'|'Recommended'|''|'0'|'M'|'Nillable'|'TypeOfSuspectedExposureToBodilyFluids'|'NV'|''|''|'NV.NotReporting; NV.NotRecorded; NV.NotApplicable; '|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eOther.07'|'Natural, Suspected, Intentional, or Unintentional Disaster'|'E23_04'|''|''|'Event caused by natural forces or Suspected and Intentional/Unintentional Disasters (terrorism).'|'Optional'|''|'0'|'M'|''|'SuspectedIntentionalOrUnintentionalDisaster'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eOther.08'|'Crew Member Completing this Report'|'E23_10'|''|'State'|'The statewide assigned ID number of the EMS crew member which completed this patient care report'|'Recommended'|''|'0'|'1'|'Nillable'|'CrewMemberID'|'NV'|''|''|'NV.NotReporting; NV.NotRecorded; NV.NotApplicable; '|''|'2'|'50'|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eOther.09'|'External Electronic Document Type'|''|''|''|'Document type which has been electronically stored with PCR.'|'Optional'|'Added to allow an improved implementation of electronic healthcare records.'|'0'|'1'|''|'ExternalElectronicDocuments'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eOther.10'|'File Attachment Type'|''|''|''|'The description of the file attachment stored in File Attachment Image (eOther.11).'|'Optional'|'Added to allow an improved implementation of electronic healthcare records.'|'0'|'1'|''|'GraphicType'|''|''|''|''|''|'1'|'255'|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eOther.11'|'File Attachment Image'|''|''|''|'The file that is attached electronically to the patient care report.'|'Optional'|'Added to allow an improved implementation of electronic healthcare records.'|'0'|'1'|''|'FileImage'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eOther.12'|'Type of Person Signing'|''|''|''|'The individual's signature associated with eOther.15 (Signature Status).'|'Optional'|'Added to better document disposition and billing information.'|'0'|'1'|''|'SignatureType'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eOther.13'|'Signature Reason'|''|''|''|'The reason for the individuals signature.'|'Optional'|''|'0'|'M'|''|'SignatureReason'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eOther.14'|'Type Of Patient Representative'|''|''|''|'If Patient Representative is chosen as the owner of the signature, this documents the relationship of the individual signing to the patient.'|'Optional'|'Added to improve documentation on disposition and billing.'|'0'|'1'|''|'RelationshipSignature'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eOther.15'|'Signature Status'|''|''|''|'Indication that a patient or patient representative signature has been collected or attempted to be collected.'|'Optional'|'Added to better document disposition and billing.'|'0'|'1'|''|'SignatureStatus'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eOther.16'|'Signature File Name'|''|''|''|'The name of the graphic file for the signature.'|'Optional'|''|'0'|'1'|''|'FileName'|''|''|''|''|''|''|'255'|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eOther.17'|'Signature File Type'|''|''|''|'The description of the file attachment stored in Signature Graphic (eOther.18).'|'Optional'|''|'0'|'1'|''|'GraphicType'|''|''|''|''|''|'1'|'255'|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eOther.18'|'Signature Graphic'|''|''|''|'The graphic file for the signature.'|'Optional'|'Added to better document disposition and billing.'|'0'|'1'|''|'Graphic'|''|''|''|''|''|''|''|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eOther.19'|'Date/Time of Signature'|''|''|''|'The date and time the signature was captured.'|'Optional'|'Added to better document disposition and billing.'|'0'|'1'|''|'DateTimeType'|''|''|''|''|''|''|''|''|'1950-01-01T00:00:00-00:00'|'2050-01-01T00:00:00-00:00'|''|''|''|'[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\\.\\d+)?(\\+|-)[0-9]{2}:[0-9]{2}'|\n" +
        "'EMSDataSet'|'element'|'eOther.20'|'Signature Last Name'|''|''|''|'The last name of the individual who signed the associated signature.'|'Optional'|'Added to better document disposition and billing.'|'0'|'1'|''|'PersonLastName'|''|''|''|''|''|'1'|'60'|''|''|''|''|''|''|''|\n" +
        "'EMSDataSet'|'element'|'eOther.21'|'Signature First Name'|''|''|''|'The first name of the individual associated with the signature.'|'Optional'|'Added to better document disposition and billing.'|'0'|'1'|''|'PersonFirstName'|''|''|''|''|''|'1'|'50'|''|''|''|''|''|''|''|";
}
function getElements() {
    return "'DEMDataSet'|'dCustomConfiguration.03'|'Custom Data Type'|'9902001'|'Binary'|\n" +
        "'DEMDataSet'|'dCustomConfiguration.03'|'Custom Data Type'|'9902003'|'Date/Time'|\n" +
        "'DEMDataSet'|'dCustomConfiguration.03'|'Custom Data Type'|'9902005'|'Integer/Number'|\n" +
        "'DEMDataSet'|'dCustomConfiguration.03'|'Custom Data Type'|'9902007'|'Other'|\n" +
        "'DEMDataSet'|'dCustomConfiguration.03'|'Custom Data Type'|'9902009'|'Text/String'|\n" +
        "'DEMDataSet'|'dCustomConfiguration.03'|'Custom Data Type'|'9902011'|'Boolean'|\n" +
        "'DEMDataSet'|'dCustomConfiguration.04'|'Custom Data Element Recurrence'|'9923001'|'No'|\n" +
        "'DEMDataSet'|'dCustomConfiguration.04'|'Custom Data Element Recurrence'|'9923003'|'Yes'|\n" +
        "'DEMDataSet'|'dCustomConfiguration.05'|'Custom Data Element Usage'|'9903001'|'Mandatory'|\n" +
        "'DEMDataSet'|'dCustomConfiguration.05'|'Custom Data Element Usage'|'9903003'|'Required'|\n" +
        "'DEMDataSet'|'dCustomConfiguration.05'|'Custom Data Element Usage'|'9903005'|'Recommended'|\n" +
        "'DEMDataSet'|'dCustomConfiguration.05'|'Custom Data Element Usage'|'9903007'|'Optional'|\n" +
        "'DEMDataSet'|'dCustomConfiguration.07'|'Custom Data Element Potential NOT Values (NV)'|'7701001'|'Not Applicable'|\n" +
        "'DEMDataSet'|'dCustomConfiguration.07'|'Custom Data Element Potential NOT Values (NV)'|'7701003'|'Not Recorded'|\n" +
        "'DEMDataSet'|'dCustomConfiguration.07'|'Custom Data Element Potential NOT Values (NV)'|'7701005'|'Not Reporting'|\n" +
        "'DEMDataSet'|'dCustomConfiguration.08'|'Custom Data Element Potential Pertinent Negative Values (PN)'|'8801001'|'Contraindication Noted'|\n" +
        "'DEMDataSet'|'dCustomConfiguration.08'|'Custom Data Element Potential Pertinent Negative Values (PN)'|'8801003'|'Denied By Order'|\n" +
        "'DEMDataSet'|'dCustomConfiguration.08'|'Custom Data Element Potential Pertinent Negative Values (PN)'|'8801005'|'Exam Finding Not Present'|\n" +
        "'DEMDataSet'|'dCustomConfiguration.08'|'Custom Data Element Potential Pertinent Negative Values (PN)'|'8801007'|'Medication Allergy'|\n" +
        "'DEMDataSet'|'dCustomConfiguration.08'|'Custom Data Element Potential Pertinent Negative Values (PN)'|'8801009'|'Medication Already Taken'|\n" +
        "'DEMDataSet'|'dCustomConfiguration.08'|'Custom Data Element Potential Pertinent Negative Values (PN)'|'8801013'|'No Known Drug Allergy'|\n" +
        "'DEMDataSet'|'dCustomConfiguration.08'|'Custom Data Element Potential Pertinent Negative Values (PN)'|'8801015'|'None Reported'|\n" +
        "'DEMDataSet'|'dCustomConfiguration.08'|'Custom Data Element Potential Pertinent Negative Values (PN)'|'8801017'|'Not Performed by EMS'|\n" +
        "'DEMDataSet'|'dCustomConfiguration.08'|'Custom Data Element Potential Pertinent Negative Values (PN)'|'8801019'|'Refused'|\n" +
        "'DEMDataSet'|'dCustomConfiguration.08'|'Custom Data Element Potential Pertinent Negative Values (PN)'|'8801021'|'Unresponsive'|\n" +
        "'DEMDataSet'|'dCustomConfiguration.08'|'Custom Data Element Potential Pertinent Negative Values (PN)'|'8801023'|'Unable to Complete'|\n" +
        "'DEMDataSet'|'dAgency.09'|'Primary Type of Service'|'9920001'|'911 Response (Scene) with Transport Capability'|\n" +
        "'DEMDataSet'|'dAgency.09'|'Primary Type of Service'|'9920003'|'911 Response (Scene) without Transport Capability'|\n" +
        "'DEMDataSet'|'dAgency.09'|'Primary Type of Service'|'9920005'|'Air Medical'|\n" +
        "'DEMDataSet'|'dAgency.09'|'Primary Type of Service'|'9920007'|'ALS Intercept'|\n" +
        "'DEMDataSet'|'dAgency.09'|'Primary Type of Service'|'9920011'|'Hazmat'|\n" +
        "'DEMDataSet'|'dAgency.09'|'Primary Type of Service'|'9920013'|'Medical Transport (Convalescent, Interfacility Transfer Hospital and Nursing Home)'|\n" +
        "'DEMDataSet'|'dAgency.09'|'Primary Type of Service'|'9920015'|'Rescue'|\n" +
        "'DEMDataSet'|'dAgency.09'|'Primary Type of Service'|'9920017'|'Community Paramedicine'|\n" +
        "'DEMDataSet'|'dAgency.09'|'Primary Type of Service'|'9920019'|'Critical Care (Ground)'|\n" +
        "'DEMDataSet'|'dAgency.10'|'Other Types of Service'|'9920001'|'911 Response (Scene) with Transport Capability'|\n" +
        "'DEMDataSet'|'dAgency.10'|'Other Types of Service'|'9920003'|'911 Response (Scene) without Transport Capability'|\n" +
        "'DEMDataSet'|'dAgency.10'|'Other Types of Service'|'9920005'|'Air Medical'|\n" +
        "'DEMDataSet'|'dAgency.10'|'Other Types of Service'|'9920007'|'ALS Intercept'|\n" +
        "'DEMDataSet'|'dAgency.10'|'Other Types of Service'|'9920011'|'Hazmat'|\n" +
        "'DEMDataSet'|'dAgency.10'|'Other Types of Service'|'9920013'|'Medical Transport (Convalescent, Interfacility Transfer Hospital and Nursing Home)'|\n" +
        "'DEMDataSet'|'dAgency.10'|'Other Types of Service'|'9920015'|'Rescue'|\n" +
        "'DEMDataSet'|'dAgency.10'|'Other Types of Service'|'9920017'|'Community Paramedicine'|\n" +
        "'DEMDataSet'|'dAgency.10'|'Other Types of Service'|'9920019'|'Critical Care (Ground)'|\n" +
        "'DEMDataSet'|'dAgency.11'|'Level of Service'|'9917001'|'2009 Advanced Emergency Medical Technician (AEMT)'|\n" +
        "'DEMDataSet'|'dAgency.11'|'Level of Service'|'9917003'|'2009 Emergency Medical Responder (EMR)'|\n" +
        "'DEMDataSet'|'dAgency.11'|'Level of Service'|'9917005'|'2009 Emergency Medical Technician (EMT)'|\n" +
        "'DEMDataSet'|'dAgency.11'|'Level of Service'|'9917007'|'2009 Paramedic'|\n" +
        "'DEMDataSet'|'dAgency.11'|'Level of Service'|'9917009'|'First Responder'|\n" +
        "'DEMDataSet'|'dAgency.11'|'Level of Service'|'9917011'|'EMT-Basic'|\n" +
        "'DEMDataSet'|'dAgency.11'|'Level of Service'|'9917013'|'EMT-Intermediate'|\n" +
        "'DEMDataSet'|'dAgency.11'|'Level of Service'|'9917015'|'EMT-Paramedic'|\n" +
        "'DEMDataSet'|'dAgency.11'|'Level of Service'|'9917019'|'Physician'|\n" +
        "'DEMDataSet'|'dAgency.11'|'Level of Service'|'9917021'|'Critical Care Paramedic'|\n" +
        "'DEMDataSet'|'dAgency.11'|'Level of Service'|'9917023'|'Community Paramedicine'|\n" +
        "'DEMDataSet'|'dAgency.11'|'Level of Service'|'9917025'|'Nurse Practitioner'|\n" +
        "'DEMDataSet'|'dAgency.11'|'Level of Service'|'9917027'|'Physician Assistant'|\n" +
        "'DEMDataSet'|'dAgency.11'|'Level of Service'|'9917029'|'Licensed Practical Nurse (LPN)'|\n" +
        "'DEMDataSet'|'dAgency.11'|'Level of Service'|'9917031'|'Registered Nurse'|\n" +
        "'DEMDataSet'|'dAgency.12'|'Organization Status'|'1016001'|'Mixed'|\n" +
        "'DEMDataSet'|'dAgency.12'|'Organization Status'|'1016003'|'Non-Volunteer'|\n" +
        "'DEMDataSet'|'dAgency.12'|'Organization Status'|'1016005'|'Volunteer'|\n" +
        "'DEMDataSet'|'dAgency.13'|'Organizational Type'|'9912001'|'Fire Department'|\n" +
        "'DEMDataSet'|'dAgency.13'|'Organizational Type'|'9912003'|'Governmental, Non-Fire'|\n" +
        "'DEMDataSet'|'dAgency.13'|'Organizational Type'|'9912005'|'Hospital'|\n" +
        "'DEMDataSet'|'dAgency.13'|'Organizational Type'|'9912007'|'Private, Nonhospital'|\n" +
        "'DEMDataSet'|'dAgency.13'|'Organizational Type'|'9912009'|'Tribal'|\n" +
        "'DEMDataSet'|'dAgency.14'|'EMS Agency Organizational Tax Status'|'1018001'|'For Profit'|\n" +
        "'DEMDataSet'|'dAgency.14'|'EMS Agency Organizational Tax Status'|'1018003'|'Other (e.g., Government)'|\n" +
        "'DEMDataSet'|'dAgency.14'|'EMS Agency Organizational Tax Status'|'1018005'|'Not For Profit'|\n" +
        "'DEMDataSet'|'dAgency.23'|'EMS Agency Time Zone'|'1027001'|'All other time zones'|\n" +
        "'DEMDataSet'|'dAgency.23'|'EMS Agency Time Zone'|'1027003'|'GMT-04:00 Atlantic Time'|\n" +
        "'DEMDataSet'|'dAgency.23'|'EMS Agency Time Zone'|'1027005'|'GMT-05:00 Eastern Time'|\n" +
        "'DEMDataSet'|'dAgency.23'|'EMS Agency Time Zone'|'1027007'|'GMT-06:00 Central Time'|\n" +
        "'DEMDataSet'|'dAgency.23'|'EMS Agency Time Zone'|'1027009'|'GMT-07:00 Mountain Time'|\n" +
        "'DEMDataSet'|'dAgency.23'|'EMS Agency Time Zone'|'1027011'|'GMT-08:00 Pacific Time'|\n" +
        "'DEMDataSet'|'dAgency.23'|'EMS Agency Time Zone'|'1027013'|'GMT-09:00 Alaska'|\n" +
        "'DEMDataSet'|'dAgency.23'|'EMS Agency Time Zone'|'1027015'|'GMT-10:00 Hawaii'|\n" +
        "'DEMDataSet'|'dAgency.23'|'EMS Agency Time Zone'|'1027017'|'GMT-11:00 Midway Island, Samoa'|\n" +
        "'DEMDataSet'|'dAgency.24'|'EMS Agency Daylight Savings Time Use'|'9923001'|'No'|\n" +
        "'DEMDataSet'|'dAgency.24'|'EMS Agency Daylight Savings Time Use'|'9923003'|'Yes'|\n" +
        "'DEMDataSet'|'dContact.01'|'Agency Contact Type'|'1101001'|'Administrative Assistant'|\n" +
        "'DEMDataSet'|'dContact.01'|'Agency Contact Type'|'1101003'|'EMS Agency Director/Chief/Lead Administrator/CEO'|\n" +
        "'DEMDataSet'|'dContact.01'|'Agency Contact Type'|'1101005'|'EMS Assistant Agency Director/Chief/Administrator/CEO'|\n" +
        "'DEMDataSet'|'dContact.01'|'Agency Contact Type'|'1101007'|'EMS Assistant Medical Director'|\n" +
        "'DEMDataSet'|'dContact.01'|'Agency Contact Type'|'1101009'|'EMS IT/Data Specialist'|\n" +
        "'DEMDataSet'|'dContact.01'|'Agency Contact Type'|'1101011'|'EMS Medical Director'|\n" +
        "'DEMDataSet'|'dContact.01'|'Agency Contact Type'|'1101013'|'EMS Quality/Performance Improvement Specialist'|\n" +
        "'DEMDataSet'|'dContact.01'|'Agency Contact Type'|'1101015'|'EMS Training/Education Specialist'|\n" +
        "'DEMDataSet'|'dContact.01'|'Agency Contact Type'|'1101017'|'Other'|\n" +
        "'DEMDataSet'|'dContact.09'|'Agency Contact Country'|'CA'|'Canada'|\n" +
        "'DEMDataSet'|'dContact.09'|'Agency Contact Country'|'MX'|'Mexico'|\n" +
        "'DEMDataSet'|'dContact.09'|'Agency Contact Country'|'US'|'United States'|\n" +
        "'DEMDataSet'|'dContact.13'|'Agency Medical Director Degree'|'1113001'|'Doctor of Medicine'|\n" +
        "'DEMDataSet'|'dContact.13'|'Agency Medical Director Degree'|'1113003'|'Doctor of Osteopathy'|\n" +
        "'DEMDataSet'|'dContact.14'|'Agency Medical Director Board Certification Type'|'1114001'|'Allergy and Immunology'|\n" +
        "'DEMDataSet'|'dContact.14'|'Agency Medical Director Board Certification Type'|'1114003'|'Anesthesiology'|\n" +
        "'DEMDataSet'|'dContact.14'|'Agency Medical Director Board Certification Type'|'1114005'|'Colon and Rectal Surgery'|\n" +
        "'DEMDataSet'|'dContact.14'|'Agency Medical Director Board Certification Type'|'1114007'|'Dermatology'|\n" +
        "'DEMDataSet'|'dContact.14'|'Agency Medical Director Board Certification Type'|'1114009'|'Emergency Medicine'|\n" +
        "'DEMDataSet'|'dContact.14'|'Agency Medical Director Board Certification Type'|'1114011'|'Family Medicine'|\n" +
        "'DEMDataSet'|'dContact.14'|'Agency Medical Director Board Certification Type'|'1114013'|'Internal Medicine'|\n" +
        "'DEMDataSet'|'dContact.14'|'Agency Medical Director Board Certification Type'|'1114015'|'Neurological Surgery'|\n" +
        "'DEMDataSet'|'dContact.14'|'Agency Medical Director Board Certification Type'|'1114017'|'Neurology'|\n" +
        "'DEMDataSet'|'dContact.14'|'Agency Medical Director Board Certification Type'|'1114019'|'None (Not Board Certified)'|\n" +
        "'DEMDataSet'|'dContact.14'|'Agency Medical Director Board Certification Type'|'1114021'|'Obstetrics and Gynecology'|\n" +
        "'DEMDataSet'|'dContact.14'|'Agency Medical Director Board Certification Type'|'1114023'|'Ophthalmology'|\n" +
        "'DEMDataSet'|'dContact.14'|'Agency Medical Director Board Certification Type'|'1114025'|'Orthopedic Surgery'|\n" +
        "'DEMDataSet'|'dContact.14'|'Agency Medical Director Board Certification Type'|'1114027'|'Otolaryngology'|\n" +
        "'DEMDataSet'|'dContact.14'|'Agency Medical Director Board Certification Type'|'1114029'|'Pediatrics'|\n" +
        "'DEMDataSet'|'dContact.14'|'Agency Medical Director Board Certification Type'|'1114031'|'Physical Medicine and Rehabilitation'|\n" +
        "'DEMDataSet'|'dContact.14'|'Agency Medical Director Board Certification Type'|'1114033'|'Plastic Surgery'|\n" +
        "'DEMDataSet'|'dContact.14'|'Agency Medical Director Board Certification Type'|'1114035'|'Psychiatry'|\n" +
        "'DEMDataSet'|'dContact.14'|'Agency Medical Director Board Certification Type'|'1114037'|'Surgery'|\n" +
        "'DEMDataSet'|'dContact.14'|'Agency Medical Director Board Certification Type'|'1114039'|'Thoracic Surgery'|\n" +
        "'DEMDataSet'|'dContact.14'|'Agency Medical Director Board Certification Type'|'1114041'|'Urology'|\n" +
        "'DEMDataSet'|'dContact.14'|'Agency Medical Director Board Certification Type'|'1114043'|'Vascular Surgery'|\n" +
        "'DEMDataSet'|'dContact.15'|'Medical Director Compensation'|'1115001'|'Compensated'|\n" +
        "'DEMDataSet'|'dContact.15'|'Medical Director Compensation'|'1115003'|'Non-Compensated'|\n" +
        "'DEMDataSet'|'dContact.16'|'EMS Medical Director Fellowship Trained Status'|'9923001'|'No'|\n" +
        "'DEMDataSet'|'dContact.16'|'EMS Medical Director Fellowship Trained Status'|'9923003'|'Yes'|\n" +
        "'DEMDataSet'|'dConfiguration.02'|'State Certification/Licensure Levels'|'9911001'|'2009 Advanced Emergency Medical Technician (AEMT)'|\n" +
        "'DEMDataSet'|'dConfiguration.02'|'State Certification/Licensure Levels'|'9911003'|'2009 Emergency Medical Responder (EMR)'|\n" +
        "'DEMDataSet'|'dConfiguration.02'|'State Certification/Licensure Levels'|'9911005'|'2009 Emergency Medical Technician (EMT)'|\n" +
        "'DEMDataSet'|'dConfiguration.02'|'State Certification/Licensure Levels'|'9911007'|'2009 Paramedic'|\n" +
        "'DEMDataSet'|'dConfiguration.02'|'State Certification/Licensure Levels'|'9911009'|'EMT-Basic'|\n" +
        "'DEMDataSet'|'dConfiguration.02'|'State Certification/Licensure Levels'|'9911011'|'EMT-Intermediate'|\n" +
        "'DEMDataSet'|'dConfiguration.02'|'State Certification/Licensure Levels'|'9911013'|'EMT-Paramedic'|\n" +
        "'DEMDataSet'|'dConfiguration.02'|'State Certification/Licensure Levels'|'9911015'|'First Responder'|\n" +
        "'DEMDataSet'|'dConfiguration.02'|'State Certification/Licensure Levels'|'9911019'|'Other'|\n" +
        "'DEMDataSet'|'dConfiguration.02'|'State Certification/Licensure Levels'|'9911021'|'Physician'|\n" +
        "'DEMDataSet'|'dConfiguration.02'|'State Certification/Licensure Levels'|'9911023'|'Critical Care Paramedic'|\n" +
        "'DEMDataSet'|'dConfiguration.02'|'State Certification/Licensure Levels'|'9911025'|'Community Paramedicine'|\n" +
        "'DEMDataSet'|'dConfiguration.02'|'State Certification/Licensure Levels'|'9911027'|'Nurse Practitioner'|\n" +
        "'DEMDataSet'|'dConfiguration.02'|'State Certification/Licensure Levels'|'9911029'|'Physician Assistant'|\n" +
        "'DEMDataSet'|'dConfiguration.02'|'State Certification/Licensure Levels'|'9911031'|'Licensed Practical Nurse (LPN)'|\n" +
        "'DEMDataSet'|'dConfiguration.02'|'State Certification/Licensure Levels'|'9911033'|'Registered Nurse'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914001'|'Airway'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914003'|'Airway-Failed'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914005'|'Airway-Obstruction/Foreign Body'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914007'|'Airway-Rapid Sequence Induction (RSI-Paralytic)'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914009'|'Airway-Sedation Assisted (Non-Paralytic)'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914011'|'Cardiac Arrest-Asystole'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914013'|'Cardiac Arrest-Hypothermia-Therapeutic'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914015'|'Cardiac Arrest-Pulseless Electrical Activity'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914017'|'Cardiac Arrest-Ventricular Fibrillation/ Pulseless Ventricular Tachycardia'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914019'|'Cardiac Arrest-Post Resuscitation Care'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914021'|'Environmental-Altitude Sickness'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914023'|'Environmental-Cold Exposure'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914025'|'Environmental-Frostbite/Cold Injury'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914027'|'Environmental-Heat Exposure/Exhaustion'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914029'|'Environmental-Heat Stroke/Hyperthermia'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914031'|'Environmental-Hypothermia'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914033'|'Exposure-Airway/Inhalation Irritants'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914035'|'Exposure-Biological/Infectious'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914037'|'Exposure-Blistering Agents'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914041'|'Exposure-Chemicals to Eye'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914043'|'Exposure-Cyanide'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914045'|'Exposure-Explosive/ Blast Injury'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914047'|'Exposure-Nerve Agents'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914049'|'Exposure-Radiologic Agents'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914051'|'General-Back Pain'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914053'|'General-Behavioral/Patient Restraint'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914055'|'General-Cardiac Arrest'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914057'|'General-Dental Problems'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914059'|'General-Epistaxis'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914061'|'General-Fever'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914063'|'General-Individualized Patient Protocol'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914065'|'General-Indwelling Medical Devices/Equipment'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914067'|'General-IV Access'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914069'|'General-Medical Device Malfunction'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914071'|'General-Pain Control'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914073'|'General-Spinal Immobilization/Clearance'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914075'|'General-Universal Patient Care/ Initial Patient Contact'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914077'|'Injury-Amputation'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914079'|'Injury-Bites and Envenomations-Land'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914081'|'Injury-Bites and Envenomations-Marine'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914083'|'Injury-Bleeding/ Hemorrhage Control'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914085'|'Injury-Burns-Thermal'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914087'|'Injury-Cardiac Arrest'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914089'|'Injury-Crush Syndrome'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914091'|'Injury-Diving Emergencies'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914093'|'Injury-Drowning/Near Drowning'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914095'|'Injury-Electrical Injuries'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914097'|'Injury-Extremity'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914099'|'Injury-Eye'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914101'|'Injury-Head'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914103'|'Injury-Impaled Object'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914105'|'Injury-Multisystem'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914107'|'Injury-Spinal Cord'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914109'|'Medical-Abdominal Pain'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914111'|'Medical-Allergic Reaction/Anaphylaxis'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914113'|'Medical-Altered Mental Status'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914115'|'Medical-Bradycardia'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914117'|'Medical-Cardiac Chest Pain'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914119'|'Medical-Diarrhea'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914121'|'Medical-Hyperglycemia'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914123'|'Medical-Hypertension'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914125'|'Medical-Hypoglycemia/Diabetic Emergency'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914127'|'Medical-Hypotension/Shock (Non-Trauma)'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914129'|'Medical-Influenza-Like Illness/ Upper Respiratory Infection'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914131'|'Medical-Nausea/Vomiting'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914133'|'Medical-Newborn/ Neonatal Resuscitation'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914135'|'General-Overdose/Poisoning/Toxic Ingestion'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914137'|'Medical-Pulmonary Edema/CHF'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914139'|'Medical-Respiratory Distress/Asthma/COPD/Reactive Airway'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914141'|'Medical-Seizure'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914143'|'Medical-ST-Elevation Myocardial Infarction (STEMI)'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914145'|'Medical-Stroke/TIA'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914147'|'Medical-Supraventricular Tachycardia (Including Atrial Fibrillation)'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914149'|'Medical-Syncope'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914151'|'Medical-Ventricular Tachycardia (With Pulse)'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914153'|'Not Done'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914155'|'OB/GYN-Childbirth/Labor/Delivery'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914157'|'OB/GYN-Eclampsia'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914159'|'OB/GYN-Gynecologic Emergencies'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914161'|'OB/GYN-Pregnancy Related Emergencies'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914163'|'OB/GYN-Post-partum Hemorrhage'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914165'|'Other'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914167'|'Exposure-Carbon Monoxide'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914169'|'Cardiac Arrest-Do Not Resuscitate'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914171'|'Cardiac Arrest-Special Resuscitation Orders'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914173'|'Exposure-Smoke Inhalation'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914175'|'General-Community Paramedicine / Mobile Integrated Healthcare'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914177'|'General-Exception Protocol'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914179'|'General-Extended Care Guidelines'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914181'|'General-Interfacility Transfers'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914183'|'General-Law Enforcement - Blood for Legal Purposes'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914185'|'General-Law Enforcement - Assist with Law Enforcement Activity'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914187'|'General-Neglect or Abuse Suspected'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914189'|'General-Refusal of Care'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914191'|'Injury-Mass/Multiple Casualties'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914193'|'Injury-Thoracic'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914195'|'Medical-Adrenal Insufficiency'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914197'|'Medical-Apparent Life Threatening Event (ALTE)'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914199'|'Medical-Tachycardia'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914201'|'Cardiac Arrest-Determination of Death / Withholding Resuscitative Efforts'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914203'|'Injury-Conducted Electrical Weapon (e.g., Taser)'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914205'|'Injury-Facial Trauma'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914207'|'Injury-General Trauma Management'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914209'|'Injury-Lightning/Lightning Strike'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914211'|'Injury-SCUBA Injury/Accidents'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914213'|'Injury-Topical Chemical Burn'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914215'|'Medical-Beta Blocker Poisoning/Overdose'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914217'|'Medical-Calcium Channel Blocker Poisoning/Overdose'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914219'|'Medical-Opioid Poisoning/Overdose'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914221'|'Medical-Respiratory Distress-Bronchiolitis'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914223'|'Medical-Respiratory Distress-Croup'|\n" +
        "'DEMDataSet'|'dConfiguration.05'|'Protocols Permitted by the State'|'9914225'|'Medical-Stimulant Poisoning/Overdose'|\n" +
        "'DEMDataSet'|'dConfiguration.06'|'EMS Certification Levels Permitted to Perform Each Procedure'|'9917001'|'2009 Advanced Emergency Medical Technician (AEMT)'|\n" +
        "'DEMDataSet'|'dConfiguration.06'|'EMS Certification Levels Permitted to Perform Each Procedure'|'9917003'|'2009 Emergency Medical Responder (EMR)'|\n" +
        "'DEMDataSet'|'dConfiguration.06'|'EMS Certification Levels Permitted to Perform Each Procedure'|'9917005'|'2009 Emergency Medical Technician (EMT)'|\n" +
        "'DEMDataSet'|'dConfiguration.06'|'EMS Certification Levels Permitted to Perform Each Procedure'|'9917007'|'2009 Paramedic'|\n" +
        "'DEMDataSet'|'dConfiguration.06'|'EMS Certification Levels Permitted to Perform Each Procedure'|'9917009'|'First Responder'|\n" +
        "'DEMDataSet'|'dConfiguration.06'|'EMS Certification Levels Permitted to Perform Each Procedure'|'9917011'|'EMT-Basic'|\n" +
        "'DEMDataSet'|'dConfiguration.06'|'EMS Certification Levels Permitted to Perform Each Procedure'|'9917013'|'EMT-Intermediate'|\n" +
        "'DEMDataSet'|'dConfiguration.06'|'EMS Certification Levels Permitted to Perform Each Procedure'|'9917015'|'EMT-Paramedic'|\n" +
        "'DEMDataSet'|'dConfiguration.06'|'EMS Certification Levels Permitted to Perform Each Procedure'|'9917019'|'Physician'|\n" +
        "'DEMDataSet'|'dConfiguration.06'|'EMS Certification Levels Permitted to Perform Each Procedure'|'9917021'|'Critical Care Paramedic'|\n" +
        "'DEMDataSet'|'dConfiguration.06'|'EMS Certification Levels Permitted to Perform Each Procedure'|'9917023'|'Community Paramedicine'|\n" +
        "'DEMDataSet'|'dConfiguration.06'|'EMS Certification Levels Permitted to Perform Each Procedure'|'9917025'|'Nurse Practitioner'|\n" +
        "'DEMDataSet'|'dConfiguration.06'|'EMS Certification Levels Permitted to Perform Each Procedure'|'9917027'|'Physician Assistant'|\n" +
        "'DEMDataSet'|'dConfiguration.06'|'EMS Certification Levels Permitted to Perform Each Procedure'|'9917029'|'Licensed Practical Nurse (LPN)'|\n" +
        "'DEMDataSet'|'dConfiguration.06'|'EMS Certification Levels Permitted to Perform Each Procedure'|'9917031'|'Registered Nurse'|\n" +
        "'DEMDataSet'|'dConfiguration.08'|'EMS Certification Levels Permitted to Administer Each Medication'|'9917001'|'2009 Advanced Emergency Medical Technician (AEMT)'|\n" +
        "'DEMDataSet'|'dConfiguration.08'|'EMS Certification Levels Permitted to Administer Each Medication'|'9917003'|'2009 Emergency Medical Responder (EMR)'|\n" +
        "'DEMDataSet'|'dConfiguration.08'|'EMS Certification Levels Permitted to Administer Each Medication'|'9917005'|'2009 Emergency Medical Technician (EMT)'|\n" +
        "'DEMDataSet'|'dConfiguration.08'|'EMS Certification Levels Permitted to Administer Each Medication'|'9917007'|'2009 Paramedic'|\n" +
        "'DEMDataSet'|'dConfiguration.08'|'EMS Certification Levels Permitted to Administer Each Medication'|'9917009'|'First Responder'|\n" +
        "'DEMDataSet'|'dConfiguration.08'|'EMS Certification Levels Permitted to Administer Each Medication'|'9917011'|'EMT-Basic'|\n" +
        "'DEMDataSet'|'dConfiguration.08'|'EMS Certification Levels Permitted to Administer Each Medication'|'9917013'|'EMT-Intermediate'|\n" +
        "'DEMDataSet'|'dConfiguration.08'|'EMS Certification Levels Permitted to Administer Each Medication'|'9917015'|'EMT-Paramedic'|\n" +
        "'DEMDataSet'|'dConfiguration.08'|'EMS Certification Levels Permitted to Administer Each Medication'|'9917019'|'Physician'|\n" +
        "'DEMDataSet'|'dConfiguration.08'|'EMS Certification Levels Permitted to Administer Each Medication'|'9917021'|'Critical Care Paramedic'|\n" +
        "'DEMDataSet'|'dConfiguration.08'|'EMS Certification Levels Permitted to Administer Each Medication'|'9917023'|'Community Paramedicine'|\n" +
        "'DEMDataSet'|'dConfiguration.08'|'EMS Certification Levels Permitted to Administer Each Medication'|'9917025'|'Nurse Practitioner'|\n" +
        "'DEMDataSet'|'dConfiguration.08'|'EMS Certification Levels Permitted to Administer Each Medication'|'9917027'|'Physician Assistant'|\n" +
        "'DEMDataSet'|'dConfiguration.08'|'EMS Certification Levels Permitted to Administer Each Medication'|'9917029'|'Licensed Practical Nurse (LPN)'|\n" +
        "'DEMDataSet'|'dConfiguration.08'|'EMS Certification Levels Permitted to Administer Each Medication'|'9917031'|'Registered Nurse'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914001'|'Airway'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914003'|'Airway-Failed'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914005'|'Airway-Obstruction/Foreign Body'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914007'|'Airway-Rapid Sequence Induction (RSI-Paralytic)'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914009'|'Airway-Sedation Assisted (Non-Paralytic)'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914011'|'Cardiac Arrest-Asystole'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914013'|'Cardiac Arrest-Hypothermia-Therapeutic'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914015'|'Cardiac Arrest-Pulseless Electrical Activity'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914017'|'Cardiac Arrest-Ventricular Fibrillation/ Pulseless Ventricular Tachycardia'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914019'|'Cardiac Arrest-Post Resuscitation Care'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914021'|'Environmental-Altitude Sickness'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914023'|'Environmental-Cold Exposure'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914025'|'Environmental-Frostbite/Cold Injury'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914027'|'Environmental-Heat Exposure/Exhaustion'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914029'|'Environmental-Heat Stroke/Hyperthermia'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914031'|'Environmental-Hypothermia'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914033'|'Exposure-Airway/Inhalation Irritants'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914035'|'Exposure-Biological/Infectious'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914037'|'Exposure-Blistering Agents'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914041'|'Exposure-Chemicals to Eye'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914043'|'Exposure-Cyanide'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914045'|'Exposure-Explosive/ Blast Injury'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914047'|'Exposure-Nerve Agents'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914049'|'Exposure-Radiologic Agents'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914051'|'General-Back Pain'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914053'|'General-Behavioral/Patient Restraint'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914055'|'General-Cardiac Arrest'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914057'|'General-Dental Problems'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914059'|'General-Epistaxis'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914061'|'General-Fever'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914063'|'General-Individualized Patient Protocol'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914065'|'General-Indwelling Medical Devices/Equipment'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914067'|'General-IV Access'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914069'|'General-Medical Device Malfunction'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914071'|'General-Pain Control'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914073'|'General-Spinal Immobilization/Clearance'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914075'|'General-Universal Patient Care/ Initial Patient Contact'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914077'|'Injury-Amputation'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914079'|'Injury-Bites and Envenomations-Land'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914081'|'Injury-Bites and Envenomations-Marine'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914083'|'Injury-Bleeding/ Hemorrhage Control'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914085'|'Injury-Burns-Thermal'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914087'|'Injury-Cardiac Arrest'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914089'|'Injury-Crush Syndrome'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914091'|'Injury-Diving Emergencies'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914093'|'Injury-Drowning/Near Drowning'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914095'|'Injury-Electrical Injuries'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914097'|'Injury-Extremity'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914099'|'Injury-Eye'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914101'|'Injury-Head'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914103'|'Injury-Impaled Object'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914105'|'Injury-Multisystem'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914107'|'Injury-Spinal Cord'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914109'|'Medical-Abdominal Pain'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914111'|'Medical-Allergic Reaction/Anaphylaxis'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914113'|'Medical-Altered Mental Status'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914115'|'Medical-Bradycardia'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914117'|'Medical-Cardiac Chest Pain'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914119'|'Medical-Diarrhea'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914121'|'Medical-Hyperglycemia'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914123'|'Medical-Hypertension'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914125'|'Medical-Hypoglycemia/Diabetic Emergency'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914127'|'Medical-Hypotension/Shock (Non-Trauma)'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914129'|'Medical-Influenza-Like Illness/ Upper Respiratory Infection'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914131'|'Medical-Nausea/Vomiting'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914133'|'Medical-Newborn/ Neonatal Resuscitation'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914135'|'General-Overdose/Poisoning/Toxic Ingestion'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914137'|'Medical-Pulmonary Edema/CHF'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914139'|'Medical-Respiratory Distress/Asthma/COPD/Reactive Airway'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914141'|'Medical-Seizure'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914143'|'Medical-ST-Elevation Myocardial Infarction (STEMI)'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914145'|'Medical-Stroke/TIA'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914147'|'Medical-Supraventricular Tachycardia (Including Atrial Fibrillation)'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914149'|'Medical-Syncope'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914151'|'Medical-Ventricular Tachycardia (With Pulse)'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914153'|'Not Done'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914155'|'OB/GYN-Childbirth/Labor/Delivery'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914157'|'OB/GYN-Eclampsia'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914159'|'OB/GYN-Gynecologic Emergencies'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914161'|'OB/GYN-Pregnancy Related Emergencies'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914163'|'OB/GYN-Post-partum Hemorrhage'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914165'|'Other'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914167'|'Exposure-Carbon Monoxide'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914169'|'Cardiac Arrest-Do Not Resuscitate'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914171'|'Cardiac Arrest-Special Resuscitation Orders'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914173'|'Exposure-Smoke Inhalation'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914175'|'General-Community Paramedicine / Mobile Integrated Healthcare'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914177'|'General-Exception Protocol'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914179'|'General-Extended Care Guidelines'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914181'|'General-Interfacility Transfers'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914183'|'General-Law Enforcement - Blood for Legal Purposes'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914185'|'General-Law Enforcement - Assist with Law Enforcement Activity'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914187'|'General-Neglect or Abuse Suspected'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914189'|'General-Refusal of Care'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914191'|'Injury-Mass/Multiple Casualties'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914193'|'Injury-Thoracic'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914195'|'Medical-Adrenal Insufficiency'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914197'|'Medical-Apparent Life Threatening Event (ALTE)'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914199'|'Medical-Tachycardia'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914201'|'Cardiac Arrest-Determination of Death / Withholding Resuscitative Efforts'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914203'|'Injury-Conducted Electrical Weapon (e.g., Taser)'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914205'|'Injury-Facial Trauma'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914207'|'Injury-General Trauma Management'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914209'|'Injury-Lightning/Lightning Strike'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914211'|'Injury-SCUBA Injury/Accidents'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914213'|'Injury-Topical Chemical Burn'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914215'|'Medical-Beta Blocker Poisoning/Overdose'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914217'|'Medical-Calcium Channel Blocker Poisoning/Overdose'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914219'|'Medical-Opioid Poisoning/Overdose'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914221'|'Medical-Respiratory Distress-Bronchiolitis'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914223'|'Medical-Respiratory Distress-Croup'|\n" +
        "'DEMDataSet'|'dConfiguration.10'|'EMS Agency Protocols'|'9914225'|'Medical-Stimulant Poisoning/Overdose'|\n" +
        "'DEMDataSet'|'dConfiguration.11'|'EMS Agency Specialty Service Capability'|'1211001'|'Air Rescue'|\n" +
        "'DEMDataSet'|'dConfiguration.11'|'EMS Agency Specialty Service Capability'|'1211003'|'CBRNE'|\n" +
        "'DEMDataSet'|'dConfiguration.11'|'EMS Agency Specialty Service Capability'|'1211005'|'Community Health Medicine'|\n" +
        "'DEMDataSet'|'dConfiguration.11'|'EMS Agency Specialty Service Capability'|'1211007'|'Disaster Medical Assistance Team (DMAT)'|\n" +
        "'DEMDataSet'|'dConfiguration.11'|'EMS Agency Specialty Service Capability'|'1211009'|'Disaster Mortuary (DMORT)'|\n" +
        "'DEMDataSet'|'dConfiguration.11'|'EMS Agency Specialty Service Capability'|'1211011'|'Dive Rescue'|\n" +
        "'DEMDataSet'|'dConfiguration.11'|'EMS Agency Specialty Service Capability'|'1211013'|'Farm Rescue'|\n" +
        "'DEMDataSet'|'dConfiguration.11'|'EMS Agency Specialty Service Capability'|'1211015'|'High Angle Rescue'|\n" +
        "'DEMDataSet'|'dConfiguration.11'|'EMS Agency Specialty Service Capability'|'1211017'|'Machinery Disentanglement'|\n" +
        "'DEMDataSet'|'dConfiguration.11'|'EMS Agency Specialty Service Capability'|'1211019'|'None'|\n" +
        "'DEMDataSet'|'dConfiguration.11'|'EMS Agency Specialty Service Capability'|'1211021'|'Ski / Snow Rescue'|\n" +
        "'DEMDataSet'|'dConfiguration.11'|'EMS Agency Specialty Service Capability'|'1211023'|'Tactical EMS'|\n" +
        "'DEMDataSet'|'dConfiguration.11'|'EMS Agency Specialty Service Capability'|'1211025'|'Trench / Confined Space Rescue'|\n" +
        "'DEMDataSet'|'dConfiguration.11'|'EMS Agency Specialty Service Capability'|'1211027'|'Urban Search and Rescue (USAR)'|\n" +
        "'DEMDataSet'|'dConfiguration.11'|'EMS Agency Specialty Service Capability'|'1211029'|'Vehicle Extrication'|\n" +
        "'DEMDataSet'|'dConfiguration.11'|'EMS Agency Specialty Service Capability'|'1211031'|'Veterinary Medical Assistance Team (VMAT)'|\n" +
        "'DEMDataSet'|'dConfiguration.11'|'EMS Agency Specialty Service Capability'|'1211033'|'Water or Ice Related Rescue (Incl Swift Water)'|\n" +
        "'DEMDataSet'|'dConfiguration.11'|'EMS Agency Specialty Service Capability'|'1211035'|'Wilderness Search and Rescue'|\n" +
        "'DEMDataSet'|'dConfiguration.12'|'Billing Status'|'9923001'|'No'|\n" +
        "'DEMDataSet'|'dConfiguration.12'|'Billing Status'|'9923003'|'Yes'|\n" +
        "'DEMDataSet'|'dConfiguration.13'|'Emergency Medical Dispatch (EMD) Provided to EMS Agency Service Area'|'1213001'|'No'|\n" +
        "'DEMDataSet'|'dConfiguration.13'|'Emergency Medical Dispatch (EMD) Provided to EMS Agency Service Area'|'1213003'|'Yes, 100% of the EMS Agency's Service Area'|\n" +
        "'DEMDataSet'|'dConfiguration.13'|'Emergency Medical Dispatch (EMD) Provided to EMS Agency Service Area'|'1213005'|'Yes, Less than 100% of the EMS Agency's Service Area'|\n" +
        "'DEMDataSet'|'dConfiguration.15'|'Patient Monitoring Capability(ies)'|'1215001'|'Capnography-Numeric'|\n" +
        "'DEMDataSet'|'dConfiguration.15'|'Patient Monitoring Capability(ies)'|'1215003'|'Capnography-Waveform'|\n" +
        "'DEMDataSet'|'dConfiguration.15'|'Patient Monitoring Capability(ies)'|'1215005'|'ECG-12 Lead or Greater'|\n" +
        "'DEMDataSet'|'dConfiguration.15'|'Patient Monitoring Capability(ies)'|'1215007'|'ECG-Less than 12 Lead (Cardiac Monitor)'|\n" +
        "'DEMDataSet'|'dConfiguration.15'|'Patient Monitoring Capability(ies)'|'1215009'|'Oximetry-Carbon Monoxide'|\n" +
        "'DEMDataSet'|'dConfiguration.15'|'Patient Monitoring Capability(ies)'|'1215011'|'Oximetry-Oxygen'|\n" +
        "'DEMDataSet'|'dConfiguration.15'|'Patient Monitoring Capability(ies)'|'1215013'|'Pressure Measurement-Invasive (Arterial, CVP, Swan, etc.)'|\n" +
        "'DEMDataSet'|'dConfiguration.15'|'Patient Monitoring Capability(ies)'|'1215015'|'Pressure Measurement-Non-Invasive (Blood Pressure, etc.)'|\n" +
        "'DEMDataSet'|'dConfiguration.15'|'Patient Monitoring Capability(ies)'|'1215017'|'Ventilator-Transport'|\n" +
        "'DEMDataSet'|'dConfiguration.15'|'Patient Monitoring Capability(ies)'|'1215019'|'Vital Sign Monitoring'|\n" +
        "'DEMDataSet'|'dLocation.01'|'EMS Location Type'|'1301001'|'EMS Agency Headquarters'|\n" +
        "'DEMDataSet'|'dLocation.01'|'EMS Location Type'|'1301003'|'EMS Staging Area'|\n" +
        "'DEMDataSet'|'dLocation.01'|'EMS Location Type'|'1301005'|'EMS Station'|\n" +
        "'DEMDataSet'|'dLocation.01'|'EMS Location Type'|'1301007'|'Other'|\n" +
        "'DEMDataSet'|'dLocation.11'|'EMS Location Country'|'CA'|'Canada'|\n" +
        "'DEMDataSet'|'dLocation.11'|'EMS Location Country'|'MX'|'Mexico'|\n" +
        "'DEMDataSet'|'dLocation.11'|'EMS Location Country'|'US'|'United States'|\n" +
        "'DEMDataSet'|'dVehicle.04'|'Vehicle Type'|'1404001'|'Ambulance'|\n" +
        "'DEMDataSet'|'dVehicle.04'|'Vehicle Type'|'1404003'|'ATV'|\n" +
        "'DEMDataSet'|'dVehicle.04'|'Vehicle Type'|'1404005'|'Bicycle'|\n" +
        "'DEMDataSet'|'dVehicle.04'|'Vehicle Type'|'1404007'|'Fire Apparatus'|\n" +
        "'DEMDataSet'|'dVehicle.04'|'Vehicle Type'|'1404009'|'Fixed Wing'|\n" +
        "'DEMDataSet'|'dVehicle.04'|'Vehicle Type'|'1404011'|'Motorcycle'|\n" +
        "'DEMDataSet'|'dVehicle.04'|'Vehicle Type'|'1404013'|'Other'|\n" +
        "'DEMDataSet'|'dVehicle.04'|'Vehicle Type'|'1404015'|'Personal Vehicle'|\n" +
        "'DEMDataSet'|'dVehicle.04'|'Vehicle Type'|'1404017'|'Quick Response Vehicle (Non-Transport Vehicle other than Fire Apparatus)'|\n" +
        "'DEMDataSet'|'dVehicle.04'|'Vehicle Type'|'1404019'|'Rescue'|\n" +
        "'DEMDataSet'|'dVehicle.04'|'Vehicle Type'|'1404021'|'Rotor Craft'|\n" +
        "'DEMDataSet'|'dVehicle.04'|'Vehicle Type'|'1404023'|'Snow Vehicle'|\n" +
        "'DEMDataSet'|'dVehicle.04'|'Vehicle Type'|'1404025'|'Watercraft'|\n" +
        "'DEMDataSet'|'dVehicle.05'|'Crew State Certification/Licensure Levels'|'9917001'|'2009 Advanced Emergency Medical Technician (AEMT)'|\n" +
        "'DEMDataSet'|'dVehicle.05'|'Crew State Certification/Licensure Levels'|'9917003'|'2009 Emergency Medical Responder (EMR)'|\n" +
        "'DEMDataSet'|'dVehicle.05'|'Crew State Certification/Licensure Levels'|'9917005'|'2009 Emergency Medical Technician (EMT)'|\n" +
        "'DEMDataSet'|'dVehicle.05'|'Crew State Certification/Licensure Levels'|'9917007'|'2009 Paramedic'|\n" +
        "'DEMDataSet'|'dVehicle.05'|'Crew State Certification/Licensure Levels'|'9917009'|'First Responder'|\n" +
        "'DEMDataSet'|'dVehicle.05'|'Crew State Certification/Licensure Levels'|'9917011'|'EMT-Basic'|\n" +
        "'DEMDataSet'|'dVehicle.05'|'Crew State Certification/Licensure Levels'|'9917013'|'EMT-Intermediate'|\n" +
        "'DEMDataSet'|'dVehicle.05'|'Crew State Certification/Licensure Levels'|'9917015'|'EMT-Paramedic'|\n" +
        "'DEMDataSet'|'dVehicle.05'|'Crew State Certification/Licensure Levels'|'9917019'|'Physician'|\n" +
        "'DEMDataSet'|'dVehicle.05'|'Crew State Certification/Licensure Levels'|'9917021'|'Critical Care Paramedic'|\n" +
        "'DEMDataSet'|'dVehicle.05'|'Crew State Certification/Licensure Levels'|'9917023'|'Community Paramedicine'|\n" +
        "'DEMDataSet'|'dVehicle.05'|'Crew State Certification/Licensure Levels'|'9917025'|'Nurse Practitioner'|\n" +
        "'DEMDataSet'|'dVehicle.05'|'Crew State Certification/Licensure Levels'|'9917027'|'Physician Assistant'|\n" +
        "'DEMDataSet'|'dVehicle.05'|'Crew State Certification/Licensure Levels'|'9917029'|'Licensed Practical Nurse (LPN)'|\n" +
        "'DEMDataSet'|'dVehicle.05'|'Crew State Certification/Licensure Levels'|'9917031'|'Registered Nurse'|\n" +
        "'DEMDataSet'|'dPersonnel.08'|'EMS Personnel's Country'|'CA'|'Canada'|\n" +
        "'DEMDataSet'|'dPersonnel.08'|'EMS Personnel's Country'|'MX'|'Mexico'|\n" +
        "'DEMDataSet'|'dPersonnel.08'|'EMS Personnel's Country'|'US'|'United States'|\n" +
        "'DEMDataSet'|'dPersonnel.12'|'EMS Personnel's Gender'|'9906001'|'Female'|\n" +
        "'DEMDataSet'|'dPersonnel.12'|'EMS Personnel's Gender'|'9906003'|'Male'|\n" +
        "'DEMDataSet'|'dPersonnel.12'|'EMS Personnel's Gender'|'9906005'|'Unknown (Unable to Determine)'|\n" +
        "'DEMDataSet'|'dPersonnel.13'|'EMS Personnel's Race'|'1513001'|'American Indian or Alaska Native'|\n" +
        "'DEMDataSet'|'dPersonnel.13'|'EMS Personnel's Race'|'1513003'|'Asian'|\n" +
        "'DEMDataSet'|'dPersonnel.13'|'EMS Personnel's Race'|'1513005'|'Black or African American'|\n" +
        "'DEMDataSet'|'dPersonnel.13'|'EMS Personnel's Race'|'1513007'|'Hispanic or Latino'|\n" +
        "'DEMDataSet'|'dPersonnel.13'|'EMS Personnel's Race'|'1513009'|'Native Hawaiian or Other Pacific Islander'|\n" +
        "'DEMDataSet'|'dPersonnel.13'|'EMS Personnel's Race'|'1513011'|'White'|\n" +
        "'DEMDataSet'|'dPersonnel.15'|'EMS Personnel's Highest Educational Degree'|'1515001'|'No Schooling Completed'|\n" +
        "'DEMDataSet'|'dPersonnel.15'|'EMS Personnel's Highest Educational Degree'|'1515003'|'Nursery School to 4th Grade'|\n" +
        "'DEMDataSet'|'dPersonnel.15'|'EMS Personnel's Highest Educational Degree'|'1515005'|'5th Grade or 6th Grade'|\n" +
        "'DEMDataSet'|'dPersonnel.15'|'EMS Personnel's Highest Educational Degree'|'1515007'|'7th Grade or 8th Grade'|\n" +
        "'DEMDataSet'|'dPersonnel.15'|'EMS Personnel's Highest Educational Degree'|'1515009'|'9th Grade'|\n" +
        "'DEMDataSet'|'dPersonnel.15'|'EMS Personnel's Highest Educational Degree'|'1515011'|'10th Grade'|\n" +
        "'DEMDataSet'|'dPersonnel.15'|'EMS Personnel's Highest Educational Degree'|'1515013'|'11th Grade'|\n" +
        "'DEMDataSet'|'dPersonnel.15'|'EMS Personnel's Highest Educational Degree'|'1515015'|'12th Grade, No Diploma'|\n" +
        "'DEMDataSet'|'dPersonnel.15'|'EMS Personnel's Highest Educational Degree'|'1515017'|'High School Graduate-Diploma or the Equivalent (GED)'|\n" +
        "'DEMDataSet'|'dPersonnel.15'|'EMS Personnel's Highest Educational Degree'|'1515019'|'Some College Credit, but Less than 1 Year'|\n" +
        "'DEMDataSet'|'dPersonnel.15'|'EMS Personnel's Highest Educational Degree'|'1515021'|'1 or More Years of College, No Degree'|\n" +
        "'DEMDataSet'|'dPersonnel.15'|'EMS Personnel's Highest Educational Degree'|'1515023'|'Associate Degree'|\n" +
        "'DEMDataSet'|'dPersonnel.15'|'EMS Personnel's Highest Educational Degree'|'1515025'|'Bachelor's Degree'|\n" +
        "'DEMDataSet'|'dPersonnel.15'|'EMS Personnel's Highest Educational Degree'|'1515027'|'Master's Degree'|\n" +
        "'DEMDataSet'|'dPersonnel.15'|'EMS Personnel's Highest Educational Degree'|'1515029'|'Professional Degree (i.e. MD, DDS, DVM, LLB, JD)'|\n" +
        "'DEMDataSet'|'dPersonnel.15'|'EMS Personnel's Highest Educational Degree'|'1515031'|'Doctorate Degree (i.e. PhD, EdD)'|\n" +
        "'DEMDataSet'|'dPersonnel.16'|'EMS Personnel's Degree Subject/Field of Study'|'1516001'|'Agriculture and Natural Resources'|\n" +
        "'DEMDataSet'|'dPersonnel.16'|'EMS Personnel's Degree Subject/Field of Study'|'1516003'|'Architecture and Related Services'|\n" +
        "'DEMDataSet'|'dPersonnel.16'|'EMS Personnel's Degree Subject/Field of Study'|'1516005'|'Area, Ethnic, Cultural, and Gender Studies'|\n" +
        "'DEMDataSet'|'dPersonnel.16'|'EMS Personnel's Degree Subject/Field of Study'|'1516007'|'Biological and Biomedical Sciences'|\n" +
        "'DEMDataSet'|'dPersonnel.16'|'EMS Personnel's Degree Subject/Field of Study'|'1516009'|'Business'|\n" +
        "'DEMDataSet'|'dPersonnel.16'|'EMS Personnel's Degree Subject/Field of Study'|'1516011'|'Communication, Journalism, and Related Programs'|\n" +
        "'DEMDataSet'|'dPersonnel.16'|'EMS Personnel's Degree Subject/Field of Study'|'1516013'|'Communications Technologies'|\n" +
        "'DEMDataSet'|'dPersonnel.16'|'EMS Personnel's Degree Subject/Field of Study'|'1516015'|'Computer and Information Sciences'|\n" +
        "'DEMDataSet'|'dPersonnel.16'|'EMS Personnel's Degree Subject/Field of Study'|'1516017'|'Education'|\n" +
        "'DEMDataSet'|'dPersonnel.16'|'EMS Personnel's Degree Subject/Field of Study'|'1516019'|'Emergency Medical Services'|\n" +
        "'DEMDataSet'|'dPersonnel.16'|'EMS Personnel's Degree Subject/Field of Study'|'1516021'|'Engineering'|\n" +
        "'DEMDataSet'|'dPersonnel.16'|'EMS Personnel's Degree Subject/Field of Study'|'1516023'|'Engineering Technologies'|\n" +
        "'DEMDataSet'|'dPersonnel.16'|'EMS Personnel's Degree Subject/Field of Study'|'1516025'|'English Language and Literature/Letters'|\n" +
        "'DEMDataSet'|'dPersonnel.16'|'EMS Personnel's Degree Subject/Field of Study'|'1516027'|'Family and Consumer Sciences/Human Sciences'|\n" +
        "'DEMDataSet'|'dPersonnel.16'|'EMS Personnel's Degree Subject/Field of Study'|'1516029'|'Fire Science'|\n" +
        "'DEMDataSet'|'dPersonnel.16'|'EMS Personnel's Degree Subject/Field of Study'|'1516031'|'Foreign Languages, Literatures, and Linguistics'|\n" +
        "'DEMDataSet'|'dPersonnel.16'|'EMS Personnel's Degree Subject/Field of Study'|'1516033'|'Health Professions and Related Clinical Sciences, Not Including Emergency Medical Services'|\n" +
        "'DEMDataSet'|'dPersonnel.16'|'EMS Personnel's Degree Subject/Field of Study'|'1516035'|'Legal Professions and Studies'|\n" +
        "'DEMDataSet'|'dPersonnel.16'|'EMS Personnel's Degree Subject/Field of Study'|'1516037'|'Liberal Arts and Sciences, General Studies, and Humanities'|\n" +
        "'DEMDataSet'|'dPersonnel.16'|'EMS Personnel's Degree Subject/Field of Study'|'1516039'|'Library Science'|\n" +
        "'DEMDataSet'|'dPersonnel.16'|'EMS Personnel's Degree Subject/Field of Study'|'1516041'|'Mathematics and Statistics'|\n" +
        "'DEMDataSet'|'dPersonnel.16'|'EMS Personnel's Degree Subject/Field of Study'|'1516043'|'Military Technologies'|\n" +
        "'DEMDataSet'|'dPersonnel.16'|'EMS Personnel's Degree Subject/Field of Study'|'1516045'|'Multi/Interdisciplinary Studies'|\n" +
        "'DEMDataSet'|'dPersonnel.16'|'EMS Personnel's Degree Subject/Field of Study'|'1516047'|'Not Classified by Field of Study'|\n" +
        "'DEMDataSet'|'dPersonnel.16'|'EMS Personnel's Degree Subject/Field of Study'|'1516049'|'None'|\n" +
        "'DEMDataSet'|'dPersonnel.16'|'EMS Personnel's Degree Subject/Field of Study'|'1516051'|'Parks, Recreation, Leisure and Fitness Studies'|\n" +
        "'DEMDataSet'|'dPersonnel.16'|'EMS Personnel's Degree Subject/Field of Study'|'1516053'|'Philosophy and Religious Studies'|\n" +
        "'DEMDataSet'|'dPersonnel.16'|'EMS Personnel's Degree Subject/Field of Study'|'1516055'|'Physical Sciences and Science Technologies'|\n" +
        "'DEMDataSet'|'dPersonnel.16'|'EMS Personnel's Degree Subject/Field of Study'|'1516057'|'Precision Production'|\n" +
        "'DEMDataSet'|'dPersonnel.16'|'EMS Personnel's Degree Subject/Field of Study'|'1516059'|'Psychology'|\n" +
        "'DEMDataSet'|'dPersonnel.16'|'EMS Personnel's Degree Subject/Field of Study'|'1516061'|'Public Administration and Social Services'|\n" +
        "'DEMDataSet'|'dPersonnel.16'|'EMS Personnel's Degree Subject/Field of Study'|'1516063'|'Security and Protective Services, Not Including Fire Science'|\n" +
        "'DEMDataSet'|'dPersonnel.16'|'EMS Personnel's Degree Subject/Field of Study'|'1516065'|'Social Sciences and History'|\n" +
        "'DEMDataSet'|'dPersonnel.16'|'EMS Personnel's Degree Subject/Field of Study'|'1516067'|'Theology and Religious Vocations'|\n" +
        "'DEMDataSet'|'dPersonnel.16'|'EMS Personnel's Degree Subject/Field of Study'|'1516069'|'Transportation and Materials Moving'|\n" +
        "'DEMDataSet'|'dPersonnel.16'|'EMS Personnel's Degree Subject/Field of Study'|'1516071'|'Visual and Performing Arts'|\n" +
        "'DEMDataSet'|'dPersonnel.17'|'EMS Personnel's Motor Vehicle License Type'|'1517001'|'All-Terrain Vehicle (ATV)'|\n" +
        "'DEMDataSet'|'dPersonnel.17'|'EMS Personnel's Motor Vehicle License Type'|'1517003'|'Commercial Class A'|\n" +
        "'DEMDataSet'|'dPersonnel.17'|'EMS Personnel's Motor Vehicle License Type'|'1517005'|'Commercial Class B'|\n" +
        "'DEMDataSet'|'dPersonnel.17'|'EMS Personnel's Motor Vehicle License Type'|'1517007'|'Commercial Class C'|\n" +
        "'DEMDataSet'|'dPersonnel.17'|'EMS Personnel's Motor Vehicle License Type'|'1517009'|'Motorcycle-Class M'|\n" +
        "'DEMDataSet'|'dPersonnel.17'|'EMS Personnel's Motor Vehicle License Type'|'1517011'|'None'|\n" +
        "'DEMDataSet'|'dPersonnel.17'|'EMS Personnel's Motor Vehicle License Type'|'1517013'|'Operator Class D (Normal)'|\n" +
        "'DEMDataSet'|'dPersonnel.17'|'EMS Personnel's Motor Vehicle License Type'|'1517015'|'Other'|\n" +
        "'DEMDataSet'|'dPersonnel.17'|'EMS Personnel's Motor Vehicle License Type'|'1517017'|'Pilot-Rotor Wing Air'|\n" +
        "'DEMDataSet'|'dPersonnel.17'|'EMS Personnel's Motor Vehicle License Type'|'1517019'|'Pilot-Fixed Wing Air'|\n" +
        "'DEMDataSet'|'dPersonnel.17'|'EMS Personnel's Motor Vehicle License Type'|'1517021'|'Snowmobile'|\n" +
        "'DEMDataSet'|'dPersonnel.17'|'EMS Personnel's Motor Vehicle License Type'|'1517023'|'Taxi and Livery Class E'|\n" +
        "'DEMDataSet'|'dPersonnel.18'|'EMS Personnel's Immunization Status'|'9910001'|'Anthrax'|\n" +
        "'DEMDataSet'|'dPersonnel.18'|'EMS Personnel's Immunization Status'|'9910003'|'Cholera'|\n" +
        "'DEMDataSet'|'dPersonnel.18'|'EMS Personnel's Immunization Status'|'9910005'|'DPT / TDaP (Diphtheria, Pertussis, Tetanus)'|\n" +
        "'DEMDataSet'|'dPersonnel.18'|'EMS Personnel's Immunization Status'|'9910007'|'Hemophilus Influenza B'|\n" +
        "'DEMDataSet'|'dPersonnel.18'|'EMS Personnel's Immunization Status'|'9910009'|'Hepatitis A'|\n" +
        "'DEMDataSet'|'dPersonnel.18'|'EMS Personnel's Immunization Status'|'9910011'|'Hepatitis B'|\n" +
        "'DEMDataSet'|'dPersonnel.18'|'EMS Personnel's Immunization Status'|'9910013'|'Human Papilloma Virus (HPV)'|\n" +
        "'DEMDataSet'|'dPersonnel.18'|'EMS Personnel's Immunization Status'|'9910015'|'Influenza-H1N1'|\n" +
        "'DEMDataSet'|'dPersonnel.18'|'EMS Personnel's Immunization Status'|'9910017'|'Influenza-Other'|\n" +
        "'DEMDataSet'|'dPersonnel.18'|'EMS Personnel's Immunization Status'|'9910019'|'Influenza-Seasonal (In past 12 months)'|\n" +
        "'DEMDataSet'|'dPersonnel.18'|'EMS Personnel's Immunization Status'|'9910021'|'Lyme Disease'|\n" +
        "'DEMDataSet'|'dPersonnel.18'|'EMS Personnel's Immunization Status'|'9910023'|'Meningococcus'|\n" +
        "'DEMDataSet'|'dPersonnel.18'|'EMS Personnel's Immunization Status'|'9910025'|'MMR (Measles, Mumps, Rubella)'|\n" +
        "'DEMDataSet'|'dPersonnel.18'|'EMS Personnel's Immunization Status'|'9910027'|'Other-Not Listed'|\n" +
        "'DEMDataSet'|'dPersonnel.18'|'EMS Personnel's Immunization Status'|'9910029'|'Plague'|\n" +
        "'DEMDataSet'|'dPersonnel.18'|'EMS Personnel's Immunization Status'|'9910031'|'Pneumococcal (Pneumonia)'|\n" +
        "'DEMDataSet'|'dPersonnel.18'|'EMS Personnel's Immunization Status'|'9910033'|'Polio'|\n" +
        "'DEMDataSet'|'dPersonnel.18'|'EMS Personnel's Immunization Status'|'9910035'|'Rabies'|\n" +
        "'DEMDataSet'|'dPersonnel.18'|'EMS Personnel's Immunization Status'|'9910037'|'Rotavirus'|\n" +
        "'DEMDataSet'|'dPersonnel.18'|'EMS Personnel's Immunization Status'|'9910039'|'Shingles'|\n" +
        "'DEMDataSet'|'dPersonnel.18'|'EMS Personnel's Immunization Status'|'9910041'|'Small Pox'|\n" +
        "'DEMDataSet'|'dPersonnel.18'|'EMS Personnel's Immunization Status'|'9910043'|'Tetanus'|\n" +
        "'DEMDataSet'|'dPersonnel.18'|'EMS Personnel's Immunization Status'|'9910045'|'Tuberculosis'|\n" +
        "'DEMDataSet'|'dPersonnel.18'|'EMS Personnel's Immunization Status'|'9910047'|'Typhoid'|\n" +
        "'DEMDataSet'|'dPersonnel.18'|'EMS Personnel's Immunization Status'|'9910049'|'Varicella (Chickenpox)'|\n" +
        "'DEMDataSet'|'dPersonnel.18'|'EMS Personnel's Immunization Status'|'9910051'|'Yellow Fever'|\n" +
        "'DEMDataSet'|'dPersonnel.20'|'EMS Personnel's Foreign Language Ability'|'amh'|'Amharic'|\n" +
        "'DEMDataSet'|'dPersonnel.20'|'EMS Personnel's Foreign Language Ability'|'ara'|'Arabic'|\n" +
        "'DEMDataSet'|'dPersonnel.20'|'EMS Personnel's Foreign Language Ability'|'arm'|'Armenian'|\n" +
        "'DEMDataSet'|'dPersonnel.20'|'EMS Personnel's Foreign Language Ability'|'ben'|'Bengali'|\n" +
        "'DEMDataSet'|'dPersonnel.20'|'EMS Personnel's Foreign Language Ability'|'crp'|'Cajun (Creole and Pidgins)'|\n" +
        "'DEMDataSet'|'dPersonnel.20'|'EMS Personnel's Foreign Language Ability'|'chi'|'Chinese'|\n" +
        "'DEMDataSet'|'dPersonnel.20'|'EMS Personnel's Foreign Language Ability'|'hrv'|'Croatian'|\n" +
        "'DEMDataSet'|'dPersonnel.20'|'EMS Personnel's Foreign Language Ability'|'cze'|'Czech'|\n" +
        "'DEMDataSet'|'dPersonnel.20'|'EMS Personnel's Foreign Language Ability'|'dan'|'Danish'|\n" +
        "'DEMDataSet'|'dPersonnel.20'|'EMS Personnel's Foreign Language Ability'|'dut'|'Dutch'|\n" +
        "'DEMDataSet'|'dPersonnel.20'|'EMS Personnel's Foreign Language Ability'|'fin'|'Finnish'|\n" +
        "'DEMDataSet'|'dPersonnel.20'|'EMS Personnel's Foreign Language Ability'|'tai'|'Formosan'|\n" +
        "'DEMDataSet'|'dPersonnel.20'|'EMS Personnel's Foreign Language Ability'|'fre'|'French'|\n" +
        "'DEMDataSet'|'dPersonnel.20'|'EMS Personnel's Foreign Language Ability'|'cpf'|'French Creole'|\n" +
        "'DEMDataSet'|'dPersonnel.20'|'EMS Personnel's Foreign Language Ability'|'ger'|'German'|\n" +
        "'DEMDataSet'|'dPersonnel.20'|'EMS Personnel's Foreign Language Ability'|'gre'|'Greek'|\n" +
        "'DEMDataSet'|'dPersonnel.20'|'EMS Personnel's Foreign Language Ability'|'guj'|'Gujarati'|\n" +
        "'DEMDataSet'|'dPersonnel.20'|'EMS Personnel's Foreign Language Ability'|'heb'|'Hebrew'|\n" +
        "'DEMDataSet'|'dPersonnel.20'|'EMS Personnel's Foreign Language Ability'|'hin'|'Hindi (Urdu)'|\n" +
        "'DEMDataSet'|'dPersonnel.20'|'EMS Personnel's Foreign Language Ability'|'hun'|'Hungarian'|\n" +
        "'DEMDataSet'|'dPersonnel.20'|'EMS Personnel's Foreign Language Ability'|'ilo'|'Ilocano'|\n" +
        "'DEMDataSet'|'dPersonnel.20'|'EMS Personnel's Foreign Language Ability'|'itl'|'Italian'|\n" +
        "'DEMDataSet'|'dPersonnel.20'|'EMS Personnel's Foreign Language Ability'|'jpn'|'Japanese'|\n" +
        "'DEMDataSet'|'dPersonnel.20'|'EMS Personnel's Foreign Language Ability'|'kor'|'Korean'|\n" +
        "'DEMDataSet'|'dPersonnel.20'|'EMS Personnel's Foreign Language Ability'|'kro'|'Kru'|\n" +
        "'DEMDataSet'|'dPersonnel.20'|'EMS Personnel's Foreign Language Ability'|'lit'|'Lithuanian'|\n" +
        "'DEMDataSet'|'dPersonnel.20'|'EMS Personnel's Foreign Language Ability'|'mal'|'Malayalam'|\n" +
        "'DEMDataSet'|'dPersonnel.20'|'EMS Personnel's Foreign Language Ability'|'hmn'|'Miao (Hmong)'|\n" +
        "'DEMDataSet'|'dPersonnel.20'|'EMS Personnel's Foreign Language Ability'|'mkh'|'Mon-Khmer (Cambodian)'|\n" +
        "'DEMDataSet'|'dPersonnel.20'|'EMS Personnel's Foreign Language Ability'|'nav'|'Navaho'|\n" +
        "'DEMDataSet'|'dPersonnel.20'|'EMS Personnel's Foreign Language Ability'|'nno'|'Norwegian'|\n" +
        "'DEMDataSet'|'dPersonnel.20'|'EMS Personnel's Foreign Language Ability'|'pan'|'Panjabi'|\n" +
        "'DEMDataSet'|'dPersonnel.20'|'EMS Personnel's Foreign Language Ability'|'gem'|'Pennsylvania Dutch (Germanic Other)'|\n" +
        "'DEMDataSet'|'dPersonnel.20'|'EMS Personnel's Foreign Language Ability'|'per'|'Persian'|\n" +
        "'DEMDataSet'|'dPersonnel.20'|'EMS Personnel's Foreign Language Ability'|'pol'|'Polish'|\n" +
        "'DEMDataSet'|'dPersonnel.20'|'EMS Personnel's Foreign Language Ability'|'por'|'Portuguese'|\n" +
        "'DEMDataSet'|'dPersonnel.20'|'EMS Personnel's Foreign Language Ability'|'rum'|'Romanian'|\n" +
        "'DEMDataSet'|'dPersonnel.20'|'EMS Personnel's Foreign Language Ability'|'rus'|'Russian'|\n" +
        "'DEMDataSet'|'dPersonnel.20'|'EMS Personnel's Foreign Language Ability'|'smo'|'Samoan'|\n" +
        "'DEMDataSet'|'dPersonnel.20'|'EMS Personnel's Foreign Language Ability'|'srp'|'Serbo-Croatian'|\n" +
        "'DEMDataSet'|'dPersonnel.20'|'EMS Personnel's Foreign Language Ability'|'slo'|'Slovak'|\n" +
        "'DEMDataSet'|'dPersonnel.20'|'EMS Personnel's Foreign Language Ability'|'spa'|'Spanish'|\n" +
        "'DEMDataSet'|'dPersonnel.20'|'EMS Personnel's Foreign Language Ability'|'swe'|'Swedish'|\n" +
        "'DEMDataSet'|'dPersonnel.20'|'EMS Personnel's Foreign Language Ability'|'syr'|'Syriac'|\n" +
        "'DEMDataSet'|'dPersonnel.20'|'EMS Personnel's Foreign Language Ability'|'tgl'|'Tagalog'|\n" +
        "'DEMDataSet'|'dPersonnel.20'|'EMS Personnel's Foreign Language Ability'|'tha'|'Thai (Laotian)'|\n" +
        "'DEMDataSet'|'dPersonnel.20'|'EMS Personnel's Foreign Language Ability'|'tur'|'Turkish'|\n" +
        "'DEMDataSet'|'dPersonnel.20'|'EMS Personnel's Foreign Language Ability'|'ukr'|'Ukrainian'|\n" +
        "'DEMDataSet'|'dPersonnel.20'|'EMS Personnel's Foreign Language Ability'|'vie'|'Vietnamese'|\n" +
        "'DEMDataSet'|'dPersonnel.20'|'EMS Personnel's Foreign Language Ability'|'yid'|'Yiddish'|\n" +
        "'DEMDataSet'|'dPersonnel.24'|'EMS Personnel's State EMS Certification Licensure Level'|'9925001'|'2009 Advanced Emergency Medical Technician (AEMT)'|\n" +
        "'DEMDataSet'|'dPersonnel.24'|'EMS Personnel's State EMS Certification Licensure Level'|'9925003'|'2009 Emergency Medical Responder (EMR)'|\n" +
        "'DEMDataSet'|'dPersonnel.24'|'EMS Personnel's State EMS Certification Licensure Level'|'9925005'|'2009 Emergency Medical Technician (EMT)'|\n" +
        "'DEMDataSet'|'dPersonnel.24'|'EMS Personnel's State EMS Certification Licensure Level'|'9925007'|'2009 Paramedic'|\n" +
        "'DEMDataSet'|'dPersonnel.24'|'EMS Personnel's State EMS Certification Licensure Level'|'9925013'|'First Responder'|\n" +
        "'DEMDataSet'|'dPersonnel.24'|'EMS Personnel's State EMS Certification Licensure Level'|'9925015'|'EMT-Basic'|\n" +
        "'DEMDataSet'|'dPersonnel.24'|'EMS Personnel's State EMS Certification Licensure Level'|'9925017'|'EMT-Intermediate'|\n" +
        "'DEMDataSet'|'dPersonnel.24'|'EMS Personnel's State EMS Certification Licensure Level'|'9925019'|'EMT-Paramedic'|\n" +
        "'DEMDataSet'|'dPersonnel.24'|'EMS Personnel's State EMS Certification Licensure Level'|'9925023'|'Other Healthcare Professional'|\n" +
        "'DEMDataSet'|'dPersonnel.24'|'EMS Personnel's State EMS Certification Licensure Level'|'9925025'|'Other Non-Healthcare Professional'|\n" +
        "'DEMDataSet'|'dPersonnel.24'|'EMS Personnel's State EMS Certification Licensure Level'|'9925027'|'Physician'|\n" +
        "'DEMDataSet'|'dPersonnel.24'|'EMS Personnel's State EMS Certification Licensure Level'|'9925029'|'Respiratory Therapist'|\n" +
        "'DEMDataSet'|'dPersonnel.24'|'EMS Personnel's State EMS Certification Licensure Level'|'9925031'|'Student'|\n" +
        "'DEMDataSet'|'dPersonnel.24'|'EMS Personnel's State EMS Certification Licensure Level'|'9925033'|'Critical Care Paramedic'|\n" +
        "'DEMDataSet'|'dPersonnel.24'|'EMS Personnel's State EMS Certification Licensure Level'|'9925035'|'Community Paramedicine'|\n" +
        "'DEMDataSet'|'dPersonnel.24'|'EMS Personnel's State EMS Certification Licensure Level'|'9925037'|'Nurse Practitioner'|\n" +
        "'DEMDataSet'|'dPersonnel.24'|'EMS Personnel's State EMS Certification Licensure Level'|'9925039'|'Physician Assistant'|\n" +
        "'DEMDataSet'|'dPersonnel.24'|'EMS Personnel's State EMS Certification Licensure Level'|'9925041'|'Licensed Practical Nurse (LPN)'|\n" +
        "'DEMDataSet'|'dPersonnel.24'|'EMS Personnel's State EMS Certification Licensure Level'|'9925043'|'Registered Nurse'|\n" +
        "'DEMDataSet'|'dPersonnel.29'|'EMS Personnel's National Registry Certification Level'|'1529001'|'2009 Advanced Emergency Medical Technician (AEMT)'|\n" +
        "'DEMDataSet'|'dPersonnel.29'|'EMS Personnel's National Registry Certification Level'|'1529003'|'2009 Emergency Medical Responder (EMR)'|\n" +
        "'DEMDataSet'|'dPersonnel.29'|'EMS Personnel's National Registry Certification Level'|'1529005'|'2009 Emergency Medical Technician'|\n" +
        "'DEMDataSet'|'dPersonnel.29'|'EMS Personnel's National Registry Certification Level'|'1529007'|'2009 Paramedic'|\n" +
        "'DEMDataSet'|'dPersonnel.29'|'EMS Personnel's National Registry Certification Level'|'1529009'|'EMT-Basic'|\n" +
        "'DEMDataSet'|'dPersonnel.29'|'EMS Personnel's National Registry Certification Level'|'1529011'|'EMT-Intermediate'|\n" +
        "'DEMDataSet'|'dPersonnel.29'|'EMS Personnel's National Registry Certification Level'|'1529013'|'EMT-Paramedic'|\n" +
        "'DEMDataSet'|'dPersonnel.29'|'EMS Personnel's National Registry Certification Level'|'1529015'|'First Responder'|\n" +
        "'DEMDataSet'|'dPersonnel.31'|'EMS Personnel's Employment Status'|'1531001'|'Full Time Paid Employee'|\n" +
        "'DEMDataSet'|'dPersonnel.31'|'EMS Personnel's Employment Status'|'1531003'|'Part Time Paid Employee'|\n" +
        "'DEMDataSet'|'dPersonnel.31'|'EMS Personnel's Employment Status'|'1531005'|'Volunteer'|\n" +
        "'DEMDataSet'|'dPersonnel.31'|'EMS Personnel's Employment Status'|'1531007'|'Neither an Employee Nor a Volunteer'|\n" +
        "'DEMDataSet'|'dPersonnel.34'|'EMS Personnel's Primary EMS Job Role'|'1534001'|'Administrator/Manager'|\n" +
        "'DEMDataSet'|'dPersonnel.34'|'EMS Personnel's Primary EMS Job Role'|'1534003'|'Driver/Pilot'|\n" +
        "'DEMDataSet'|'dPersonnel.34'|'EMS Personnel's Primary EMS Job Role'|'1534005'|'Educator/Preceptor'|\n" +
        "'DEMDataSet'|'dPersonnel.34'|'EMS Personnel's Primary EMS Job Role'|'1534007'|'Fire Suppression'|\n" +
        "'DEMDataSet'|'dPersonnel.34'|'EMS Personnel's Primary EMS Job Role'|'1534009'|'First-Line Supervisor'|\n" +
        "'DEMDataSet'|'dPersonnel.34'|'EMS Personnel's Primary EMS Job Role'|'1534011'|'Law Enforcement'|\n" +
        "'DEMDataSet'|'dPersonnel.34'|'EMS Personnel's Primary EMS Job Role'|'1534013'|'Other'|\n" +
        "'DEMDataSet'|'dPersonnel.34'|'EMS Personnel's Primary EMS Job Role'|'1534015'|'Patient Care Provider'|\n" +
        "'DEMDataSet'|'dPersonnel.34'|'EMS Personnel's Primary EMS Job Role'|'1534017'|'Rescue'|\n" +
        "'DEMDataSet'|'dPersonnel.35'|'EMS Personnel's Other Job Responsibilities'|'1534001'|'Administrator/Manager'|\n" +
        "'DEMDataSet'|'dPersonnel.35'|'EMS Personnel's Other Job Responsibilities'|'1534003'|'Driver/Pilot'|\n" +
        "'DEMDataSet'|'dPersonnel.35'|'EMS Personnel's Other Job Responsibilities'|'1534005'|'Educator/Preceptor'|\n" +
        "'DEMDataSet'|'dPersonnel.35'|'EMS Personnel's Other Job Responsibilities'|'1534007'|'Fire Suppression'|\n" +
        "'DEMDataSet'|'dPersonnel.35'|'EMS Personnel's Other Job Responsibilities'|'1534009'|'First-Line Supervisor'|\n" +
        "'DEMDataSet'|'dPersonnel.35'|'EMS Personnel's Other Job Responsibilities'|'1534011'|'Law Enforcement'|\n" +
        "'DEMDataSet'|'dPersonnel.35'|'EMS Personnel's Other Job Responsibilities'|'1534013'|'Other'|\n" +
        "'DEMDataSet'|'dPersonnel.35'|'EMS Personnel's Other Job Responsibilities'|'1534015'|'Patient Care Provider'|\n" +
        "'DEMDataSet'|'dPersonnel.35'|'EMS Personnel's Other Job Responsibilities'|'1534017'|'Rescue'|\n" +
        "'DEMDataSet'|'dPersonnel.38'|'EMS Personnel's Practice Level'|'9925001'|'2009 Advanced Emergency Medical Technician (AEMT)'|\n" +
        "'DEMDataSet'|'dPersonnel.38'|'EMS Personnel's Practice Level'|'9925003'|'2009 Emergency Medical Responder (EMR)'|\n" +
        "'DEMDataSet'|'dPersonnel.38'|'EMS Personnel's Practice Level'|'9925005'|'2009 Emergency Medical Technician (EMT)'|\n" +
        "'DEMDataSet'|'dPersonnel.38'|'EMS Personnel's Practice Level'|'9925007'|'2009 Paramedic'|\n" +
        "'DEMDataSet'|'dPersonnel.38'|'EMS Personnel's Practice Level'|'9925013'|'First Responder'|\n" +
        "'DEMDataSet'|'dPersonnel.38'|'EMS Personnel's Practice Level'|'9925015'|'EMT-Basic'|\n" +
        "'DEMDataSet'|'dPersonnel.38'|'EMS Personnel's Practice Level'|'9925017'|'EMT-Intermediate'|\n" +
        "'DEMDataSet'|'dPersonnel.38'|'EMS Personnel's Practice Level'|'9925019'|'EMT-Paramedic'|\n" +
        "'DEMDataSet'|'dPersonnel.38'|'EMS Personnel's Practice Level'|'9925023'|'Other Healthcare Professional'|\n" +
        "'DEMDataSet'|'dPersonnel.38'|'EMS Personnel's Practice Level'|'9925025'|'Other Non-Healthcare Professional'|\n" +
        "'DEMDataSet'|'dPersonnel.38'|'EMS Personnel's Practice Level'|'9925027'|'Physician'|\n" +
        "'DEMDataSet'|'dPersonnel.38'|'EMS Personnel's Practice Level'|'9925029'|'Respiratory Therapist'|\n" +
        "'DEMDataSet'|'dPersonnel.38'|'EMS Personnel's Practice Level'|'9925031'|'Student'|\n" +
        "'DEMDataSet'|'dPersonnel.38'|'EMS Personnel's Practice Level'|'9925033'|'Critical Care Paramedic'|\n" +
        "'DEMDataSet'|'dPersonnel.38'|'EMS Personnel's Practice Level'|'9925035'|'Community Paramedicine'|\n" +
        "'DEMDataSet'|'dPersonnel.38'|'EMS Personnel's Practice Level'|'9925037'|'Nurse Practitioner'|\n" +
        "'DEMDataSet'|'dPersonnel.38'|'EMS Personnel's Practice Level'|'9925039'|'Physician Assistant'|\n" +
        "'DEMDataSet'|'dPersonnel.38'|'EMS Personnel's Practice Level'|'9925041'|'Licensed Practical Nurse (LPN)'|\n" +
        "'DEMDataSet'|'dPersonnel.38'|'EMS Personnel's Practice Level'|'9925043'|'Registered Nurse'|\n" +
        "'DEMDataSet'|'dDevice.03'|'Medical Device Type'|'1603001'|'Capnography-Numeric'|\n" +
        "'DEMDataSet'|'dDevice.03'|'Medical Device Type'|'1603003'|'Capnography-Waveform'|\n" +
        "'DEMDataSet'|'dDevice.03'|'Medical Device Type'|'1603005'|'Chemistry Measurement-Blood or Serum'|\n" +
        "'DEMDataSet'|'dDevice.03'|'Medical Device Type'|'1603007'|'Chemistry Measurement-Glucometer'|\n" +
        "'DEMDataSet'|'dDevice.03'|'Medical Device Type'|'1603009'|'Chemistry Measurement-Urine'|\n" +
        "'DEMDataSet'|'dDevice.03'|'Medical Device Type'|'1603011'|'CPR-External Device'|\n" +
        "'DEMDataSet'|'dDevice.03'|'Medical Device Type'|'1603013'|'Defibrillator-Automated'|\n" +
        "'DEMDataSet'|'dDevice.03'|'Medical Device Type'|'1603015'|'Defibrillator-Manual'|\n" +
        "'DEMDataSet'|'dDevice.03'|'Medical Device Type'|'1603017'|'ECG-12 Lead or Greater'|\n" +
        "'DEMDataSet'|'dDevice.03'|'Medical Device Type'|'1603019'|'ECG-Less than 12 Lead (Cardiac Monitor)'|\n" +
        "'DEMDataSet'|'dDevice.03'|'Medical Device Type'|'1603021'|'Medication Infusion Pump'|\n" +
        "'DEMDataSet'|'dDevice.03'|'Medical Device Type'|'1603023'|'Other'|\n" +
        "'DEMDataSet'|'dDevice.03'|'Medical Device Type'|'1603025'|'Oximetry-Carbon Monoxide'|\n" +
        "'DEMDataSet'|'dDevice.03'|'Medical Device Type'|'1603027'|'Oximetry-Oxygen'|\n" +
        "'DEMDataSet'|'dDevice.03'|'Medical Device Type'|'1603029'|'Pressure Monitors-Invasive'|\n" +
        "'DEMDataSet'|'dDevice.03'|'Medical Device Type'|'1603031'|'Pressure Monitors-Non-Invasive'|\n" +
        "'DEMDataSet'|'dDevice.03'|'Medical Device Type'|'1603033'|'Respirator (BLS)'|\n" +
        "'DEMDataSet'|'dDevice.03'|'Medical Device Type'|'1603035'|'Ventilator (ALS)'|\n" +
        "'DEMDataSet'|'dDevice.03'|'Medical Device Type'|'1603037'|'Ventilator Assistance-BiPAP'|\n" +
        "'DEMDataSet'|'dDevice.03'|'Medical Device Type'|'1603039'|'Ventilator Assistance-CPAP'|\n" +
        "'DEMDataSet'|'dFacility.01'|'Type of Facility'|'1701001'|'Assisted Living Facility'|\n" +
        "'DEMDataSet'|'dFacility.01'|'Type of Facility'|'1701003'|'Clinic'|\n" +
        "'DEMDataSet'|'dFacility.01'|'Type of Facility'|'1701005'|'Hospital'|\n" +
        "'DEMDataSet'|'dFacility.01'|'Type of Facility'|'1701007'|'Nursing Home'|\n" +
        "'DEMDataSet'|'dFacility.01'|'Type of Facility'|'1701009'|'Other'|\n" +
        "'DEMDataSet'|'dFacility.01'|'Type of Facility'|'1701011'|'Urgent Care'|\n" +
        "'DEMDataSet'|'dFacility.01'|'Type of Facility'|'1701013'|'Rehabilitation Facility'|\n" +
        "'DEMDataSet'|'dFacility.01'|'Type of Facility'|'1701015'|'Mental Health Facility'|\n" +
        "'DEMDataSet'|'dFacility.01'|'Type of Facility'|'1701017'|'Dialysis Center'|\n" +
        "'DEMDataSet'|'dFacility.04'|'Hospital Designations'|'9908001'|'Behavioral Health'|\n" +
        "'DEMDataSet'|'dFacility.04'|'Hospital Designations'|'9908003'|'Burn Center'|\n" +
        "'DEMDataSet'|'dFacility.04'|'Hospital Designations'|'9908005'|'Critical Access Hospital'|\n" +
        "'DEMDataSet'|'dFacility.04'|'Hospital Designations'|'9908007'|'Hospital (General)'|\n" +
        "'DEMDataSet'|'dFacility.04'|'Hospital Designations'|'9908009'|'Neonatal Center'|\n" +
        "'DEMDataSet'|'dFacility.04'|'Hospital Designations'|'9908011'|'Pediatric Center'|\n" +
        "'DEMDataSet'|'dFacility.04'|'Hospital Designations'|'9908017'|'Stroke Center'|\n" +
        "'DEMDataSet'|'dFacility.04'|'Hospital Designations'|'9908019'|'Rehab Center'|\n" +
        "'DEMDataSet'|'dFacility.04'|'Hospital Designations'|'9908021'|'Trauma Center Level 1'|\n" +
        "'DEMDataSet'|'dFacility.04'|'Hospital Designations'|'9908023'|'Trauma Center Level 2'|\n" +
        "'DEMDataSet'|'dFacility.04'|'Hospital Designations'|'9908025'|'Trauma Center Level 3'|\n" +
        "'DEMDataSet'|'dFacility.04'|'Hospital Designations'|'9908027'|'Trauma Center Level 4'|\n" +
        "'DEMDataSet'|'dFacility.04'|'Hospital Designations'|'9908029'|'Trauma Center Level 5'|\n" +
        "'DEMDataSet'|'dFacility.04'|'Hospital Designations'|'9908031'|'Cardiac-STEMI/PCI Capable'|\n" +
        "'DEMDataSet'|'dFacility.04'|'Hospital Designations'|'9908033'|'Cardiac-STEMI/PCI Capable (24/7)'|\n" +
        "'DEMDataSet'|'dFacility.04'|'Hospital Designations'|'9908035'|'Cardiac-STEMI/Non-PCI Capable'|\n" +
        "'DEMDataSet'|'dFacility.12'|'Facility Country'|'CA'|'Canada'|\n" +
        "'DEMDataSet'|'dFacility.12'|'Facility Country'|'MX'|'Mexico'|\n" +
        "'DEMDataSet'|'dFacility.12'|'Facility Country'|'US'|'United States'|\n" +
        "'EMSDataSet'|'eCustomConfiguration.03'|'Custom Data Type'|'9902001'|'Binary'|\n" +
        "'EMSDataSet'|'eCustomConfiguration.03'|'Custom Data Type'|'9902003'|'Date/Time'|\n" +
        "'EMSDataSet'|'eCustomConfiguration.03'|'Custom Data Type'|'9902005'|'Integer/Number'|\n" +
        "'EMSDataSet'|'eCustomConfiguration.03'|'Custom Data Type'|'9902007'|'Other'|\n" +
        "'EMSDataSet'|'eCustomConfiguration.03'|'Custom Data Type'|'9902009'|'Text/String'|\n" +
        "'EMSDataSet'|'eCustomConfiguration.03'|'Custom Data Type'|'9902011'|'Boolean'|\n" +
        "'EMSDataSet'|'eCustomConfiguration.04'|'Custom Data Element Recurrence'|'9923001'|'No'|\n" +
        "'EMSDataSet'|'eCustomConfiguration.04'|'Custom Data Element Recurrence'|'9923003'|'Yes'|\n" +
        "'EMSDataSet'|'eCustomConfiguration.05'|'Custom Data Element Usage'|'9903001'|'Mandatory'|\n" +
        "'EMSDataSet'|'eCustomConfiguration.05'|'Custom Data Element Usage'|'9903003'|'Required'|\n" +
        "'EMSDataSet'|'eCustomConfiguration.05'|'Custom Data Element Usage'|'9903005'|'Recommended'|\n" +
        "'EMSDataSet'|'eCustomConfiguration.05'|'Custom Data Element Usage'|'9903007'|'Optional'|\n" +
        "'EMSDataSet'|'eCustomConfiguration.07'|'Custom Data Element Potential NOT Values (NV)'|'7701001'|'Not Applicable'|\n" +
        "'EMSDataSet'|'eCustomConfiguration.07'|'Custom Data Element Potential NOT Values (NV)'|'7701003'|'Not Recorded'|\n" +
        "'EMSDataSet'|'eCustomConfiguration.07'|'Custom Data Element Potential NOT Values (NV)'|'7701005'|'Not Reporting'|\n" +
        "'EMSDataSet'|'eCustomConfiguration.08'|'Custom Data Element Potential Pertinent Negative Values (PN)'|'8801001'|'Contraindication Noted'|\n" +
        "'EMSDataSet'|'eCustomConfiguration.08'|'Custom Data Element Potential Pertinent Negative Values (PN)'|'8801003'|'Denied By Order'|\n" +
        "'EMSDataSet'|'eCustomConfiguration.08'|'Custom Data Element Potential Pertinent Negative Values (PN)'|'8801005'|'Exam Finding Not Present'|\n" +
        "'EMSDataSet'|'eCustomConfiguration.08'|'Custom Data Element Potential Pertinent Negative Values (PN)'|'8801007'|'Medication Allergy'|\n" +
        "'EMSDataSet'|'eCustomConfiguration.08'|'Custom Data Element Potential Pertinent Negative Values (PN)'|'8801009'|'Medication Already Taken'|\n" +
        "'EMSDataSet'|'eCustomConfiguration.08'|'Custom Data Element Potential Pertinent Negative Values (PN)'|'8801013'|'No Known Drug Allergy'|\n" +
        "'EMSDataSet'|'eCustomConfiguration.08'|'Custom Data Element Potential Pertinent Negative Values (PN)'|'8801015'|'None Reported'|\n" +
        "'EMSDataSet'|'eCustomConfiguration.08'|'Custom Data Element Potential Pertinent Negative Values (PN)'|'8801017'|'Not Performed by EMS'|\n" +
        "'EMSDataSet'|'eCustomConfiguration.08'|'Custom Data Element Potential Pertinent Negative Values (PN)'|'8801019'|'Refused'|\n" +
        "'EMSDataSet'|'eCustomConfiguration.08'|'Custom Data Element Potential Pertinent Negative Values (PN)'|'8801021'|'Unresponsive'|\n" +
        "'EMSDataSet'|'eCustomConfiguration.08'|'Custom Data Element Potential Pertinent Negative Values (PN)'|'8801023'|'Unable to Complete'|\n" +
        "'EMSDataSet'|'eResponse.05'|'Type of Service Requested'|'2205001'|'911 Response (Scene)'|\n" +
        "'EMSDataSet'|'eResponse.05'|'Type of Service Requested'|'2205003'|'Intercept'|\n" +
        "'EMSDataSet'|'eResponse.05'|'Type of Service Requested'|'2205005'|'Interfacility Transport'|\n" +
        "'EMSDataSet'|'eResponse.05'|'Type of Service Requested'|'2205007'|'Medical Transport'|\n" +
        "'EMSDataSet'|'eResponse.05'|'Type of Service Requested'|'2205009'|'Mutual Aid'|\n" +
        "'EMSDataSet'|'eResponse.05'|'Type of Service Requested'|'2205011'|'Public Assistance/Other Not Listed'|\n" +
        "'EMSDataSet'|'eResponse.05'|'Type of Service Requested'|'2205013'|'Standby'|\n" +
        "'EMSDataSet'|'eResponse.06'|'Standby Purpose'|'2206001'|'Disaster Event-Drill/Exercise'|\n" +
        "'EMSDataSet'|'eResponse.06'|'Standby Purpose'|'2206003'|'Disaster Event-Live Staging'|\n" +
        "'EMSDataSet'|'eResponse.06'|'Standby Purpose'|'2206005'|'Education'|\n" +
        "'EMSDataSet'|'eResponse.06'|'Standby Purpose'|'2206007'|'EMS Staging-Improve Coverage'|\n" +
        "'EMSDataSet'|'eResponse.06'|'Standby Purpose'|'2206009'|'Fire Support-Rehab'|\n" +
        "'EMSDataSet'|'eResponse.06'|'Standby Purpose'|'2206011'|'Fire Support-Standby'|\n" +
        "'EMSDataSet'|'eResponse.06'|'Standby Purpose'|'2206013'|'Mass Gathering-Concert/Entertainment Event'|\n" +
        "'EMSDataSet'|'eResponse.06'|'Standby Purpose'|'2206015'|'Mass Gathering-Fair/Community Event'|\n" +
        "'EMSDataSet'|'eResponse.06'|'Standby Purpose'|'2206017'|'Mass Gathering-Sporting Event'|\n" +
        "'EMSDataSet'|'eResponse.06'|'Standby Purpose'|'2206019'|'Other'|\n" +
        "'EMSDataSet'|'eResponse.06'|'Standby Purpose'|'2206021'|'Public Safety Support'|\n" +
        "'EMSDataSet'|'eResponse.07'|'Primary Role of the Unit'|'2207003'|'Ground Transport'|\n" +
        "'EMSDataSet'|'eResponse.07'|'Primary Role of the Unit'|'2207005'|'Non-Transport Administrative (e.g., Supervisor)'|\n" +
        "'EMSDataSet'|'eResponse.07'|'Primary Role of the Unit'|'2207007'|'Non-Transport Assistance'|\n" +
        "'EMSDataSet'|'eResponse.07'|'Primary Role of the Unit'|'2207009'|'Non-Transport Rescue'|\n" +
        "'EMSDataSet'|'eResponse.07'|'Primary Role of the Unit'|'2207011'|'Air Transport-Helicopter'|\n" +
        "'EMSDataSet'|'eResponse.07'|'Primary Role of the Unit'|'2207013'|'Air Transport-Fixed Wing'|\n" +
        "'EMSDataSet'|'eResponse.08'|'Type of Dispatch Delay'|'2208001'|'Caller (Uncooperative)'|\n" +
        "'EMSDataSet'|'eResponse.08'|'Type of Dispatch Delay'|'2208003'|'Diversion/Failure (of previous unit)'|\n" +
        "'EMSDataSet'|'eResponse.08'|'Type of Dispatch Delay'|'2208005'|'High Call Volume'|\n" +
        "'EMSDataSet'|'eResponse.08'|'Type of Dispatch Delay'|'2208007'|'Language Barrier'|\n" +
        "'EMSDataSet'|'eResponse.08'|'Type of Dispatch Delay'|'2208009'|'Location (Inability to Obtain)'|\n" +
        "'EMSDataSet'|'eResponse.08'|'Type of Dispatch Delay'|'2208011'|'No EMS Vehicles (Units) Available'|\n" +
        "'EMSDataSet'|'eResponse.08'|'Type of Dispatch Delay'|'2208013'|'None/No Delay'|\n" +
        "'EMSDataSet'|'eResponse.08'|'Type of Dispatch Delay'|'2208015'|'Other'|\n" +
        "'EMSDataSet'|'eResponse.08'|'Type of Dispatch Delay'|'2208017'|'Technical Failure (Computer, Phone etc.)'|\n" +
        "'EMSDataSet'|'eResponse.09'|'Type of Response Delay'|'2209001'|'Crowd'|\n" +
        "'EMSDataSet'|'eResponse.09'|'Type of Response Delay'|'2209003'|'Directions/Unable to Locate'|\n" +
        "'EMSDataSet'|'eResponse.09'|'Type of Response Delay'|'2209005'|'Distance'|\n" +
        "'EMSDataSet'|'eResponse.09'|'Type of Response Delay'|'2209007'|'Diversion (Different Incident)'|\n" +
        "'EMSDataSet'|'eResponse.09'|'Type of Response Delay'|'2209009'|'HazMat'|\n" +
        "'EMSDataSet'|'eResponse.09'|'Type of Response Delay'|'2209011'|'None/No Delay'|\n" +
        "'EMSDataSet'|'eResponse.09'|'Type of Response Delay'|'2209013'|'Other'|\n" +
        "'EMSDataSet'|'eResponse.09'|'Type of Response Delay'|'2209015'|'Rendezvous Transport Unavailable'|\n" +
        "'EMSDataSet'|'eResponse.09'|'Type of Response Delay'|'2209017'|'Route Obstruction (e.g., Train)'|\n" +
        "'EMSDataSet'|'eResponse.09'|'Type of Response Delay'|'2209019'|'Scene Safety (Not Secure for EMS)'|\n" +
        "'EMSDataSet'|'eResponse.09'|'Type of Response Delay'|'2209021'|'Staff Delay'|\n" +
        "'EMSDataSet'|'eResponse.09'|'Type of Response Delay'|'2209023'|'Traffic'|\n" +
        "'EMSDataSet'|'eResponse.09'|'Type of Response Delay'|'2209025'|'Vehicle Crash Involving this Unit'|\n" +
        "'EMSDataSet'|'eResponse.09'|'Type of Response Delay'|'2209027'|'Vehicle Failure of this Unit'|\n" +
        "'EMSDataSet'|'eResponse.09'|'Type of Response Delay'|'2209029'|'Weather'|\n" +
        "'EMSDataSet'|'eResponse.09'|'Type of Response Delay'|'2209031'|'Mechanical Issue-Unit, Equipment, etc.'|\n" +
        "'EMSDataSet'|'eResponse.09'|'Type of Response Delay'|'2209033'|'Flight Planning'|\n" +
        "'EMSDataSet'|'eResponse.10'|'Type of Scene Delay'|'2210001'|'Awaiting Air Unit'|\n" +
        "'EMSDataSet'|'eResponse.10'|'Type of Scene Delay'|'2210003'|'Awaiting Ground Unit'|\n" +
        "'EMSDataSet'|'eResponse.10'|'Type of Scene Delay'|'2210005'|'Crowd'|\n" +
        "'EMSDataSet'|'eResponse.10'|'Type of Scene Delay'|'2210007'|'Directions/Unable to Locate'|\n" +
        "'EMSDataSet'|'eResponse.10'|'Type of Scene Delay'|'2210009'|'Distance'|\n" +
        "'EMSDataSet'|'eResponse.10'|'Type of Scene Delay'|'2210011'|'Extrication'|\n" +
        "'EMSDataSet'|'eResponse.10'|'Type of Scene Delay'|'2210013'|'HazMat'|\n" +
        "'EMSDataSet'|'eResponse.10'|'Type of Scene Delay'|'2210015'|'Language Barrier'|\n" +
        "'EMSDataSet'|'eResponse.10'|'Type of Scene Delay'|'2210017'|'None/No Delay'|\n" +
        "'EMSDataSet'|'eResponse.10'|'Type of Scene Delay'|'2210019'|'Other'|\n" +
        "'EMSDataSet'|'eResponse.10'|'Type of Scene Delay'|'2210021'|'Patient Access'|\n" +
        "'EMSDataSet'|'eResponse.10'|'Type of Scene Delay'|'2210023'|'Safety-Crew/Staging'|\n" +
        "'EMSDataSet'|'eResponse.10'|'Type of Scene Delay'|'2210025'|'Safety-Patient'|\n" +
        "'EMSDataSet'|'eResponse.10'|'Type of Scene Delay'|'2210027'|'Staff Delay'|\n" +
        "'EMSDataSet'|'eResponse.10'|'Type of Scene Delay'|'2210029'|'Traffic'|\n" +
        "'EMSDataSet'|'eResponse.10'|'Type of Scene Delay'|'2210031'|'Triage/Multiple Patients'|\n" +
        "'EMSDataSet'|'eResponse.10'|'Type of Scene Delay'|'2210033'|'Vehicle Crash Involving this Unit'|\n" +
        "'EMSDataSet'|'eResponse.10'|'Type of Scene Delay'|'2210035'|'Vehicle Failure of this Unit'|\n" +
        "'EMSDataSet'|'eResponse.10'|'Type of Scene Delay'|'2210037'|'Weather'|\n" +
        "'EMSDataSet'|'eResponse.10'|'Type of Scene Delay'|'2210039'|'Mechanical Issue-Unit, Equipment, etc.'|\n" +
        "'EMSDataSet'|'eResponse.11'|'Type of Transport Delay'|'2211001'|'Crowd'|\n" +
        "'EMSDataSet'|'eResponse.11'|'Type of Transport Delay'|'2211003'|'Directions/Unable to Locate'|\n" +
        "'EMSDataSet'|'eResponse.11'|'Type of Transport Delay'|'2211005'|'Distance'|\n" +
        "'EMSDataSet'|'eResponse.11'|'Type of Transport Delay'|'2211007'|'Diversion'|\n" +
        "'EMSDataSet'|'eResponse.11'|'Type of Transport Delay'|'2211009'|'HazMat'|\n" +
        "'EMSDataSet'|'eResponse.11'|'Type of Transport Delay'|'2211011'|'None/No Delay'|\n" +
        "'EMSDataSet'|'eResponse.11'|'Type of Transport Delay'|'2211013'|'Other'|\n" +
        "'EMSDataSet'|'eResponse.11'|'Type of Transport Delay'|'2211015'|'Rendezvous Transport Unavailable'|\n" +
        "'EMSDataSet'|'eResponse.11'|'Type of Transport Delay'|'2211017'|'Route Obstruction (e.g., Train)'|\n" +
        "'EMSDataSet'|'eResponse.11'|'Type of Transport Delay'|'2211019'|'Safety'|\n" +
        "'EMSDataSet'|'eResponse.11'|'Type of Transport Delay'|'2211021'|'Staff Delay'|\n" +
        "'EMSDataSet'|'eResponse.11'|'Type of Transport Delay'|'2211023'|'Traffic'|\n" +
        "'EMSDataSet'|'eResponse.11'|'Type of Transport Delay'|'2211025'|'Vehicle Crash Involving this Unit'|\n" +
        "'EMSDataSet'|'eResponse.11'|'Type of Transport Delay'|'2211027'|'Vehicle Failure of this Unit'|\n" +
        "'EMSDataSet'|'eResponse.11'|'Type of Transport Delay'|'2211029'|'Weather'|\n" +
        "'EMSDataSet'|'eResponse.11'|'Type of Transport Delay'|'2211031'|'Patient Condition Change (e.g., Unit Stopped)'|\n" +
        "'EMSDataSet'|'eResponse.12'|'Type of Turn-Around Delay'|'2212001'|'Clean-up'|\n" +
        "'EMSDataSet'|'eResponse.12'|'Type of Turn-Around Delay'|'2212003'|'Decontamination'|\n" +
        "'EMSDataSet'|'eResponse.12'|'Type of Turn-Around Delay'|'2212005'|'Distance'|\n" +
        "'EMSDataSet'|'eResponse.12'|'Type of Turn-Around Delay'|'2212007'|'Documentation'|\n" +
        "'EMSDataSet'|'eResponse.12'|'Type of Turn-Around Delay'|'2212009'|'ED Overcrowding / Transfer of Care'|\n" +
        "'EMSDataSet'|'eResponse.12'|'Type of Turn-Around Delay'|'2212011'|'Equipment Failure'|\n" +
        "'EMSDataSet'|'eResponse.12'|'Type of Turn-Around Delay'|'2212013'|'Equipment/Supply Replenishment'|\n" +
        "'EMSDataSet'|'eResponse.12'|'Type of Turn-Around Delay'|'2212015'|'None/No Delay'|\n" +
        "'EMSDataSet'|'eResponse.12'|'Type of Turn-Around Delay'|'2212017'|'Other'|\n" +
        "'EMSDataSet'|'eResponse.12'|'Type of Turn-Around Delay'|'2212019'|'Rendezvous Transport Unavailable'|\n" +
        "'EMSDataSet'|'eResponse.12'|'Type of Turn-Around Delay'|'2212021'|'Route Obstruction (e.g., Train)'|\n" +
        "'EMSDataSet'|'eResponse.12'|'Type of Turn-Around Delay'|'2212023'|'Staff Delay'|\n" +
        "'EMSDataSet'|'eResponse.12'|'Type of Turn-Around Delay'|'2212025'|'Traffic'|\n" +
        "'EMSDataSet'|'eResponse.12'|'Type of Turn-Around Delay'|'2212027'|'Vehicle Crash of this Unit'|\n" +
        "'EMSDataSet'|'eResponse.12'|'Type of Turn-Around Delay'|'2212029'|'Vehicle Failure of this Unit'|\n" +
        "'EMSDataSet'|'eResponse.12'|'Type of Turn-Around Delay'|'2212031'|'Weather'|\n" +
        "'EMSDataSet'|'eResponse.12'|'Type of Turn-Around Delay'|'2212033'|'EMS Crew Accompanies Patient for Facility Procedure'|\n" +
        "'EMSDataSet'|'eResponse.15'|'Level of Care of This Unit'|'2215001'|'BLS-First Responder/EMR'|\n" +
        "'EMSDataSet'|'eResponse.15'|'Level of Care of This Unit'|'2215003'|'BLS-Basic /EMT'|\n" +
        "'EMSDataSet'|'eResponse.15'|'Level of Care of This Unit'|'2215005'|'BLS-AEMT'|\n" +
        "'EMSDataSet'|'eResponse.15'|'Level of Care of This Unit'|'2215007'|'BLS-Intermediate'|\n" +
        "'EMSDataSet'|'eResponse.15'|'Level of Care of This Unit'|'2215023'|'BLS-Community Paramedicine'|\n" +
        "'EMSDataSet'|'eResponse.15'|'Level of Care of This Unit'|'2215009'|'ALS-AEMT'|\n" +
        "'EMSDataSet'|'eResponse.15'|'Level of Care of This Unit'|'2215011'|'ALS-Intermediate'|\n" +
        "'EMSDataSet'|'eResponse.15'|'Level of Care of This Unit'|'2215013'|'ALS-Paramedic'|\n" +
        "'EMSDataSet'|'eResponse.15'|'Level of Care of This Unit'|'2215015'|'ALS-Community Paramedicine'|\n" +
        "'EMSDataSet'|'eResponse.15'|'Level of Care of This Unit'|'2215017'|'ALS-Nurse'|\n" +
        "'EMSDataSet'|'eResponse.15'|'Level of Care of This Unit'|'2215019'|'ALS-Physician'|\n" +
        "'EMSDataSet'|'eResponse.15'|'Level of Care of This Unit'|'2215021'|'Specialty Critical Care'|\n" +
        "'EMSDataSet'|'eResponse.23'|'Response Mode to Scene'|'2223001'|'Emergent (Immediate Response)'|\n" +
        "'EMSDataSet'|'eResponse.23'|'Response Mode to Scene'|'2223003'|'Emergent Downgraded to Non-Emergent'|\n" +
        "'EMSDataSet'|'eResponse.23'|'Response Mode to Scene'|'2223005'|'Non-Emergent'|\n" +
        "'EMSDataSet'|'eResponse.23'|'Response Mode to Scene'|'2223007'|'Non-Emergent Upgraded to Emergent'|\n" +
        "'EMSDataSet'|'eResponse.24'|'Additional Response Mode Descriptors'|'2224001'|'Intersection Navigation-Against Normal Light  Patterns'|\n" +
        "'EMSDataSet'|'eResponse.24'|'Additional Response Mode Descriptors'|'2224003'|'Intersection Navigation-With Automated Light Changing Technology'|\n" +
        "'EMSDataSet'|'eResponse.24'|'Additional Response Mode Descriptors'|'2224005'|'Intersection Navigation-With Normal Light Patterns'|\n" +
        "'EMSDataSet'|'eResponse.24'|'Additional Response Mode Descriptors'|'2224007'|'Scheduled'|\n" +
        "'EMSDataSet'|'eResponse.24'|'Additional Response Mode Descriptors'|'2224009'|'Speed-Enhanced per Local Policy'|\n" +
        "'EMSDataSet'|'eResponse.24'|'Additional Response Mode Descriptors'|'2224011'|'Speed-Normal Traffic'|\n" +
        "'EMSDataSet'|'eResponse.24'|'Additional Response Mode Descriptors'|'2224013'|'Unscheduled'|\n" +
        "'EMSDataSet'|'eResponse.24'|'Additional Response Mode Descriptors'|'2224015'|'Lights and Sirens'|\n" +
        "'EMSDataSet'|'eResponse.24'|'Additional Response Mode Descriptors'|'2224017'|'Lights and No Sirens'|\n" +
        "'EMSDataSet'|'eResponse.24'|'Additional Response Mode Descriptors'|'2224019'|'No Lights or Sirens'|\n" +
        "'EMSDataSet'|'eResponse.24'|'Additional Response Mode Descriptors'|'2224021'|'Initial No Lights or Sirens, Upgraded to Lights and Sirens'|\n" +
        "'EMSDataSet'|'eResponse.24'|'Additional Response Mode Descriptors'|'2224023'|'Initial Lights and Sirens, Downgraded to No Lights or Sirens'|\n" +
        "'EMSDataSet'|'eDispatch.01'|'Complaint Reported by Dispatch'|'2301001'|'Abdominal Pain/Problems'|\n" +
        "'EMSDataSet'|'eDispatch.01'|'Complaint Reported by Dispatch'|'2301003'|'Allergic Reaction/Stings'|\n" +
        "'EMSDataSet'|'eDispatch.01'|'Complaint Reported by Dispatch'|'2301005'|'Animal Bite'|\n" +
        "'EMSDataSet'|'eDispatch.01'|'Complaint Reported by Dispatch'|'2301007'|'Assault'|\n" +
        "'EMSDataSet'|'eDispatch.01'|'Complaint Reported by Dispatch'|'2301009'|'Automated Crash Notification'|\n" +
        "'EMSDataSet'|'eDispatch.01'|'Complaint Reported by Dispatch'|'2301011'|'Back Pain (Non-Traumatic)'|\n" +
        "'EMSDataSet'|'eDispatch.01'|'Complaint Reported by Dispatch'|'2301013'|'Breathing Problem'|\n" +
        "'EMSDataSet'|'eDispatch.01'|'Complaint Reported by Dispatch'|'2301015'|'Burns/Explosion'|\n" +
        "'EMSDataSet'|'eDispatch.01'|'Complaint Reported by Dispatch'|'2301017'|'Carbon Monoxide/Hazmat/Inhalation/CBRN'|\n" +
        "'EMSDataSet'|'eDispatch.01'|'Complaint Reported by Dispatch'|'2301019'|'Cardiac Arrest/Death'|\n" +
        "'EMSDataSet'|'eDispatch.01'|'Complaint Reported by Dispatch'|'2301021'|'Chest Pain (Non-Traumatic)'|\n" +
        "'EMSDataSet'|'eDispatch.01'|'Complaint Reported by Dispatch'|'2301023'|'Choking'|\n" +
        "'EMSDataSet'|'eDispatch.01'|'Complaint Reported by Dispatch'|'2301025'|'Convulsions/Seizure'|\n" +
        "'EMSDataSet'|'eDispatch.01'|'Complaint Reported by Dispatch'|'2301027'|'Diabetic Problem'|\n" +
        "'EMSDataSet'|'eDispatch.01'|'Complaint Reported by Dispatch'|'2301029'|'Electrocution/Lightning'|\n" +
        "'EMSDataSet'|'eDispatch.01'|'Complaint Reported by Dispatch'|'2301031'|'Eye Problem/Injury'|\n" +
        "'EMSDataSet'|'eDispatch.01'|'Complaint Reported by Dispatch'|'2301033'|'Falls'|\n" +
        "'EMSDataSet'|'eDispatch.01'|'Complaint Reported by Dispatch'|'2301035'|'Fire'|\n" +
        "'EMSDataSet'|'eDispatch.01'|'Complaint Reported by Dispatch'|'2301037'|'Headache'|\n" +
        "'EMSDataSet'|'eDispatch.01'|'Complaint Reported by Dispatch'|'2301039'|'Healthcare Professional/Admission'|\n" +
        "'EMSDataSet'|'eDispatch.01'|'Complaint Reported by Dispatch'|'2301041'|'Heart Problems/AICD'|\n" +
        "'EMSDataSet'|'eDispatch.01'|'Complaint Reported by Dispatch'|'2301043'|'Heat/Cold Exposure'|\n" +
        "'EMSDataSet'|'eDispatch.01'|'Complaint Reported by Dispatch'|'2301045'|'Hemorrhage/Laceration'|\n" +
        "'EMSDataSet'|'eDispatch.01'|'Complaint Reported by Dispatch'|'2301047'|'Industrial Accident/Inaccessible Incident/Other Entrapments (Non-Vehicle)'|\n" +
        "'EMSDataSet'|'eDispatch.01'|'Complaint Reported by Dispatch'|'2301049'|'Medical Alarm'|\n" +
        "'EMSDataSet'|'eDispatch.01'|'Complaint Reported by Dispatch'|'2301051'|'No Other Appropriate Choice'|\n" +
        "'EMSDataSet'|'eDispatch.01'|'Complaint Reported by Dispatch'|'2301053'|'Overdose/Poisoning/Ingestion'|\n" +
        "'EMSDataSet'|'eDispatch.01'|'Complaint Reported by Dispatch'|'2301055'|'Pandemic/Epidemic/Outbreak'|\n" +
        "'EMSDataSet'|'eDispatch.01'|'Complaint Reported by Dispatch'|'2301057'|'Pregnancy/Childbirth/Miscarriage'|\n" +
        "'EMSDataSet'|'eDispatch.01'|'Complaint Reported by Dispatch'|'2301059'|'Psychiatric Problem/Abnormal Behavior/Suicide Attempt'|\n" +
        "'EMSDataSet'|'eDispatch.01'|'Complaint Reported by Dispatch'|'2301061'|'Sick Person'|\n" +
        "'EMSDataSet'|'eDispatch.01'|'Complaint Reported by Dispatch'|'2301063'|'Stab/Gunshot Wound/Penetrating Trauma'|\n" +
        "'EMSDataSet'|'eDispatch.01'|'Complaint Reported by Dispatch'|'2301065'|'Standby'|\n" +
        "'EMSDataSet'|'eDispatch.01'|'Complaint Reported by Dispatch'|'2301067'|'Stroke/CVA'|\n" +
        "'EMSDataSet'|'eDispatch.01'|'Complaint Reported by Dispatch'|'2301069'|'Traffic/Transportation Incident'|\n" +
        "'EMSDataSet'|'eDispatch.01'|'Complaint Reported by Dispatch'|'2301071'|'Transfer/Interfacility/Palliative Care'|\n" +
        "'EMSDataSet'|'eDispatch.01'|'Complaint Reported by Dispatch'|'2301073'|'Traumatic Injury'|\n" +
        "'EMSDataSet'|'eDispatch.01'|'Complaint Reported by Dispatch'|'2301075'|'Well Person Check'|\n" +
        "'EMSDataSet'|'eDispatch.01'|'Complaint Reported by Dispatch'|'2301077'|'Unconscious/Fainting/Near-Fainting'|\n" +
        "'EMSDataSet'|'eDispatch.01'|'Complaint Reported by Dispatch'|'2301079'|'Unknown Problem/Person Down'|\n" +
        "'EMSDataSet'|'eDispatch.01'|'Complaint Reported by Dispatch'|'2301081'|'Drowning/Diving/SCUBA Accident'|\n" +
        "'EMSDataSet'|'eDispatch.01'|'Complaint Reported by Dispatch'|'2301083'|'Airmedical Transport'|\n" +
        "'EMSDataSet'|'eDispatch.02'|'EMD Performed'|'2302001'|'No'|\n" +
        "'EMSDataSet'|'eDispatch.02'|'EMD Performed'|'2302003'|'Yes, With Pre-Arrival Instructions'|\n" +
        "'EMSDataSet'|'eDispatch.02'|'EMD Performed'|'2302005'|'Yes, Without Pre-Arrival Instructions'|\n" +
        "'EMSDataSet'|'eDispatch.02'|'EMD Performed'|'2302007'|'Yes, Unknown if Pre-Arrival Instructions Given'|\n" +
        "'EMSDataSet'|'eDispatch.05'|'Dispatch Priority (Patient Acuity)'|'2305001'|'Critical'|\n" +
        "'EMSDataSet'|'eDispatch.05'|'Dispatch Priority (Patient Acuity)'|'2305003'|'Emergent'|\n" +
        "'EMSDataSet'|'eDispatch.05'|'Dispatch Priority (Patient Acuity)'|'2305005'|'Lower Acuity'|\n" +
        "'EMSDataSet'|'eDispatch.05'|'Dispatch Priority (Patient Acuity)'|'2305007'|'Non-Acute [e.g., Scheduled Transfer  or Standby]'|\n" +
        "'EMSDataSet'|'eCrew.02'|'Crew Member Level'|'9925001'|'2009 Advanced Emergency Medical Technician (AEMT)'|\n" +
        "'EMSDataSet'|'eCrew.02'|'Crew Member Level'|'9925003'|'2009 Emergency Medical Responder (EMR)'|\n" +
        "'EMSDataSet'|'eCrew.02'|'Crew Member Level'|'9925005'|'2009 Emergency Medical Technician (EMT)'|\n" +
        "'EMSDataSet'|'eCrew.02'|'Crew Member Level'|'9925007'|'2009 Paramedic'|\n" +
        "'EMSDataSet'|'eCrew.02'|'Crew Member Level'|'9925013'|'First Responder'|\n" +
        "'EMSDataSet'|'eCrew.02'|'Crew Member Level'|'9925015'|'EMT-Basic'|\n" +
        "'EMSDataSet'|'eCrew.02'|'Crew Member Level'|'9925017'|'EMT-Intermediate'|\n" +
        "'EMSDataSet'|'eCrew.02'|'Crew Member Level'|'9925019'|'EMT-Paramedic'|\n" +
        "'EMSDataSet'|'eCrew.02'|'Crew Member Level'|'9925023'|'Other Healthcare Professional'|\n" +
        "'EMSDataSet'|'eCrew.02'|'Crew Member Level'|'9925025'|'Other Non-Healthcare Professional'|\n" +
        "'EMSDataSet'|'eCrew.02'|'Crew Member Level'|'9925027'|'Physician'|\n" +
        "'EMSDataSet'|'eCrew.02'|'Crew Member Level'|'9925029'|'Respiratory Therapist'|\n" +
        "'EMSDataSet'|'eCrew.02'|'Crew Member Level'|'9925031'|'Student'|\n" +
        "'EMSDataSet'|'eCrew.02'|'Crew Member Level'|'9925033'|'Critical Care Paramedic'|\n" +
        "'EMSDataSet'|'eCrew.02'|'Crew Member Level'|'9925035'|'Community Paramedicine'|\n" +
        "'EMSDataSet'|'eCrew.02'|'Crew Member Level'|'9925037'|'Nurse Practitioner'|\n" +
        "'EMSDataSet'|'eCrew.02'|'Crew Member Level'|'9925039'|'Physician Assistant'|\n" +
        "'EMSDataSet'|'eCrew.02'|'Crew Member Level'|'9925041'|'Licensed Practical Nurse (LPN)'|\n" +
        "'EMSDataSet'|'eCrew.02'|'Crew Member Level'|'9925043'|'Registered Nurse'|\n" +
        "'EMSDataSet'|'eCrew.03'|'Crew Member Response Role'|'2403001'|'Driver/Pilot-Response'|\n" +
        "'EMSDataSet'|'eCrew.03'|'Crew Member Response Role'|'2403003'|'Driver/Pilot-Transport'|\n" +
        "'EMSDataSet'|'eCrew.03'|'Crew Member Response Role'|'2403005'|'Other'|\n" +
        "'EMSDataSet'|'eCrew.03'|'Crew Member Response Role'|'2403007'|'Other Patient Caregiver-At Scene'|\n" +
        "'EMSDataSet'|'eCrew.03'|'Crew Member Response Role'|'2403009'|'Other Patient Caregiver-Transport'|\n" +
        "'EMSDataSet'|'eCrew.03'|'Crew Member Response Role'|'2403011'|'Primary Patient Caregiver-At Scene'|\n" +
        "'EMSDataSet'|'eCrew.03'|'Crew Member Response Role'|'2403013'|'Primary Patient Caregiver-Transport'|\n" +
        "'EMSDataSet'|'ePatient.13'|'Gender'|'9906001'|'Female'|\n" +
        "'EMSDataSet'|'ePatient.13'|'Gender'|'9906003'|'Male'|\n" +
        "'EMSDataSet'|'ePatient.13'|'Gender'|'9906005'|'Unknown (Unable to Determine)'|\n" +
        "'EMSDataSet'|'ePatient.14'|'Race'|'2514001'|'American Indian or Alaska Native'|\n" +
        "'EMSDataSet'|'ePatient.14'|'Race'|'2514003'|'Asian'|\n" +
        "'EMSDataSet'|'ePatient.14'|'Race'|'2514005'|'Black or African American'|\n" +
        "'EMSDataSet'|'ePatient.14'|'Race'|'2514007'|'Hispanic or Latino'|\n" +
        "'EMSDataSet'|'ePatient.14'|'Race'|'2514009'|'Native Hawaiian or Other Pacific Islander'|\n" +
        "'EMSDataSet'|'ePatient.14'|'Race'|'2514011'|'White'|\n" +
        "'EMSDataSet'|'ePatient.16'|'Age Units'|'2516001'|'Days'|\n" +
        "'EMSDataSet'|'ePatient.16'|'Age Units'|'2516003'|'Hours'|\n" +
        "'EMSDataSet'|'ePatient.16'|'Age Units'|'2516005'|'Minutes'|\n" +
        "'EMSDataSet'|'ePatient.16'|'Age Units'|'2516007'|'Months'|\n" +
        "'EMSDataSet'|'ePatient.16'|'Age Units'|'2516009'|'Years'|\n" +
        "'EMSDataSet'|'ePayment.01'|'Primary Method of Payment'|'2601001'|'Insurance'|\n" +
        "'EMSDataSet'|'ePayment.01'|'Primary Method of Payment'|'2601003'|'Medicaid'|\n" +
        "'EMSDataSet'|'ePayment.01'|'Primary Method of Payment'|'2601005'|'Medicare'|\n" +
        "'EMSDataSet'|'ePayment.01'|'Primary Method of Payment'|'2601007'|'Not Billed (for any reason)'|\n" +
        "'EMSDataSet'|'ePayment.01'|'Primary Method of Payment'|'2601009'|'Other Government'|\n" +
        "'EMSDataSet'|'ePayment.01'|'Primary Method of Payment'|'2601011'|'Self Pay'|\n" +
        "'EMSDataSet'|'ePayment.01'|'Primary Method of Payment'|'2601013'|'Workers Compensation'|\n" +
        "'EMSDataSet'|'ePayment.01'|'Primary Method of Payment'|'2601015'|'Payment by Facility'|\n" +
        "'EMSDataSet'|'ePayment.01'|'Primary Method of Payment'|'2601017'|'Contracted Payment'|\n" +
        "'EMSDataSet'|'ePayment.01'|'Primary Method of Payment'|'2601019'|'Community Network'|\n" +
        "'EMSDataSet'|'ePayment.01'|'Primary Method of Payment'|'2601021'|'No Insurance Identified'|\n" +
        "'EMSDataSet'|'ePayment.01'|'Primary Method of Payment'|'2601023'|'Other Payment Option'|\n" +
        "'EMSDataSet'|'ePayment.02'|'Physician Certification Statement'|'9922001'|'No'|\n" +
        "'EMSDataSet'|'ePayment.02'|'Physician Certification Statement'|'9922003'|'Unknown'|\n" +
        "'EMSDataSet'|'ePayment.02'|'Physician Certification Statement'|'9922005'|'Yes'|\n" +
        "'EMSDataSet'|'ePayment.04'|'Reason for Physician Certification Statement'|'2604001'|'Bed Confined'|\n" +
        "'EMSDataSet'|'ePayment.04'|'Reason for Physician Certification Statement'|'2604003'|'Cardiac/Hemodynamic monitoring required during transport'|\n" +
        "'EMSDataSet'|'ePayment.04'|'Reason for Physician Certification Statement'|'2604005'|'Confused, combative, lethargic, comatose'|\n" +
        "'EMSDataSet'|'ePayment.04'|'Reason for Physician Certification Statement'|'2604007'|'Contractures'|\n" +
        "'EMSDataSet'|'ePayment.04'|'Reason for Physician Certification Statement'|'2604009'|'Danger to self or others-monitoring'|\n" +
        "'EMSDataSet'|'ePayment.04'|'Reason for Physician Certification Statement'|'2604011'|'Danger to self or others-seclusion (flight risk)'|\n" +
        "'EMSDataSet'|'ePayment.04'|'Reason for Physician Certification Statement'|'2604013'|'DVT requires elevation of lower extremity'|\n" +
        "'EMSDataSet'|'ePayment.04'|'Reason for Physician Certification Statement'|'2604015'|'IV medications/fluids required during transport'|\n" +
        "'EMSDataSet'|'ePayment.04'|'Reason for Physician Certification Statement'|'2604017'|'Moderate to severe pain on movement'|\n" +
        "'EMSDataSet'|'ePayment.04'|'Reason for Physician Certification Statement'|'2604019'|'Morbid Obesity requires additional personnel/equipment to handle'|\n" +
        "'EMSDataSet'|'ePayment.04'|'Reason for Physician Certification Statement'|'2604021'|'Non-healing fractures'|\n" +
        "'EMSDataSet'|'ePayment.04'|'Reason for Physician Certification Statement'|'2604023'|'Orthopedic device (backboard, halo, use of pins in traction, etc.) requiring special handling in transit'|\n" +
        "'EMSDataSet'|'ePayment.04'|'Reason for Physician Certification Statement'|'2604025'|'Restraints (Physical or Chemical) anticipated or used during transport'|\n" +
        "'EMSDataSet'|'ePayment.04'|'Reason for Physician Certification Statement'|'2604027'|'Risk of falling off wheelchair or stretcher while in motion (not related to obesity)'|\n" +
        "'EMSDataSet'|'ePayment.04'|'Reason for Physician Certification Statement'|'2604029'|'Severe Muscular weakness and de-conditioned state precludes any significant physical activity'|\n" +
        "'EMSDataSet'|'ePayment.04'|'Reason for Physician Certification Statement'|'2604031'|'Special handling en route-Isolation'|\n" +
        "'EMSDataSet'|'ePayment.04'|'Reason for Physician Certification Statement'|'2604033'|'Third Party assistance/attendant required to apply, administer, or regulate or adjust oxygen en route'|\n" +
        "'EMSDataSet'|'ePayment.04'|'Reason for Physician Certification Statement'|'2604035'|'Unable to maintain erect sitting position in a chair for time needed to transport, due to moderate muscular weakness and de-conditioning.'|\n" +
        "'EMSDataSet'|'ePayment.04'|'Reason for Physician Certification Statement'|'2604037'|'Unable to sit in chair or wheelchair due to Grade II or greater decubitus ulcers on buttocks.'|\n" +
        "'EMSDataSet'|'ePayment.05'|'Healthcare Provider Type Signing Physician Certification Statement'|'2605001'|'Clinical Nurse Specialist'|\n" +
        "'EMSDataSet'|'ePayment.05'|'Healthcare Provider Type Signing Physician Certification Statement'|'2605003'|'Discharge Planner'|\n" +
        "'EMSDataSet'|'ePayment.05'|'Healthcare Provider Type Signing Physician Certification Statement'|'2605005'|'Physician (MD or DO)'|\n" +
        "'EMSDataSet'|'ePayment.05'|'Healthcare Provider Type Signing Physician Certification Statement'|'2605007'|'Physician Assistant'|\n" +
        "'EMSDataSet'|'ePayment.05'|'Healthcare Provider Type Signing Physician Certification Statement'|'2605009'|'Registered Nurse'|\n" +
        "'EMSDataSet'|'ePayment.05'|'Healthcare Provider Type Signing Physician Certification Statement'|'2605011'|'Registered Nurse Practitioner'|\n" +
        "'EMSDataSet'|'ePayment.08'|'Patient Resides in Service Area'|'2608001'|'Resident Within EMS Service Area'|\n" +
        "'EMSDataSet'|'ePayment.08'|'Patient Resides in Service Area'|'2608003'|'Not a Resident Within EMS Service Area'|\n" +
        "'EMSDataSet'|'ePayment.11'|'Insurance Company Billing Priority'|'2611001'|'Other'|\n" +
        "'EMSDataSet'|'ePayment.11'|'Insurance Company Billing Priority'|'2611003'|'Primary'|\n" +
        "'EMSDataSet'|'ePayment.11'|'Insurance Company Billing Priority'|'2611005'|'Secondary'|\n" +
        "'EMSDataSet'|'ePayment.11'|'Insurance Company Billing Priority'|'2611007'|'Tertiary'|\n" +
        "'EMSDataSet'|'ePayment.11'|'Insurance Company Billing Priority'|'2611009'|'Payer Responsibility Four'|\n" +
        "'EMSDataSet'|'ePayment.11'|'Insurance Company Billing Priority'|'2611011'|'Payer Responsibility Five'|\n" +
        "'EMSDataSet'|'ePayment.11'|'Insurance Company Billing Priority'|'2611013'|'Payer Responsibility Six'|\n" +
        "'EMSDataSet'|'ePayment.11'|'Insurance Company Billing Priority'|'2611015'|'Payer Responsibility Seven'|\n" +
        "'EMSDataSet'|'ePayment.11'|'Insurance Company Billing Priority'|'2611017'|'Payer Responsibility Eight'|\n" +
        "'EMSDataSet'|'ePayment.11'|'Insurance Company Billing Priority'|'2611019'|'Payer Responsibility Nine'|\n" +
        "'EMSDataSet'|'ePayment.11'|'Insurance Company Billing Priority'|'2611021'|'Payer Responsibility Ten'|\n" +
        "'EMSDataSet'|'ePayment.11'|'Insurance Company Billing Priority'|'2611023'|'Payer Responsibility Eleven'|\n" +
        "'EMSDataSet'|'ePayment.11'|'Insurance Company Billing Priority'|'2611025'|'Unknown'|\n" +
        "'EMSDataSet'|'ePayment.22'|'Relationship to the Insured'|'2622001'|'Self'|\n" +
        "'EMSDataSet'|'ePayment.22'|'Relationship to the Insured'|'2622003'|'Spouse'|\n" +
        "'EMSDataSet'|'ePayment.22'|'Relationship to the Insured'|'2622005'|'Child/Dependent'|\n" +
        "'EMSDataSet'|'ePayment.22'|'Relationship to the Insured'|'2622009'|'Cadaver Donor'|\n" +
        "'EMSDataSet'|'ePayment.22'|'Relationship to the Insured'|'2622011'|'Employee'|\n" +
        "'EMSDataSet'|'ePayment.22'|'Relationship to the Insured'|'2622013'|'Life/Domestic Partner'|\n" +
        "'EMSDataSet'|'ePayment.22'|'Relationship to the Insured'|'2622015'|'Organ Donor'|\n" +
        "'EMSDataSet'|'ePayment.22'|'Relationship to the Insured'|'2622017'|'Unknown'|\n" +
        "'EMSDataSet'|'ePayment.22'|'Relationship to the Insured'|'2622019'|'Other Relationship'|\n" +
        "'EMSDataSet'|'ePayment.32'|'Closest Relative/ Guardian Relationship'|'2632001'|'Appointed Guardian'|\n" +
        "'EMSDataSet'|'ePayment.32'|'Closest Relative/ Guardian Relationship'|'2632003'|'Child/Dependent'|\n" +
        "'EMSDataSet'|'ePayment.32'|'Closest Relative/ Guardian Relationship'|'2632005'|'Father'|\n" +
        "'EMSDataSet'|'ePayment.32'|'Closest Relative/ Guardian Relationship'|'2632007'|'Mother'|\n" +
        "'EMSDataSet'|'ePayment.32'|'Closest Relative/ Guardian Relationship'|'2632009'|'Other (Non-Relative)'|\n" +
        "'EMSDataSet'|'ePayment.32'|'Closest Relative/ Guardian Relationship'|'2632011'|'Other (Relative)'|\n" +
        "'EMSDataSet'|'ePayment.32'|'Closest Relative/ Guardian Relationship'|'2632013'|'Sibling'|\n" +
        "'EMSDataSet'|'ePayment.32'|'Closest Relative/ Guardian Relationship'|'2632015'|'Spouse'|\n" +
        "'EMSDataSet'|'ePayment.32'|'Closest Relative/ Guardian Relationship'|'2632017'|'Employee'|\n" +
        "'EMSDataSet'|'ePayment.32'|'Closest Relative/ Guardian Relationship'|'2632019'|'Life/Domestic Partner'|\n" +
        "'EMSDataSet'|'ePayment.32'|'Closest Relative/ Guardian Relationship'|'2632021'|'Unknown'|\n" +
        "'EMSDataSet'|'ePayment.40'|'Response Urgency'|'2640001'|'Immediate'|\n" +
        "'EMSDataSet'|'ePayment.40'|'Response Urgency'|'2640003'|'Non-Immediate'|\n" +
        "'EMSDataSet'|'ePayment.41'|'Patient Transport Assessment'|'2641001'|'Unable to sit without assistance'|\n" +
        "'EMSDataSet'|'ePayment.41'|'Patient Transport Assessment'|'2641003'|'Unable to stand without assistance'|\n" +
        "'EMSDataSet'|'ePayment.41'|'Patient Transport Assessment'|'2641005'|'Unable to walk without assistance'|\n" +
        "'EMSDataSet'|'ePayment.42'|'Specialty Care Transport Care Provider'|'2642001'|'Advanced EMT-Paramedic'|\n" +
        "'EMSDataSet'|'ePayment.42'|'Specialty Care Transport Care Provider'|'2642003'|'Nurse'|\n" +
        "'EMSDataSet'|'ePayment.42'|'Specialty Care Transport Care Provider'|'2642005'|'Nurse Practitioner'|\n" +
        "'EMSDataSet'|'ePayment.42'|'Specialty Care Transport Care Provider'|'2642007'|'Physician (MD, DO)'|\n" +
        "'EMSDataSet'|'ePayment.42'|'Specialty Care Transport Care Provider'|'2642009'|'Physician Assistant'|\n" +
        "'EMSDataSet'|'ePayment.42'|'Specialty Care Transport Care Provider'|'2642011'|'2009 Emergency Medical Responder (EMR)'|\n" +
        "'EMSDataSet'|'ePayment.42'|'Specialty Care Transport Care Provider'|'2642013'|'2009 Emergency Medical Technician (EMT)'|\n" +
        "'EMSDataSet'|'ePayment.42'|'Specialty Care Transport Care Provider'|'2642015'|'2009 Advanced Emergency Medical Technician (AEMT)'|\n" +
        "'EMSDataSet'|'ePayment.42'|'Specialty Care Transport Care Provider'|'2642017'|'2009 Paramedic'|\n" +
        "'EMSDataSet'|'ePayment.42'|'Specialty Care Transport Care Provider'|'2642019'|'First Responder'|\n" +
        "'EMSDataSet'|'ePayment.42'|'Specialty Care Transport Care Provider'|'2642021'|'EMT-Basic'|\n" +
        "'EMSDataSet'|'ePayment.42'|'Specialty Care Transport Care Provider'|'2642023'|'EMT-Intermediate'|\n" +
        "'EMSDataSet'|'ePayment.42'|'Specialty Care Transport Care Provider'|'2642025'|'EMT-Paramedic'|\n" +
        "'EMSDataSet'|'ePayment.42'|'Specialty Care Transport Care Provider'|'2642027'|'Other Healthcare Professional'|\n" +
        "'EMSDataSet'|'ePayment.42'|'Specialty Care Transport Care Provider'|'2642029'|'Other Non-Healthcare Professional'|\n" +
        "'EMSDataSet'|'ePayment.42'|'Specialty Care Transport Care Provider'|'2642031'|'Respiratory Therapist'|\n" +
        "'EMSDataSet'|'ePayment.42'|'Specialty Care Transport Care Provider'|'2642033'|'Student'|\n" +
        "'EMSDataSet'|'ePayment.42'|'Specialty Care Transport Care Provider'|'2642035'|'Critical Care Paramedic'|\n" +
        "'EMSDataSet'|'ePayment.42'|'Specialty Care Transport Care Provider'|'2642037'|'Community Paramedicine'|\n" +
        "'EMSDataSet'|'ePayment.42'|'Specialty Care Transport Care Provider'|'2642039'|'Registered Nurse'|\n" +
        "'EMSDataSet'|'ePayment.44'|'Ambulance Transport Reason Code'|'A'|'Patient was transported to the nearest facility for care of symptoms, complaints, or both'|\n" +
        "'EMSDataSet'|'ePayment.44'|'Ambulance Transport Reason Code'|'B'|'Patient was transported for the benefit of a preferred physician'|\n" +
        "'EMSDataSet'|'ePayment.44'|'Ambulance Transport Reason Code'|'C'|'Patient was transported for the nearness of family members'|\n" +
        "'EMSDataSet'|'ePayment.44'|'Ambulance Transport Reason Code'|'D'|'Patient was transported for the care of a specialist or for availability of equipment'|\n" +
        "'EMSDataSet'|'ePayment.44'|'Ambulance Transport Reason Code'|'E'|'Patient was transferred to a Rehabilitation Facility'|\n" +
        "'EMSDataSet'|'ePayment.47'|'Ambulance Conditions Indicator'|'01'|'Patient was admitted to a hospital'|\n" +
        "'EMSDataSet'|'ePayment.47'|'Ambulance Conditions Indicator'|'04'|'Patient was moved by stretcher'|\n" +
        "'EMSDataSet'|'ePayment.47'|'Ambulance Conditions Indicator'|'05'|'Patient was unconscious or in shock'|\n" +
        "'EMSDataSet'|'ePayment.47'|'Ambulance Conditions Indicator'|'06'|'Patient was transported in an emergency situation'|\n" +
        "'EMSDataSet'|'ePayment.47'|'Ambulance Conditions Indicator'|'07'|'Patient had to be physically restrained'|\n" +
        "'EMSDataSet'|'ePayment.47'|'Ambulance Conditions Indicator'|'08'|'Patient had visible hemorrhaging'|\n" +
        "'EMSDataSet'|'ePayment.47'|'Ambulance Conditions Indicator'|'09'|'Ambulance service was medically necessary'|\n" +
        "'EMSDataSet'|'ePayment.47'|'Ambulance Conditions Indicator'|'12'|'Patient is confined to a bed or chair (Use code 12 to indicate patient was bedridden during transport.)'|\n" +
        "'EMSDataSet'|'ePayment.49'|'ALS Assessment Performed and Warranted'|'9923001'|'No'|\n" +
        "'EMSDataSet'|'ePayment.49'|'ALS Assessment Performed and Warranted'|'9923003'|'Yes'|\n" +
        "'EMSDataSet'|'ePayment.50'|'CMS Service Level'|'2650001'|'ALS, Level 1'|\n" +
        "'EMSDataSet'|'ePayment.50'|'CMS Service Level'|'2650003'|'ALS, Level 1 Emergency'|\n" +
        "'EMSDataSet'|'ePayment.50'|'CMS Service Level'|'2650005'|'ALS, Level 2'|\n" +
        "'EMSDataSet'|'ePayment.50'|'CMS Service Level'|'2650007'|'BLS'|\n" +
        "'EMSDataSet'|'ePayment.50'|'CMS Service Level'|'2650009'|'BLS, Emergency'|\n" +
        "'EMSDataSet'|'ePayment.50'|'CMS Service Level'|'2650011'|'Fixed Wing (Airplane)'|\n" +
        "'EMSDataSet'|'ePayment.50'|'CMS Service Level'|'2650013'|'Paramedic Intercept'|\n" +
        "'EMSDataSet'|'ePayment.50'|'CMS Service Level'|'2650015'|'Specialty Care Transport'|\n" +
        "'EMSDataSet'|'ePayment.50'|'CMS Service Level'|'2650017'|'Rotary Wing (Helicopter)'|\n" +
        "'EMSDataSet'|'ePayment.52'|'CMS Transportation Indicator'|'C1'|'Interfacility Transport (Requires Higher level of care)'|\n" +
        "'EMSDataSet'|'ePayment.52'|'CMS Transportation Indicator'|'C2'|'Interfacility Transport (service not available)'|\n" +
        "'EMSDataSet'|'ePayment.52'|'CMS Transportation Indicator'|'C3'|'Emergency Trauma Dispatch Condition Code (Major Incident or Mechanism of Injury)'|\n" +
        "'EMSDataSet'|'ePayment.52'|'CMS Transportation Indicator'|'C4'|'Medically Necessary Transport (Facility on Divert or Services Unavailable)'|\n" +
        "'EMSDataSet'|'ePayment.52'|'CMS Transportation Indicator'|'C5'|'BLS Transport of ALS Patient (ALS not available)'|\n" +
        "'EMSDataSet'|'ePayment.52'|'CMS Transportation Indicator'|'C6'|'ALS Response (Based on Dispatch Info) to BLS Patient (Condition)'|\n" +
        "'EMSDataSet'|'ePayment.52'|'CMS Transportation Indicator'|'C7'|'IV Medications required en route (ALS)'|\n" +
        "'EMSDataSet'|'ePayment.52'|'CMS Transportation Indicator'|'D1'|'Long Distance-patient's condition requires rapid transportation over a long distance'|\n" +
        "'EMSDataSet'|'ePayment.52'|'CMS Transportation Indicator'|'D2'|'Rare Circumstances, Traffic Patterns Precludes Ground Transport'|\n" +
        "'EMSDataSet'|'ePayment.52'|'CMS Transportation Indicator'|'D3'|'Time to the closest appropriate hospital due to the patient's condition precludes ground transport; maximize clinical benefits'|\n" +
        "'EMSDataSet'|'ePayment.52'|'CMS Transportation Indicator'|'D4'|'Pick up Point not Accessible by Ground Transport'|\n" +
        "'EMSDataSet'|'ePayment.57'|'Payer Type'|'11'|'Other Non-Federal Programs'|\n" +
        "'EMSDataSet'|'ePayment.57'|'Payer Type'|'12'|'Preferred Provider Organization (PPO)'|\n" +
        "'EMSDataSet'|'ePayment.57'|'Payer Type'|'13'|'Point of Service (POS)'|\n" +
        "'EMSDataSet'|'ePayment.57'|'Payer Type'|'14'|'Exclusive Provider Organization (EPO)'|\n" +
        "'EMSDataSet'|'ePayment.57'|'Payer Type'|'15'|'Indemnity Insurance'|\n" +
        "'EMSDataSet'|'ePayment.57'|'Payer Type'|'16'|'Health Maintenance Organization (HMO) Medicare Risk'|\n" +
        "'EMSDataSet'|'ePayment.57'|'Payer Type'|'17'|'Dental Maintenance Organization'|\n" +
        "'EMSDataSet'|'ePayment.57'|'Payer Type'|'AM'|'Automobile Medical'|\n" +
        "'EMSDataSet'|'ePayment.57'|'Payer Type'|'BL'|'Blue Cross/Blue Shield'|\n" +
        "'EMSDataSet'|'ePayment.57'|'Payer Type'|'CH'|'Champus'|\n" +
        "'EMSDataSet'|'ePayment.57'|'Payer Type'|'CI'|'Commercial Insurance Co.'|\n" +
        "'EMSDataSet'|'ePayment.57'|'Payer Type'|'DS'|'Disability'|\n" +
        "'EMSDataSet'|'ePayment.57'|'Payer Type'|'FI'|'Federal Employees Program'|\n" +
        "'EMSDataSet'|'ePayment.57'|'Payer Type'|'HM'|'Health Maintenance Organization'|\n" +
        "'EMSDataSet'|'ePayment.57'|'Payer Type'|'LM'|'Liability Medical'|\n" +
        "'EMSDataSet'|'ePayment.57'|'Payer Type'|'MA'|'Medicare Part A'|\n" +
        "'EMSDataSet'|'ePayment.57'|'Payer Type'|'MB'|'Medicare Part B'|\n" +
        "'EMSDataSet'|'ePayment.57'|'Payer Type'|'MC'|'Medicaid'|\n" +
        "'EMSDataSet'|'ePayment.57'|'Payer Type'|'OF'|'Other Federal Program'|\n" +
        "'EMSDataSet'|'ePayment.57'|'Payer Type'|'TV'|'Title V'|\n" +
        "'EMSDataSet'|'ePayment.57'|'Payer Type'|'VA'|'Veteran Affairs Plan'|\n" +
        "'EMSDataSet'|'ePayment.57'|'Payer Type'|'WC'|'Workers' Compensation Health Claim'|\n" +
        "'EMSDataSet'|'ePayment.57'|'Payer Type'|'ZZ'|'Mutually Defined'|\n" +
        "'EMSDataSet'|'eScene.01'|'First EMS Unit on Scene'|'9923001'|'No'|\n" +
        "'EMSDataSet'|'eScene.01'|'First EMS Unit on Scene'|'9923003'|'Yes'|\n" +
        "'EMSDataSet'|'eScene.04'|'Type of Other Service at Scene'|'2704001'|'EMS Mutual Aid'|\n" +
        "'EMSDataSet'|'eScene.04'|'Type of Other Service at Scene'|'2704003'|'Fire'|\n" +
        "'EMSDataSet'|'eScene.04'|'Type of Other Service at Scene'|'2704005'|'First Responder'|\n" +
        "'EMSDataSet'|'eScene.04'|'Type of Other Service at Scene'|'2704007'|'Hazmat'|\n" +
        "'EMSDataSet'|'eScene.04'|'Type of Other Service at Scene'|'2704009'|'Law'|\n" +
        "'EMSDataSet'|'eScene.04'|'Type of Other Service at Scene'|'2704011'|'Other'|\n" +
        "'EMSDataSet'|'eScene.04'|'Type of Other Service at Scene'|'2704013'|'Other EMS Agency'|\n" +
        "'EMSDataSet'|'eScene.04'|'Type of Other Service at Scene'|'2704015'|'Other Health Care Provider'|\n" +
        "'EMSDataSet'|'eScene.04'|'Type of Other Service at Scene'|'2704017'|'Rescue'|\n" +
        "'EMSDataSet'|'eScene.04'|'Type of Other Service at Scene'|'2704019'|'Utilities'|\n" +
        "'EMSDataSet'|'eScene.06'|'Number of Patients at Scene'|'2707001'|'Multiple'|\n" +
        "'EMSDataSet'|'eScene.06'|'Number of Patients at Scene'|'2707003'|'None'|\n" +
        "'EMSDataSet'|'eScene.06'|'Number of Patients at Scene'|'2707005'|'Single'|\n" +
        "'EMSDataSet'|'eScene.07'|'Mass Casualty Incident'|'9923001'|'No'|\n" +
        "'EMSDataSet'|'eScene.07'|'Mass Casualty Incident'|'9923003'|'Yes'|\n" +
        "'EMSDataSet'|'eScene.08'|'Triage Classification for MCI Patient'|'2708001'|'Red - Immediate'|\n" +
        "'EMSDataSet'|'eScene.08'|'Triage Classification for MCI Patient'|'2708003'|'Yellow - Delayed'|\n" +
        "'EMSDataSet'|'eScene.08'|'Triage Classification for MCI Patient'|'2708005'|'Green - Minimal (Minor)'|\n" +
        "'EMSDataSet'|'eScene.08'|'Triage Classification for MCI Patient'|'2708007'|'Gray - Expectant'|\n" +
        "'EMSDataSet'|'eScene.08'|'Triage Classification for MCI Patient'|'2708009'|'Black - Deceased'|\n" +
        "'EMSDataSet'|'eSituation.02'|'Possible Injury'|'9922001'|'No'|\n" +
        "'EMSDataSet'|'eSituation.02'|'Possible Injury'|'9922003'|'Unknown'|\n" +
        "'EMSDataSet'|'eSituation.02'|'Possible Injury'|'9922005'|'Yes'|\n" +
        "'EMSDataSet'|'eSituation.03'|'Complaint Type'|'2803001'|'Chief (Primary)'|\n" +
        "'EMSDataSet'|'eSituation.03'|'Complaint Type'|'2803003'|'Other'|\n" +
        "'EMSDataSet'|'eSituation.03'|'Complaint Type'|'2803005'|'Secondary'|\n" +
        "'EMSDataSet'|'eSituation.06'|'Time Units of Duration of Complaint'|'2806001'|'Seconds'|\n" +
        "'EMSDataSet'|'eSituation.06'|'Time Units of Duration of Complaint'|'2806003'|'Minutes'|\n" +
        "'EMSDataSet'|'eSituation.06'|'Time Units of Duration of Complaint'|'2806005'|'Hours'|\n" +
        "'EMSDataSet'|'eSituation.06'|'Time Units of Duration of Complaint'|'2806007'|'Days'|\n" +
        "'EMSDataSet'|'eSituation.06'|'Time Units of Duration of Complaint'|'2806009'|'Weeks'|\n" +
        "'EMSDataSet'|'eSituation.06'|'Time Units of Duration of Complaint'|'2806011'|'Months'|\n" +
        "'EMSDataSet'|'eSituation.06'|'Time Units of Duration of Complaint'|'2806013'|'Years'|\n" +
        "'EMSDataSet'|'eSituation.07'|'Chief Complaint Anatomic Location'|'2807001'|'Abdomen'|\n" +
        "'EMSDataSet'|'eSituation.07'|'Chief Complaint Anatomic Location'|'2807003'|'Back'|\n" +
        "'EMSDataSet'|'eSituation.07'|'Chief Complaint Anatomic Location'|'2807005'|'Chest'|\n" +
        "'EMSDataSet'|'eSituation.07'|'Chief Complaint Anatomic Location'|'2807007'|'Extremity-Lower'|\n" +
        "'EMSDataSet'|'eSituation.07'|'Chief Complaint Anatomic Location'|'2807009'|'Extremity-Upper'|\n" +
        "'EMSDataSet'|'eSituation.07'|'Chief Complaint Anatomic Location'|'2807011'|'General/Global'|\n" +
        "'EMSDataSet'|'eSituation.07'|'Chief Complaint Anatomic Location'|'2807013'|'Genitalia'|\n" +
        "'EMSDataSet'|'eSituation.07'|'Chief Complaint Anatomic Location'|'2807015'|'Head'|\n" +
        "'EMSDataSet'|'eSituation.07'|'Chief Complaint Anatomic Location'|'2807017'|'Neck'|\n" +
        "'EMSDataSet'|'eSituation.08'|'Chief Complaint Organ System'|'2808001'|'Behavioral/Psychiatric'|\n" +
        "'EMSDataSet'|'eSituation.08'|'Chief Complaint Organ System'|'2808003'|'Cardiovascular'|\n" +
        "'EMSDataSet'|'eSituation.08'|'Chief Complaint Organ System'|'2808005'|'CNS/Neuro'|\n" +
        "'EMSDataSet'|'eSituation.08'|'Chief Complaint Organ System'|'2808007'|'Endocrine/Metabolic'|\n" +
        "'EMSDataSet'|'eSituation.08'|'Chief Complaint Organ System'|'2808009'|'GI'|\n" +
        "'EMSDataSet'|'eSituation.08'|'Chief Complaint Organ System'|'2808011'|'Global/General'|\n" +
        "'EMSDataSet'|'eSituation.08'|'Chief Complaint Organ System'|'2808013'|'Lymphatic/Immune'|\n" +
        "'EMSDataSet'|'eSituation.08'|'Chief Complaint Organ System'|'2808015'|'Musculoskeletal/Skin'|\n" +
        "'EMSDataSet'|'eSituation.08'|'Chief Complaint Organ System'|'2808017'|'Reproductive'|\n" +
        "'EMSDataSet'|'eSituation.08'|'Chief Complaint Organ System'|'2808019'|'Pulmonary'|\n" +
        "'EMSDataSet'|'eSituation.08'|'Chief Complaint Organ System'|'2808021'|'Renal'|\n" +
        "'EMSDataSet'|'eSituation.13'|'Initial Patient Acuity'|'2813001'|'Critical (Red)'|\n" +
        "'EMSDataSet'|'eSituation.13'|'Initial Patient Acuity'|'2813003'|'Emergent (Yellow)'|\n" +
        "'EMSDataSet'|'eSituation.13'|'Initial Patient Acuity'|'2813005'|'Lower Acuity (Green)'|\n" +
        "'EMSDataSet'|'eSituation.13'|'Initial Patient Acuity'|'2813007'|'Dead without Resuscitation Efforts (Black)'|\n" +
        "'EMSDataSet'|'eSituation.14'|'Work-Related Illness/Injury'|'9922001'|'No'|\n" +
        "'EMSDataSet'|'eSituation.14'|'Work-Related Illness/Injury'|'9922003'|'Unknown'|\n" +
        "'EMSDataSet'|'eSituation.14'|'Work-Related Illness/Injury'|'9922005'|'Yes'|\n" +
        "'EMSDataSet'|'eSituation.15'|'Patient's Occupational Industry'|'2815001'|'Accommodation and Food Services'|\n" +
        "'EMSDataSet'|'eSituation.15'|'Patient's Occupational Industry'|'2815003'|'Administrative and Support and Waste Management and Remediation Services'|\n" +
        "'EMSDataSet'|'eSituation.15'|'Patient's Occupational Industry'|'2815005'|'Agriculture, Forestry, Fishing and Hunting'|\n" +
        "'EMSDataSet'|'eSituation.15'|'Patient's Occupational Industry'|'2815007'|'Arts, Entertainment, and Recreation'|\n" +
        "'EMSDataSet'|'eSituation.15'|'Patient's Occupational Industry'|'2815009'|'Construction'|\n" +
        "'EMSDataSet'|'eSituation.15'|'Patient's Occupational Industry'|'2815011'|'Educational Services'|\n" +
        "'EMSDataSet'|'eSituation.15'|'Patient's Occupational Industry'|'2815013'|'Finance and Insurance'|\n" +
        "'EMSDataSet'|'eSituation.15'|'Patient's Occupational Industry'|'2815015'|'Health Care and Social Assistance'|\n" +
        "'EMSDataSet'|'eSituation.15'|'Patient's Occupational Industry'|'2815017'|'Information'|\n" +
        "'EMSDataSet'|'eSituation.15'|'Patient's Occupational Industry'|'2815019'|'Management of Companies and Enterprises'|\n" +
        "'EMSDataSet'|'eSituation.15'|'Patient's Occupational Industry'|'2815021'|'Manufacturing'|\n" +
        "'EMSDataSet'|'eSituation.15'|'Patient's Occupational Industry'|'2815023'|'Mining, Quarrying, and Oil and Gas Extraction'|\n" +
        "'EMSDataSet'|'eSituation.15'|'Patient's Occupational Industry'|'2815025'|'Other Services (except Public Administration)'|\n" +
        "'EMSDataSet'|'eSituation.15'|'Patient's Occupational Industry'|'2815027'|'Professional, Scientific, and Technical Services'|\n" +
        "'EMSDataSet'|'eSituation.15'|'Patient's Occupational Industry'|'2815029'|'Public Administration'|\n" +
        "'EMSDataSet'|'eSituation.15'|'Patient's Occupational Industry'|'2815031'|'Real Estate and Rental and Leasing'|\n" +
        "'EMSDataSet'|'eSituation.15'|'Patient's Occupational Industry'|'2815033'|'Retail Trade'|\n" +
        "'EMSDataSet'|'eSituation.15'|'Patient's Occupational Industry'|'2815035'|'Transportation and Warehousing'|\n" +
        "'EMSDataSet'|'eSituation.15'|'Patient's Occupational Industry'|'2815037'|'Utilities'|\n" +
        "'EMSDataSet'|'eSituation.15'|'Patient's Occupational Industry'|'2815039'|'Wholesale Trade'|\n" +
        "'EMSDataSet'|'eSituation.16'|'Patient's Occupation'|'2816001'|'Architecture and Engineering Occupations'|\n" +
        "'EMSDataSet'|'eSituation.16'|'Patient's Occupation'|'2816003'|'Arts, Design, Entertainment, Sports, and Media Occupations'|\n" +
        "'EMSDataSet'|'eSituation.16'|'Patient's Occupation'|'2816005'|'Building and Grounds Cleaning and Maintenance Occupations'|\n" +
        "'EMSDataSet'|'eSituation.16'|'Patient's Occupation'|'2816007'|'Business and Financial Operations Occupations'|\n" +
        "'EMSDataSet'|'eSituation.16'|'Patient's Occupation'|'2816009'|'Community and Social Services Occupations'|\n" +
        "'EMSDataSet'|'eSituation.16'|'Patient's Occupation'|'2816011'|'Computer and Mathematical Occupations'|\n" +
        "'EMSDataSet'|'eSituation.16'|'Patient's Occupation'|'2816013'|'Construction and Extraction Occupations'|\n" +
        "'EMSDataSet'|'eSituation.16'|'Patient's Occupation'|'2816015'|'Education, Training, and Library Occupations'|\n" +
        "'EMSDataSet'|'eSituation.16'|'Patient's Occupation'|'2816017'|'Farming, Fishing and Forestry Occupations'|\n" +
        "'EMSDataSet'|'eSituation.16'|'Patient's Occupation'|'2816019'|'Food Preparation and Serving Related Occupations'|\n" +
        "'EMSDataSet'|'eSituation.16'|'Patient's Occupation'|'2816021'|'Healthcare Practitioners and Technical Occupations'|\n" +
        "'EMSDataSet'|'eSituation.16'|'Patient's Occupation'|'2816023'|'Healthcare Support Occupations'|\n" +
        "'EMSDataSet'|'eSituation.16'|'Patient's Occupation'|'2816025'|'Installation, Maintenance, and Repair Occupations'|\n" +
        "'EMSDataSet'|'eSituation.16'|'Patient's Occupation'|'2816027'|'Legal Occupations'|\n" +
        "'EMSDataSet'|'eSituation.16'|'Patient's Occupation'|'2816029'|'Life, Physical, and Social Science Occupations'|\n" +
        "'EMSDataSet'|'eSituation.16'|'Patient's Occupation'|'2816031'|'Management Occupations'|\n" +
        "'EMSDataSet'|'eSituation.16'|'Patient's Occupation'|'2816033'|'Military Specific Occupations'|\n" +
        "'EMSDataSet'|'eSituation.16'|'Patient's Occupation'|'2816035'|'Office and Administrative Support Occupations'|\n" +
        "'EMSDataSet'|'eSituation.16'|'Patient's Occupation'|'2816037'|'Personal Care and Service Occupations'|\n" +
        "'EMSDataSet'|'eSituation.16'|'Patient's Occupation'|'2816039'|'Production Occupations'|\n" +
        "'EMSDataSet'|'eSituation.16'|'Patient's Occupation'|'2816041'|'Protective Service Occupations'|\n" +
        "'EMSDataSet'|'eSituation.16'|'Patient's Occupation'|'2816043'|'Sales and Related Occupations'|\n" +
        "'EMSDataSet'|'eSituation.16'|'Patient's Occupation'|'2816045'|'Transportation and Material Moving Occupations'|\n" +
        "'EMSDataSet'|'eInjury.02'|'Mechanism of Injury'|'2902001'|'Blunt'|\n" +
        "'EMSDataSet'|'eInjury.02'|'Mechanism of Injury'|'2902003'|'Burn'|\n" +
        "'EMSDataSet'|'eInjury.02'|'Mechanism of Injury'|'2902005'|'Other'|\n" +
        "'EMSDataSet'|'eInjury.02'|'Mechanism of Injury'|'2902007'|'Penetrating'|\n" +
        "'EMSDataSet'|'eInjury.03'|'Trauma Center Criteria'|'2903001'|'Amputation proximal to wrist or ankle'|\n" +
        "'EMSDataSet'|'eInjury.03'|'Trauma Center Criteria'|'2903003'|'Crushed, degloved, mangled, or pulseless extremity'|\n" +
        "'EMSDataSet'|'eInjury.03'|'Trauma Center Criteria'|'2903005'|'Chest wall instability or deformity (e.g., flail chest)'|\n" +
        "'EMSDataSet'|'eInjury.03'|'Trauma Center Criteria'|'2903007'|'Glasgow Coma Score <= 13'|\n" +
        "'EMSDataSet'|'eInjury.03'|'Trauma Center Criteria'|'2903009'|'Open or depressed skull fracture'|\n" +
        "'EMSDataSet'|'eInjury.03'|'Trauma Center Criteria'|'2903011'|'Paralysis'|\n" +
        "'EMSDataSet'|'eInjury.03'|'Trauma Center Criteria'|'2903013'|'Pelvic fractures'|\n" +
        "'EMSDataSet'|'eInjury.03'|'Trauma Center Criteria'|'2903015'|'All penetrating injuries to  head, neck, torso, and extremities proximal to elbow or knee'|\n" +
        "'EMSDataSet'|'eInjury.03'|'Trauma Center Criteria'|'2903017'|'Respiratory Rate  <10 or >29 breaths per minute (<20 in infants aged <1 year) or need for ventilatory support'|\n" +
        "'EMSDataSet'|'eInjury.03'|'Trauma Center Criteria'|'2903019'|'Systolic Blood Pressure <90 mmHg'|\n" +
        "'EMSDataSet'|'eInjury.03'|'Trauma Center Criteria'|'2903021'|'Two or more proximal long-bone fractures'|\n" +
        "'EMSDataSet'|'eInjury.04'|'Vehicular, Pedestrian, or Other Injury Risk Factor'|'2904001'|'Auto v. Pedestrian/Bicyclist Thrown, Run Over, or > 20 MPH Impact'|\n" +
        "'EMSDataSet'|'eInjury.04'|'Vehicular, Pedestrian, or Other Injury Risk Factor'|'2904003'|'Fall Adults: > 20 ft. (one story is equal to 10 ft.)'|\n" +
        "'EMSDataSet'|'eInjury.04'|'Vehicular, Pedestrian, or Other Injury Risk Factor'|'2904005'|'Fall Children: > 10 ft. or 2-3 times the height of the child'|\n" +
        "'EMSDataSet'|'eInjury.04'|'Vehicular, Pedestrian, or Other Injury Risk Factor'|'2904007'|'Crash Death in Same Passenger Compartment'|\n" +
        "'EMSDataSet'|'eInjury.04'|'Vehicular, Pedestrian, or Other Injury Risk Factor'|'2904009'|'Crash Ejection (partial or complete) from automobile'|\n" +
        "'EMSDataSet'|'eInjury.04'|'Vehicular, Pedestrian, or Other Injury Risk Factor'|'2904011'|'Crash Intrusion, including roof: > 12 in. occupant site; > 18 in. any site'|\n" +
        "'EMSDataSet'|'eInjury.04'|'Vehicular, Pedestrian, or Other Injury Risk Factor'|'2904013'|'Crash Vehicle Telemetry Data (AACN) Consistent with High Risk of Injury'|\n" +
        "'EMSDataSet'|'eInjury.04'|'Vehicular, Pedestrian, or Other Injury Risk Factor'|'2904015'|'Motorcycle Crash > 20 MPH'|\n" +
        "'EMSDataSet'|'eInjury.04'|'Vehicular, Pedestrian, or Other Injury Risk Factor'|'2904017'|'SBP < 110 for age > 65'|\n" +
        "'EMSDataSet'|'eInjury.04'|'Vehicular, Pedestrian, or Other Injury Risk Factor'|'2904019'|'Anticoagulants and Bleeding Disorders'|\n" +
        "'EMSDataSet'|'eInjury.04'|'Vehicular, Pedestrian, or Other Injury Risk Factor'|'2904021'|'Pregnancy > 20 weeks'|\n" +
        "'EMSDataSet'|'eInjury.04'|'Vehicular, Pedestrian, or Other Injury Risk Factor'|'2904023'|'EMS Provider Judgment'|\n" +
        "'EMSDataSet'|'eInjury.04'|'Vehicular, Pedestrian, or Other Injury Risk Factor'|'2904025'|'Burn, without other trauma'|\n" +
        "'EMSDataSet'|'eInjury.04'|'Vehicular, Pedestrian, or Other Injury Risk Factor'|'2904027'|'Burn, with trauma mechanism'|\n" +
        "'EMSDataSet'|'eInjury.06'|'Location of Patient in Vehicle'|'2906001'|'Front Seat-Left Side (or motorcycle driver)'|\n" +
        "'EMSDataSet'|'eInjury.06'|'Location of Patient in Vehicle'|'2906003'|'Front Seat-Middle'|\n" +
        "'EMSDataSet'|'eInjury.06'|'Location of Patient in Vehicle'|'2906005'|'Front Seat-Right Side'|\n" +
        "'EMSDataSet'|'eInjury.06'|'Location of Patient in Vehicle'|'2906007'|'Passenger in other enclosed passenger or cargo area (non-trailing unit such as a bus, etc.)'|\n" +
        "'EMSDataSet'|'eInjury.06'|'Location of Patient in Vehicle'|'2906009'|'Passenger in unenclosed passenger or cargo area (non-trailing unit such as a pickup, etc.)'|\n" +
        "'EMSDataSet'|'eInjury.06'|'Location of Patient in Vehicle'|'2906011'|'Riding on Vehicle Exterior (non-trailing unit)'|\n" +
        "'EMSDataSet'|'eInjury.06'|'Location of Patient in Vehicle'|'2906013'|'Second Seat-Left Side (or motorcycle passenger)'|\n" +
        "'EMSDataSet'|'eInjury.06'|'Location of Patient in Vehicle'|'2906015'|'Second Seat-Middle'|\n" +
        "'EMSDataSet'|'eInjury.06'|'Location of Patient in Vehicle'|'2906017'|'Second Seat-Right Side'|\n" +
        "'EMSDataSet'|'eInjury.06'|'Location of Patient in Vehicle'|'2906019'|'Sleeper Section of Cab (truck)'|\n" +
        "'EMSDataSet'|'eInjury.06'|'Location of Patient in Vehicle'|'2906021'|'Third Row-Left Side (or motorcycle passenger)'|\n" +
        "'EMSDataSet'|'eInjury.06'|'Location of Patient in Vehicle'|'2906023'|'Third Row-Middle'|\n" +
        "'EMSDataSet'|'eInjury.06'|'Location of Patient in Vehicle'|'2906025'|'Third Row-Right Side'|\n" +
        "'EMSDataSet'|'eInjury.06'|'Location of Patient in Vehicle'|'2906027'|'Trailing Unit'|\n" +
        "'EMSDataSet'|'eInjury.06'|'Location of Patient in Vehicle'|'2906029'|'Unknown'|\n" +
        "'EMSDataSet'|'eInjury.07'|'Use of Occupant Safety Equipment'|'2907001'|'Child Booster Seat'|\n" +
        "'EMSDataSet'|'eInjury.07'|'Use of Occupant Safety Equipment'|'2907003'|'Eye Protection'|\n" +
        "'EMSDataSet'|'eInjury.07'|'Use of Occupant Safety Equipment'|'2907005'|'Helmet Worn'|\n" +
        "'EMSDataSet'|'eInjury.07'|'Use of Occupant Safety Equipment'|'2907007'|'Infant Car Seat Forward Facing'|\n" +
        "'EMSDataSet'|'eInjury.07'|'Use of Occupant Safety Equipment'|'2907009'|'Infant Car Seat Rear Facing'|\n" +
        "'EMSDataSet'|'eInjury.07'|'Use of Occupant Safety Equipment'|'2907015'|'None'|\n" +
        "'EMSDataSet'|'eInjury.07'|'Use of Occupant Safety Equipment'|'2907017'|'Other'|\n" +
        "'EMSDataSet'|'eInjury.07'|'Use of Occupant Safety Equipment'|'2907019'|'Personal Floatation Device'|\n" +
        "'EMSDataSet'|'eInjury.07'|'Use of Occupant Safety Equipment'|'2907021'|'Protective Clothing'|\n" +
        "'EMSDataSet'|'eInjury.07'|'Use of Occupant Safety Equipment'|'2907023'|'Protective Non-Clothing Gear'|\n" +
        "'EMSDataSet'|'eInjury.07'|'Use of Occupant Safety Equipment'|'2907027'|'Shoulder and Lap Belt Used'|\n" +
        "'EMSDataSet'|'eInjury.07'|'Use of Occupant Safety Equipment'|'2907029'|'Lap Belt Only Used'|\n" +
        "'EMSDataSet'|'eInjury.07'|'Use of Occupant Safety Equipment'|'2907031'|'Shoulder Belt Only Used'|\n" +
        "'EMSDataSet'|'eInjury.08'|'Airbag Deployment'|'2908001'|'Airbag Deployed Front'|\n" +
        "'EMSDataSet'|'eInjury.08'|'Airbag Deployment'|'2908003'|'Airbag Deployed Side'|\n" +
        "'EMSDataSet'|'eInjury.08'|'Airbag Deployment'|'2908005'|'Airbag Deployed Other (knee, air belt, etc.)'|\n" +
        "'EMSDataSet'|'eInjury.08'|'Airbag Deployment'|'2908007'|'No Airbag Deployed'|\n" +
        "'EMSDataSet'|'eInjury.08'|'Airbag Deployment'|'2908009'|'No Airbag Present'|\n" +
        "'EMSDataSet'|'eInjury.10'|'OSHA Personal Protective Equipment Used'|'2910001'|'Eye and Face Protection'|\n" +
        "'EMSDataSet'|'eInjury.10'|'OSHA Personal Protective Equipment Used'|'2910003'|'Foot Protection'|\n" +
        "'EMSDataSet'|'eInjury.10'|'OSHA Personal Protective Equipment Used'|'2910005'|'Head Protection'|\n" +
        "'EMSDataSet'|'eInjury.10'|'OSHA Personal Protective Equipment Used'|'2910007'|'Hearing Protection'|\n" +
        "'EMSDataSet'|'eInjury.10'|'OSHA Personal Protective Equipment Used'|'2910009'|'Respiratory Protection'|\n" +
        "'EMSDataSet'|'eInjury.10'|'OSHA Personal Protective Equipment Used'|'2910011'|'Safety Belts, lifelines, and lanyards'|\n" +
        "'EMSDataSet'|'eInjury.10'|'OSHA Personal Protective Equipment Used'|'2910013'|'Safety Nets'|\n" +
        "'EMSDataSet'|'eInjury.21'|'ACN Incident Multiple Impacts'|'9923001'|'No'|\n" +
        "'EMSDataSet'|'eInjury.21'|'ACN Incident Multiple Impacts'|'9923003'|'Yes'|\n" +
        "'EMSDataSet'|'eInjury.23'|'ACN High Probability of Injury'|'9923001'|'No'|\n" +
        "'EMSDataSet'|'eInjury.23'|'ACN High Probability of Injury'|'9923003'|'Yes'|\n" +
        "'EMSDataSet'|'eInjury.25'|'ACN Incident Rollover'|'Y'|'Yes'|\n" +
        "'EMSDataSet'|'eInjury.25'|'ACN Incident Rollover'|'N'|'No'|\n" +
        "'EMSDataSet'|'eInjury.26'|'ACN Vehicle Seat Location'|'2926001'|'Driver Front Seat'|\n" +
        "'EMSDataSet'|'eInjury.26'|'ACN Vehicle Seat Location'|'2926003'|'Front Row Middle Seat'|\n" +
        "'EMSDataSet'|'eInjury.26'|'ACN Vehicle Seat Location'|'2926005'|'Passenger Front Seat'|\n" +
        "'EMSDataSet'|'eInjury.26'|'ACN Vehicle Seat Location'|'2926007'|'Second Row Left Seat'|\n" +
        "'EMSDataSet'|'eInjury.26'|'ACN Vehicle Seat Location'|'2926009'|'Second Row Middle Seat'|\n" +
        "'EMSDataSet'|'eInjury.26'|'ACN Vehicle Seat Location'|'2926011'|'Second Row Right Seat'|\n" +
        "'EMSDataSet'|'eInjury.26'|'ACN Vehicle Seat Location'|'2926013'|'Third Row Left Seat'|\n" +
        "'EMSDataSet'|'eInjury.26'|'ACN Vehicle Seat Location'|'2926015'|'Third Row Middle Seat'|\n" +
        "'EMSDataSet'|'eInjury.26'|'ACN Vehicle Seat Location'|'2926017'|'Third Row Right Seat'|\n" +
        "'EMSDataSet'|'eInjury.27'|'Seat Occupied'|'Y'|'Yes'|\n" +
        "'EMSDataSet'|'eInjury.27'|'Seat Occupied'|'N'|'No'|\n" +
        "'EMSDataSet'|'eInjury.28'|'ACN Incident Seatbelt Use'|'Y'|'Yes'|\n" +
        "'EMSDataSet'|'eInjury.28'|'ACN Incident Seatbelt Use'|'N'|'No'|\n" +
        "'EMSDataSet'|'eInjury.29'|'ACN Incident Airbag Deployed'|'Y'|'Yes'|\n" +
        "'EMSDataSet'|'eInjury.29'|'ACN Incident Airbag Deployed'|'N'|'No'|\n" +
        "'EMSDataSet'|'eArrest.01'|'Cardiac Arrest'|'3001001'|'No'|\n" +
        "'EMSDataSet'|'eArrest.01'|'Cardiac Arrest'|'3001003'|'Yes, Prior to EMS Arrival'|\n" +
        "'EMSDataSet'|'eArrest.01'|'Cardiac Arrest'|'3001005'|'Yes, After EMS Arrival'|\n" +
        "'EMSDataSet'|'eArrest.02'|'Cardiac Arrest Etiology'|'3002001'|'Cardiac (Presumed)'|\n" +
        "'EMSDataSet'|'eArrest.02'|'Cardiac Arrest Etiology'|'3002003'|'Drowning/Submersion'|\n" +
        "'EMSDataSet'|'eArrest.02'|'Cardiac Arrest Etiology'|'3002005'|'Drug Overdose'|\n" +
        "'EMSDataSet'|'eArrest.02'|'Cardiac Arrest Etiology'|'3002007'|'Electrocution'|\n" +
        "'EMSDataSet'|'eArrest.02'|'Cardiac Arrest Etiology'|'3002009'|'Exsanguination'|\n" +
        "'EMSDataSet'|'eArrest.02'|'Cardiac Arrest Etiology'|'3002011'|'Other'|\n" +
        "'EMSDataSet'|'eArrest.02'|'Cardiac Arrest Etiology'|'3002013'|'Respiratory/Asphyxia'|\n" +
        "'EMSDataSet'|'eArrest.02'|'Cardiac Arrest Etiology'|'3002015'|'Trauma'|\n" +
        "'EMSDataSet'|'eArrest.03'|'Resuscitation Attempted By EMS'|'3003001'|'Attempted Defibrillation'|\n" +
        "'EMSDataSet'|'eArrest.03'|'Resuscitation Attempted By EMS'|'3003003'|'Attempted Ventilation'|\n" +
        "'EMSDataSet'|'eArrest.03'|'Resuscitation Attempted By EMS'|'3003005'|'Initiated Chest Compressions'|\n" +
        "'EMSDataSet'|'eArrest.03'|'Resuscitation Attempted By EMS'|'3003007'|'Not Attempted-Considered Futile'|\n" +
        "'EMSDataSet'|'eArrest.03'|'Resuscitation Attempted By EMS'|'3003009'|'Not Attempted-DNR Orders'|\n" +
        "'EMSDataSet'|'eArrest.03'|'Resuscitation Attempted By EMS'|'3003011'|'Not Attempted-Signs of Circulation'|\n" +
        "'EMSDataSet'|'eArrest.04'|'Arrest Witnessed By'|'3004001'|'Not Witnessed'|\n" +
        "'EMSDataSet'|'eArrest.04'|'Arrest Witnessed By'|'3004003'|'Witnessed by Family Member'|\n" +
        "'EMSDataSet'|'eArrest.04'|'Arrest Witnessed By'|'3004005'|'Witnessed by Healthcare Provider'|\n" +
        "'EMSDataSet'|'eArrest.04'|'Arrest Witnessed By'|'3004007'|'Witnessed by Lay Person'|\n" +
        "'EMSDataSet'|'eArrest.05'|'CPR Care Provided Prior to EMS Arrival'|'9923001'|'No'|\n" +
        "'EMSDataSet'|'eArrest.05'|'CPR Care Provided Prior to EMS Arrival'|'9923003'|'Yes'|\n" +
        "'EMSDataSet'|'eArrest.06'|'Who Provided CPR Prior to EMS Arrival'|'3006001'|'Family Member'|\n" +
        "'EMSDataSet'|'eArrest.06'|'Who Provided CPR Prior to EMS Arrival'|'3006003'|'First Responder (Fire, Law, EMS)'|\n" +
        "'EMSDataSet'|'eArrest.06'|'Who Provided CPR Prior to EMS Arrival'|'3006005'|'Healthcare Professional (Non-EMS)'|\n" +
        "'EMSDataSet'|'eArrest.06'|'Who Provided CPR Prior to EMS Arrival'|'3006007'|'Lay Person (Non-Family)'|\n" +
        "'EMSDataSet'|'eArrest.06'|'Who Provided CPR Prior to EMS Arrival'|'3006009'|'Other EMS Professional (not part of dispatched response)'|\n" +
        "'EMSDataSet'|'eArrest.07'|'AED Use Prior to EMS Arrival'|'3007001'|'No'|\n" +
        "'EMSDataSet'|'eArrest.07'|'AED Use Prior to EMS Arrival'|'3007003'|'Yes, Applied without Defibrillation'|\n" +
        "'EMSDataSet'|'eArrest.07'|'AED Use Prior to EMS Arrival'|'3007005'|'Yes, With Defibrillation'|\n" +
        "'EMSDataSet'|'eArrest.08'|'Who Used AED Prior to EMS Arrival'|'3008001'|'Family Member'|\n" +
        "'EMSDataSet'|'eArrest.08'|'Who Used AED Prior to EMS Arrival'|'3008003'|'First Responder (Fire, Law, EMS)'|\n" +
        "'EMSDataSet'|'eArrest.08'|'Who Used AED Prior to EMS Arrival'|'3008005'|'Healthcare Professional (Non-EMS)'|\n" +
        "'EMSDataSet'|'eArrest.08'|'Who Used AED Prior to EMS Arrival'|'3008007'|'Lay Person (Non-Family)'|\n" +
        "'EMSDataSet'|'eArrest.08'|'Who Used AED Prior to EMS Arrival'|'3008009'|'Other EMS Professional (not part of dispatched response)'|\n" +
        "'EMSDataSet'|'eArrest.09'|'Type of CPR Provided'|'3009001'|'Compressions-Continuous'|\n" +
        "'EMSDataSet'|'eArrest.09'|'Type of CPR Provided'|'3009003'|'Compressions-External Band Type Device'|\n" +
        "'EMSDataSet'|'eArrest.09'|'Type of CPR Provided'|'3009005'|'Compressions-External Plunger Type Device'|\n" +
        "'EMSDataSet'|'eArrest.09'|'Type of CPR Provided'|'3009007'|'Compressions-External Thumper Type Device'|\n" +
        "'EMSDataSet'|'eArrest.09'|'Type of CPR Provided'|'3009009'|'Compressions-Intermittent with Ventilation'|\n" +
        "'EMSDataSet'|'eArrest.09'|'Type of CPR Provided'|'3009011'|'Compressions-Other Device'|\n" +
        "'EMSDataSet'|'eArrest.09'|'Type of CPR Provided'|'3009013'|'Ventilation-Bag Valve Mask'|\n" +
        "'EMSDataSet'|'eArrest.09'|'Type of CPR Provided'|'3009015'|'Ventilation-Impedance Threshold Device'|\n" +
        "'EMSDataSet'|'eArrest.09'|'Type of CPR Provided'|'3009017'|'Ventilation-Mouth to Mouth'|\n" +
        "'EMSDataSet'|'eArrest.09'|'Type of CPR Provided'|'3009019'|'Ventilation-Pocket Mask'|\n" +
        "'EMSDataSet'|'eArrest.11'|'First Monitored Arrest Rhythm of the Patient'|'3011001'|'Asystole'|\n" +
        "'EMSDataSet'|'eArrest.11'|'First Monitored Arrest Rhythm of the Patient'|'3011005'|'PEA'|\n" +
        "'EMSDataSet'|'eArrest.11'|'First Monitored Arrest Rhythm of the Patient'|'3011007'|'Unknown AED Non-Shockable Rhythm'|\n" +
        "'EMSDataSet'|'eArrest.11'|'First Monitored Arrest Rhythm of the Patient'|'3011009'|'Unknown AED Shockable Rhythm'|\n" +
        "'EMSDataSet'|'eArrest.11'|'First Monitored Arrest Rhythm of the Patient'|'3011011'|'Ventricular Fibrillation'|\n" +
        "'EMSDataSet'|'eArrest.11'|'First Monitored Arrest Rhythm of the Patient'|'3011013'|'Ventricular Tachycardia-Pulseless'|\n" +
        "'EMSDataSet'|'eArrest.12'|'Any Return of Spontaneous Circulation'|'3012001'|'No'|\n" +
        "'EMSDataSet'|'eArrest.12'|'Any Return of Spontaneous Circulation'|'3012003'|'Yes, At Arrival at the ED'|\n" +
        "'EMSDataSet'|'eArrest.12'|'Any Return of Spontaneous Circulation'|'3012005'|'Yes, Prior to Arrival at the ED'|\n" +
        "'EMSDataSet'|'eArrest.12'|'Any Return of Spontaneous Circulation'|'3012007'|'Yes, Sustained for 20 consecutive minutes'|\n" +
        "'EMSDataSet'|'eArrest.13'|'Neurological Outcome at Hospital Discharge'|'3013001'|'CPC 1 Good Cerebral Performance'|\n" +
        "'EMSDataSet'|'eArrest.13'|'Neurological Outcome at Hospital Discharge'|'3013003'|'CPC 2 Moderate Cerebral Disability'|\n" +
        "'EMSDataSet'|'eArrest.13'|'Neurological Outcome at Hospital Discharge'|'3013005'|'CPC 3 Severe Cerebral Disability'|\n" +
        "'EMSDataSet'|'eArrest.13'|'Neurological Outcome at Hospital Discharge'|'3013007'|'CPC 4 Coma or Vegetative State'|\n" +
        "'EMSDataSet'|'eArrest.16'|'Reason CPR/Resuscitation Discontinued'|'3016001'|'DNR'|\n" +
        "'EMSDataSet'|'eArrest.16'|'Reason CPR/Resuscitation Discontinued'|'3016003'|'Medical Control Order'|\n" +
        "'EMSDataSet'|'eArrest.16'|'Reason CPR/Resuscitation Discontinued'|'3016005'|'Obvious Signs of Death'|\n" +
        "'EMSDataSet'|'eArrest.16'|'Reason CPR/Resuscitation Discontinued'|'3016007'|'Physically Unable to Perform'|\n" +
        "'EMSDataSet'|'eArrest.16'|'Reason CPR/Resuscitation Discontinued'|'3016009'|'Protocol/Policy Requirements Completed'|\n" +
        "'EMSDataSet'|'eArrest.16'|'Reason CPR/Resuscitation Discontinued'|'3016011'|'Return of Spontaneous Circulation (pulse or BP noted)'|\n" +
        "'EMSDataSet'|'eArrest.17'|'Cardiac Rhythm on Arrival at Destination'|'9901001'|'Agonal/Idioventricular'|\n" +
        "'EMSDataSet'|'eArrest.17'|'Cardiac Rhythm on Arrival at Destination'|'9901003'|'Asystole'|\n" +
        "'EMSDataSet'|'eArrest.17'|'Cardiac Rhythm on Arrival at Destination'|'9901005'|'Artifact'|\n" +
        "'EMSDataSet'|'eArrest.17'|'Cardiac Rhythm on Arrival at Destination'|'9901007'|'Atrial Fibrillation'|\n" +
        "'EMSDataSet'|'eArrest.17'|'Cardiac Rhythm on Arrival at Destination'|'9901009'|'Atrial Flutter'|\n" +
        "'EMSDataSet'|'eArrest.17'|'Cardiac Rhythm on Arrival at Destination'|'9901011'|'AV Block-1st Degree'|\n" +
        "'EMSDataSet'|'eArrest.17'|'Cardiac Rhythm on Arrival at Destination'|'9901013'|'AV Block-2nd Degree-Type 1'|\n" +
        "'EMSDataSet'|'eArrest.17'|'Cardiac Rhythm on Arrival at Destination'|'9901015'|'AV Block-2nd Degree-Type 2'|\n" +
        "'EMSDataSet'|'eArrest.17'|'Cardiac Rhythm on Arrival at Destination'|'9901017'|'AV Block-3rd Degree'|\n" +
        "'EMSDataSet'|'eArrest.17'|'Cardiac Rhythm on Arrival at Destination'|'9901019'|'Junctional'|\n" +
        "'EMSDataSet'|'eArrest.17'|'Cardiac Rhythm on Arrival at Destination'|'9901021'|'Left Bundle Branch Block'|\n" +
        "'EMSDataSet'|'eArrest.17'|'Cardiac Rhythm on Arrival at Destination'|'9901023'|'Non-STEMI Anterior Ischemia'|\n" +
        "'EMSDataSet'|'eArrest.17'|'Cardiac Rhythm on Arrival at Destination'|'9901025'|'Non-STEMI Inferior Ischemia'|\n" +
        "'EMSDataSet'|'eArrest.17'|'Cardiac Rhythm on Arrival at Destination'|'9901027'|'Non-STEMI Lateral Ischemia'|\n" +
        "'EMSDataSet'|'eArrest.17'|'Cardiac Rhythm on Arrival at Destination'|'9901029'|'Non-STEMI Posterior Ischemia'|\n" +
        "'EMSDataSet'|'eArrest.17'|'Cardiac Rhythm on Arrival at Destination'|'9901031'|'Other'|\n" +
        "'EMSDataSet'|'eArrest.17'|'Cardiac Rhythm on Arrival at Destination'|'9901033'|'Paced Rhythm'|\n" +
        "'EMSDataSet'|'eArrest.17'|'Cardiac Rhythm on Arrival at Destination'|'9901035'|'PEA'|\n" +
        "'EMSDataSet'|'eArrest.17'|'Cardiac Rhythm on Arrival at Destination'|'9901037'|'Premature Atrial Contractions'|\n" +
        "'EMSDataSet'|'eArrest.17'|'Cardiac Rhythm on Arrival at Destination'|'9901039'|'Premature Ventricular Contractions'|\n" +
        "'EMSDataSet'|'eArrest.17'|'Cardiac Rhythm on Arrival at Destination'|'9901041'|'Right Bundle Branch Block'|\n" +
        "'EMSDataSet'|'eArrest.17'|'Cardiac Rhythm on Arrival at Destination'|'9901043'|'Sinus Arrhythmia'|\n" +
        "'EMSDataSet'|'eArrest.17'|'Cardiac Rhythm on Arrival at Destination'|'9901045'|'Sinus Bradycardia'|\n" +
        "'EMSDataSet'|'eArrest.17'|'Cardiac Rhythm on Arrival at Destination'|'9901047'|'Sinus Rhythm'|\n" +
        "'EMSDataSet'|'eArrest.17'|'Cardiac Rhythm on Arrival at Destination'|'9901049'|'Sinus Tachycardia'|\n" +
        "'EMSDataSet'|'eArrest.17'|'Cardiac Rhythm on Arrival at Destination'|'9901051'|'STEMI Anterior Ischemia'|\n" +
        "'EMSDataSet'|'eArrest.17'|'Cardiac Rhythm on Arrival at Destination'|'9901053'|'STEMI Inferior Ischemia'|\n" +
        "'EMSDataSet'|'eArrest.17'|'Cardiac Rhythm on Arrival at Destination'|'9901055'|'STEMI Lateral Ischemia'|\n" +
        "'EMSDataSet'|'eArrest.17'|'Cardiac Rhythm on Arrival at Destination'|'9901057'|'STEMI Posterior Ischemia'|\n" +
        "'EMSDataSet'|'eArrest.17'|'Cardiac Rhythm on Arrival at Destination'|'9901059'|'Supraventricular Tachycardia'|\n" +
        "'EMSDataSet'|'eArrest.17'|'Cardiac Rhythm on Arrival at Destination'|'9901061'|'Torsades De Points'|\n" +
        "'EMSDataSet'|'eArrest.17'|'Cardiac Rhythm on Arrival at Destination'|'9901063'|'Unknown AED Non-Shockable Rhythm'|\n" +
        "'EMSDataSet'|'eArrest.17'|'Cardiac Rhythm on Arrival at Destination'|'9901065'|'Unknown AED Shockable Rhythm'|\n" +
        "'EMSDataSet'|'eArrest.17'|'Cardiac Rhythm on Arrival at Destination'|'9901067'|'Ventricular Fibrillation'|\n" +
        "'EMSDataSet'|'eArrest.17'|'Cardiac Rhythm on Arrival at Destination'|'9901069'|'Ventricular Tachycardia (With Pulse)'|\n" +
        "'EMSDataSet'|'eArrest.17'|'Cardiac Rhythm on Arrival at Destination'|'9901071'|'Ventricular Tachycardia (Pulseless)'|\n" +
        "'EMSDataSet'|'eArrest.18'|'End of EMS Cardiac Arrest Event'|'3018001'|'Expired in ED'|\n" +
        "'EMSDataSet'|'eArrest.18'|'End of EMS Cardiac Arrest Event'|'3018003'|'Expired in the Field'|\n" +
        "'EMSDataSet'|'eArrest.18'|'End of EMS Cardiac Arrest Event'|'3018005'|'Ongoing Resuscitation in ED'|\n" +
        "'EMSDataSet'|'eArrest.18'|'End of EMS Cardiac Arrest Event'|'3018007'|'ROSC in the Field'|\n" +
        "'EMSDataSet'|'eArrest.18'|'End of EMS Cardiac Arrest Event'|'3018009'|'ROSC in the ED'|\n" +
        "'EMSDataSet'|'eArrest.18'|'End of EMS Cardiac Arrest Event'|'3018011'|'Ongoing Resuscitation by Other EMS'|\n" +
        "'EMSDataSet'|'eHistory.01'|'Barriers to Patient Care'|'3101001'|'Cultural, Custom, Religious'|\n" +
        "'EMSDataSet'|'eHistory.01'|'Barriers to Patient Care'|'3101003'|'Developmentally Impaired'|\n" +
        "'EMSDataSet'|'eHistory.01'|'Barriers to Patient Care'|'3101005'|'Hearing Impaired'|\n" +
        "'EMSDataSet'|'eHistory.01'|'Barriers to Patient Care'|'3101007'|'Language'|\n" +
        "'EMSDataSet'|'eHistory.01'|'Barriers to Patient Care'|'3101009'|'None Noted'|\n" +
        "'EMSDataSet'|'eHistory.01'|'Barriers to Patient Care'|'3101011'|'Obesity'|\n" +
        "'EMSDataSet'|'eHistory.01'|'Barriers to Patient Care'|'3101013'|'Physical Barrier (Unable to Access Patient)'|\n" +
        "'EMSDataSet'|'eHistory.01'|'Barriers to Patient Care'|'3101015'|'Physically Impaired'|\n" +
        "'EMSDataSet'|'eHistory.01'|'Barriers to Patient Care'|'3101017'|'Physically Restrained'|\n" +
        "'EMSDataSet'|'eHistory.01'|'Barriers to Patient Care'|'3101019'|'Psychologically Impaired'|\n" +
        "'EMSDataSet'|'eHistory.01'|'Barriers to Patient Care'|'3101021'|'Sight Impaired'|\n" +
        "'EMSDataSet'|'eHistory.01'|'Barriers to Patient Care'|'3101023'|'Speech Impaired'|\n" +
        "'EMSDataSet'|'eHistory.01'|'Barriers to Patient Care'|'3101025'|'Unattended or Unsupervised (including minors)'|\n" +
        "'EMSDataSet'|'eHistory.01'|'Barriers to Patient Care'|'3101027'|'Unconscious'|\n" +
        "'EMSDataSet'|'eHistory.01'|'Barriers to Patient Care'|'3101029'|'Uncooperative'|\n" +
        "'EMSDataSet'|'eHistory.01'|'Barriers to Patient Care'|'3101031'|'State of Emotional Distress'|\n" +
        "'EMSDataSet'|'eHistory.05'|'Advance Directives'|'3105001'|'Family/Guardian request DNR (but no documentation)'|\n" +
        "'EMSDataSet'|'eHistory.05'|'Advance Directives'|'3105003'|'Living Will'|\n" +
        "'EMSDataSet'|'eHistory.05'|'Advance Directives'|'3105005'|'None'|\n" +
        "'EMSDataSet'|'eHistory.05'|'Advance Directives'|'3105007'|'Other'|\n" +
        "'EMSDataSet'|'eHistory.05'|'Advance Directives'|'3105009'|'Other Healthcare Advanced Directive Form'|\n" +
        "'EMSDataSet'|'eHistory.05'|'Advance Directives'|'3105011'|'State EMS DNR or Medical Order Form'|\n" +
        "'EMSDataSet'|'eHistory.09'|'Medical History Obtained From'|'3109001'|'Bystander/Other'|\n" +
        "'EMSDataSet'|'eHistory.09'|'Medical History Obtained From'|'3109003'|'Family'|\n" +
        "'EMSDataSet'|'eHistory.09'|'Medical History Obtained From'|'3109005'|'Health Care Personnel'|\n" +
        "'EMSDataSet'|'eHistory.09'|'Medical History Obtained From'|'3109007'|'Patient'|\n" +
        "'EMSDataSet'|'eHistory.10'|'The Patient's Type of Immunization'|'9910001'|'Anthrax'|\n" +
        "'EMSDataSet'|'eHistory.10'|'The Patient's Type of Immunization'|'9910003'|'Cholera'|\n" +
        "'EMSDataSet'|'eHistory.10'|'The Patient's Type of Immunization'|'9910005'|'DPT / TDaP (Diphtheria, Pertussis, Tetanus)'|\n" +
        "'EMSDataSet'|'eHistory.10'|'The Patient's Type of Immunization'|'9910007'|'Hemophilus Influenza B'|\n" +
        "'EMSDataSet'|'eHistory.10'|'The Patient's Type of Immunization'|'9910009'|'Hepatitis A'|\n" +
        "'EMSDataSet'|'eHistory.10'|'The Patient's Type of Immunization'|'9910011'|'Hepatitis B'|\n" +
        "'EMSDataSet'|'eHistory.10'|'The Patient's Type of Immunization'|'9910013'|'Human Papilloma Virus (HPV)'|\n" +
        "'EMSDataSet'|'eHistory.10'|'The Patient's Type of Immunization'|'9910015'|'Influenza-H1N1'|\n" +
        "'EMSDataSet'|'eHistory.10'|'The Patient's Type of Immunization'|'9910017'|'Influenza-Other'|\n" +
        "'EMSDataSet'|'eHistory.10'|'The Patient's Type of Immunization'|'9910019'|'Influenza-Seasonal (In past 12 months)'|\n" +
        "'EMSDataSet'|'eHistory.10'|'The Patient's Type of Immunization'|'9910021'|'Lyme Disease'|\n" +
        "'EMSDataSet'|'eHistory.10'|'The Patient's Type of Immunization'|'9910023'|'Meningococcus'|\n" +
        "'EMSDataSet'|'eHistory.10'|'The Patient's Type of Immunization'|'9910025'|'MMR (Measles, Mumps, Rubella)'|\n" +
        "'EMSDataSet'|'eHistory.10'|'The Patient's Type of Immunization'|'9910027'|'Other-Not Listed'|\n" +
        "'EMSDataSet'|'eHistory.10'|'The Patient's Type of Immunization'|'9910029'|'Plague'|\n" +
        "'EMSDataSet'|'eHistory.10'|'The Patient's Type of Immunization'|'9910031'|'Pneumococcal (Pneumonia)'|\n" +
        "'EMSDataSet'|'eHistory.10'|'The Patient's Type of Immunization'|'9910033'|'Polio'|\n" +
        "'EMSDataSet'|'eHistory.10'|'The Patient's Type of Immunization'|'9910035'|'Rabies'|\n" +
        "'EMSDataSet'|'eHistory.10'|'The Patient's Type of Immunization'|'9910037'|'Rotavirus'|\n" +
        "'EMSDataSet'|'eHistory.10'|'The Patient's Type of Immunization'|'9910039'|'Shingles'|\n" +
        "'EMSDataSet'|'eHistory.10'|'The Patient's Type of Immunization'|'9910041'|'Small Pox'|\n" +
        "'EMSDataSet'|'eHistory.10'|'The Patient's Type of Immunization'|'9910043'|'Tetanus'|\n" +
        "'EMSDataSet'|'eHistory.10'|'The Patient's Type of Immunization'|'9910045'|'Tuberculosis'|\n" +
        "'EMSDataSet'|'eHistory.10'|'The Patient's Type of Immunization'|'9910047'|'Typhoid'|\n" +
        "'EMSDataSet'|'eHistory.10'|'The Patient's Type of Immunization'|'9910049'|'Varicella (Chickenpox)'|\n" +
        "'EMSDataSet'|'eHistory.10'|'The Patient's Type of Immunization'|'9910051'|'Yellow Fever'|\n" +
        "'EMSDataSet'|'eHistory.14'|'Current Medication Dosage Unit'|'3114001'|'Centimeters (cm)'|\n" +
        "'EMSDataSet'|'eHistory.14'|'Current Medication Dosage Unit'|'3114003'|'Grams (gms)'|\n" +
        "'EMSDataSet'|'eHistory.14'|'Current Medication Dosage Unit'|'3114005'|'Drops (gtts)'|\n" +
        "'EMSDataSet'|'eHistory.14'|'Current Medication Dosage Unit'|'3114007'|'Inches (in)'|\n" +
        "'EMSDataSet'|'eHistory.14'|'Current Medication Dosage Unit'|'3114009'|'International Units (IU)'|\n" +
        "'EMSDataSet'|'eHistory.14'|'Current Medication Dosage Unit'|'3114011'|'Keep Vein Open (kvo)'|\n" +
        "'EMSDataSet'|'eHistory.14'|'Current Medication Dosage Unit'|'3114013'|'Liters Per Minute (l/min [fluid])'|\n" +
        "'EMSDataSet'|'eHistory.14'|'Current Medication Dosage Unit'|'3114015'|'Liters (l)'|\n" +
        "'EMSDataSet'|'eHistory.14'|'Current Medication Dosage Unit'|'3114017'|'Liters Per Minute (LPM [gas])'|\n" +
        "'EMSDataSet'|'eHistory.14'|'Current Medication Dosage Unit'|'3114019'|'Micrograms (mcg)'|\n" +
        "'EMSDataSet'|'eHistory.14'|'Current Medication Dosage Unit'|'3114021'|'Micrograms per Kilogram per Minute (mcg/kg/min)'|\n" +
        "'EMSDataSet'|'eHistory.14'|'Current Medication Dosage Unit'|'3114023'|'Micrograms per Minute (mcg/min)'|\n" +
        "'EMSDataSet'|'eHistory.14'|'Current Medication Dosage Unit'|'3114025'|'Milliequivalents (mEq)'|\n" +
        "'EMSDataSet'|'eHistory.14'|'Current Medication Dosage Unit'|'3114027'|'Metered Dose (MDI)'|\n" +
        "'EMSDataSet'|'eHistory.14'|'Current Medication Dosage Unit'|'3114029'|'Milligrams (mg)'|\n" +
        "'EMSDataSet'|'eHistory.14'|'Current Medication Dosage Unit'|'3114031'|'Milligrams per Kilogram (mg/kg)'|\n" +
        "'EMSDataSet'|'eHistory.14'|'Current Medication Dosage Unit'|'3114033'|'Milligrams per Kilogram Per Minute (mg/kg/min)'|\n" +
        "'EMSDataSet'|'eHistory.14'|'Current Medication Dosage Unit'|'3114035'|'Milligrams per Minute (mg/min)'|\n" +
        "'EMSDataSet'|'eHistory.14'|'Current Medication Dosage Unit'|'3114037'|'Milliliters (ml)'|\n" +
        "'EMSDataSet'|'eHistory.14'|'Current Medication Dosage Unit'|'3114039'|'Milliliters per Hour (ml/hr)'|\n" +
        "'EMSDataSet'|'eHistory.14'|'Current Medication Dosage Unit'|'3114041'|'Other'|\n" +
        "'EMSDataSet'|'eHistory.14'|'Current Medication Dosage Unit'|'3114043'|'Puffs'|\n" +
        "'EMSDataSet'|'eHistory.14'|'Current Medication Dosage Unit'|'3114045'|'Units per Hour (units/hr)'|\n" +
        "'EMSDataSet'|'eHistory.14'|'Current Medication Dosage Unit'|'3114047'|'Micrograms per Kilogram (mcg/kg)'|\n" +
        "'EMSDataSet'|'eHistory.14'|'Current Medication Dosage Unit'|'3114049'|'Units'|\n" +
        "'EMSDataSet'|'eHistory.14'|'Current Medication Dosage Unit'|'3114051'|'Units per Kilogram per Hour (units/kg/hr)'|\n" +
        "'EMSDataSet'|'eHistory.14'|'Current Medication Dosage Unit'|'3114053'|'Units per Kilogram (units/kg)'|\n" +
        "'EMSDataSet'|'eHistory.15'|'Current Medication Administration Route'|'9927001'|'Blow-By'|\n" +
        "'EMSDataSet'|'eHistory.15'|'Current Medication Administration Route'|'9927003'|'Buccal'|\n" +
        "'EMSDataSet'|'eHistory.15'|'Current Medication Administration Route'|'9927005'|'Endotracheal Tube (ET)'|\n" +
        "'EMSDataSet'|'eHistory.15'|'Current Medication Administration Route'|'9927007'|'Gastrostomy Tube'|\n" +
        "'EMSDataSet'|'eHistory.15'|'Current Medication Administration Route'|'9927009'|'Inhalation'|\n" +
        "'EMSDataSet'|'eHistory.15'|'Current Medication Administration Route'|'9927011'|'Intraarterial'|\n" +
        "'EMSDataSet'|'eHistory.15'|'Current Medication Administration Route'|'9927013'|'Intradermal'|\n" +
        "'EMSDataSet'|'eHistory.15'|'Current Medication Administration Route'|'9927015'|'Intramuscular (IM)'|\n" +
        "'EMSDataSet'|'eHistory.15'|'Current Medication Administration Route'|'9927017'|'Intranasal'|\n" +
        "'EMSDataSet'|'eHistory.15'|'Current Medication Administration Route'|'9927019'|'Intraocular'|\n" +
        "'EMSDataSet'|'eHistory.15'|'Current Medication Administration Route'|'9927021'|'Intraosseous (IO)'|\n" +
        "'EMSDataSet'|'eHistory.15'|'Current Medication Administration Route'|'9927023'|'Intravenous (IV)'|\n" +
        "'EMSDataSet'|'eHistory.15'|'Current Medication Administration Route'|'9927025'|'Nasal Cannula'|\n" +
        "'EMSDataSet'|'eHistory.15'|'Current Medication Administration Route'|'9927027'|'Nasogastric'|\n" +
        "'EMSDataSet'|'eHistory.15'|'Current Medication Administration Route'|'9927029'|'Nasotracheal Tube'|\n" +
        "'EMSDataSet'|'eHistory.15'|'Current Medication Administration Route'|'9927031'|'Non-Rebreather Mask'|\n" +
        "'EMSDataSet'|'eHistory.15'|'Current Medication Administration Route'|'9927033'|'Ophthalmic'|\n" +
        "'EMSDataSet'|'eHistory.15'|'Current Medication Administration Route'|'9927035'|'Oral'|\n" +
        "'EMSDataSet'|'eHistory.15'|'Current Medication Administration Route'|'9927037'|'Other/miscellaneous'|\n" +
        "'EMSDataSet'|'eHistory.15'|'Current Medication Administration Route'|'9927039'|'Otic'|\n" +
        "'EMSDataSet'|'eHistory.15'|'Current Medication Administration Route'|'9927041'|'Re-breather mask'|\n" +
        "'EMSDataSet'|'eHistory.15'|'Current Medication Administration Route'|'9927043'|'Rectal'|\n" +
        "'EMSDataSet'|'eHistory.15'|'Current Medication Administration Route'|'9927045'|'Subcutaneous'|\n" +
        "'EMSDataSet'|'eHistory.15'|'Current Medication Administration Route'|'9927047'|'Sublingual'|\n" +
        "'EMSDataSet'|'eHistory.15'|'Current Medication Administration Route'|'9927049'|'Topical'|\n" +
        "'EMSDataSet'|'eHistory.15'|'Current Medication Administration Route'|'9927051'|'Tracheostomy'|\n" +
        "'EMSDataSet'|'eHistory.15'|'Current Medication Administration Route'|'9927053'|'Transdermal'|\n" +
        "'EMSDataSet'|'eHistory.15'|'Current Medication Administration Route'|'9927055'|'Urethral'|\n" +
        "'EMSDataSet'|'eHistory.15'|'Current Medication Administration Route'|'9927057'|'Ventimask'|\n" +
        "'EMSDataSet'|'eHistory.15'|'Current Medication Administration Route'|'9927059'|'Wound'|\n" +
        "'EMSDataSet'|'eHistory.15'|'Current Medication Administration Route'|'9927061'|'Portacath'|\n" +
        "'EMSDataSet'|'eHistory.16'|'Presence of Emergency Information Form'|'9923001'|'No'|\n" +
        "'EMSDataSet'|'eHistory.16'|'Presence of Emergency Information Form'|'9923003'|'Yes'|\n" +
        "'EMSDataSet'|'eHistory.17'|'Alcohol/Drug Use Indicators'|'3117001'|'Alcohol Containers/Paraphernalia at Scene'|\n" +
        "'EMSDataSet'|'eHistory.17'|'Alcohol/Drug Use Indicators'|'3117003'|'Drug Paraphernalia at Scene'|\n" +
        "'EMSDataSet'|'eHistory.17'|'Alcohol/Drug Use Indicators'|'3117005'|'Patient Admits to Alcohol Use'|\n" +
        "'EMSDataSet'|'eHistory.17'|'Alcohol/Drug Use Indicators'|'3117007'|'Patient Admits to Drug Use'|\n" +
        "'EMSDataSet'|'eHistory.17'|'Alcohol/Drug Use Indicators'|'3117009'|'Positive Level known from Law Enforcement or Hospital Record'|\n" +
        "'EMSDataSet'|'eHistory.17'|'Alcohol/Drug Use Indicators'|'3117011'|'Smell of Alcohol on Breath'|\n" +
        "'EMSDataSet'|'eHistory.18'|'Pregnancy'|'3118001'|'No'|\n" +
        "'EMSDataSet'|'eHistory.18'|'Pregnancy'|'3118003'|'Possible, Unconfirmed'|\n" +
        "'EMSDataSet'|'eHistory.18'|'Pregnancy'|'3118005'|'Yes, Confirmed 12 to 20 Weeks'|\n" +
        "'EMSDataSet'|'eHistory.18'|'Pregnancy'|'3118007'|'Yes, Confirmed Greater Than 20 Weeks'|\n" +
        "'EMSDataSet'|'eHistory.18'|'Pregnancy'|'3118009'|'Yes, Confirmed Less Than 12 Weeks'|\n" +
        "'EMSDataSet'|'eHistory.18'|'Pregnancy'|'3118011'|'Yes, Weeks Unknown'|\n" +
        "'EMSDataSet'|'eVitals.02'|'Obtained Prior to this Unit's EMS Care'|'9923001'|'No'|\n" +
        "'EMSDataSet'|'eVitals.02'|'Obtained Prior to this Unit's EMS Care'|'9923003'|'Yes'|\n" +
        "'EMSDataSet'|'eVitals.03'|'Cardiac Rhythm / Electrocardiography (ECG)'|'9901001'|'Agonal/Idioventricular'|\n" +
        "'EMSDataSet'|'eVitals.03'|'Cardiac Rhythm / Electrocardiography (ECG)'|'9901003'|'Asystole'|\n" +
        "'EMSDataSet'|'eVitals.03'|'Cardiac Rhythm / Electrocardiography (ECG)'|'9901005'|'Artifact'|\n" +
        "'EMSDataSet'|'eVitals.03'|'Cardiac Rhythm / Electrocardiography (ECG)'|'9901007'|'Atrial Fibrillation'|\n" +
        "'EMSDataSet'|'eVitals.03'|'Cardiac Rhythm / Electrocardiography (ECG)'|'9901009'|'Atrial Flutter'|\n" +
        "'EMSDataSet'|'eVitals.03'|'Cardiac Rhythm / Electrocardiography (ECG)'|'9901011'|'AV Block-1st Degree'|\n" +
        "'EMSDataSet'|'eVitals.03'|'Cardiac Rhythm / Electrocardiography (ECG)'|'9901013'|'AV Block-2nd Degree-Type 1'|\n" +
        "'EMSDataSet'|'eVitals.03'|'Cardiac Rhythm / Electrocardiography (ECG)'|'9901015'|'AV Block-2nd Degree-Type 2'|\n" +
        "'EMSDataSet'|'eVitals.03'|'Cardiac Rhythm / Electrocardiography (ECG)'|'9901017'|'AV Block-3rd Degree'|\n" +
        "'EMSDataSet'|'eVitals.03'|'Cardiac Rhythm / Electrocardiography (ECG)'|'9901019'|'Junctional'|\n" +
        "'EMSDataSet'|'eVitals.03'|'Cardiac Rhythm / Electrocardiography (ECG)'|'9901021'|'Left Bundle Branch Block'|\n" +
        "'EMSDataSet'|'eVitals.03'|'Cardiac Rhythm / Electrocardiography (ECG)'|'9901023'|'Non-STEMI Anterior Ischemia'|\n" +
        "'EMSDataSet'|'eVitals.03'|'Cardiac Rhythm / Electrocardiography (ECG)'|'9901025'|'Non-STEMI Inferior Ischemia'|\n" +
        "'EMSDataSet'|'eVitals.03'|'Cardiac Rhythm / Electrocardiography (ECG)'|'9901027'|'Non-STEMI Lateral Ischemia'|\n" +
        "'EMSDataSet'|'eVitals.03'|'Cardiac Rhythm / Electrocardiography (ECG)'|'9901029'|'Non-STEMI Posterior Ischemia'|\n" +
        "'EMSDataSet'|'eVitals.03'|'Cardiac Rhythm / Electrocardiography (ECG)'|'9901031'|'Other'|\n" +
        "'EMSDataSet'|'eVitals.03'|'Cardiac Rhythm / Electrocardiography (ECG)'|'9901033'|'Paced Rhythm'|\n" +
        "'EMSDataSet'|'eVitals.03'|'Cardiac Rhythm / Electrocardiography (ECG)'|'9901035'|'PEA'|\n" +
        "'EMSDataSet'|'eVitals.03'|'Cardiac Rhythm / Electrocardiography (ECG)'|'9901037'|'Premature Atrial Contractions'|\n" +
        "'EMSDataSet'|'eVitals.03'|'Cardiac Rhythm / Electrocardiography (ECG)'|'9901039'|'Premature Ventricular Contractions'|\n" +
        "'EMSDataSet'|'eVitals.03'|'Cardiac Rhythm / Electrocardiography (ECG)'|'9901041'|'Right Bundle Branch Block'|\n" +
        "'EMSDataSet'|'eVitals.03'|'Cardiac Rhythm / Electrocardiography (ECG)'|'9901043'|'Sinus Arrhythmia'|\n" +
        "'EMSDataSet'|'eVitals.03'|'Cardiac Rhythm / Electrocardiography (ECG)'|'9901045'|'Sinus Bradycardia'|\n" +
        "'EMSDataSet'|'eVitals.03'|'Cardiac Rhythm / Electrocardiography (ECG)'|'9901047'|'Sinus Rhythm'|\n" +
        "'EMSDataSet'|'eVitals.03'|'Cardiac Rhythm / Electrocardiography (ECG)'|'9901049'|'Sinus Tachycardia'|\n" +
        "'EMSDataSet'|'eVitals.03'|'Cardiac Rhythm / Electrocardiography (ECG)'|'9901051'|'STEMI Anterior Ischemia'|\n" +
        "'EMSDataSet'|'eVitals.03'|'Cardiac Rhythm / Electrocardiography (ECG)'|'9901053'|'STEMI Inferior Ischemia'|\n" +
        "'EMSDataSet'|'eVitals.03'|'Cardiac Rhythm / Electrocardiography (ECG)'|'9901055'|'STEMI Lateral Ischemia'|\n" +
        "'EMSDataSet'|'eVitals.03'|'Cardiac Rhythm / Electrocardiography (ECG)'|'9901057'|'STEMI Posterior Ischemia'|\n" +
        "'EMSDataSet'|'eVitals.03'|'Cardiac Rhythm / Electrocardiography (ECG)'|'9901059'|'Supraventricular Tachycardia'|\n" +
        "'EMSDataSet'|'eVitals.03'|'Cardiac Rhythm / Electrocardiography (ECG)'|'9901061'|'Torsades De Points'|\n" +
        "'EMSDataSet'|'eVitals.03'|'Cardiac Rhythm / Electrocardiography (ECG)'|'9901063'|'Unknown AED Non-Shockable Rhythm'|\n" +
        "'EMSDataSet'|'eVitals.03'|'Cardiac Rhythm / Electrocardiography (ECG)'|'9901065'|'Unknown AED Shockable Rhythm'|\n" +
        "'EMSDataSet'|'eVitals.03'|'Cardiac Rhythm / Electrocardiography (ECG)'|'9901067'|'Ventricular Fibrillation'|\n" +
        "'EMSDataSet'|'eVitals.03'|'Cardiac Rhythm / Electrocardiography (ECG)'|'9901069'|'Ventricular Tachycardia (With Pulse)'|\n" +
        "'EMSDataSet'|'eVitals.03'|'Cardiac Rhythm / Electrocardiography (ECG)'|'9901071'|'Ventricular Tachycardia (Pulseless)'|\n" +
        "'EMSDataSet'|'eVitals.04'|'ECG Type'|'3304001'|'3 Lead'|\n" +
        "'EMSDataSet'|'eVitals.04'|'ECG Type'|'3304003'|'4 Lead'|\n" +
        "'EMSDataSet'|'eVitals.04'|'ECG Type'|'3304005'|'5 Lead'|\n" +
        "'EMSDataSet'|'eVitals.04'|'ECG Type'|'3304007'|'12 Lead-Left Sided (Normal)'|\n" +
        "'EMSDataSet'|'eVitals.04'|'ECG Type'|'3304009'|'12 Lead-Right Sided'|\n" +
        "'EMSDataSet'|'eVitals.04'|'ECG Type'|'3304011'|'15 Lead'|\n" +
        "'EMSDataSet'|'eVitals.04'|'ECG Type'|'3304013'|'18 Lead'|\n" +
        "'EMSDataSet'|'eVitals.04'|'ECG Type'|'3304015'|'Other (AED, Not Listed)'|\n" +
        "'EMSDataSet'|'eVitals.05'|'Method of ECG Interpretation'|'3305001'|'Computer Interpretation'|\n" +
        "'EMSDataSet'|'eVitals.05'|'Method of ECG Interpretation'|'3305003'|'Manual Interpretation'|\n" +
        "'EMSDataSet'|'eVitals.05'|'Method of ECG Interpretation'|'3305005'|'Transmission with No Interpretation'|\n" +
        "'EMSDataSet'|'eVitals.05'|'Method of ECG Interpretation'|'3305007'|'Transmission with Remote Interpretation'|\n" +
        "'EMSDataSet'|'eVitals.08'|'Method of Blood Pressure Measurement'|'3308001'|'Arterial Line'|\n" +
        "'EMSDataSet'|'eVitals.08'|'Method of Blood Pressure Measurement'|'3308003'|'Doppler'|\n" +
        "'EMSDataSet'|'eVitals.08'|'Method of Blood Pressure Measurement'|'3308005'|'Cuff-Automated'|\n" +
        "'EMSDataSet'|'eVitals.08'|'Method of Blood Pressure Measurement'|'3308007'|'Cuff-Manual Auscultated'|\n" +
        "'EMSDataSet'|'eVitals.08'|'Method of Blood Pressure Measurement'|'3308009'|'Cuff-Manual Palpated Only'|\n" +
        "'EMSDataSet'|'eVitals.08'|'Method of Blood Pressure Measurement'|'3308011'|'Venous Line'|\n" +
        "'EMSDataSet'|'eVitals.11'|'Method of Heart Rate Measurement'|'3311001'|'Auscultated'|\n" +
        "'EMSDataSet'|'eVitals.11'|'Method of Heart Rate Measurement'|'3311003'|'Doppler'|\n" +
        "'EMSDataSet'|'eVitals.11'|'Method of Heart Rate Measurement'|'3311005'|'Electronic Monitor - Cardiac'|\n" +
        "'EMSDataSet'|'eVitals.11'|'Method of Heart Rate Measurement'|'3311007'|'Electronic Monitor - Pulse Oximeter'|\n" +
        "'EMSDataSet'|'eVitals.11'|'Method of Heart Rate Measurement'|'3311009'|'Electronic Monitor (Other)'|\n" +
        "'EMSDataSet'|'eVitals.11'|'Method of Heart Rate Measurement'|'3311011'|'Palpated'|\n" +
        "'EMSDataSet'|'eVitals.13'|'Pulse Rhythm'|'3313001'|'Irregularly Irregular'|\n" +
        "'EMSDataSet'|'eVitals.13'|'Pulse Rhythm'|'3313003'|'Regular'|\n" +
        "'EMSDataSet'|'eVitals.13'|'Pulse Rhythm'|'3313005'|'Regularly Irregular'|\n" +
        "'EMSDataSet'|'eVitals.15'|'Respiratory Effort'|'3315001'|'Apneic'|\n" +
        "'EMSDataSet'|'eVitals.15'|'Respiratory Effort'|'3315003'|'Labored'|\n" +
        "'EMSDataSet'|'eVitals.15'|'Respiratory Effort'|'3315005'|'Mechanically Assisted (BVM, CPAP, etc.)'|\n" +
        "'EMSDataSet'|'eVitals.15'|'Respiratory Effort'|'3315007'|'Normal'|\n" +
        "'EMSDataSet'|'eVitals.15'|'Respiratory Effort'|'3315009'|'Rapid'|\n" +
        "'EMSDataSet'|'eVitals.15'|'Respiratory Effort'|'3315011'|'Shallow'|\n" +
        "'EMSDataSet'|'eVitals.15'|'Respiratory Effort'|'3315013'|'Weak/Agonal'|\n" +
        "'EMSDataSet'|'eVitals.19'|'Glasgow Coma Score-Eye'|'1'|'No eye movement when assessed (All Age Groups)'|\n" +
        "'EMSDataSet'|'eVitals.19'|'Glasgow Coma Score-Eye'|'2'|'Opens Eyes to painful stimulation (All Age Groups)'|\n" +
        "'EMSDataSet'|'eVitals.19'|'Glasgow Coma Score-Eye'|'3'|'Opens Eyes to verbal stimulation (All Age Groups)'|\n" +
        "'EMSDataSet'|'eVitals.19'|'Glasgow Coma Score-Eye'|'4'|'Opens Eyes spontaneously (All Age Groups)'|\n" +
        "'EMSDataSet'|'eVitals.20'|'Glasgow Coma Score-Verbal'|'1'|'No verbal/vocal response (All Age Groups)'|\n" +
        "'EMSDataSet'|'eVitals.20'|'Glasgow Coma Score-Verbal'|'2'|'Incomprehensible sounds (>2 Years); Inconsolable, agitated'|\n" +
        "'EMSDataSet'|'eVitals.20'|'Glasgow Coma Score-Verbal'|'3'|'Inappropriate words (>2 Years); Inconsistently consolable, moaning'|\n" +
        "'EMSDataSet'|'eVitals.20'|'Glasgow Coma Score-Verbal'|'4'|'Confused (>2 Years); Cries but is consolable, inappropriate interactions'|\n" +
        "'EMSDataSet'|'eVitals.20'|'Glasgow Coma Score-Verbal'|'5'|'Oriented (>2 Years); Smiles, oriented to sounds, follows objects, interacts'|\n" +
        "'EMSDataSet'|'eVitals.21'|'Glasgow Coma Score-Motor'|'1'|'No Motor Response (All Age Groups)'|\n" +
        "'EMSDataSet'|'eVitals.21'|'Glasgow Coma Score-Motor'|'2'|'Extension to pain (All Age Groups)'|\n" +
        "'EMSDataSet'|'eVitals.21'|'Glasgow Coma Score-Motor'|'3'|'Flexion to pain (All Age Groups)'|\n" +
        "'EMSDataSet'|'eVitals.21'|'Glasgow Coma Score-Motor'|'4'|'Withdrawal from pain (All Age Groups)'|\n" +
        "'EMSDataSet'|'eVitals.21'|'Glasgow Coma Score-Motor'|'5'|'Localizing pain (All Age Groups)'|\n" +
        "'EMSDataSet'|'eVitals.21'|'Glasgow Coma Score-Motor'|'6'|'Obeys commands (>2Years); Appropriate response to stimulation'|\n" +
        "'EMSDataSet'|'eVitals.22'|'Glasgow Coma Score-Qualifier'|'3322001'|'Eye Obstruction Prevents Eye Assessment'|\n" +
        "'EMSDataSet'|'eVitals.22'|'Glasgow Coma Score-Qualifier'|'3322003'|'Initial GCS has legitimate values without interventions such as intubation and sedation'|\n" +
        "'EMSDataSet'|'eVitals.22'|'Glasgow Coma Score-Qualifier'|'3322005'|'Patient Chemically Paralyzed'|\n" +
        "'EMSDataSet'|'eVitals.22'|'Glasgow Coma Score-Qualifier'|'3322007'|'Patient Chemically Sedated'|\n" +
        "'EMSDataSet'|'eVitals.22'|'Glasgow Coma Score-Qualifier'|'3322009'|'Patient Intubated'|\n" +
        "'EMSDataSet'|'eVitals.25'|'Temperature Method'|'3325001'|'Axillary'|\n" +
        "'EMSDataSet'|'eVitals.25'|'Temperature Method'|'3325003'|'Central (Venous or Arterial)'|\n" +
        "'EMSDataSet'|'eVitals.25'|'Temperature Method'|'3325005'|'Esophageal'|\n" +
        "'EMSDataSet'|'eVitals.25'|'Temperature Method'|'3325007'|'Oral'|\n" +
        "'EMSDataSet'|'eVitals.25'|'Temperature Method'|'3325009'|'Rectal'|\n" +
        "'EMSDataSet'|'eVitals.25'|'Temperature Method'|'3325011'|'Temporal Artery'|\n" +
        "'EMSDataSet'|'eVitals.25'|'Temperature Method'|'3325013'|'Tympanic'|\n" +
        "'EMSDataSet'|'eVitals.25'|'Temperature Method'|'3325015'|'Urinary Catheter'|\n" +
        "'EMSDataSet'|'eVitals.25'|'Temperature Method'|'3325017'|'Skin Probe'|\n" +
        "'EMSDataSet'|'eVitals.26'|'Level of Responsiveness (AVPU)'|'3326001'|'Alert'|\n" +
        "'EMSDataSet'|'eVitals.26'|'Level of Responsiveness (AVPU)'|'3326003'|'Verbal'|\n" +
        "'EMSDataSet'|'eVitals.26'|'Level of Responsiveness (AVPU)'|'3326005'|'Painful'|\n" +
        "'EMSDataSet'|'eVitals.26'|'Level of Responsiveness (AVPU)'|'3326007'|'Unresponsive'|\n" +
        "'EMSDataSet'|'eVitals.28'|'Pain Scale Type'|'3328001'|'FLACC (Face, Legs, Activity, Cry, Consolability)'|\n" +
        "'EMSDataSet'|'eVitals.28'|'Pain Scale Type'|'3328003'|'Numeric (0-10)'|\n" +
        "'EMSDataSet'|'eVitals.28'|'Pain Scale Type'|'3328005'|'Other'|\n" +
        "'EMSDataSet'|'eVitals.28'|'Pain Scale Type'|'3328007'|'Wong-Baker (FACES)'|\n" +
        "'EMSDataSet'|'eVitals.29'|'Stroke Scale Score'|'3329001'|'Negative'|\n" +
        "'EMSDataSet'|'eVitals.29'|'Stroke Scale Score'|'3329003'|'Non-Conclusive'|\n" +
        "'EMSDataSet'|'eVitals.29'|'Stroke Scale Score'|'3329005'|'Positive'|\n" +
        "'EMSDataSet'|'eVitals.30'|'Stroke Scale Type'|'3330001'|'Cincinnati'|\n" +
        "'EMSDataSet'|'eVitals.30'|'Stroke Scale Type'|'3330003'|'Los Angeles'|\n" +
        "'EMSDataSet'|'eVitals.30'|'Stroke Scale Type'|'3330005'|'Massachusetts'|\n" +
        "'EMSDataSet'|'eVitals.30'|'Stroke Scale Type'|'3330007'|'Miami Emergency Neurologic Deficit (MEND)'|\n" +
        "'EMSDataSet'|'eVitals.30'|'Stroke Scale Type'|'3330009'|'NIH'|\n" +
        "'EMSDataSet'|'eVitals.30'|'Stroke Scale Type'|'3330011'|'Other Stroke Scale Type'|\n" +
        "'EMSDataSet'|'eVitals.30'|'Stroke Scale Type'|'3330013'|'F.A.S.T. Exam'|\n" +
        "'EMSDataSet'|'eVitals.31'|'Reperfusion Checklist'|'3331001'|'Definite Contraindications to Thrombolytic Use'|\n" +
        "'EMSDataSet'|'eVitals.31'|'Reperfusion Checklist'|'3331003'|'No Contraindications to Thrombolytic Use'|\n" +
        "'EMSDataSet'|'eVitals.31'|'Reperfusion Checklist'|'3331005'|'Possible Contraindications to Thrombolytic Use'|\n" +
        "'EMSDataSet'|'eLabs.02'|'Study/Result Prior to this Unit's EMS Care'|'9923001'|'No'|\n" +
        "'EMSDataSet'|'eLabs.02'|'Study/Result Prior to this Unit's EMS Care'|'9923003'|'Yes'|\n" +
        "'EMSDataSet'|'eLabs.03'|'Laboratory Result Type'|'3403001'|'Alanine Transaminase'|\n" +
        "'EMSDataSet'|'eLabs.03'|'Laboratory Result Type'|'3403003'|'Alcohol-Blood'|\n" +
        "'EMSDataSet'|'eLabs.03'|'Laboratory Result Type'|'3403005'|'Alcohol-Breath'|\n" +
        "'EMSDataSet'|'eLabs.03'|'Laboratory Result Type'|'3403007'|'Alkaline Phosphatase'|\n" +
        "'EMSDataSet'|'eLabs.03'|'Laboratory Result Type'|'3403009'|'Amylase'|\n" +
        "'EMSDataSet'|'eLabs.03'|'Laboratory Result Type'|'3403013'|'Aspartate Transaminase'|\n" +
        "'EMSDataSet'|'eLabs.03'|'Laboratory Result Type'|'3403015'|'B-Type Natriuretic Peptide (BNP)'|\n" +
        "'EMSDataSet'|'eLabs.03'|'Laboratory Result Type'|'3403017'|'Base Excess'|\n" +
        "'EMSDataSet'|'eLabs.03'|'Laboratory Result Type'|'3403019'|'Bilirubin-Direct'|\n" +
        "'EMSDataSet'|'eLabs.03'|'Laboratory Result Type'|'3403021'|'Bilirubin-Total'|\n" +
        "'EMSDataSet'|'eLabs.03'|'Laboratory Result Type'|'3403023'|'BUN'|\n" +
        "'EMSDataSet'|'eLabs.03'|'Laboratory Result Type'|'3403025'|'Calcium-Ionized'|\n" +
        "'EMSDataSet'|'eLabs.03'|'Laboratory Result Type'|'3403027'|'Calcium-Serum'|\n" +
        "'EMSDataSet'|'eLabs.03'|'Laboratory Result Type'|'3403029'|'Carbon Dioxide-Partial Pressure'|\n" +
        "'EMSDataSet'|'eLabs.03'|'Laboratory Result Type'|'3403033'|'Chloride'|\n" +
        "'EMSDataSet'|'eLabs.03'|'Laboratory Result Type'|'3403035'|'Creatine Kinase'|\n" +
        "'EMSDataSet'|'eLabs.03'|'Laboratory Result Type'|'3403037'|'Creatine Kinase-MB'|\n" +
        "'EMSDataSet'|'eLabs.03'|'Laboratory Result Type'|'3403039'|'Creatinine'|\n" +
        "'EMSDataSet'|'eLabs.03'|'Laboratory Result Type'|'3403041'|'Gamma Glutamyl Transpeptidase'|\n" +
        "'EMSDataSet'|'eLabs.03'|'Laboratory Result Type'|'3403043'|'Glucose'|\n" +
        "'EMSDataSet'|'eLabs.03'|'Laboratory Result Type'|'3403045'|'Hematocrit'|\n" +
        "'EMSDataSet'|'eLabs.03'|'Laboratory Result Type'|'3403047'|'Hemoglobin'|\n" +
        "'EMSDataSet'|'eLabs.03'|'Laboratory Result Type'|'3403049'|'Human Chorionic Gonadotropin-Serum'|\n" +
        "'EMSDataSet'|'eLabs.03'|'Laboratory Result Type'|'3403051'|'Human Chorionic Gonadotropin-Urine'|\n" +
        "'EMSDataSet'|'eLabs.03'|'Laboratory Result Type'|'3403053'|'International Normalized Ratio (INR)'|\n" +
        "'EMSDataSet'|'eLabs.03'|'Laboratory Result Type'|'3403055'|'Lactate Dehydrogenase'|\n" +
        "'EMSDataSet'|'eLabs.03'|'Laboratory Result Type'|'3403057'|'Lactate-Arterial'|\n" +
        "'EMSDataSet'|'eLabs.03'|'Laboratory Result Type'|'3403059'|'Lactate-Venous'|\n" +
        "'EMSDataSet'|'eLabs.03'|'Laboratory Result Type'|'3403061'|'Lipase'|\n" +
        "'EMSDataSet'|'eLabs.03'|'Laboratory Result Type'|'3403063'|'Magnesium'|\n" +
        "'EMSDataSet'|'eLabs.03'|'Laboratory Result Type'|'3403065'|'Oxygen-Partial Pressure'|\n" +
        "'EMSDataSet'|'eLabs.03'|'Laboratory Result Type'|'3403067'|'Partial Thromboplastin Time'|\n" +
        "'EMSDataSet'|'eLabs.03'|'Laboratory Result Type'|'3403071'|'pH-ABG'|\n" +
        "'EMSDataSet'|'eLabs.03'|'Laboratory Result Type'|'3403073'|'pH-Venous'|\n" +
        "'EMSDataSet'|'eLabs.03'|'Laboratory Result Type'|'3403075'|'Platelets'|\n" +
        "'EMSDataSet'|'eLabs.03'|'Laboratory Result Type'|'3403077'|'Potassium'|\n" +
        "'EMSDataSet'|'eLabs.03'|'Laboratory Result Type'|'3403079'|'Prothrombin Time'|\n" +
        "'EMSDataSet'|'eLabs.03'|'Laboratory Result Type'|'3403081'|'Red Blood Cells'|\n" +
        "'EMSDataSet'|'eLabs.03'|'Laboratory Result Type'|'3403083'|'Sodium'|\n" +
        "'EMSDataSet'|'eLabs.03'|'Laboratory Result Type'|'3403085'|'Troponin'|\n" +
        "'EMSDataSet'|'eLabs.03'|'Laboratory Result Type'|'3403087'|'White Blood Cells'|\n" +
        "'EMSDataSet'|'eLabs.03'|'Laboratory Result Type'|'3403089'|'Ammonia'|\n" +
        "'EMSDataSet'|'eLabs.03'|'Laboratory Result Type'|'3403091'|'Bicarbonate (HCO3)'|\n" +
        "'EMSDataSet'|'eLabs.03'|'Laboratory Result Type'|'3403093'|'Carboxyhemoglobin'|\n" +
        "'EMSDataSet'|'eLabs.03'|'Laboratory Result Type'|'3403095'|'CO2, Total (Bicarbonate)'|\n" +
        "'EMSDataSet'|'eLabs.03'|'Laboratory Result Type'|'3403097'|'CRP (C-Reactive Protein)'|\n" +
        "'EMSDataSet'|'eLabs.03'|'Laboratory Result Type'|'3403099'|'Dilantin'|\n" +
        "'EMSDataSet'|'eLabs.03'|'Laboratory Result Type'|'3403101'|'Leukocytes'|\n" +
        "'EMSDataSet'|'eLabs.03'|'Laboratory Result Type'|'3403103'|'Nitrates'|\n" +
        "'EMSDataSet'|'eLabs.03'|'Laboratory Result Type'|'3403105'|'Phenobarbital'|\n" +
        "'EMSDataSet'|'eLabs.03'|'Laboratory Result Type'|'3403107'|'Protein'|\n" +
        "'EMSDataSet'|'eLabs.03'|'Laboratory Result Type'|'3403109'|'Salicylate'|\n" +
        "'EMSDataSet'|'eLabs.03'|'Laboratory Result Type'|'3403111'|'Specific Gravity'|\n" +
        "'EMSDataSet'|'eLabs.03'|'Laboratory Result Type'|'3403113'|'Tylenol'|\n" +
        "'EMSDataSet'|'eLabs.05'|'Imaging Study Type'|'3405001'|'CAT Scan'|\n" +
        "'EMSDataSet'|'eLabs.05'|'Imaging Study Type'|'3405003'|'Magnetic Resonance Imaging (MRI)'|\n" +
        "'EMSDataSet'|'eLabs.05'|'Imaging Study Type'|'3405005'|'Other'|\n" +
        "'EMSDataSet'|'eLabs.05'|'Imaging Study Type'|'3405007'|'PET Scan'|\n" +
        "'EMSDataSet'|'eLabs.05'|'Imaging Study Type'|'3405009'|'Ultrasound'|\n" +
        "'EMSDataSet'|'eLabs.05'|'Imaging Study Type'|'3405011'|'X-ray'|\n" +
        "'EMSDataSet'|'eLabs.05'|'Imaging Study Type'|'3405013'|'Angiography'|\n" +
        "'EMSDataSet'|'eExam.02'|'Length Based Tape Measure'|'3502001'|'Blue'|\n" +
        "'EMSDataSet'|'eExam.02'|'Length Based Tape Measure'|'3502003'|'Green'|\n" +
        "'EMSDataSet'|'eExam.02'|'Length Based Tape Measure'|'3502005'|'Grey'|\n" +
        "'EMSDataSet'|'eExam.02'|'Length Based Tape Measure'|'3502007'|'Orange'|\n" +
        "'EMSDataSet'|'eExam.02'|'Length Based Tape Measure'|'3502009'|'Pink'|\n" +
        "'EMSDataSet'|'eExam.02'|'Length Based Tape Measure'|'3502011'|'Purple'|\n" +
        "'EMSDataSet'|'eExam.02'|'Length Based Tape Measure'|'3502013'|'Red'|\n" +
        "'EMSDataSet'|'eExam.02'|'Length Based Tape Measure'|'3502015'|'White'|\n" +
        "'EMSDataSet'|'eExam.02'|'Length Based Tape Measure'|'3502017'|'Yellow'|\n" +
        "'EMSDataSet'|'eExam.04'|'Skin Assessment'|'3504001'|'Clammy'|\n" +
        "'EMSDataSet'|'eExam.04'|'Skin Assessment'|'3504003'|'Cold'|\n" +
        "'EMSDataSet'|'eExam.04'|'Skin Assessment'|'3504005'|'Cyanotic'|\n" +
        "'EMSDataSet'|'eExam.04'|'Skin Assessment'|'3504007'|'Diaphoretic'|\n" +
        "'EMSDataSet'|'eExam.04'|'Skin Assessment'|'3504009'|'Dry'|\n" +
        "'EMSDataSet'|'eExam.04'|'Skin Assessment'|'3504011'|'Flushed'|\n" +
        "'EMSDataSet'|'eExam.04'|'Skin Assessment'|'3504013'|'Hot'|\n" +
        "'EMSDataSet'|'eExam.04'|'Skin Assessment'|'3504015'|'Jaundiced'|\n" +
        "'EMSDataSet'|'eExam.04'|'Skin Assessment'|'3504017'|'Lividity'|\n" +
        "'EMSDataSet'|'eExam.04'|'Skin Assessment'|'3504019'|'Mottled'|\n" +
        "'EMSDataSet'|'eExam.04'|'Skin Assessment'|'3504021'|'Normal'|\n" +
        "'EMSDataSet'|'eExam.04'|'Skin Assessment'|'3504023'|'Not Done'|\n" +
        "'EMSDataSet'|'eExam.04'|'Skin Assessment'|'3504025'|'Pale'|\n" +
        "'EMSDataSet'|'eExam.04'|'Skin Assessment'|'3504027'|'Poor Turgor'|\n" +
        "'EMSDataSet'|'eExam.04'|'Skin Assessment'|'3504029'|'Red (Erythematous)'|\n" +
        "'EMSDataSet'|'eExam.04'|'Skin Assessment'|'3504031'|'Tenting'|\n" +
        "'EMSDataSet'|'eExam.04'|'Skin Assessment'|'3504033'|'Warm'|\n" +
        "'EMSDataSet'|'eExam.04'|'Skin Assessment'|'3504035'|'Capillary Nail Bed Refill less than 2 seconds'|\n" +
        "'EMSDataSet'|'eExam.04'|'Skin Assessment'|'3504037'|'Capillary Nail Bed Refill 2-4 seconds'|\n" +
        "'EMSDataSet'|'eExam.04'|'Skin Assessment'|'3504039'|'Capillary Nail Bed Refill more than 4 seconds'|\n" +
        "'EMSDataSet'|'eExam.05'|'Head Assessment'|'3505001'|'Abrasion'|\n" +
        "'EMSDataSet'|'eExam.05'|'Head Assessment'|'3505003'|'Avulsion'|\n" +
        "'EMSDataSet'|'eExam.05'|'Head Assessment'|'3505005'|'Bleeding Controlled'|\n" +
        "'EMSDataSet'|'eExam.05'|'Head Assessment'|'3505007'|'Bleeding Uncontrolled'|\n" +
        "'EMSDataSet'|'eExam.05'|'Head Assessment'|'3505009'|'Burn-Blistering'|\n" +
        "'EMSDataSet'|'eExam.05'|'Head Assessment'|'3505011'|'Burn-Charring'|\n" +
        "'EMSDataSet'|'eExam.05'|'Head Assessment'|'3505013'|'Burn-Redness'|\n" +
        "'EMSDataSet'|'eExam.05'|'Head Assessment'|'3505015'|'Burn-White/Waxy'|\n" +
        "'EMSDataSet'|'eExam.05'|'Head Assessment'|'3505017'|'Decapitation'|\n" +
        "'EMSDataSet'|'eExam.05'|'Head Assessment'|'3505019'|'Deformity'|\n" +
        "'EMSDataSet'|'eExam.05'|'Head Assessment'|'3505021'|'Drainage'|\n" +
        "'EMSDataSet'|'eExam.05'|'Head Assessment'|'3505023'|'Foreign Body'|\n" +
        "'EMSDataSet'|'eExam.05'|'Head Assessment'|'3505029'|'Laceration'|\n" +
        "'EMSDataSet'|'eExam.05'|'Head Assessment'|'3505031'|'Mass/Lesion'|\n" +
        "'EMSDataSet'|'eExam.05'|'Head Assessment'|'3505033'|'Normal'|\n" +
        "'EMSDataSet'|'eExam.05'|'Head Assessment'|'3505035'|'Not Done'|\n" +
        "'EMSDataSet'|'eExam.05'|'Head Assessment'|'3505037'|'Pain'|\n" +
        "'EMSDataSet'|'eExam.05'|'Head Assessment'|'3505039'|'Puncture/Stab Wound'|\n" +
        "'EMSDataSet'|'eExam.05'|'Head Assessment'|'3505045'|'Gunshot Wound'|\n" +
        "'EMSDataSet'|'eExam.05'|'Head Assessment'|'3505047'|'Crush Injury'|\n" +
        "'EMSDataSet'|'eExam.05'|'Head Assessment'|'3505049'|'Swelling'|\n" +
        "'EMSDataSet'|'eExam.05'|'Head Assessment'|'3505051'|'Contusion'|\n" +
        "'EMSDataSet'|'eExam.05'|'Head Assessment'|'3505053'|'Tenderness'|\n" +
        "'EMSDataSet'|'eExam.06'|'Face Assessment'|'3506001'|'Abrasion'|\n" +
        "'EMSDataSet'|'eExam.06'|'Face Assessment'|'3506003'|'Asymmetric Smile or Droop'|\n" +
        "'EMSDataSet'|'eExam.06'|'Face Assessment'|'3506005'|'Avulsion'|\n" +
        "'EMSDataSet'|'eExam.06'|'Face Assessment'|'3506007'|'Bleeding Controlled'|\n" +
        "'EMSDataSet'|'eExam.06'|'Face Assessment'|'3506009'|'Bleeding Uncontrolled'|\n" +
        "'EMSDataSet'|'eExam.06'|'Face Assessment'|'3506011'|'Burn-Blistering'|\n" +
        "'EMSDataSet'|'eExam.06'|'Face Assessment'|'3506013'|'Burn-Charring'|\n" +
        "'EMSDataSet'|'eExam.06'|'Face Assessment'|'3506015'|'Burn-Redness'|\n" +
        "'EMSDataSet'|'eExam.06'|'Face Assessment'|'3506017'|'Burn-White/Waxy'|\n" +
        "'EMSDataSet'|'eExam.06'|'Face Assessment'|'3506021'|'Deformity'|\n" +
        "'EMSDataSet'|'eExam.06'|'Face Assessment'|'3506023'|'Drainage'|\n" +
        "'EMSDataSet'|'eExam.06'|'Face Assessment'|'3506025'|'Foreign Body'|\n" +
        "'EMSDataSet'|'eExam.06'|'Face Assessment'|'3506031'|'Laceration'|\n" +
        "'EMSDataSet'|'eExam.06'|'Face Assessment'|'3506033'|'Mass/Lesion'|\n" +
        "'EMSDataSet'|'eExam.06'|'Face Assessment'|'3506035'|'Normal'|\n" +
        "'EMSDataSet'|'eExam.06'|'Face Assessment'|'3506037'|'Not Done'|\n" +
        "'EMSDataSet'|'eExam.06'|'Face Assessment'|'3506039'|'Pain'|\n" +
        "'EMSDataSet'|'eExam.06'|'Face Assessment'|'3506041'|'Puncture/Stab Wound'|\n" +
        "'EMSDataSet'|'eExam.06'|'Face Assessment'|'3506047'|'Gunshot Wound'|\n" +
        "'EMSDataSet'|'eExam.06'|'Face Assessment'|'3506049'|'Crush Injury'|\n" +
        "'EMSDataSet'|'eExam.06'|'Face Assessment'|'3506051'|'Tenderness'|\n" +
        "'EMSDataSet'|'eExam.06'|'Face Assessment'|'3506053'|'Swelling'|\n" +
        "'EMSDataSet'|'eExam.06'|'Face Assessment'|'3506055'|'Contusion'|\n" +
        "'EMSDataSet'|'eExam.07'|'Neck Assessment'|'3507001'|'Abrasion'|\n" +
        "'EMSDataSet'|'eExam.07'|'Neck Assessment'|'3507003'|'Avulsion'|\n" +
        "'EMSDataSet'|'eExam.07'|'Neck Assessment'|'3507005'|'Bleeding Controlled'|\n" +
        "'EMSDataSet'|'eExam.07'|'Neck Assessment'|'3507007'|'Bleeding Uncontrolled'|\n" +
        "'EMSDataSet'|'eExam.07'|'Neck Assessment'|'3507009'|'Burn-Blistering'|\n" +
        "'EMSDataSet'|'eExam.07'|'Neck Assessment'|'3507011'|'Burn-Charring'|\n" +
        "'EMSDataSet'|'eExam.07'|'Neck Assessment'|'3507013'|'Burn-Redness'|\n" +
        "'EMSDataSet'|'eExam.07'|'Neck Assessment'|'3507015'|'Burn-White/Waxy'|\n" +
        "'EMSDataSet'|'eExam.07'|'Neck Assessment'|'3507017'|'Decapitation'|\n" +
        "'EMSDataSet'|'eExam.07'|'Neck Assessment'|'3507019'|'Foreign Body'|\n" +
        "'EMSDataSet'|'eExam.07'|'Neck Assessment'|'3507025'|'JVD'|\n" +
        "'EMSDataSet'|'eExam.07'|'Neck Assessment'|'3507027'|'Laceration'|\n" +
        "'EMSDataSet'|'eExam.07'|'Neck Assessment'|'3507029'|'Normal'|\n" +
        "'EMSDataSet'|'eExam.07'|'Neck Assessment'|'3507031'|'Not Done'|\n" +
        "'EMSDataSet'|'eExam.07'|'Neck Assessment'|'3507033'|'Pain'|\n" +
        "'EMSDataSet'|'eExam.07'|'Neck Assessment'|'3507035'|'Puncture/Stab Wound'|\n" +
        "'EMSDataSet'|'eExam.07'|'Neck Assessment'|'3507037'|'Stridor'|\n" +
        "'EMSDataSet'|'eExam.07'|'Neck Assessment'|'3507039'|'Subcutaneous Air'|\n" +
        "'EMSDataSet'|'eExam.07'|'Neck Assessment'|'3507045'|'Tracheal Deviation-Left'|\n" +
        "'EMSDataSet'|'eExam.07'|'Neck Assessment'|'3507047'|'Tracheal Deviation-Right'|\n" +
        "'EMSDataSet'|'eExam.07'|'Neck Assessment'|'3507049'|'Gunshot Wound'|\n" +
        "'EMSDataSet'|'eExam.07'|'Neck Assessment'|'3507051'|'Crush Injury'|\n" +
        "'EMSDataSet'|'eExam.07'|'Neck Assessment'|'3507053'|'Swelling'|\n" +
        "'EMSDataSet'|'eExam.07'|'Neck Assessment'|'3507055'|'Contusion'|\n" +
        "'EMSDataSet'|'eExam.07'|'Neck Assessment'|'3507057'|'Deformity'|\n" +
        "'EMSDataSet'|'eExam.07'|'Neck Assessment'|'3507059'|'Tenderness'|\n" +
        "'EMSDataSet'|'eExam.08'|'Chest/Lungs Assessment'|'3508001'|'Abrasion'|\n" +
        "'EMSDataSet'|'eExam.08'|'Chest/Lungs Assessment'|'3508003'|'Avulsion'|\n" +
        "'EMSDataSet'|'eExam.08'|'Chest/Lungs Assessment'|'3508005'|'Accessory Muscles Used with Breathing'|\n" +
        "'EMSDataSet'|'eExam.08'|'Chest/Lungs Assessment'|'3508007'|'Bleeding Controlled'|\n" +
        "'EMSDataSet'|'eExam.08'|'Chest/Lungs Assessment'|'3508009'|'Bleeding Uncontrolled'|\n" +
        "'EMSDataSet'|'eExam.08'|'Chest/Lungs Assessment'|'3508011'|'Breath Sounds-Absent-Left'|\n" +
        "'EMSDataSet'|'eExam.08'|'Chest/Lungs Assessment'|'3508013'|'Breath Sounds-Absent-Right'|\n" +
        "'EMSDataSet'|'eExam.08'|'Chest/Lungs Assessment'|'3508015'|'Breath Sounds-Decreased Left'|\n" +
        "'EMSDataSet'|'eExam.08'|'Chest/Lungs Assessment'|'3508017'|'Breath Sounds-Decreased Right'|\n" +
        "'EMSDataSet'|'eExam.08'|'Chest/Lungs Assessment'|'3508019'|'Breath Sounds-Equal'|\n" +
        "'EMSDataSet'|'eExam.08'|'Chest/Lungs Assessment'|'3508021'|'Breath Sounds-Normal-Left'|\n" +
        "'EMSDataSet'|'eExam.08'|'Chest/Lungs Assessment'|'3508023'|'Breath Sounds-Normal-Right'|\n" +
        "'EMSDataSet'|'eExam.08'|'Chest/Lungs Assessment'|'3508025'|'Burn-Blistering'|\n" +
        "'EMSDataSet'|'eExam.08'|'Chest/Lungs Assessment'|'3508027'|'Burn-Charring'|\n" +
        "'EMSDataSet'|'eExam.08'|'Chest/Lungs Assessment'|'3508029'|'Burn-Redness'|\n" +
        "'EMSDataSet'|'eExam.08'|'Chest/Lungs Assessment'|'3508031'|'Burn-White/Waxy'|\n" +
        "'EMSDataSet'|'eExam.08'|'Chest/Lungs Assessment'|'3508033'|'Crush Injury'|\n" +
        "'EMSDataSet'|'eExam.08'|'Chest/Lungs Assessment'|'3508035'|'Deformity'|\n" +
        "'EMSDataSet'|'eExam.08'|'Chest/Lungs Assessment'|'3508037'|'Flail Segment-Left'|\n" +
        "'EMSDataSet'|'eExam.08'|'Chest/Lungs Assessment'|'3508039'|'Flail Segment-Right'|\n" +
        "'EMSDataSet'|'eExam.08'|'Chest/Lungs Assessment'|'3508041'|'Foreign Body'|\n" +
        "'EMSDataSet'|'eExam.08'|'Chest/Lungs Assessment'|'3508047'|'Increased Respiratory Effort'|\n" +
        "'EMSDataSet'|'eExam.08'|'Chest/Lungs Assessment'|'3508049'|'Implanted Device'|\n" +
        "'EMSDataSet'|'eExam.08'|'Chest/Lungs Assessment'|'3508051'|'Laceration'|\n" +
        "'EMSDataSet'|'eExam.08'|'Chest/Lungs Assessment'|'3508053'|'Normal'|\n" +
        "'EMSDataSet'|'eExam.08'|'Chest/Lungs Assessment'|'3508055'|'Not Done'|\n" +
        "'EMSDataSet'|'eExam.08'|'Chest/Lungs Assessment'|'3508057'|'Pain'|\n" +
        "'EMSDataSet'|'eExam.08'|'Chest/Lungs Assessment'|'3508059'|'Pain with Inspiration/expiration-Left'|\n" +
        "'EMSDataSet'|'eExam.08'|'Chest/Lungs Assessment'|'3508061'|'Pain with Inspiration/expiration-Right'|\n" +
        "'EMSDataSet'|'eExam.08'|'Chest/Lungs Assessment'|'3508063'|'Puncture/Stab Wound'|\n" +
        "'EMSDataSet'|'eExam.08'|'Chest/Lungs Assessment'|'3508065'|'Rales-Left'|\n" +
        "'EMSDataSet'|'eExam.08'|'Chest/Lungs Assessment'|'3508067'|'Rales-Right'|\n" +
        "'EMSDataSet'|'eExam.08'|'Chest/Lungs Assessment'|'3508069'|'Retraction'|\n" +
        "'EMSDataSet'|'eExam.08'|'Chest/Lungs Assessment'|'3508071'|'Rhonchi-Left'|\n" +
        "'EMSDataSet'|'eExam.08'|'Chest/Lungs Assessment'|'3508073'|'Rhonchi-Right'|\n" +
        "'EMSDataSet'|'eExam.08'|'Chest/Lungs Assessment'|'3508075'|'Rhonchi/Wheezing'|\n" +
        "'EMSDataSet'|'eExam.08'|'Chest/Lungs Assessment'|'3508077'|'Stridor-Left'|\n" +
        "'EMSDataSet'|'eExam.08'|'Chest/Lungs Assessment'|'3508079'|'Stridor-Right'|\n" +
        "'EMSDataSet'|'eExam.08'|'Chest/Lungs Assessment'|'3508085'|'Tenderness-Left'|\n" +
        "'EMSDataSet'|'eExam.08'|'Chest/Lungs Assessment'|'3508087'|'Tenderness-Right'|\n" +
        "'EMSDataSet'|'eExam.08'|'Chest/Lungs Assessment'|'3508089'|'Wheezing-Expiratory - Left'|\n" +
        "'EMSDataSet'|'eExam.08'|'Chest/Lungs Assessment'|'3508091'|'Wheezing-Expiratory - Right'|\n" +
        "'EMSDataSet'|'eExam.08'|'Chest/Lungs Assessment'|'3508093'|'Wheezing-Inspiratory - Left'|\n" +
        "'EMSDataSet'|'eExam.08'|'Chest/Lungs Assessment'|'3508095'|'Wheezing-Inspiratory - Right'|\n" +
        "'EMSDataSet'|'eExam.08'|'Chest/Lungs Assessment'|'3508097'|'Gunshot Wound'|\n" +
        "'EMSDataSet'|'eExam.08'|'Chest/Lungs Assessment'|'3508099'|'Swelling'|\n" +
        "'EMSDataSet'|'eExam.08'|'Chest/Lungs Assessment'|'3508101'|'Contusion'|\n" +
        "'EMSDataSet'|'eExam.08'|'Chest/Lungs Assessment'|'3508103'|'Tenderness-General'|\n" +
        "'EMSDataSet'|'eExam.09'|'Heart Assessment'|'3509001'|'Clicks'|\n" +
        "'EMSDataSet'|'eExam.09'|'Heart Assessment'|'3509003'|'Heart Sounds Decreased'|\n" +
        "'EMSDataSet'|'eExam.09'|'Heart Assessment'|'3509005'|'Murmur-Diastolic'|\n" +
        "'EMSDataSet'|'eExam.09'|'Heart Assessment'|'3509007'|'Murmur-Systolic'|\n" +
        "'EMSDataSet'|'eExam.09'|'Heart Assessment'|'3509009'|'Normal'|\n" +
        "'EMSDataSet'|'eExam.09'|'Heart Assessment'|'3509011'|'Not Done'|\n" +
        "'EMSDataSet'|'eExam.09'|'Heart Assessment'|'3509013'|'Rubs'|\n" +
        "'EMSDataSet'|'eExam.09'|'Heart Assessment'|'3509015'|'S1'|\n" +
        "'EMSDataSet'|'eExam.09'|'Heart Assessment'|'3509017'|'S2'|\n" +
        "'EMSDataSet'|'eExam.09'|'Heart Assessment'|'3509019'|'S3'|\n" +
        "'EMSDataSet'|'eExam.09'|'Heart Assessment'|'3509021'|'S4'|\n" +
        "'EMSDataSet'|'eExam.10'|'Abdominal Assessment Finding Location'|'3510001'|'Generalized'|\n" +
        "'EMSDataSet'|'eExam.10'|'Abdominal Assessment Finding Location'|'3510003'|'Left Lower Quadrant'|\n" +
        "'EMSDataSet'|'eExam.10'|'Abdominal Assessment Finding Location'|'3510005'|'Left Upper Quadrant'|\n" +
        "'EMSDataSet'|'eExam.10'|'Abdominal Assessment Finding Location'|'3510007'|'Periumbilical'|\n" +
        "'EMSDataSet'|'eExam.10'|'Abdominal Assessment Finding Location'|'3510009'|'Right Lower Quadrant'|\n" +
        "'EMSDataSet'|'eExam.10'|'Abdominal Assessment Finding Location'|'3510011'|'Right Upper Quadrant'|\n" +
        "'EMSDataSet'|'eExam.10'|'Abdominal Assessment Finding Location'|'3510013'|'Epigastric'|\n" +
        "'EMSDataSet'|'eExam.11'|'Abdomen Assessment'|'3511001'|'Abrasion'|\n" +
        "'EMSDataSet'|'eExam.11'|'Abdomen Assessment'|'3511003'|'Avulsion'|\n" +
        "'EMSDataSet'|'eExam.11'|'Abdomen Assessment'|'3511005'|'Bleeding Controlled'|\n" +
        "'EMSDataSet'|'eExam.11'|'Abdomen Assessment'|'3511007'|'Bleeding Uncontrolled'|\n" +
        "'EMSDataSet'|'eExam.11'|'Abdomen Assessment'|'3511009'|'Bowel Sounds-Absent'|\n" +
        "'EMSDataSet'|'eExam.11'|'Abdomen Assessment'|'3511011'|'Bowel Sounds-Present'|\n" +
        "'EMSDataSet'|'eExam.11'|'Abdomen Assessment'|'3511013'|'Burn-Blistering'|\n" +
        "'EMSDataSet'|'eExam.11'|'Abdomen Assessment'|'3511015'|'Burn-Charring'|\n" +
        "'EMSDataSet'|'eExam.11'|'Abdomen Assessment'|'3511017'|'Burn-Redness'|\n" +
        "'EMSDataSet'|'eExam.11'|'Abdomen Assessment'|'3511019'|'Burn-White/Waxy'|\n" +
        "'EMSDataSet'|'eExam.11'|'Abdomen Assessment'|'3511021'|'Distention'|\n" +
        "'EMSDataSet'|'eExam.11'|'Abdomen Assessment'|'3511023'|'Foreign Body'|\n" +
        "'EMSDataSet'|'eExam.11'|'Abdomen Assessment'|'3511025'|'Guarding'|\n" +
        "'EMSDataSet'|'eExam.11'|'Abdomen Assessment'|'3511031'|'Laceration'|\n" +
        "'EMSDataSet'|'eExam.11'|'Abdomen Assessment'|'3511033'|'Mass/Lesion'|\n" +
        "'EMSDataSet'|'eExam.11'|'Abdomen Assessment'|'3511035'|'Mass-Pulsating'|\n" +
        "'EMSDataSet'|'eExam.11'|'Abdomen Assessment'|'3511037'|'Normal'|\n" +
        "'EMSDataSet'|'eExam.11'|'Abdomen Assessment'|'3511039'|'Not Done'|\n" +
        "'EMSDataSet'|'eExam.11'|'Abdomen Assessment'|'3511041'|'Pain'|\n" +
        "'EMSDataSet'|'eExam.11'|'Abdomen Assessment'|'3511043'|'Pregnant-Palpable Uterus'|\n" +
        "'EMSDataSet'|'eExam.11'|'Abdomen Assessment'|'3511045'|'Puncture/Stab Wound'|\n" +
        "'EMSDataSet'|'eExam.11'|'Abdomen Assessment'|'3511051'|'Tenderness'|\n" +
        "'EMSDataSet'|'eExam.11'|'Abdomen Assessment'|'3511053'|'Gunshot Wound'|\n" +
        "'EMSDataSet'|'eExam.11'|'Abdomen Assessment'|'3511055'|'Crush Injury'|\n" +
        "'EMSDataSet'|'eExam.11'|'Abdomen Assessment'|'3511057'|'Swelling'|\n" +
        "'EMSDataSet'|'eExam.11'|'Abdomen Assessment'|'3511059'|'Contusion'|\n" +
        "'EMSDataSet'|'eExam.11'|'Abdomen Assessment'|'3511061'|'Deformity'|\n" +
        "'EMSDataSet'|'eExam.11'|'Abdomen Assessment'|'3511063'|'Rebound Tenderness'|\n" +
        "'EMSDataSet'|'eExam.11'|'Abdomen Assessment'|'3511065'|'Rigidity'|\n" +
        "'EMSDataSet'|'eExam.12'|'Pelvis/Genitourinary Assessment'|'3512001'|'Abrasion'|\n" +
        "'EMSDataSet'|'eExam.12'|'Pelvis/Genitourinary Assessment'|'3512003'|'Avulsion'|\n" +
        "'EMSDataSet'|'eExam.12'|'Pelvis/Genitourinary Assessment'|'3512005'|'Bleeding Controlled'|\n" +
        "'EMSDataSet'|'eExam.12'|'Pelvis/Genitourinary Assessment'|'3512007'|'Bleeding Uncontrolled'|\n" +
        "'EMSDataSet'|'eExam.12'|'Pelvis/Genitourinary Assessment'|'3512009'|'Bleeding-Rectal'|\n" +
        "'EMSDataSet'|'eExam.12'|'Pelvis/Genitourinary Assessment'|'3512011'|'Bleeding-Urethral'|\n" +
        "'EMSDataSet'|'eExam.12'|'Pelvis/Genitourinary Assessment'|'3512013'|'Bleeding-Vaginal'|\n" +
        "'EMSDataSet'|'eExam.12'|'Pelvis/Genitourinary Assessment'|'3512015'|'Burn-Blistering'|\n" +
        "'EMSDataSet'|'eExam.12'|'Pelvis/Genitourinary Assessment'|'3512017'|'Burn-Charring'|\n" +
        "'EMSDataSet'|'eExam.12'|'Pelvis/Genitourinary Assessment'|'3512019'|'Burn-Redness'|\n" +
        "'EMSDataSet'|'eExam.12'|'Pelvis/Genitourinary Assessment'|'3512021'|'Burn-White/Waxy'|\n" +
        "'EMSDataSet'|'eExam.12'|'Pelvis/Genitourinary Assessment'|'3512023'|'Deformity'|\n" +
        "'EMSDataSet'|'eExam.12'|'Pelvis/Genitourinary Assessment'|'3512025'|'Foreign Body'|\n" +
        "'EMSDataSet'|'eExam.12'|'Pelvis/Genitourinary Assessment'|'3512027'|'Genital Injury'|\n" +
        "'EMSDataSet'|'eExam.12'|'Pelvis/Genitourinary Assessment'|'3512033'|'Laceration'|\n" +
        "'EMSDataSet'|'eExam.12'|'Pelvis/Genitourinary Assessment'|'3512035'|'Mass/Lesion'|\n" +
        "'EMSDataSet'|'eExam.12'|'Pelvis/Genitourinary Assessment'|'3512037'|'Normal'|\n" +
        "'EMSDataSet'|'eExam.12'|'Pelvis/Genitourinary Assessment'|'3512039'|'Not Done'|\n" +
        "'EMSDataSet'|'eExam.12'|'Pelvis/Genitourinary Assessment'|'3512041'|'Pain'|\n" +
        "'EMSDataSet'|'eExam.12'|'Pelvis/Genitourinary Assessment'|'3512043'|'Pelvic Fracture'|\n" +
        "'EMSDataSet'|'eExam.12'|'Pelvis/Genitourinary Assessment'|'3512045'|'Pelvic Instability'|\n" +
        "'EMSDataSet'|'eExam.12'|'Pelvis/Genitourinary Assessment'|'3512047'|'Penile Priapism/Erection'|\n" +
        "'EMSDataSet'|'eExam.12'|'Pelvis/Genitourinary Assessment'|'3512049'|'Pregnant-Crowning'|\n" +
        "'EMSDataSet'|'eExam.12'|'Pelvis/Genitourinary Assessment'|'3512051'|'Puncture/Stab Wound'|\n" +
        "'EMSDataSet'|'eExam.12'|'Pelvis/Genitourinary Assessment'|'3512057'|'Tenderness'|\n" +
        "'EMSDataSet'|'eExam.12'|'Pelvis/Genitourinary Assessment'|'3512059'|'Gunshot Wound'|\n" +
        "'EMSDataSet'|'eExam.12'|'Pelvis/Genitourinary Assessment'|'3512061'|'Crush Injury'|\n" +
        "'EMSDataSet'|'eExam.12'|'Pelvis/Genitourinary Assessment'|'3512063'|'Swelling'|\n" +
        "'EMSDataSet'|'eExam.12'|'Pelvis/Genitourinary Assessment'|'3512065'|'Contusion'|\n" +
        "'EMSDataSet'|'eExam.13'|'Back and Spine Assessment Finding Location'|'3513001'|'Back-General'|\n" +
        "'EMSDataSet'|'eExam.13'|'Back and Spine Assessment Finding Location'|'3513003'|'Cervical-Left'|\n" +
        "'EMSDataSet'|'eExam.13'|'Back and Spine Assessment Finding Location'|'3513005'|'Cervical-Midline'|\n" +
        "'EMSDataSet'|'eExam.13'|'Back and Spine Assessment Finding Location'|'3513007'|'Cervical-Right'|\n" +
        "'EMSDataSet'|'eExam.13'|'Back and Spine Assessment Finding Location'|'3513009'|'Lumbar-Left'|\n" +
        "'EMSDataSet'|'eExam.13'|'Back and Spine Assessment Finding Location'|'3513011'|'Lumbar-Midline'|\n" +
        "'EMSDataSet'|'eExam.13'|'Back and Spine Assessment Finding Location'|'3513013'|'Lumbar-Right'|\n" +
        "'EMSDataSet'|'eExam.13'|'Back and Spine Assessment Finding Location'|'3513015'|'Thoracic-Left'|\n" +
        "'EMSDataSet'|'eExam.13'|'Back and Spine Assessment Finding Location'|'3513017'|'Thoracic-Midline'|\n" +
        "'EMSDataSet'|'eExam.13'|'Back and Spine Assessment Finding Location'|'3513019'|'Thoracic-Right'|\n" +
        "'EMSDataSet'|'eExam.13'|'Back and Spine Assessment Finding Location'|'3513021'|'Sacral-Left'|\n" +
        "'EMSDataSet'|'eExam.13'|'Back and Spine Assessment Finding Location'|'3513023'|'Sacral-Midline'|\n" +
        "'EMSDataSet'|'eExam.13'|'Back and Spine Assessment Finding Location'|'3513025'|'Sacral-Right'|\n" +
        "'EMSDataSet'|'eExam.14'|'Back and Spine Assessment'|'3514001'|'Abrasion'|\n" +
        "'EMSDataSet'|'eExam.14'|'Back and Spine Assessment'|'3514003'|'Avulsion'|\n" +
        "'EMSDataSet'|'eExam.14'|'Back and Spine Assessment'|'3514005'|'Bleeding Controlled'|\n" +
        "'EMSDataSet'|'eExam.14'|'Back and Spine Assessment'|'3514007'|'Bleeding Uncontrolled'|\n" +
        "'EMSDataSet'|'eExam.14'|'Back and Spine Assessment'|'3514009'|'Burn-Blistering'|\n" +
        "'EMSDataSet'|'eExam.14'|'Back and Spine Assessment'|'3514011'|'Burn-Charring'|\n" +
        "'EMSDataSet'|'eExam.14'|'Back and Spine Assessment'|'3514013'|'Burn-Redness'|\n" +
        "'EMSDataSet'|'eExam.14'|'Back and Spine Assessment'|'3514015'|'Burn-White/Waxy'|\n" +
        "'EMSDataSet'|'eExam.14'|'Back and Spine Assessment'|'3514017'|'Deformity'|\n" +
        "'EMSDataSet'|'eExam.14'|'Back and Spine Assessment'|'3514019'|'Foreign Body'|\n" +
        "'EMSDataSet'|'eExam.14'|'Back and Spine Assessment'|'3514025'|'Laceration'|\n" +
        "'EMSDataSet'|'eExam.14'|'Back and Spine Assessment'|'3514027'|'Normal'|\n" +
        "'EMSDataSet'|'eExam.14'|'Back and Spine Assessment'|'3514029'|'Not Done'|\n" +
        "'EMSDataSet'|'eExam.14'|'Back and Spine Assessment'|'3514031'|'Pain'|\n" +
        "'EMSDataSet'|'eExam.14'|'Back and Spine Assessment'|'3514033'|'Pain with Range of Motion'|\n" +
        "'EMSDataSet'|'eExam.14'|'Back and Spine Assessment'|'3514035'|'Puncture/Stab Wound'|\n" +
        "'EMSDataSet'|'eExam.14'|'Back and Spine Assessment'|'3514041'|'Tenderness Costovertebral Angle'|\n" +
        "'EMSDataSet'|'eExam.14'|'Back and Spine Assessment'|'3514043'|'Tenderness Midline Spinous Process'|\n" +
        "'EMSDataSet'|'eExam.14'|'Back and Spine Assessment'|'3514045'|'Tenderness Paraspinous'|\n" +
        "'EMSDataSet'|'eExam.14'|'Back and Spine Assessment'|'3514047'|'Gunshot Wound'|\n" +
        "'EMSDataSet'|'eExam.14'|'Back and Spine Assessment'|'3514049'|'Crush Injury'|\n" +
        "'EMSDataSet'|'eExam.14'|'Back and Spine Assessment'|'3514051'|'Swelling'|\n" +
        "'EMSDataSet'|'eExam.14'|'Back and Spine Assessment'|'3514053'|'Contusion'|\n" +
        "'EMSDataSet'|'eExam.14'|'Back and Spine Assessment'|'3514055'|'Tenderness'|\n" +
        "'EMSDataSet'|'eExam.15'|'Extremity Assessment Finding Location'|'3515001'|'Ankle-Left'|\n" +
        "'EMSDataSet'|'eExam.15'|'Extremity Assessment Finding Location'|'3515003'|'Ankle-Right'|\n" +
        "'EMSDataSet'|'eExam.15'|'Extremity Assessment Finding Location'|'3515005'|'Arm-Upper-Left'|\n" +
        "'EMSDataSet'|'eExam.15'|'Extremity Assessment Finding Location'|'3515007'|'Arm-Upper-Right'|\n" +
        "'EMSDataSet'|'eExam.15'|'Extremity Assessment Finding Location'|'3515009'|'Elbow-Left'|\n" +
        "'EMSDataSet'|'eExam.15'|'Extremity Assessment Finding Location'|'3515011'|'Elbow-Right'|\n" +
        "'EMSDataSet'|'eExam.15'|'Extremity Assessment Finding Location'|'3515013'|'Finger-2nd (Index)-Left'|\n" +
        "'EMSDataSet'|'eExam.15'|'Extremity Assessment Finding Location'|'3515015'|'Finger-2nd (Index)-Right'|\n" +
        "'EMSDataSet'|'eExam.15'|'Extremity Assessment Finding Location'|'3515017'|'Finger-3rd (Middle)-Left'|\n" +
        "'EMSDataSet'|'eExam.15'|'Extremity Assessment Finding Location'|'3515019'|'Finger-3rd (Middle)-Right'|\n" +
        "'EMSDataSet'|'eExam.15'|'Extremity Assessment Finding Location'|'3515021'|'Finger-4th (Ring)-Left'|\n" +
        "'EMSDataSet'|'eExam.15'|'Extremity Assessment Finding Location'|'3515023'|'Finger-4th (Ring)-Right'|\n" +
        "'EMSDataSet'|'eExam.15'|'Extremity Assessment Finding Location'|'3515025'|'Finger-5th (Smallest)-Left'|\n" +
        "'EMSDataSet'|'eExam.15'|'Extremity Assessment Finding Location'|'3515027'|'Finger-5th (Smallest)-Right'|\n" +
        "'EMSDataSet'|'eExam.15'|'Extremity Assessment Finding Location'|'3515029'|'Foot-Dorsal-Left'|\n" +
        "'EMSDataSet'|'eExam.15'|'Extremity Assessment Finding Location'|'3515031'|'Foot-Dorsal-Right'|\n" +
        "'EMSDataSet'|'eExam.15'|'Extremity Assessment Finding Location'|'3515033'|'Foot-Plantar-Left'|\n" +
        "'EMSDataSet'|'eExam.15'|'Extremity Assessment Finding Location'|'3515035'|'Foot-Plantar-Right'|\n" +
        "'EMSDataSet'|'eExam.15'|'Extremity Assessment Finding Location'|'3515037'|'Forearm-Left'|\n" +
        "'EMSDataSet'|'eExam.15'|'Extremity Assessment Finding Location'|'3515039'|'Forearm-Right'|\n" +
        "'EMSDataSet'|'eExam.15'|'Extremity Assessment Finding Location'|'3515041'|'Hand-Dorsal-Left'|\n" +
        "'EMSDataSet'|'eExam.15'|'Extremity Assessment Finding Location'|'3515043'|'Hand-Dorsal-Right'|\n" +
        "'EMSDataSet'|'eExam.15'|'Extremity Assessment Finding Location'|'3515045'|'Hand-Palm-Left'|\n" +
        "'EMSDataSet'|'eExam.15'|'Extremity Assessment Finding Location'|'3515047'|'Hand-Palm-Right'|\n" +
        "'EMSDataSet'|'eExam.15'|'Extremity Assessment Finding Location'|'3515049'|'Hip-Left'|\n" +
        "'EMSDataSet'|'eExam.15'|'Extremity Assessment Finding Location'|'3515051'|'Hip-Right'|\n" +
        "'EMSDataSet'|'eExam.15'|'Extremity Assessment Finding Location'|'3515053'|'Knee-Left'|\n" +
        "'EMSDataSet'|'eExam.15'|'Extremity Assessment Finding Location'|'3515055'|'Knee-Right'|\n" +
        "'EMSDataSet'|'eExam.15'|'Extremity Assessment Finding Location'|'3515057'|'Leg-Lower-Left'|\n" +
        "'EMSDataSet'|'eExam.15'|'Extremity Assessment Finding Location'|'3515059'|'Leg-Lower-Right'|\n" +
        "'EMSDataSet'|'eExam.15'|'Extremity Assessment Finding Location'|'3515061'|'Leg-Upper-Left'|\n" +
        "'EMSDataSet'|'eExam.15'|'Extremity Assessment Finding Location'|'3515063'|'Leg-Upper-Right'|\n" +
        "'EMSDataSet'|'eExam.15'|'Extremity Assessment Finding Location'|'3515065'|'Shoulder-Left'|\n" +
        "'EMSDataSet'|'eExam.15'|'Extremity Assessment Finding Location'|'3515067'|'Shoulder-Right'|\n" +
        "'EMSDataSet'|'eExam.15'|'Extremity Assessment Finding Location'|'3515069'|'Thumb-Left'|\n" +
        "'EMSDataSet'|'eExam.15'|'Extremity Assessment Finding Location'|'3515071'|'Thumb-Right'|\n" +
        "'EMSDataSet'|'eExam.15'|'Extremity Assessment Finding Location'|'3515073'|'Toe-1st (Big)-Left'|\n" +
        "'EMSDataSet'|'eExam.15'|'Extremity Assessment Finding Location'|'3515075'|'Toe-1st (Big)-Right'|\n" +
        "'EMSDataSet'|'eExam.15'|'Extremity Assessment Finding Location'|'3515077'|'Toe-2nd-Left'|\n" +
        "'EMSDataSet'|'eExam.15'|'Extremity Assessment Finding Location'|'3515079'|'Toe-2nd-Right'|\n" +
        "'EMSDataSet'|'eExam.15'|'Extremity Assessment Finding Location'|'3515081'|'Toe-3rd-Left'|\n" +
        "'EMSDataSet'|'eExam.15'|'Extremity Assessment Finding Location'|'3515083'|'Toe-3rd-Right'|\n" +
        "'EMSDataSet'|'eExam.15'|'Extremity Assessment Finding Location'|'3515085'|'Toe-4th-Left'|\n" +
        "'EMSDataSet'|'eExam.15'|'Extremity Assessment Finding Location'|'3515087'|'Toe-4th-Right'|\n" +
        "'EMSDataSet'|'eExam.15'|'Extremity Assessment Finding Location'|'3515089'|'Toe-5th (Smallest)-Left'|\n" +
        "'EMSDataSet'|'eExam.15'|'Extremity Assessment Finding Location'|'3515091'|'Toe-5th (Smallest)-Right'|\n" +
        "'EMSDataSet'|'eExam.15'|'Extremity Assessment Finding Location'|'3515093'|'Wrist-Left'|\n" +
        "'EMSDataSet'|'eExam.15'|'Extremity Assessment Finding Location'|'3515095'|'Wrist-Right'|\n" +
        "'EMSDataSet'|'eExam.16'|'Extremities Assessment'|'3516001'|'Abrasion'|\n" +
        "'EMSDataSet'|'eExam.16'|'Extremities Assessment'|'3516003'|'Amputation-Acute'|\n" +
        "'EMSDataSet'|'eExam.16'|'Extremities Assessment'|'3516005'|'Amputation-Previous'|\n" +
        "'EMSDataSet'|'eExam.16'|'Extremities Assessment'|'3516007'|'Avulsion'|\n" +
        "'EMSDataSet'|'eExam.16'|'Extremities Assessment'|'3516009'|'Bleeding Controlled'|\n" +
        "'EMSDataSet'|'eExam.16'|'Extremities Assessment'|'3516011'|'Bleeding Uncontrolled'|\n" +
        "'EMSDataSet'|'eExam.16'|'Extremities Assessment'|'3516013'|'Burn-Blistering'|\n" +
        "'EMSDataSet'|'eExam.16'|'Extremities Assessment'|'3516015'|'Burn-Charring'|\n" +
        "'EMSDataSet'|'eExam.16'|'Extremities Assessment'|'3516017'|'Burn-Redness'|\n" +
        "'EMSDataSet'|'eExam.16'|'Extremities Assessment'|'3516019'|'Burn-White/Waxy'|\n" +
        "'EMSDataSet'|'eExam.16'|'Extremities Assessment'|'3516021'|'Clubbing (of fingers)'|\n" +
        "'EMSDataSet'|'eExam.16'|'Extremities Assessment'|'3516023'|'Crush Injury'|\n" +
        "'EMSDataSet'|'eExam.16'|'Extremities Assessment'|'3516025'|'Deformity'|\n" +
        "'EMSDataSet'|'eExam.16'|'Extremities Assessment'|'3516027'|'Dislocation'|\n" +
        "'EMSDataSet'|'eExam.16'|'Extremities Assessment'|'3516029'|'Edema'|\n" +
        "'EMSDataSet'|'eExam.16'|'Extremities Assessment'|'3516031'|'Foreign Body'|\n" +
        "'EMSDataSet'|'eExam.16'|'Extremities Assessment'|'3516033'|'Fracture-Closed'|\n" +
        "'EMSDataSet'|'eExam.16'|'Extremities Assessment'|'3516035'|'Fracture-Open'|\n" +
        "'EMSDataSet'|'eExam.16'|'Extremities Assessment'|'3516041'|'Laceration'|\n" +
        "'EMSDataSet'|'eExam.16'|'Extremities Assessment'|'3516043'|'Motor Function-Abnormal/Weakness'|\n" +
        "'EMSDataSet'|'eExam.16'|'Extremities Assessment'|'3516045'|'Motor Function-Absent'|\n" +
        "'EMSDataSet'|'eExam.16'|'Extremities Assessment'|'3516047'|'Motor Function-Normal'|\n" +
        "'EMSDataSet'|'eExam.16'|'Extremities Assessment'|'3516049'|'Normal'|\n" +
        "'EMSDataSet'|'eExam.16'|'Extremities Assessment'|'3516051'|'Not Done'|\n" +
        "'EMSDataSet'|'eExam.16'|'Extremities Assessment'|'3516053'|'Pain'|\n" +
        "'EMSDataSet'|'eExam.16'|'Extremities Assessment'|'3516055'|'Paralysis'|\n" +
        "'EMSDataSet'|'eExam.16'|'Extremities Assessment'|'3516057'|'Pulse-Abnormal'|\n" +
        "'EMSDataSet'|'eExam.16'|'Extremities Assessment'|'3516059'|'Pulse-Absent'|\n" +
        "'EMSDataSet'|'eExam.16'|'Extremities Assessment'|'3516061'|'Pulse-Normal'|\n" +
        "'EMSDataSet'|'eExam.16'|'Extremities Assessment'|'3516063'|'Puncture/Stab Wound'|\n" +
        "'EMSDataSet'|'eExam.16'|'Extremities Assessment'|'3516065'|'Sensation-Abnormal'|\n" +
        "'EMSDataSet'|'eExam.16'|'Extremities Assessment'|'3516067'|'Sensation-Absent'|\n" +
        "'EMSDataSet'|'eExam.16'|'Extremities Assessment'|'3516069'|'Sensation-Normal'|\n" +
        "'EMSDataSet'|'eExam.16'|'Extremities Assessment'|'3516075'|'Tenderness'|\n" +
        "'EMSDataSet'|'eExam.16'|'Extremities Assessment'|'3516077'|'Gunshot Wound'|\n" +
        "'EMSDataSet'|'eExam.16'|'Extremities Assessment'|'3516079'|'Swelling'|\n" +
        "'EMSDataSet'|'eExam.16'|'Extremities Assessment'|'3516081'|'Contusion'|\n" +
        "'EMSDataSet'|'eExam.16'|'Extremities Assessment'|'3516083'|'Arm Drift'|\n" +
        "'EMSDataSet'|'eExam.17'|'Eye Assessment Finding Location'|'3517001'|'Bilateral'|\n" +
        "'EMSDataSet'|'eExam.17'|'Eye Assessment Finding Location'|'3517003'|'Left'|\n" +
        "'EMSDataSet'|'eExam.17'|'Eye Assessment Finding Location'|'3517005'|'Right'|\n" +
        "'EMSDataSet'|'eExam.18'|'Eye Assessment'|'3518001'|'1-mm'|\n" +
        "'EMSDataSet'|'eExam.18'|'Eye Assessment'|'3518003'|'2-mm'|\n" +
        "'EMSDataSet'|'eExam.18'|'Eye Assessment'|'3518005'|'3-mm'|\n" +
        "'EMSDataSet'|'eExam.18'|'Eye Assessment'|'3518007'|'4-mm'|\n" +
        "'EMSDataSet'|'eExam.18'|'Eye Assessment'|'3518009'|'5-mm'|\n" +
        "'EMSDataSet'|'eExam.18'|'Eye Assessment'|'3518011'|'6-mm'|\n" +
        "'EMSDataSet'|'eExam.18'|'Eye Assessment'|'3518013'|'7-mm'|\n" +
        "'EMSDataSet'|'eExam.18'|'Eye Assessment'|'3518015'|'8-mm or >'|\n" +
        "'EMSDataSet'|'eExam.18'|'Eye Assessment'|'3518017'|'Blind'|\n" +
        "'EMSDataSet'|'eExam.18'|'Eye Assessment'|'3518019'|'Cataract Present'|\n" +
        "'EMSDataSet'|'eExam.18'|'Eye Assessment'|'3518021'|'Clouded'|\n" +
        "'EMSDataSet'|'eExam.18'|'Eye Assessment'|'3518023'|'Deformity'|\n" +
        "'EMSDataSet'|'eExam.18'|'Eye Assessment'|'3518025'|'Dysconjugate Gaze'|\n" +
        "'EMSDataSet'|'eExam.18'|'Eye Assessment'|'3518027'|'Foreign Body'|\n" +
        "'EMSDataSet'|'eExam.18'|'Eye Assessment'|'3518029'|'Glaucoma Present'|\n" +
        "'EMSDataSet'|'eExam.18'|'Eye Assessment'|'3518031'|'Hyphema'|\n" +
        "'EMSDataSet'|'eExam.18'|'Eye Assessment'|'3518033'|'Jaundiced Sclera'|\n" +
        "'EMSDataSet'|'eExam.18'|'Eye Assessment'|'3518035'|'Missing'|\n" +
        "'EMSDataSet'|'eExam.18'|'Eye Assessment'|'3518037'|'Non-Reactive'|\n" +
        "'EMSDataSet'|'eExam.18'|'Eye Assessment'|'3518039'|'Not Done'|\n" +
        "'EMSDataSet'|'eExam.18'|'Eye Assessment'|'3518041'|'Non-Reactive Prosthetic'|\n" +
        "'EMSDataSet'|'eExam.18'|'Eye Assessment'|'3518043'|'Nystagmus Noted'|\n" +
        "'EMSDataSet'|'eExam.18'|'Eye Assessment'|'3518045'|'Open Globe'|\n" +
        "'EMSDataSet'|'eExam.18'|'Eye Assessment'|'3518047'|'PERRL'|\n" +
        "'EMSDataSet'|'eExam.18'|'Eye Assessment'|'3518049'|'Pupil-Irregular/Teardrop'|\n" +
        "'EMSDataSet'|'eExam.18'|'Eye Assessment'|'3518051'|'Reactive'|\n" +
        "'EMSDataSet'|'eExam.18'|'Eye Assessment'|'3518053'|'Sluggish'|\n" +
        "'EMSDataSet'|'eExam.18'|'Eye Assessment'|'3518055'|'Swelling'|\n" +
        "'EMSDataSet'|'eExam.18'|'Eye Assessment'|'3518057'|'Contusion'|\n" +
        "'EMSDataSet'|'eExam.18'|'Eye Assessment'|'3518059'|'Puncture/Stab Wound'|\n" +
        "'EMSDataSet'|'eExam.19'|'Mental Status Assessment'|'3519001'|'Combative'|\n" +
        "'EMSDataSet'|'eExam.19'|'Mental Status Assessment'|'3519003'|'Confused'|\n" +
        "'EMSDataSet'|'eExam.19'|'Mental Status Assessment'|'3519005'|'Hallucinations'|\n" +
        "'EMSDataSet'|'eExam.19'|'Mental Status Assessment'|'3519007'|'Normal Baseline for Patient'|\n" +
        "'EMSDataSet'|'eExam.19'|'Mental Status Assessment'|'3519009'|'Not Done'|\n" +
        "'EMSDataSet'|'eExam.19'|'Mental Status Assessment'|'3519011'|'Oriented-Person'|\n" +
        "'EMSDataSet'|'eExam.19'|'Mental Status Assessment'|'3519013'|'Oriented-Place'|\n" +
        "'EMSDataSet'|'eExam.19'|'Mental Status Assessment'|'3519015'|'Oriented-Event'|\n" +
        "'EMSDataSet'|'eExam.19'|'Mental Status Assessment'|'3519017'|'Oriented-Time'|\n" +
        "'EMSDataSet'|'eExam.19'|'Mental Status Assessment'|'3519019'|'Pharmacologically Sedated/Paralyzed'|\n" +
        "'EMSDataSet'|'eExam.19'|'Mental Status Assessment'|'3519021'|'Unresponsive'|\n" +
        "'EMSDataSet'|'eExam.19'|'Mental Status Assessment'|'3519023'|'Agitation'|\n" +
        "'EMSDataSet'|'eExam.19'|'Mental Status Assessment'|'3519025'|'Somnolent'|\n" +
        "'EMSDataSet'|'eExam.19'|'Mental Status Assessment'|'3519027'|'Stupor'|\n" +
        "'EMSDataSet'|'eExam.20'|'Neurological Assessment'|'3520001'|'Aphagia'|\n" +
        "'EMSDataSet'|'eExam.20'|'Neurological Assessment'|'3520003'|'Aphasia'|\n" +
        "'EMSDataSet'|'eExam.20'|'Neurological Assessment'|'3520005'|'Cerebellar Function-Abnormal'|\n" +
        "'EMSDataSet'|'eExam.20'|'Neurological Assessment'|'3520007'|'Cerebellar Function-Normal'|\n" +
        "'EMSDataSet'|'eExam.20'|'Neurological Assessment'|'3520009'|'Decerebrate Posturing'|\n" +
        "'EMSDataSet'|'eExam.20'|'Neurological Assessment'|'3520011'|'Decorticate Posturing'|\n" +
        "'EMSDataSet'|'eExam.20'|'Neurological Assessment'|'3520013'|'Gait-Abnormal'|\n" +
        "'EMSDataSet'|'eExam.20'|'Neurological Assessment'|'3520015'|'Gait-Normal'|\n" +
        "'EMSDataSet'|'eExam.20'|'Neurological Assessment'|'3520017'|'Hemiplegia-Left'|\n" +
        "'EMSDataSet'|'eExam.20'|'Neurological Assessment'|'3520019'|'Hemiplegia-Right'|\n" +
        "'EMSDataSet'|'eExam.20'|'Neurological Assessment'|'3520021'|'Normal Baseline for Patient'|\n" +
        "'EMSDataSet'|'eExam.20'|'Neurological Assessment'|'3520023'|'Not Done'|\n" +
        "'EMSDataSet'|'eExam.20'|'Neurological Assessment'|'3520025'|'Seizures'|\n" +
        "'EMSDataSet'|'eExam.20'|'Neurological Assessment'|'3520027'|'Speech Normal'|\n" +
        "'EMSDataSet'|'eExam.20'|'Neurological Assessment'|'3520029'|'Speech Slurring'|\n" +
        "'EMSDataSet'|'eExam.20'|'Neurological Assessment'|'3520031'|'Strength-Asymmetric'|\n" +
        "'EMSDataSet'|'eExam.20'|'Neurological Assessment'|'3520033'|'Strength-Normal'|\n" +
        "'EMSDataSet'|'eExam.20'|'Neurological Assessment'|'3520035'|'Strength-Symmetric'|\n" +
        "'EMSDataSet'|'eExam.20'|'Neurological Assessment'|'3520037'|'Tremors'|\n" +
        "'EMSDataSet'|'eExam.20'|'Neurological Assessment'|'3520039'|'Weakness-Facial Droop-Left'|\n" +
        "'EMSDataSet'|'eExam.20'|'Neurological Assessment'|'3520041'|'Weakness-Facial Droop-Right'|\n" +
        "'EMSDataSet'|'eExam.20'|'Neurological Assessment'|'3520043'|'Weakness-Left Sided'|\n" +
        "'EMSDataSet'|'eExam.20'|'Neurological Assessment'|'3520045'|'Weakness-Right Sided'|\n" +
        "'EMSDataSet'|'eExam.20'|'Neurological Assessment'|'3520051'|'Arm Drift-Left'|\n" +
        "'EMSDataSet'|'eExam.20'|'Neurological Assessment'|'3520053'|'Arm Drift-Right'|\n" +
        "'EMSDataSet'|'eExam.21'|'Stroke/CVA Symptoms Resolved'|'3521001'|'No'|\n" +
        "'EMSDataSet'|'eExam.21'|'Stroke/CVA Symptoms Resolved'|'3521003'|'Yes-Resolved Prior to EMS Arrival'|\n" +
        "'EMSDataSet'|'eExam.21'|'Stroke/CVA Symptoms Resolved'|'3521005'|'Yes-Resolved in EMS Presence'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914001'|'Airway'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914003'|'Airway-Failed'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914005'|'Airway-Obstruction/Foreign Body'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914007'|'Airway-Rapid Sequence Induction (RSI-Paralytic)'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914009'|'Airway-Sedation Assisted (Non-Paralytic)'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914011'|'Cardiac Arrest-Asystole'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914013'|'Cardiac Arrest-Hypothermia-Therapeutic'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914015'|'Cardiac Arrest-Pulseless Electrical Activity'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914017'|'Cardiac Arrest-Ventricular Fibrillation/ Pulseless Ventricular Tachycardia'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914019'|'Cardiac Arrest-Post Resuscitation Care'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914021'|'Environmental-Altitude Sickness'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914023'|'Environmental-Cold Exposure'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914025'|'Environmental-Frostbite/Cold Injury'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914027'|'Environmental-Heat Exposure/Exhaustion'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914029'|'Environmental-Heat Stroke/Hyperthermia'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914031'|'Environmental-Hypothermia'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914033'|'Exposure-Airway/Inhalation Irritants'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914035'|'Exposure-Biological/Infectious'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914037'|'Exposure-Blistering Agents'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914041'|'Exposure-Chemicals to Eye'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914043'|'Exposure-Cyanide'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914045'|'Exposure-Explosive/ Blast Injury'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914047'|'Exposure-Nerve Agents'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914049'|'Exposure-Radiologic Agents'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914051'|'General-Back Pain'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914053'|'General-Behavioral/Patient Restraint'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914055'|'General-Cardiac Arrest'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914057'|'General-Dental Problems'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914059'|'General-Epistaxis'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914061'|'General-Fever'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914063'|'General-Individualized Patient Protocol'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914065'|'General-Indwelling Medical Devices/Equipment'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914067'|'General-IV Access'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914069'|'General-Medical Device Malfunction'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914071'|'General-Pain Control'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914073'|'General-Spinal Immobilization/Clearance'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914075'|'General-Universal Patient Care/ Initial Patient Contact'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914077'|'Injury-Amputation'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914079'|'Injury-Bites and Envenomations-Land'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914081'|'Injury-Bites and Envenomations-Marine'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914083'|'Injury-Bleeding/ Hemorrhage Control'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914085'|'Injury-Burns-Thermal'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914087'|'Injury-Cardiac Arrest'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914089'|'Injury-Crush Syndrome'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914091'|'Injury-Diving Emergencies'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914093'|'Injury-Drowning/Near Drowning'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914095'|'Injury-Electrical Injuries'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914097'|'Injury-Extremity'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914099'|'Injury-Eye'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914101'|'Injury-Head'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914103'|'Injury-Impaled Object'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914105'|'Injury-Multisystem'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914107'|'Injury-Spinal Cord'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914109'|'Medical-Abdominal Pain'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914111'|'Medical-Allergic Reaction/Anaphylaxis'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914113'|'Medical-Altered Mental Status'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914115'|'Medical-Bradycardia'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914117'|'Medical-Cardiac Chest Pain'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914119'|'Medical-Diarrhea'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914121'|'Medical-Hyperglycemia'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914123'|'Medical-Hypertension'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914125'|'Medical-Hypoglycemia/Diabetic Emergency'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914127'|'Medical-Hypotension/Shock (Non-Trauma)'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914129'|'Medical-Influenza-Like Illness/ Upper Respiratory Infection'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914131'|'Medical-Nausea/Vomiting'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914133'|'Medical-Newborn/ Neonatal Resuscitation'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914135'|'General-Overdose/Poisoning/Toxic Ingestion'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914137'|'Medical-Pulmonary Edema/CHF'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914139'|'Medical-Respiratory Distress/Asthma/COPD/Reactive Airway'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914141'|'Medical-Seizure'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914143'|'Medical-ST-Elevation Myocardial Infarction (STEMI)'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914145'|'Medical-Stroke/TIA'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914147'|'Medical-Supraventricular Tachycardia (Including Atrial Fibrillation)'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914149'|'Medical-Syncope'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914151'|'Medical-Ventricular Tachycardia (With Pulse)'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914153'|'Not Done'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914155'|'OB/GYN-Childbirth/Labor/Delivery'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914157'|'OB/GYN-Eclampsia'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914159'|'OB/GYN-Gynecologic Emergencies'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914161'|'OB/GYN-Pregnancy Related Emergencies'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914163'|'OB/GYN-Post-partum Hemorrhage'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914165'|'Other'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914167'|'Exposure-Carbon Monoxide'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914169'|'Cardiac Arrest-Do Not Resuscitate'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914171'|'Cardiac Arrest-Special Resuscitation Orders'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914173'|'Exposure-Smoke Inhalation'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914175'|'General-Community Paramedicine / Mobile Integrated Healthcare'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914177'|'General-Exception Protocol'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914179'|'General-Extended Care Guidelines'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914181'|'General-Interfacility Transfers'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914183'|'General-Law Enforcement - Blood for Legal Purposes'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914185'|'General-Law Enforcement - Assist with Law Enforcement Activity'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914187'|'General-Neglect or Abuse Suspected'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914189'|'General-Refusal of Care'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914191'|'Injury-Mass/Multiple Casualties'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914193'|'Injury-Thoracic'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914195'|'Medical-Adrenal Insufficiency'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914197'|'Medical-Apparent Life Threatening Event (ALTE)'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914199'|'Medical-Tachycardia'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914201'|'Cardiac Arrest-Determination of Death / Withholding Resuscitative Efforts'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914203'|'Injury-Conducted Electrical Weapon (e.g., Taser)'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914205'|'Injury-Facial Trauma'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914207'|'Injury-General Trauma Management'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914209'|'Injury-Lightning/Lightning Strike'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914211'|'Injury-SCUBA Injury/Accidents'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914213'|'Injury-Topical Chemical Burn'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914215'|'Medical-Beta Blocker Poisoning/Overdose'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914217'|'Medical-Calcium Channel Blocker Poisoning/Overdose'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914219'|'Medical-Opioid Poisoning/Overdose'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914221'|'Medical-Respiratory Distress-Bronchiolitis'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914223'|'Medical-Respiratory Distress-Croup'|\n" +
        "'EMSDataSet'|'eProtocols.01'|'Protocols Used'|'9914225'|'Medical-Stimulant Poisoning/Overdose'|\n" +
        "'EMSDataSet'|'eProtocols.02'|'Protocol Age Category'|'3602001'|'Adult Only'|\n" +
        "'EMSDataSet'|'eProtocols.02'|'Protocol Age Category'|'3602003'|'General'|\n" +
        "'EMSDataSet'|'eProtocols.02'|'Protocol Age Category'|'3602005'|'Pediatric Only'|\n" +
        "'EMSDataSet'|'eMedications.02'|'Medication Administered Prior to this Unit's EMS Care'|'9923001'|'No'|\n" +
        "'EMSDataSet'|'eMedications.02'|'Medication Administered Prior to this Unit's EMS Care'|'9923003'|'Yes'|\n" +
        "'EMSDataSet'|'eMedications.04'|'Medication Administered Route'|'9927001'|'Blow-By'|\n" +
        "'EMSDataSet'|'eMedications.04'|'Medication Administered Route'|'9927003'|'Buccal'|\n" +
        "'EMSDataSet'|'eMedications.04'|'Medication Administered Route'|'9927005'|'Endotracheal Tube (ET)'|\n" +
        "'EMSDataSet'|'eMedications.04'|'Medication Administered Route'|'9927007'|'Gastrostomy Tube'|\n" +
        "'EMSDataSet'|'eMedications.04'|'Medication Administered Route'|'9927009'|'Inhalation'|\n" +
        "'EMSDataSet'|'eMedications.04'|'Medication Administered Route'|'9927011'|'Intraarterial'|\n" +
        "'EMSDataSet'|'eMedications.04'|'Medication Administered Route'|'9927013'|'Intradermal'|\n" +
        "'EMSDataSet'|'eMedications.04'|'Medication Administered Route'|'9927015'|'Intramuscular (IM)'|\n" +
        "'EMSDataSet'|'eMedications.04'|'Medication Administered Route'|'9927017'|'Intranasal'|\n" +
        "'EMSDataSet'|'eMedications.04'|'Medication Administered Route'|'9927019'|'Intraocular'|\n" +
        "'EMSDataSet'|'eMedications.04'|'Medication Administered Route'|'9927021'|'Intraosseous (IO)'|\n" +
        "'EMSDataSet'|'eMedications.04'|'Medication Administered Route'|'9927023'|'Intravenous (IV)'|\n" +
        "'EMSDataSet'|'eMedications.04'|'Medication Administered Route'|'9927025'|'Nasal Cannula'|\n" +
        "'EMSDataSet'|'eMedications.04'|'Medication Administered Route'|'9927027'|'Nasogastric'|\n" +
        "'EMSDataSet'|'eMedications.04'|'Medication Administered Route'|'9927029'|'Nasotracheal Tube'|\n" +
        "'EMSDataSet'|'eMedications.04'|'Medication Administered Route'|'9927031'|'Non-Rebreather Mask'|\n" +
        "'EMSDataSet'|'eMedications.04'|'Medication Administered Route'|'9927033'|'Ophthalmic'|\n" +
        "'EMSDataSet'|'eMedications.04'|'Medication Administered Route'|'9927035'|'Oral'|\n" +
        "'EMSDataSet'|'eMedications.04'|'Medication Administered Route'|'9927037'|'Other/miscellaneous'|\n" +
        "'EMSDataSet'|'eMedications.04'|'Medication Administered Route'|'9927039'|'Otic'|\n" +
        "'EMSDataSet'|'eMedications.04'|'Medication Administered Route'|'9927041'|'Re-breather mask'|\n" +
        "'EMSDataSet'|'eMedications.04'|'Medication Administered Route'|'9927043'|'Rectal'|\n" +
        "'EMSDataSet'|'eMedications.04'|'Medication Administered Route'|'9927045'|'Subcutaneous'|\n" +
        "'EMSDataSet'|'eMedications.04'|'Medication Administered Route'|'9927047'|'Sublingual'|\n" +
        "'EMSDataSet'|'eMedications.04'|'Medication Administered Route'|'9927049'|'Topical'|\n" +
        "'EMSDataSet'|'eMedications.04'|'Medication Administered Route'|'9927051'|'Tracheostomy'|\n" +
        "'EMSDataSet'|'eMedications.04'|'Medication Administered Route'|'9927053'|'Transdermal'|\n" +
        "'EMSDataSet'|'eMedications.04'|'Medication Administered Route'|'9927055'|'Urethral'|\n" +
        "'EMSDataSet'|'eMedications.04'|'Medication Administered Route'|'9927057'|'Ventimask'|\n" +
        "'EMSDataSet'|'eMedications.04'|'Medication Administered Route'|'9927059'|'Wound'|\n" +
        "'EMSDataSet'|'eMedications.04'|'Medication Administered Route'|'9927061'|'Portacath'|\n" +
        "'EMSDataSet'|'eMedications.06'|'Medication Dosage Units'|'3706001'|'Grams (gms)'|\n" +
        "'EMSDataSet'|'eMedications.06'|'Medication Dosage Units'|'3706003'|'Inches (in)'|\n" +
        "'EMSDataSet'|'eMedications.06'|'Medication Dosage Units'|'3706005'|'International Units (IU)'|\n" +
        "'EMSDataSet'|'eMedications.06'|'Medication Dosage Units'|'3706007'|'Keep Vein Open (kvo)'|\n" +
        "'EMSDataSet'|'eMedications.06'|'Medication Dosage Units'|'3706009'|'Liters (l)'|\n" +
        "'EMSDataSet'|'eMedications.06'|'Medication Dosage Units'|'3706011'|'Liters Per Minute (l/min [fluid])'|\n" +
        "'EMSDataSet'|'eMedications.06'|'Medication Dosage Units'|'3706013'|'Metered Dose (MDI)'|\n" +
        "'EMSDataSet'|'eMedications.06'|'Medication Dosage Units'|'3706015'|'Micrograms (mcg)'|\n" +
        "'EMSDataSet'|'eMedications.06'|'Medication Dosage Units'|'3706017'|'Micrograms per Kilogram per Minute (mcg/kg/min)'|\n" +
        "'EMSDataSet'|'eMedications.06'|'Medication Dosage Units'|'3706019'|'Milliequivalents (mEq)'|\n" +
        "'EMSDataSet'|'eMedications.06'|'Medication Dosage Units'|'3706021'|'Milligrams (mg)'|\n" +
        "'EMSDataSet'|'eMedications.06'|'Medication Dosage Units'|'3706023'|'Milligrams per Kilogram Per Minute (mg/kg/min)'|\n" +
        "'EMSDataSet'|'eMedications.06'|'Medication Dosage Units'|'3706025'|'Milliliters (ml)'|\n" +
        "'EMSDataSet'|'eMedications.06'|'Medication Dosage Units'|'3706027'|'Milliliters per Hour (ml/hr)'|\n" +
        "'EMSDataSet'|'eMedications.06'|'Medication Dosage Units'|'3706029'|'Other'|\n" +
        "'EMSDataSet'|'eMedications.06'|'Medication Dosage Units'|'3706031'|'Centimeters (cm)'|\n" +
        "'EMSDataSet'|'eMedications.06'|'Medication Dosage Units'|'3706033'|'Drops (gtts)'|\n" +
        "'EMSDataSet'|'eMedications.06'|'Medication Dosage Units'|'3706035'|'Liters Per Minute (LPM [gas])'|\n" +
        "'EMSDataSet'|'eMedications.06'|'Medication Dosage Units'|'3706037'|'Micrograms per Minute (mcg/min)'|\n" +
        "'EMSDataSet'|'eMedications.06'|'Medication Dosage Units'|'3706039'|'Milligrams per Kilogram (mg/kg)'|\n" +
        "'EMSDataSet'|'eMedications.06'|'Medication Dosage Units'|'3706041'|'Milligrams per Minute (mg/min)'|\n" +
        "'EMSDataSet'|'eMedications.06'|'Medication Dosage Units'|'3706043'|'Puffs'|\n" +
        "'EMSDataSet'|'eMedications.06'|'Medication Dosage Units'|'3706045'|'Units per Hour (units/hr)'|\n" +
        "'EMSDataSet'|'eMedications.06'|'Medication Dosage Units'|'3706047'|'Micrograms per Kilogram (mcg/kg)'|\n" +
        "'EMSDataSet'|'eMedications.06'|'Medication Dosage Units'|'3706049'|'Units'|\n" +
        "'EMSDataSet'|'eMedications.06'|'Medication Dosage Units'|'3706051'|'Units per Kilogram per Hour (units/kg/hr)'|\n" +
        "'EMSDataSet'|'eMedications.06'|'Medication Dosage Units'|'3706053'|'Units per Kilogram (units/kg)'|\n" +
        "'EMSDataSet'|'eMedications.07'|'Response to Medication'|'9916001'|'Improved'|\n" +
        "'EMSDataSet'|'eMedications.07'|'Response to Medication'|'9916003'|'Unchanged'|\n" +
        "'EMSDataSet'|'eMedications.07'|'Response to Medication'|'9916005'|'Worse'|\n" +
        "'EMSDataSet'|'eMedications.08'|'Medication Complication'|'3708001'|'Altered Mental Status'|\n" +
        "'EMSDataSet'|'eMedications.08'|'Medication Complication'|'3708003'|'Apnea'|\n" +
        "'EMSDataSet'|'eMedications.08'|'Medication Complication'|'3708005'|'Bleeding'|\n" +
        "'EMSDataSet'|'eMedications.08'|'Medication Complication'|'3708007'|'Bradycardia'|\n" +
        "'EMSDataSet'|'eMedications.08'|'Medication Complication'|'3708009'|'Bradypnea'|\n" +
        "'EMSDataSet'|'eMedications.08'|'Medication Complication'|'3708011'|'Diarrhea'|\n" +
        "'EMSDataSet'|'eMedications.08'|'Medication Complication'|'3708013'|'Extravasation'|\n" +
        "'EMSDataSet'|'eMedications.08'|'Medication Complication'|'3708015'|'Hypertension'|\n" +
        "'EMSDataSet'|'eMedications.08'|'Medication Complication'|'3708017'|'Hyperthermia'|\n" +
        "'EMSDataSet'|'eMedications.08'|'Medication Complication'|'3708019'|'Hypotension'|\n" +
        "'EMSDataSet'|'eMedications.08'|'Medication Complication'|'3708021'|'Hypothermia'|\n" +
        "'EMSDataSet'|'eMedications.08'|'Medication Complication'|'3708023'|'Hypoxia'|\n" +
        "'EMSDataSet'|'eMedications.08'|'Medication Complication'|'3708025'|'Injury'|\n" +
        "'EMSDataSet'|'eMedications.08'|'Medication Complication'|'3708029'|'Nausea'|\n" +
        "'EMSDataSet'|'eMedications.08'|'Medication Complication'|'3708031'|'None'|\n" +
        "'EMSDataSet'|'eMedications.08'|'Medication Complication'|'3708033'|'Other'|\n" +
        "'EMSDataSet'|'eMedications.08'|'Medication Complication'|'3708035'|'Respiratory Distress'|\n" +
        "'EMSDataSet'|'eMedications.08'|'Medication Complication'|'3708037'|'Tachycardia'|\n" +
        "'EMSDataSet'|'eMedications.08'|'Medication Complication'|'3708039'|'Tachypnea'|\n" +
        "'EMSDataSet'|'eMedications.08'|'Medication Complication'|'3708041'|'Vomiting'|\n" +
        "'EMSDataSet'|'eMedications.08'|'Medication Complication'|'3708043'|'Itching'|\n" +
        "'EMSDataSet'|'eMedications.08'|'Medication Complication'|'3708045'|'Urticaria'|\n" +
        "'EMSDataSet'|'eMedications.10'|'Role/Type of Person Administering Medication'|'9905001'|'2009 Advanced Emergency Medical Technician (AEMT)'|\n" +
        "'EMSDataSet'|'eMedications.10'|'Role/Type of Person Administering Medication'|'9905003'|'2009 Emergency Medical Responder (EMR)'|\n" +
        "'EMSDataSet'|'eMedications.10'|'Role/Type of Person Administering Medication'|'9905005'|'2009 Emergency Medical Technician (EMT)'|\n" +
        "'EMSDataSet'|'eMedications.10'|'Role/Type of Person Administering Medication'|'9905007'|'2009 Paramedic'|\n" +
        "'EMSDataSet'|'eMedications.10'|'Role/Type of Person Administering Medication'|'9905009'|'EMT-Basic'|\n" +
        "'EMSDataSet'|'eMedications.10'|'Role/Type of Person Administering Medication'|'9905011'|'EMT-Intermediate'|\n" +
        "'EMSDataSet'|'eMedications.10'|'Role/Type of Person Administering Medication'|'9905013'|'EMT-Paramedic'|\n" +
        "'EMSDataSet'|'eMedications.10'|'Role/Type of Person Administering Medication'|'9905015'|'First Responder'|\n" +
        "'EMSDataSet'|'eMedications.10'|'Role/Type of Person Administering Medication'|'9905019'|'Other Healthcare Professional'|\n" +
        "'EMSDataSet'|'eMedications.10'|'Role/Type of Person Administering Medication'|'9905021'|'Other Non-Healthcare Professional'|\n" +
        "'EMSDataSet'|'eMedications.10'|'Role/Type of Person Administering Medication'|'9905023'|'Patient/Lay Person'|\n" +
        "'EMSDataSet'|'eMedications.10'|'Role/Type of Person Administering Medication'|'9905025'|'Physician'|\n" +
        "'EMSDataSet'|'eMedications.10'|'Role/Type of Person Administering Medication'|'9905027'|'Respiratory Therapist'|\n" +
        "'EMSDataSet'|'eMedications.10'|'Role/Type of Person Administering Medication'|'9905029'|'Student'|\n" +
        "'EMSDataSet'|'eMedications.10'|'Role/Type of Person Administering Medication'|'9905031'|'Critical Care Paramedic'|\n" +
        "'EMSDataSet'|'eMedications.10'|'Role/Type of Person Administering Medication'|'9905033'|'Community Paramedicine'|\n" +
        "'EMSDataSet'|'eMedications.10'|'Role/Type of Person Administering Medication'|'9905035'|'Nurse Practitioner'|\n" +
        "'EMSDataSet'|'eMedications.10'|'Role/Type of Person Administering Medication'|'9905037'|'Physician Assistant'|\n" +
        "'EMSDataSet'|'eMedications.10'|'Role/Type of Person Administering Medication'|'9905039'|'Licensed Practical Nurse (LPN)'|\n" +
        "'EMSDataSet'|'eMedications.10'|'Role/Type of Person Administering Medication'|'9905041'|'Registered Nurse'|\n" +
        "'EMSDataSet'|'eMedications.11'|'Medication Authorization'|'9918001'|'On-Line (Remote Verbal Order)'|\n" +
        "'EMSDataSet'|'eMedications.11'|'Medication Authorization'|'9918003'|'On-Scene'|\n" +
        "'EMSDataSet'|'eMedications.11'|'Medication Authorization'|'9918005'|'Protocol (Standing Order)'|\n" +
        "'EMSDataSet'|'eMedications.11'|'Medication Authorization'|'9918007'|'Written Orders (Patient Specific)'|\n" +
        "'EMSDataSet'|'eProcedures.02'|'Procedure Performed Prior to this Unit's EMS Care'|'9923001'|'No'|\n" +
        "'EMSDataSet'|'eProcedures.02'|'Procedure Performed Prior to this Unit's EMS Care'|'9923003'|'Yes'|\n" +
        "'EMSDataSet'|'eProcedures.06'|'Procedure Successful'|'9923001'|'No'|\n" +
        "'EMSDataSet'|'eProcedures.06'|'Procedure Successful'|'9923003'|'Yes'|\n" +
        "'EMSDataSet'|'eProcedures.07'|'Procedure Complication'|'3907001'|'Altered Mental Status'|\n" +
        "'EMSDataSet'|'eProcedures.07'|'Procedure Complication'|'3907003'|'Apnea'|\n" +
        "'EMSDataSet'|'eProcedures.07'|'Procedure Complication'|'3907005'|'Bleeding'|\n" +
        "'EMSDataSet'|'eProcedures.07'|'Procedure Complication'|'3907007'|'Bradypnea'|\n" +
        "'EMSDataSet'|'eProcedures.07'|'Procedure Complication'|'3907009'|'Diarrhea'|\n" +
        "'EMSDataSet'|'eProcedures.07'|'Procedure Complication'|'3907011'|'Esophageal Intubation-immediately'|\n" +
        "'EMSDataSet'|'eProcedures.07'|'Procedure Complication'|'3907013'|'Esophageal Intubation-other'|\n" +
        "'EMSDataSet'|'eProcedures.07'|'Procedure Complication'|'3907015'|'Extravasation'|\n" +
        "'EMSDataSet'|'eProcedures.07'|'Procedure Complication'|'3907017'|'Hypertension'|\n" +
        "'EMSDataSet'|'eProcedures.07'|'Procedure Complication'|'3907019'|'Hyperthermia'|\n" +
        "'EMSDataSet'|'eProcedures.07'|'Procedure Complication'|'3907021'|'Hypotension'|\n" +
        "'EMSDataSet'|'eProcedures.07'|'Procedure Complication'|'3907023'|'Hypothermia'|\n" +
        "'EMSDataSet'|'eProcedures.07'|'Procedure Complication'|'3907025'|'Hypoxia'|\n" +
        "'EMSDataSet'|'eProcedures.07'|'Procedure Complication'|'3907027'|'Injury'|\n" +
        "'EMSDataSet'|'eProcedures.07'|'Procedure Complication'|'3907031'|'Nausea'|\n" +
        "'EMSDataSet'|'eProcedures.07'|'Procedure Complication'|'3907033'|'None'|\n" +
        "'EMSDataSet'|'eProcedures.07'|'Procedure Complication'|'3907035'|'Other'|\n" +
        "'EMSDataSet'|'eProcedures.07'|'Procedure Complication'|'3907039'|'Respiratory Distress'|\n" +
        "'EMSDataSet'|'eProcedures.07'|'Procedure Complication'|'3907041'|'Tachycardia'|\n" +
        "'EMSDataSet'|'eProcedures.07'|'Procedure Complication'|'3907043'|'Tachypnea'|\n" +
        "'EMSDataSet'|'eProcedures.07'|'Procedure Complication'|'3907045'|'Vomiting'|\n" +
        "'EMSDataSet'|'eProcedures.07'|'Procedure Complication'|'3907047'|'Bradycardia'|\n" +
        "'EMSDataSet'|'eProcedures.07'|'Procedure Complication'|'3907049'|'Itching'|\n" +
        "'EMSDataSet'|'eProcedures.07'|'Procedure Complication'|'3907051'|'Urticaria'|\n" +
        "'EMSDataSet'|'eProcedures.08'|'Response to Procedure'|'9916001'|'Improved'|\n" +
        "'EMSDataSet'|'eProcedures.08'|'Response to Procedure'|'9916003'|'Unchanged'|\n" +
        "'EMSDataSet'|'eProcedures.08'|'Response to Procedure'|'9916005'|'Worse'|\n" +
        "'EMSDataSet'|'eProcedures.10'|'Role/Type of Person Performing the Procedure'|'9905001'|'2009 Advanced Emergency Medical Technician (AEMT)'|\n" +
        "'EMSDataSet'|'eProcedures.10'|'Role/Type of Person Performing the Procedure'|'9905003'|'2009 Emergency Medical Responder (EMR)'|\n" +
        "'EMSDataSet'|'eProcedures.10'|'Role/Type of Person Performing the Procedure'|'9905005'|'2009 Emergency Medical Technician (EMT)'|\n" +
        "'EMSDataSet'|'eProcedures.10'|'Role/Type of Person Performing the Procedure'|'9905007'|'2009 Paramedic'|\n" +
        "'EMSDataSet'|'eProcedures.10'|'Role/Type of Person Performing the Procedure'|'9905009'|'EMT-Basic'|\n" +
        "'EMSDataSet'|'eProcedures.10'|'Role/Type of Person Performing the Procedure'|'9905011'|'EMT-Intermediate'|\n" +
        "'EMSDataSet'|'eProcedures.10'|'Role/Type of Person Performing the Procedure'|'9905013'|'EMT-Paramedic'|\n" +
        "'EMSDataSet'|'eProcedures.10'|'Role/Type of Person Performing the Procedure'|'9905015'|'First Responder'|\n" +
        "'EMSDataSet'|'eProcedures.10'|'Role/Type of Person Performing the Procedure'|'9905019'|'Other Healthcare Professional'|\n" +
        "'EMSDataSet'|'eProcedures.10'|'Role/Type of Person Performing the Procedure'|'9905021'|'Other Non-Healthcare Professional'|\n" +
        "'EMSDataSet'|'eProcedures.10'|'Role/Type of Person Performing the Procedure'|'9905023'|'Patient/Lay Person'|\n" +
        "'EMSDataSet'|'eProcedures.10'|'Role/Type of Person Performing the Procedure'|'9905025'|'Physician'|\n" +
        "'EMSDataSet'|'eProcedures.10'|'Role/Type of Person Performing the Procedure'|'9905027'|'Respiratory Therapist'|\n" +
        "'EMSDataSet'|'eProcedures.10'|'Role/Type of Person Performing the Procedure'|'9905029'|'Student'|\n" +
        "'EMSDataSet'|'eProcedures.10'|'Role/Type of Person Performing the Procedure'|'9905031'|'Critical Care Paramedic'|\n" +
        "'EMSDataSet'|'eProcedures.10'|'Role/Type of Person Performing the Procedure'|'9905033'|'Community Paramedicine'|\n" +
        "'EMSDataSet'|'eProcedures.10'|'Role/Type of Person Performing the Procedure'|'9905035'|'Nurse Practitioner'|\n" +
        "'EMSDataSet'|'eProcedures.10'|'Role/Type of Person Performing the Procedure'|'9905037'|'Physician Assistant'|\n" +
        "'EMSDataSet'|'eProcedures.10'|'Role/Type of Person Performing the Procedure'|'9905039'|'Licensed Practical Nurse (LPN)'|\n" +
        "'EMSDataSet'|'eProcedures.10'|'Role/Type of Person Performing the Procedure'|'9905041'|'Registered Nurse'|\n" +
        "'EMSDataSet'|'eProcedures.11'|'Procedure Authorization'|'9918001'|'On-Line (Remote Verbal Order)'|\n" +
        "'EMSDataSet'|'eProcedures.11'|'Procedure Authorization'|'9918003'|'On-Scene'|\n" +
        "'EMSDataSet'|'eProcedures.11'|'Procedure Authorization'|'9918005'|'Protocol (Standing Order)'|\n" +
        "'EMSDataSet'|'eProcedures.11'|'Procedure Authorization'|'9918007'|'Written Orders (Patient Specific)'|\n" +
        "'EMSDataSet'|'eProcedures.13'|'Vascular Access Location'|'3913001'|'Antecubital-Left'|\n" +
        "'EMSDataSet'|'eProcedures.13'|'Vascular Access Location'|'3913003'|'Antecubital-Right'|\n" +
        "'EMSDataSet'|'eProcedures.13'|'Vascular Access Location'|'3913005'|'External Jugular-Left'|\n" +
        "'EMSDataSet'|'eProcedures.13'|'Vascular Access Location'|'3913007'|'External Jugular-Right'|\n" +
        "'EMSDataSet'|'eProcedures.13'|'Vascular Access Location'|'3913009'|'Femoral-Left IV'|\n" +
        "'EMSDataSet'|'eProcedures.13'|'Vascular Access Location'|'3913011'|'Femoral-Right IV'|\n" +
        "'EMSDataSet'|'eProcedures.13'|'Vascular Access Location'|'3913013'|'Foot-Right'|\n" +
        "'EMSDataSet'|'eProcedures.13'|'Vascular Access Location'|'3913015'|'Foot-Left'|\n" +
        "'EMSDataSet'|'eProcedures.13'|'Vascular Access Location'|'3913017'|'Forearm-Left'|\n" +
        "'EMSDataSet'|'eProcedures.13'|'Vascular Access Location'|'3913019'|'Forearm-Right'|\n" +
        "'EMSDataSet'|'eProcedures.13'|'Vascular Access Location'|'3913021'|'Hand-Left'|\n" +
        "'EMSDataSet'|'eProcedures.13'|'Vascular Access Location'|'3913023'|'Hand-Right'|\n" +
        "'EMSDataSet'|'eProcedures.13'|'Vascular Access Location'|'3913025'|'Internal Jugular-Left'|\n" +
        "'EMSDataSet'|'eProcedures.13'|'Vascular Access Location'|'3913027'|'Internal Jugular-Right'|\n" +
        "'EMSDataSet'|'eProcedures.13'|'Vascular Access Location'|'3913029'|'IO-Iliac Crest-Left'|\n" +
        "'EMSDataSet'|'eProcedures.13'|'Vascular Access Location'|'3913031'|'IO-Iliac Crest-Right'|\n" +
        "'EMSDataSet'|'eProcedures.13'|'Vascular Access Location'|'3913033'|'IO-Femoral-Left Distal'|\n" +
        "'EMSDataSet'|'eProcedures.13'|'Vascular Access Location'|'3913035'|'IO-Femoral-Right Distal'|\n" +
        "'EMSDataSet'|'eProcedures.13'|'Vascular Access Location'|'3913037'|'IO-Humeral-Left'|\n" +
        "'EMSDataSet'|'eProcedures.13'|'Vascular Access Location'|'3913039'|'IO-Humeral-Right'|\n" +
        "'EMSDataSet'|'eProcedures.13'|'Vascular Access Location'|'3913041'|'IO-Tibia-Left Distal'|\n" +
        "'EMSDataSet'|'eProcedures.13'|'Vascular Access Location'|'3913043'|'IO-Sternum'|\n" +
        "'EMSDataSet'|'eProcedures.13'|'Vascular Access Location'|'3913045'|'IO-Tibia-Right Distal'|\n" +
        "'EMSDataSet'|'eProcedures.13'|'Vascular Access Location'|'3913047'|'IO-Tibia-Left Proximal'|\n" +
        "'EMSDataSet'|'eProcedures.13'|'Vascular Access Location'|'3913049'|'IO-Tibia-Right Proximal'|\n" +
        "'EMSDataSet'|'eProcedures.13'|'Vascular Access Location'|'3913051'|'Lower Extremity-Left'|\n" +
        "'EMSDataSet'|'eProcedures.13'|'Vascular Access Location'|'3913053'|'Lower Extremity-Right'|\n" +
        "'EMSDataSet'|'eProcedures.13'|'Vascular Access Location'|'3913055'|'Other Peripheral'|\n" +
        "'EMSDataSet'|'eProcedures.13'|'Vascular Access Location'|'3913057'|'Other Central (PICC, Portacath, etc.)'|\n" +
        "'EMSDataSet'|'eProcedures.13'|'Vascular Access Location'|'3913059'|'Scalp'|\n" +
        "'EMSDataSet'|'eProcedures.13'|'Vascular Access Location'|'3913061'|'Subclavian-Left'|\n" +
        "'EMSDataSet'|'eProcedures.13'|'Vascular Access Location'|'3913063'|'Subclavian-Right'|\n" +
        "'EMSDataSet'|'eProcedures.13'|'Vascular Access Location'|'3913065'|'Umbilical'|\n" +
        "'EMSDataSet'|'eProcedures.13'|'Vascular Access Location'|'3913067'|'Venous Cutdown-Left Lower Extremity'|\n" +
        "'EMSDataSet'|'eProcedures.13'|'Vascular Access Location'|'3913069'|'Venous Cutdown-Right Lower Extremity'|\n" +
        "'EMSDataSet'|'eProcedures.13'|'Vascular Access Location'|'3913071'|'Upper Arm-Left'|\n" +
        "'EMSDataSet'|'eProcedures.13'|'Vascular Access Location'|'3913073'|'Upper Arm-Right'|\n" +
        "'EMSDataSet'|'eProcedures.13'|'Vascular Access Location'|'3913075'|'Radial-Left'|\n" +
        "'EMSDataSet'|'eProcedures.13'|'Vascular Access Location'|'3913077'|'Radial-Right'|\n" +
        "'EMSDataSet'|'eAirway.01'|'Indications for Invasive Airway'|'4001001'|'Adequate Airway Reflexes/Effort, Potential for Compromise'|\n" +
        "'EMSDataSet'|'eAirway.01'|'Indications for Invasive Airway'|'4001003'|'Airway Reflex Compromised'|\n" +
        "'EMSDataSet'|'eAirway.01'|'Indications for Invasive Airway'|'4001005'|'Apnea or Agonal Respirations'|\n" +
        "'EMSDataSet'|'eAirway.01'|'Indications for Invasive Airway'|'4001007'|'Illness Involving Airway'|\n" +
        "'EMSDataSet'|'eAirway.01'|'Indications for Invasive Airway'|'4001009'|'Injury Involving Airway'|\n" +
        "'EMSDataSet'|'eAirway.01'|'Indications for Invasive Airway'|'4001011'|'Other'|\n" +
        "'EMSDataSet'|'eAirway.01'|'Indications for Invasive Airway'|'4001013'|'Ventilatory Effort Compromised'|\n" +
        "'EMSDataSet'|'eAirway.03'|'Airway Device Being Confirmed'|'4003001'|'Cricothyrotomy Tube'|\n" +
        "'EMSDataSet'|'eAirway.03'|'Airway Device Being Confirmed'|'4003003'|'Endotracheal Tube'|\n" +
        "'EMSDataSet'|'eAirway.03'|'Airway Device Being Confirmed'|'4003005'|'Other-Invasive Airway'|\n" +
        "'EMSDataSet'|'eAirway.03'|'Airway Device Being Confirmed'|'4003007'|'SAD-Combitube'|\n" +
        "'EMSDataSet'|'eAirway.03'|'Airway Device Being Confirmed'|'4003009'|'SAD-King'|\n" +
        "'EMSDataSet'|'eAirway.03'|'Airway Device Being Confirmed'|'4003011'|'SAD-LMA'|\n" +
        "'EMSDataSet'|'eAirway.03'|'Airway Device Being Confirmed'|'4003013'|'SAD-Other'|\n" +
        "'EMSDataSet'|'eAirway.03'|'Airway Device Being Confirmed'|'4003015'|'Tracheostomy Tube'|\n" +
        "'EMSDataSet'|'eAirway.04'|'Airway Device Placement Confirmed Method'|'4004001'|'Auscultation'|\n" +
        "'EMSDataSet'|'eAirway.04'|'Airway Device Placement Confirmed Method'|'4004003'|'Bulb/Syringe Aspiration'|\n" +
        "'EMSDataSet'|'eAirway.04'|'Airway Device Placement Confirmed Method'|'4004005'|'Colorimetric ETCO2'|\n" +
        "'EMSDataSet'|'eAirway.04'|'Airway Device Placement Confirmed Method'|'4004007'|'Condensation in Tube'|\n" +
        "'EMSDataSet'|'eAirway.04'|'Airway Device Placement Confirmed Method'|'4004009'|'Digital (Numeric) ETCO2'|\n" +
        "'EMSDataSet'|'eAirway.04'|'Airway Device Placement Confirmed Method'|'4004011'|'Direct Re-Visualization of Tube in Place'|\n" +
        "'EMSDataSet'|'eAirway.04'|'Airway Device Placement Confirmed Method'|'4004013'|'Endotracheal Tube Whistle (BAAM, etc.)'|\n" +
        "'EMSDataSet'|'eAirway.04'|'Airway Device Placement Confirmed Method'|'4004015'|'Other'|\n" +
        "'EMSDataSet'|'eAirway.04'|'Airway Device Placement Confirmed Method'|'4004017'|'Visualization of Vocal Cords'|\n" +
        "'EMSDataSet'|'eAirway.04'|'Airway Device Placement Confirmed Method'|'4004019'|'Waveform ETCO2'|\n" +
        "'EMSDataSet'|'eAirway.06'|'Type of Individual Confirming Airway Device Placement'|'4006001'|'Another Person on the Same Crew'|\n" +
        "'EMSDataSet'|'eAirway.06'|'Type of Individual Confirming Airway Device Placement'|'4006003'|'Other'|\n" +
        "'EMSDataSet'|'eAirway.06'|'Type of Individual Confirming Airway Device Placement'|'4006005'|'Person Performing Intubation'|\n" +
        "'EMSDataSet'|'eAirway.06'|'Type of Individual Confirming Airway Device Placement'|'4006007'|'Receiving Air Medical/EMS Crew'|\n" +
        "'EMSDataSet'|'eAirway.06'|'Type of Individual Confirming Airway Device Placement'|'4006009'|'Receiving Hospital Team'|\n" +
        "'EMSDataSet'|'eAirway.08'|'Airway Complications Encountered'|'4008001'|'Adverse Event from Facilitating Drugs'|\n" +
        "'EMSDataSet'|'eAirway.08'|'Airway Complications Encountered'|'4008003'|'Bradycardia (<50)'|\n" +
        "'EMSDataSet'|'eAirway.08'|'Airway Complications Encountered'|'4008005'|'Cardiac Arrest'|\n" +
        "'EMSDataSet'|'eAirway.08'|'Airway Complications Encountered'|'4008007'|'Esophageal Intubation-Delayed Detection (After Tube Secured)'|\n" +
        "'EMSDataSet'|'eAirway.08'|'Airway Complications Encountered'|'4008009'|'Esophageal Intubation-Detected in Emergency Department'|\n" +
        "'EMSDataSet'|'eAirway.08'|'Airway Complications Encountered'|'4008011'|'Failed Intubation Effort'|\n" +
        "'EMSDataSet'|'eAirway.08'|'Airway Complications Encountered'|'4008013'|'Injury or Trauma to Patient from Airway Management Effort'|\n" +
        "'EMSDataSet'|'eAirway.08'|'Airway Complications Encountered'|'4008015'|'Other'|\n" +
        "'EMSDataSet'|'eAirway.08'|'Airway Complications Encountered'|'4008017'|'Oxygen Desaturation (<90%)'|\n" +
        "'EMSDataSet'|'eAirway.08'|'Airway Complications Encountered'|'4008019'|'Patient Vomiting/Aspiration'|\n" +
        "'EMSDataSet'|'eAirway.08'|'Airway Complications Encountered'|'4008021'|'Tube Dislodged During Transport/Patient Care'|\n" +
        "'EMSDataSet'|'eAirway.08'|'Airway Complications Encountered'|'4008023'|'Tube Was Not in Correct Position when EMS Crew/Team Assumed Care of the Patient'|\n" +
        "'EMSDataSet'|'eAirway.09'|'Suspected Reasons for Failed Airway Management'|'4009001'|'Difficult Patient Airway Anatomy'|\n" +
        "'EMSDataSet'|'eAirway.09'|'Suspected Reasons for Failed Airway Management'|'4009003'|'ETI Attempted, but Arrived At Destination Facility Before Accomplished'|\n" +
        "'EMSDataSet'|'eAirway.09'|'Suspected Reasons for Failed Airway Management'|'4009005'|'Facial or Oral Trauma'|\n" +
        "'EMSDataSet'|'eAirway.09'|'Suspected Reasons for Failed Airway Management'|'4009007'|'Inability to Expose Vocal Cords'|\n" +
        "'EMSDataSet'|'eAirway.09'|'Suspected Reasons for Failed Airway Management'|'4009009'|'Inadequate Patient Relaxation/Presence of Protective Airway Reflexes'|\n" +
        "'EMSDataSet'|'eAirway.09'|'Suspected Reasons for Failed Airway Management'|'4009011'|'Jaw Clenched (Trismus)'|\n" +
        "'EMSDataSet'|'eAirway.09'|'Suspected Reasons for Failed Airway Management'|'4009013'|'Other'|\n" +
        "'EMSDataSet'|'eAirway.09'|'Suspected Reasons for Failed Airway Management'|'4009015'|'Poor Patient Access'|\n" +
        "'EMSDataSet'|'eAirway.09'|'Suspected Reasons for Failed Airway Management'|'4009017'|'Secretions/Blood/Vomit'|\n" +
        "'EMSDataSet'|'eAirway.09'|'Suspected Reasons for Failed Airway Management'|'4009019'|'Unable to Position or Access Patient'|\n" +
        "'EMSDataSet'|'eDevice.03'|'Medical Device Event Type'|'4103001'|'12-Lead ECG'|\n" +
        "'EMSDataSet'|'eDevice.03'|'Medical Device Event Type'|'4103003'|'Analysis (Button Pressed)'|\n" +
        "'EMSDataSet'|'eDevice.03'|'Medical Device Event Type'|'4103005'|'CO2'|\n" +
        "'EMSDataSet'|'eDevice.03'|'Medical Device Event Type'|'4103007'|'Date Transmitted'|\n" +
        "'EMSDataSet'|'eDevice.03'|'Medical Device Event Type'|'4103009'|'Defibrillation'|\n" +
        "'EMSDataSet'|'eDevice.03'|'Medical Device Event Type'|'4103011'|'ECG-Monitor'|\n" +
        "'EMSDataSet'|'eDevice.03'|'Medical Device Event Type'|'4103013'|'Heart Rate'|\n" +
        "'EMSDataSet'|'eDevice.03'|'Medical Device Event Type'|'4103015'|'Invasive Pressure 1'|\n" +
        "'EMSDataSet'|'eDevice.03'|'Medical Device Event Type'|'4103017'|'Invasive Pressure 2'|\n" +
        "'EMSDataSet'|'eDevice.03'|'Medical Device Event Type'|'4103019'|'No Shock Advised'|\n" +
        "'EMSDataSet'|'eDevice.03'|'Medical Device Event Type'|'4103021'|'Non-Invasive BP'|\n" +
        "'EMSDataSet'|'eDevice.03'|'Medical Device Event Type'|'4103023'|'Other'|\n" +
        "'EMSDataSet'|'eDevice.03'|'Medical Device Event Type'|'4103025'|'Pacing Electrical Capture'|\n" +
        "'EMSDataSet'|'eDevice.03'|'Medical Device Event Type'|'4103027'|'Pacing Started'|\n" +
        "'EMSDataSet'|'eDevice.03'|'Medical Device Event Type'|'4103029'|'Pacing Stopped'|\n" +
        "'EMSDataSet'|'eDevice.03'|'Medical Device Event Type'|'4103031'|'Patient Connected'|\n" +
        "'EMSDataSet'|'eDevice.03'|'Medical Device Event Type'|'4103033'|'Power On'|\n" +
        "'EMSDataSet'|'eDevice.03'|'Medical Device Event Type'|'4103035'|'Pulse Oximetry'|\n" +
        "'EMSDataSet'|'eDevice.03'|'Medical Device Event Type'|'4103037'|'Pulse Rate'|\n" +
        "'EMSDataSet'|'eDevice.03'|'Medical Device Event Type'|'4103039'|'Respiratory Rate'|\n" +
        "'EMSDataSet'|'eDevice.03'|'Medical Device Event Type'|'4103041'|'Shock Advised'|\n" +
        "'EMSDataSet'|'eDevice.03'|'Medical Device Event Type'|'4103043'|'Sync Off'|\n" +
        "'EMSDataSet'|'eDevice.03'|'Medical Device Event Type'|'4103045'|'Sync On'|\n" +
        "'EMSDataSet'|'eDevice.03'|'Medical Device Event Type'|'4103047'|'Temperature 1'|\n" +
        "'EMSDataSet'|'eDevice.03'|'Medical Device Event Type'|'4103049'|'Temperature 2'|\n" +
        "'EMSDataSet'|'eDevice.06'|'Medical Device Mode (Manual, AED, Pacing, CO2, O2, etc)'|'4106001'|'Advisory'|\n" +
        "'EMSDataSet'|'eDevice.06'|'Medical Device Mode (Manual, AED, Pacing, CO2, O2, etc)'|'4106003'|'Automated'|\n" +
        "'EMSDataSet'|'eDevice.06'|'Medical Device Mode (Manual, AED, Pacing, CO2, O2, etc)'|'4106005'|'Demand'|\n" +
        "'EMSDataSet'|'eDevice.06'|'Medical Device Mode (Manual, AED, Pacing, CO2, O2, etc)'|'4106007'|'Manual'|\n" +
        "'EMSDataSet'|'eDevice.06'|'Medical Device Mode (Manual, AED, Pacing, CO2, O2, etc)'|'4106009'|'Mid-Stream'|\n" +
        "'EMSDataSet'|'eDevice.06'|'Medical Device Mode (Manual, AED, Pacing, CO2, O2, etc)'|'4106011'|'Sensing'|\n" +
        "'EMSDataSet'|'eDevice.06'|'Medical Device Mode (Manual, AED, Pacing, CO2, O2, etc)'|'4106013'|'Side-Stream'|\n" +
        "'EMSDataSet'|'eDevice.07'|'Medical Device ECG Lead'|'4107001'|'I'|\n" +
        "'EMSDataSet'|'eDevice.07'|'Medical Device ECG Lead'|'4107003'|'II'|\n" +
        "'EMSDataSet'|'eDevice.07'|'Medical Device ECG Lead'|'4107005'|'III'|\n" +
        "'EMSDataSet'|'eDevice.07'|'Medical Device ECG Lead'|'4107007'|'AVR'|\n" +
        "'EMSDataSet'|'eDevice.07'|'Medical Device ECG Lead'|'4107009'|'AVL'|\n" +
        "'EMSDataSet'|'eDevice.07'|'Medical Device ECG Lead'|'4107011'|'AVF'|\n" +
        "'EMSDataSet'|'eDevice.07'|'Medical Device ECG Lead'|'4107013'|'Paddle'|\n" +
        "'EMSDataSet'|'eDevice.07'|'Medical Device ECG Lead'|'4107015'|'Pads'|\n" +
        "'EMSDataSet'|'eDevice.07'|'Medical Device ECG Lead'|'4107017'|'V1'|\n" +
        "'EMSDataSet'|'eDevice.07'|'Medical Device ECG Lead'|'4107019'|'V2'|\n" +
        "'EMSDataSet'|'eDevice.07'|'Medical Device ECG Lead'|'4107021'|'V3'|\n" +
        "'EMSDataSet'|'eDevice.07'|'Medical Device ECG Lead'|'4107023'|'V3r'|\n" +
        "'EMSDataSet'|'eDevice.07'|'Medical Device ECG Lead'|'4107025'|'V4'|\n" +
        "'EMSDataSet'|'eDevice.07'|'Medical Device ECG Lead'|'4107027'|'V4r'|\n" +
        "'EMSDataSet'|'eDevice.07'|'Medical Device ECG Lead'|'4107029'|'V5'|\n" +
        "'EMSDataSet'|'eDevice.07'|'Medical Device ECG Lead'|'4107031'|'V5r'|\n" +
        "'EMSDataSet'|'eDevice.07'|'Medical Device ECG Lead'|'4107033'|'V6'|\n" +
        "'EMSDataSet'|'eDevice.07'|'Medical Device ECG Lead'|'4107035'|'V6r'|\n" +
        "'EMSDataSet'|'eDevice.07'|'Medical Device ECG Lead'|'4107037'|'V7'|\n" +
        "'EMSDataSet'|'eDevice.07'|'Medical Device ECG Lead'|'4107039'|'V8'|\n" +
        "'EMSDataSet'|'eDevice.07'|'Medical Device ECG Lead'|'4107041'|'V9'|\n" +
        "'EMSDataSet'|'eDevice.09'|'Type of Shock'|'4109001'|'Biphasic'|\n" +
        "'EMSDataSet'|'eDevice.09'|'Type of Shock'|'4109003'|'Monophasic'|\n" +
        "'EMSDataSet'|'eDisposition.12'|'Incident/Patient Disposition'|'4212001'|'Assist, Agency'|\n" +
        "'EMSDataSet'|'eDisposition.12'|'Incident/Patient Disposition'|'4212003'|'Assist, Public'|\n" +
        "'EMSDataSet'|'eDisposition.12'|'Incident/Patient Disposition'|'4212005'|'Assist, Unit'|\n" +
        "'EMSDataSet'|'eDisposition.12'|'Incident/Patient Disposition'|'4212007'|'Canceled (Prior to Arrival At Scene)'|\n" +
        "'EMSDataSet'|'eDisposition.12'|'Incident/Patient Disposition'|'4212009'|'Canceled on Scene (No Patient Contact)'|\n" +
        "'EMSDataSet'|'eDisposition.12'|'Incident/Patient Disposition'|'4212011'|'Canceled on Scene (No Patient Found)'|\n" +
        "'EMSDataSet'|'eDisposition.12'|'Incident/Patient Disposition'|'4212013'|'Patient Dead at Scene-No Resuscitation Attempted (With Transport)'|\n" +
        "'EMSDataSet'|'eDisposition.12'|'Incident/Patient Disposition'|'4212015'|'Patient Dead at Scene-No Resuscitation Attempted (Without Transport)'|\n" +
        "'EMSDataSet'|'eDisposition.12'|'Incident/Patient Disposition'|'4212017'|'Patient Dead at Scene-Resuscitation Attempted (With Transport)'|\n" +
        "'EMSDataSet'|'eDisposition.12'|'Incident/Patient Disposition'|'4212019'|'Patient Dead at Scene-Resuscitation Attempted (Without Transport)'|\n" +
        "'EMSDataSet'|'eDisposition.12'|'Incident/Patient Disposition'|'4212021'|'Patient Evaluated, No Treatment/Transport Required'|\n" +
        "'EMSDataSet'|'eDisposition.12'|'Incident/Patient Disposition'|'4212023'|'Patient Refused Evaluation/Care (With Transport)'|\n" +
        "'EMSDataSet'|'eDisposition.12'|'Incident/Patient Disposition'|'4212025'|'Patient Refused Evaluation/Care (Without Transport)'|\n" +
        "'EMSDataSet'|'eDisposition.12'|'Incident/Patient Disposition'|'4212027'|'Patient Treated, Released (AMA)'|\n" +
        "'EMSDataSet'|'eDisposition.12'|'Incident/Patient Disposition'|'4212029'|'Patient Treated, Released (per protocol)'|\n" +
        "'EMSDataSet'|'eDisposition.12'|'Incident/Patient Disposition'|'4212031'|'Patient Treated, Transferred Care to Another EMS Unit'|\n" +
        "'EMSDataSet'|'eDisposition.12'|'Incident/Patient Disposition'|'4212033'|'Patient Treated, Transported by this EMS Unit'|\n" +
        "'EMSDataSet'|'eDisposition.12'|'Incident/Patient Disposition'|'4212035'|'Patient Treated, Transported by Law Enforcement'|\n" +
        "'EMSDataSet'|'eDisposition.12'|'Incident/Patient Disposition'|'4212037'|'Patient Treated, Transported by Private Vehicle'|\n" +
        "'EMSDataSet'|'eDisposition.12'|'Incident/Patient Disposition'|'4212039'|'Standby-No Services or Support Provided'|\n" +
        "'EMSDataSet'|'eDisposition.12'|'Incident/Patient Disposition'|'4212041'|'Standby-Public Safety, Fire, or EMS Operational Support Provided'|\n" +
        "'EMSDataSet'|'eDisposition.12'|'Incident/Patient Disposition'|'4212043'|'Transport Non-Patient, Organs, etc.'|\n" +
        "'EMSDataSet'|'eDisposition.13'|'How Patient Was Moved to Ambulance'|'9909001'|'Assisted/Walk'|\n" +
        "'EMSDataSet'|'eDisposition.13'|'How Patient Was Moved to Ambulance'|'9909003'|'Backboard'|\n" +
        "'EMSDataSet'|'eDisposition.13'|'How Patient Was Moved to Ambulance'|'9909005'|'Chair'|\n" +
        "'EMSDataSet'|'eDisposition.13'|'How Patient Was Moved to Ambulance'|'9909007'|'Carried'|\n" +
        "'EMSDataSet'|'eDisposition.13'|'How Patient Was Moved to Ambulance'|'9909009'|'Other'|\n" +
        "'EMSDataSet'|'eDisposition.13'|'How Patient Was Moved to Ambulance'|'9909011'|'Stairchair'|\n" +
        "'EMSDataSet'|'eDisposition.13'|'How Patient Was Moved to Ambulance'|'9909013'|'Stretcher'|\n" +
        "'EMSDataSet'|'eDisposition.13'|'How Patient Was Moved to Ambulance'|'9909015'|'Wheelchair'|\n" +
        "'EMSDataSet'|'eDisposition.14'|'Position of Patient During Transport'|'4214001'|'Car Seat'|\n" +
        "'EMSDataSet'|'eDisposition.14'|'Position of Patient During Transport'|'4214003'|'Fowlers (Semi-Upright Sitting)'|\n" +
        "'EMSDataSet'|'eDisposition.14'|'Position of Patient During Transport'|'4214005'|'Lateral Left'|\n" +
        "'EMSDataSet'|'eDisposition.14'|'Position of Patient During Transport'|'4214007'|'Lateral Right'|\n" +
        "'EMSDataSet'|'eDisposition.14'|'Position of Patient During Transport'|'4214009'|'Other'|\n" +
        "'EMSDataSet'|'eDisposition.14'|'Position of Patient During Transport'|'4214011'|'Prone'|\n" +
        "'EMSDataSet'|'eDisposition.14'|'Position of Patient During Transport'|'4214013'|'Semi-Fowlers'|\n" +
        "'EMSDataSet'|'eDisposition.14'|'Position of Patient During Transport'|'4214015'|'Sitting'|\n" +
        "'EMSDataSet'|'eDisposition.14'|'Position of Patient During Transport'|'4214017'|'Supine'|\n" +
        "'EMSDataSet'|'eDisposition.14'|'Position of Patient During Transport'|'4214019'|'Trendelenburg'|\n" +
        "'EMSDataSet'|'eDisposition.15'|'How Patient Was Transported From Ambulance'|'9909001'|'Assisted/Walk'|\n" +
        "'EMSDataSet'|'eDisposition.15'|'How Patient Was Transported From Ambulance'|'9909003'|'Backboard'|\n" +
        "'EMSDataSet'|'eDisposition.15'|'How Patient Was Transported From Ambulance'|'9909005'|'Chair'|\n" +
        "'EMSDataSet'|'eDisposition.15'|'How Patient Was Transported From Ambulance'|'9909007'|'Carried'|\n" +
        "'EMSDataSet'|'eDisposition.15'|'How Patient Was Transported From Ambulance'|'9909009'|'Other'|\n" +
        "'EMSDataSet'|'eDisposition.15'|'How Patient Was Transported From Ambulance'|'9909011'|'Stairchair'|\n" +
        "'EMSDataSet'|'eDisposition.15'|'How Patient Was Transported From Ambulance'|'9909013'|'Stretcher'|\n" +
        "'EMSDataSet'|'eDisposition.15'|'How Patient Was Transported From Ambulance'|'9909015'|'Wheelchair'|\n" +
        "'EMSDataSet'|'eDisposition.16'|'EMS Transport Method'|'4216001'|'Air Medical-Fixed Wing'|\n" +
        "'EMSDataSet'|'eDisposition.16'|'EMS Transport Method'|'4216003'|'Air Medical-Rotor Craft'|\n" +
        "'EMSDataSet'|'eDisposition.16'|'EMS Transport Method'|'4216005'|'Ground-Ambulance'|\n" +
        "'EMSDataSet'|'eDisposition.16'|'EMS Transport Method'|'4216007'|'Ground-ATV or Rescue Vehicle'|\n" +
        "'EMSDataSet'|'eDisposition.16'|'EMS Transport Method'|'4216009'|'Ground-Bariatric'|\n" +
        "'EMSDataSet'|'eDisposition.16'|'EMS Transport Method'|'4216011'|'Ground-Other Not Listed'|\n" +
        "'EMSDataSet'|'eDisposition.16'|'EMS Transport Method'|'4216013'|'Ground-Mass Casualty Bus/Vehicle'|\n" +
        "'EMSDataSet'|'eDisposition.16'|'EMS Transport Method'|'4216015'|'Ground-Wheelchair Van'|\n" +
        "'EMSDataSet'|'eDisposition.16'|'EMS Transport Method'|'4216017'|'Water-Boat'|\n" +
        "'EMSDataSet'|'eDisposition.17'|'Transport Mode from Scene'|'4217001'|'Emergent (Immediate Response)'|\n" +
        "'EMSDataSet'|'eDisposition.17'|'Transport Mode from Scene'|'4217003'|'Emergent Downgraded to Non-Emergent'|\n" +
        "'EMSDataSet'|'eDisposition.17'|'Transport Mode from Scene'|'4217005'|'Non-Emergent'|\n" +
        "'EMSDataSet'|'eDisposition.17'|'Transport Mode from Scene'|'4217007'|'Non-Emergent Upgraded to Emergent'|\n" +
        "'EMSDataSet'|'eDisposition.18'|'Additional Transport Mode Descriptors'|'4218001'|'Intersection Navigation-Against Normal Light Patterns'|\n" +
        "'EMSDataSet'|'eDisposition.18'|'Additional Transport Mode Descriptors'|'4218003'|'Intersection Navigation-With Automated Light Changing Technology'|\n" +
        "'EMSDataSet'|'eDisposition.18'|'Additional Transport Mode Descriptors'|'4218005'|'Intersection Navigation-With Normal Light Patterns'|\n" +
        "'EMSDataSet'|'eDisposition.18'|'Additional Transport Mode Descriptors'|'4218007'|'Speed-Enhanced per Local Policy'|\n" +
        "'EMSDataSet'|'eDisposition.18'|'Additional Transport Mode Descriptors'|'4218009'|'Speed-Normal Traffic'|\n" +
        "'EMSDataSet'|'eDisposition.18'|'Additional Transport Mode Descriptors'|'4218011'|'Lights and Sirens'|\n" +
        "'EMSDataSet'|'eDisposition.18'|'Additional Transport Mode Descriptors'|'4218013'|'Lights and No Sirens'|\n" +
        "'EMSDataSet'|'eDisposition.18'|'Additional Transport Mode Descriptors'|'4218015'|'No Lights or Sirens'|\n" +
        "'EMSDataSet'|'eDisposition.18'|'Additional Transport Mode Descriptors'|'4218017'|'Initial No Lights or Sirens, Upgraded to Lights and Sirens'|\n" +
        "'EMSDataSet'|'eDisposition.18'|'Additional Transport Mode Descriptors'|'4218019'|'Initial Lights and Sirens, Downgraded to No Lights or Sirens'|\n" +
        "'EMSDataSet'|'eDisposition.19'|'Final Patient Acuity'|'4219001'|'Critical (Red)'|\n" +
        "'EMSDataSet'|'eDisposition.19'|'Final Patient Acuity'|'4219003'|'Emergent (Yellow)'|\n" +
        "'EMSDataSet'|'eDisposition.19'|'Final Patient Acuity'|'4219005'|'Lower Acuity (Green)'|\n" +
        "'EMSDataSet'|'eDisposition.19'|'Final Patient Acuity'|'4219007'|'Dead without Resuscitation Efforts (Black)'|\n" +
        "'EMSDataSet'|'eDisposition.20'|'Reason for Choosing Destination'|'4220001'|'Closest Facility'|\n" +
        "'EMSDataSet'|'eDisposition.20'|'Reason for Choosing Destination'|'4220003'|'Diversion'|\n" +
        "'EMSDataSet'|'eDisposition.20'|'Reason for Choosing Destination'|'4220005'|'Family Choice'|\n" +
        "'EMSDataSet'|'eDisposition.20'|'Reason for Choosing Destination'|'4220007'|'Insurance Status/Requirement'|\n" +
        "'EMSDataSet'|'eDisposition.20'|'Reason for Choosing Destination'|'4220009'|'Law Enforcement Choice'|\n" +
        "'EMSDataSet'|'eDisposition.20'|'Reason for Choosing Destination'|'4220011'|'On-Line/On-Scene Medical Direction'|\n" +
        "'EMSDataSet'|'eDisposition.20'|'Reason for Choosing Destination'|'4220013'|'Other'|\n" +
        "'EMSDataSet'|'eDisposition.20'|'Reason for Choosing Destination'|'4220015'|'Patient's Choice'|\n" +
        "'EMSDataSet'|'eDisposition.20'|'Reason for Choosing Destination'|'4220017'|'Patient's Physician's Choice'|\n" +
        "'EMSDataSet'|'eDisposition.20'|'Reason for Choosing Destination'|'4220019'|'Protocol'|\n" +
        "'EMSDataSet'|'eDisposition.20'|'Reason for Choosing Destination'|'4220021'|'Regional Specialty Center'|\n" +
        "'EMSDataSet'|'eDisposition.21'|'Type of Destination'|'4221001'|'Home'|\n" +
        "'EMSDataSet'|'eDisposition.21'|'Type of Destination'|'4221003'|'Hospital-Emergency Department'|\n" +
        "'EMSDataSet'|'eDisposition.21'|'Type of Destination'|'4221005'|'Hospital-Non-Emergency Department Bed'|\n" +
        "'EMSDataSet'|'eDisposition.21'|'Type of Destination'|'4221007'|'Medical Office/Clinic'|\n" +
        "'EMSDataSet'|'eDisposition.21'|'Type of Destination'|'4221009'|'Morgue/Mortuary'|\n" +
        "'EMSDataSet'|'eDisposition.21'|'Type of Destination'|'4221011'|'Nursing Home/Assisted Living Facility'|\n" +
        "'EMSDataSet'|'eDisposition.21'|'Type of Destination'|'4221013'|'Other'|\n" +
        "'EMSDataSet'|'eDisposition.21'|'Type of Destination'|'4221015'|'Other EMS Responder (air)'|\n" +
        "'EMSDataSet'|'eDisposition.21'|'Type of Destination'|'4221017'|'Other EMS Responder (ground)'|\n" +
        "'EMSDataSet'|'eDisposition.21'|'Type of Destination'|'4221019'|'Police/Jail'|\n" +
        "'EMSDataSet'|'eDisposition.21'|'Type of Destination'|'4221021'|'Urgent Care'|\n" +
        "'EMSDataSet'|'eDisposition.21'|'Type of Destination'|'4221023'|'Freestanding Emergency Department'|\n" +
        "'EMSDataSet'|'eDisposition.22'|'Hospital In-Patient Destination'|'4222001'|'Hospital-Burn'|\n" +
        "'EMSDataSet'|'eDisposition.22'|'Hospital In-Patient Destination'|'4222003'|'Hospital-Cath Lab'|\n" +
        "'EMSDataSet'|'eDisposition.22'|'Hospital In-Patient Destination'|'4222005'|'Hospital-CCU'|\n" +
        "'EMSDataSet'|'eDisposition.22'|'Hospital In-Patient Destination'|'4222007'|'Hospital-Endoscopy'|\n" +
        "'EMSDataSet'|'eDisposition.22'|'Hospital In-Patient Destination'|'4222009'|'Hospital-Hospice'|\n" +
        "'EMSDataSet'|'eDisposition.22'|'Hospital In-Patient Destination'|'4222011'|'Hospital-Hyperbaric Oxygen Treatment'|\n" +
        "'EMSDataSet'|'eDisposition.22'|'Hospital In-Patient Destination'|'4222013'|'Hospital-ICU'|\n" +
        "'EMSDataSet'|'eDisposition.22'|'Hospital In-Patient Destination'|'4222015'|'Hospital-Labor &amp; Delivery'|\n" +
        "'EMSDataSet'|'eDisposition.22'|'Hospital In-Patient Destination'|'4222017'|'Hospital-Med/Surg'|\n" +
        "'EMSDataSet'|'eDisposition.22'|'Hospital In-Patient Destination'|'4222019'|'Hospital-Mental Health'|\n" +
        "'EMSDataSet'|'eDisposition.22'|'Hospital In-Patient Destination'|'4222021'|'Hospital-MICU'|\n" +
        "'EMSDataSet'|'eDisposition.22'|'Hospital In-Patient Destination'|'4222023'|'Hospital-NICU'|\n" +
        "'EMSDataSet'|'eDisposition.22'|'Hospital In-Patient Destination'|'4222025'|'Hospital-Nursery'|\n" +
        "'EMSDataSet'|'eDisposition.22'|'Hospital In-Patient Destination'|'4222027'|'Hospital-Peds (General)'|\n" +
        "'EMSDataSet'|'eDisposition.22'|'Hospital In-Patient Destination'|'4222029'|'Hospital-Peds ICU'|\n" +
        "'EMSDataSet'|'eDisposition.22'|'Hospital In-Patient Destination'|'4222031'|'Hospital-OR'|\n" +
        "'EMSDataSet'|'eDisposition.22'|'Hospital In-Patient Destination'|'4222033'|'Hospital-Orthopedic'|\n" +
        "'EMSDataSet'|'eDisposition.22'|'Hospital In-Patient Destination'|'4222035'|'Hospital-Other'|\n" +
        "'EMSDataSet'|'eDisposition.22'|'Hospital In-Patient Destination'|'4222037'|'Hospital-Out-Patient Bed'|\n" +
        "'EMSDataSet'|'eDisposition.22'|'Hospital In-Patient Destination'|'4222039'|'Hospital-Radiology Services - MRI'|\n" +
        "'EMSDataSet'|'eDisposition.22'|'Hospital In-Patient Destination'|'4222041'|'Hospital-Radiology Services - CT/PET'|\n" +
        "'EMSDataSet'|'eDisposition.22'|'Hospital In-Patient Destination'|'4222043'|'Hospital-Radiology Services - X-Ray'|\n" +
        "'EMSDataSet'|'eDisposition.22'|'Hospital In-Patient Destination'|'4222045'|'Hospital-Radiation'|\n" +
        "'EMSDataSet'|'eDisposition.22'|'Hospital In-Patient Destination'|'4222047'|'Hospital-Rehab'|\n" +
        "'EMSDataSet'|'eDisposition.22'|'Hospital In-Patient Destination'|'4222049'|'Hospital-SICU'|\n" +
        "'EMSDataSet'|'eDisposition.22'|'Hospital In-Patient Destination'|'4222051'|'Hospital-Oncology'|\n" +
        "'EMSDataSet'|'eDisposition.22'|'Hospital In-Patient Destination'|'4222053'|'Hospital-Outpatient Surgery'|\n" +
        "'EMSDataSet'|'eDisposition.23'|'Hospital Capability'|'9908001'|'Behavioral Health'|\n" +
        "'EMSDataSet'|'eDisposition.23'|'Hospital Capability'|'9908003'|'Burn Center'|\n" +
        "'EMSDataSet'|'eDisposition.23'|'Hospital Capability'|'9908005'|'Critical Access Hospital'|\n" +
        "'EMSDataSet'|'eDisposition.23'|'Hospital Capability'|'9908007'|'Hospital (General)'|\n" +
        "'EMSDataSet'|'eDisposition.23'|'Hospital Capability'|'9908009'|'Neonatal Center'|\n" +
        "'EMSDataSet'|'eDisposition.23'|'Hospital Capability'|'9908011'|'Pediatric Center'|\n" +
        "'EMSDataSet'|'eDisposition.23'|'Hospital Capability'|'9908017'|'Stroke Center'|\n" +
        "'EMSDataSet'|'eDisposition.23'|'Hospital Capability'|'9908019'|'Rehab Center'|\n" +
        "'EMSDataSet'|'eDisposition.23'|'Hospital Capability'|'9908021'|'Trauma Center Level 1'|\n" +
        "'EMSDataSet'|'eDisposition.23'|'Hospital Capability'|'9908023'|'Trauma Center Level 2'|\n" +
        "'EMSDataSet'|'eDisposition.23'|'Hospital Capability'|'9908025'|'Trauma Center Level 3'|\n" +
        "'EMSDataSet'|'eDisposition.23'|'Hospital Capability'|'9908027'|'Trauma Center Level 4'|\n" +
        "'EMSDataSet'|'eDisposition.23'|'Hospital Capability'|'9908029'|'Trauma Center Level 5'|\n" +
        "'EMSDataSet'|'eDisposition.23'|'Hospital Capability'|'9908031'|'Cardiac-STEMI/PCI Capable'|\n" +
        "'EMSDataSet'|'eDisposition.23'|'Hospital Capability'|'9908033'|'Cardiac-STEMI/PCI Capable (24/7)'|\n" +
        "'EMSDataSet'|'eDisposition.23'|'Hospital Capability'|'9908035'|'Cardiac-STEMI/Non-PCI Capable'|\n" +
        "'EMSDataSet'|'eDisposition.24'|'Destination Team Pre-Arrival Alert or Activation'|'4224001'|'No'|\n" +
        "'EMSDataSet'|'eDisposition.24'|'Destination Team Pre-Arrival Alert or Activation'|'4224003'|'Yes-Adult Trauma'|\n" +
        "'EMSDataSet'|'eDisposition.24'|'Destination Team Pre-Arrival Alert or Activation'|'4224005'|'Yes-Cardiac Arrest'|\n" +
        "'EMSDataSet'|'eDisposition.24'|'Destination Team Pre-Arrival Alert or Activation'|'4224007'|'Yes-Obstetrics'|\n" +
        "'EMSDataSet'|'eDisposition.24'|'Destination Team Pre-Arrival Alert or Activation'|'4224009'|'Yes-Other'|\n" +
        "'EMSDataSet'|'eDisposition.24'|'Destination Team Pre-Arrival Alert or Activation'|'4224011'|'Yes-Pediatric Trauma'|\n" +
        "'EMSDataSet'|'eDisposition.24'|'Destination Team Pre-Arrival Alert or Activation'|'4224013'|'Yes-STEMI'|\n" +
        "'EMSDataSet'|'eDisposition.24'|'Destination Team Pre-Arrival Alert or Activation'|'4224015'|'Yes-Stroke'|\n" +
        "'EMSDataSet'|'eDisposition.24'|'Destination Team Pre-Arrival Alert or Activation'|'4224017'|'Yes-Trauma (General)'|\n" +
        "'EMSDataSet'|'eDisposition.26'|'Disposition Instructions Provided'|'4226001'|'Contact 911 or see your Doctor if problem returns'|\n" +
        "'EMSDataSet'|'eDisposition.26'|'Disposition Instructions Provided'|'4226003'|'Contact 911 or see your Doctor if problem worsens'|\n" +
        "'EMSDataSet'|'eDisposition.26'|'Disposition Instructions Provided'|'4226005'|'Other Not Listed (Described in Narrative)'|\n" +
        "'EMSDataSet'|'eDisposition.26'|'Disposition Instructions Provided'|'4226007'|'Problem Specific Instructions Provided'|\n" +
        "'EMSDataSet'|'eDisposition.26'|'Disposition Instructions Provided'|'4226009'|'See Your Doctor or the Emergency Department immediately'|\n" +
        "'EMSDataSet'|'eDisposition.26'|'Disposition Instructions Provided'|'4226011'|'See Your Doctor or the Emergency Department in the next 24 hours'|\n" +
        "'EMSDataSet'|'eDisposition.26'|'Disposition Instructions Provided'|'4226013'|'See Your Doctor or the Emergency Department in the next 4 hours'|\n" +
        "'EMSDataSet'|'eDisposition.26'|'Disposition Instructions Provided'|'4226015'|'See Your Doctor within the next one week'|\n" +
        "'EMSDataSet'|'eOutcome.01'|'Emergency Department Disposition'|'01'|'Discharged to home or self care (routine discharge)'|\n" +
        "'EMSDataSet'|'eOutcome.01'|'Emergency Department Disposition'|'02'|'Discharged/transferred to another short term general hospital for inpatient care'|\n" +
        "'EMSDataSet'|'eOutcome.01'|'Emergency Department Disposition'|'03'|'Discharged/transferred to a skilled nursing facility (SNF)'|\n" +
        "'EMSDataSet'|'eOutcome.01'|'Emergency Department Disposition'|'04'|'Discharged/transferred to an intermediate care facility (ICF)'|\n" +
        "'EMSDataSet'|'eOutcome.01'|'Emergency Department Disposition'|'05'|'Discharged/transferred to another type of institution not defined elsewhere in this code list'|\n" +
        "'EMSDataSet'|'eOutcome.01'|'Emergency Department Disposition'|'06'|'Discharged/transferred to home under care of organized home health service organization in anticipation of covered skills care'|\n" +
        "'EMSDataSet'|'eOutcome.01'|'Emergency Department Disposition'|'07'|'Left against medical advice or discontinued care'|\n" +
        "'EMSDataSet'|'eOutcome.01'|'Emergency Department Disposition'|'09'|'Admitted as an inpatient to this hospital.'|\n" +
        "'EMSDataSet'|'eOutcome.01'|'Emergency Department Disposition'|'20'|'Deceased/Expired (or did not recover - Religious Non Medical Health Care Patient)'|\n" +
        "'EMSDataSet'|'eOutcome.01'|'Emergency Department Disposition'|'21'|'Discharged/transferred to court/law enforcement'|\n" +
        "'EMSDataSet'|'eOutcome.01'|'Emergency Department Disposition'|'30'|'Still a patient or expected to return for outpatient services.'|\n" +
        "'EMSDataSet'|'eOutcome.01'|'Emergency Department Disposition'|'43'|'Discharged/transferred to a Federal Health Care Facility (e.g., VA or federal health care facility)'|\n" +
        "'EMSDataSet'|'eOutcome.01'|'Emergency Department Disposition'|'50'|'Discharged/transferred to Hospice - home.'|\n" +
        "'EMSDataSet'|'eOutcome.01'|'Emergency Department Disposition'|'51'|'Discharged/transferred to Hospice - medical facility'|\n" +
        "'EMSDataSet'|'eOutcome.01'|'Emergency Department Disposition'|'61'|'Discharged/transferred within this institution to a hospital based Medicare approved swing bed.'|\n" +
        "'EMSDataSet'|'eOutcome.01'|'Emergency Department Disposition'|'62'|'Discharged/transferred to a inpatient rehabilitation facility including distinct part units of a hospital.'|\n" +
        "'EMSDataSet'|'eOutcome.01'|'Emergency Department Disposition'|'63'|'Discharged/transferred to long term care hospitals'|\n" +
        "'EMSDataSet'|'eOutcome.01'|'Emergency Department Disposition'|'64'|'Discharged/transferred to a nursing facility certified under Medicaid but not certified under Medicare'|\n" +
        "'EMSDataSet'|'eOutcome.01'|'Emergency Department Disposition'|'65'|'Discharged/transferred to a psychiatric hospital or psychiatric distinct part unit of a hospital.'|\n" +
        "'EMSDataSet'|'eOutcome.01'|'Emergency Department Disposition'|'66'|'Discharged/transferred to a Critical Access Hospital (CAH).'|\n" +
        "'EMSDataSet'|'eOutcome.01'|'Emergency Department Disposition'|'70'|'Discharged/transferred to another type of health care institution not defined elsewhere in the code list.'|\n" +
        "'EMSDataSet'|'eOutcome.02'|'Hospital Disposition'|'01'|'Discharged to home or self care (routine discharge)'|\n" +
        "'EMSDataSet'|'eOutcome.02'|'Hospital Disposition'|'02'|'Discharged/transferred to another short term general hospital for inpatient care'|\n" +
        "'EMSDataSet'|'eOutcome.02'|'Hospital Disposition'|'03'|'Discharged/transferred to a skilled nursing facility (SNF)'|\n" +
        "'EMSDataSet'|'eOutcome.02'|'Hospital Disposition'|'04'|'Discharged/transferred to an intermediate care facility (ICF)'|\n" +
        "'EMSDataSet'|'eOutcome.02'|'Hospital Disposition'|'05'|'Discharged/transferred to another type of institution not defined elsewhere in this code list'|\n" +
        "'EMSDataSet'|'eOutcome.02'|'Hospital Disposition'|'06'|'Discharged/transferred to home under care of organized home health service organization in anticipation of covered skills care'|\n" +
        "'EMSDataSet'|'eOutcome.02'|'Hospital Disposition'|'07'|'Left against medical advice or discontinued care'|\n" +
        "'EMSDataSet'|'eOutcome.02'|'Hospital Disposition'|'20'|'Deceased/Expired (or did not recover - Religious Non Medical Health Care Patient)'|\n" +
        "'EMSDataSet'|'eOutcome.02'|'Hospital Disposition'|'21'|'Discharged/transferred to court/law enforcement'|\n" +
        "'EMSDataSet'|'eOutcome.02'|'Hospital Disposition'|'30'|'Still a patient or expected to return for outpatient services.'|\n" +
        "'EMSDataSet'|'eOutcome.02'|'Hospital Disposition'|'43'|'Discharged/transferred to a Federal Health Care Facility (e.g., VA or federal health care facility)'|\n" +
        "'EMSDataSet'|'eOutcome.02'|'Hospital Disposition'|'50'|'Discharged/transferred to Hospice - home.'|\n" +
        "'EMSDataSet'|'eOutcome.02'|'Hospital Disposition'|'51'|'Discharged/transferred to Hospice - medical facility'|\n" +
        "'EMSDataSet'|'eOutcome.02'|'Hospital Disposition'|'61'|'Discharged/transferred within this institution to a hospital based Medicare approved swing bed.'|\n" +
        "'EMSDataSet'|'eOutcome.02'|'Hospital Disposition'|'62'|'Discharged/transferred to a inpatient rehabilitation facility including distinct part units of a hospital.'|\n" +
        "'EMSDataSet'|'eOutcome.02'|'Hospital Disposition'|'63'|'Discharged/transferred to long term care hospitals'|\n" +
        "'EMSDataSet'|'eOutcome.02'|'Hospital Disposition'|'64'|'Discharged/transferred to a nursing facility certified under Medicaid but not certified under Medicare'|\n" +
        "'EMSDataSet'|'eOutcome.02'|'Hospital Disposition'|'65'|'Discharged/transferred to a psychiatric hospital or psychiatric distinct part unit of a hospital.'|\n" +
        "'EMSDataSet'|'eOutcome.02'|'Hospital Disposition'|'66'|'Discharged/transferred to a Critical Access Hospital (CAH).'|\n" +
        "'EMSDataSet'|'eOutcome.02'|'Hospital Disposition'|'70'|'Discharged/transferred to another type of health care institution not defined elsewhere in the code list.'|\n" +
        "'EMSDataSet'|'eOutcome.03'|'External Report ID/Number Type'|'4303001'|'Disaster Tag'|\n" +
        "'EMSDataSet'|'eOutcome.03'|'External Report ID/Number Type'|'4303003'|'Fire Incident Report'|\n" +
        "'EMSDataSet'|'eOutcome.03'|'External Report ID/Number Type'|'4303005'|'Hospital-Receiving'|\n" +
        "'EMSDataSet'|'eOutcome.03'|'External Report ID/Number Type'|'4303007'|'Hospital-Transferring'|\n" +
        "'EMSDataSet'|'eOutcome.03'|'External Report ID/Number Type'|'4303009'|'Law Enforcement Report'|\n" +
        "'EMSDataSet'|'eOutcome.03'|'External Report ID/Number Type'|'4303011'|'Other'|\n" +
        "'EMSDataSet'|'eOutcome.03'|'External Report ID/Number Type'|'4303013'|'Other Registry'|\n" +
        "'EMSDataSet'|'eOutcome.03'|'External Report ID/Number Type'|'4303015'|'Other Report'|\n" +
        "'EMSDataSet'|'eOutcome.03'|'External Report ID/Number Type'|'4303017'|'Patient ID'|\n" +
        "'EMSDataSet'|'eOutcome.03'|'External Report ID/Number Type'|'4303019'|'Prior EMS Patient Care Report'|\n" +
        "'EMSDataSet'|'eOutcome.03'|'External Report ID/Number Type'|'4303021'|'STEMI Registry'|\n" +
        "'EMSDataSet'|'eOutcome.03'|'External Report ID/Number Type'|'4303023'|'Stroke Registry'|\n" +
        "'EMSDataSet'|'eOutcome.03'|'External Report ID/Number Type'|'4303025'|'Trauma Registry'|\n" +
        "'EMSDataSet'|'eOutcome.17'|'Outcome at Hospital Discharge'|'4317001'|'No Symptoms At All'|\n" +
        "'EMSDataSet'|'eOutcome.17'|'Outcome at Hospital Discharge'|'4317003'|'No significant disability despite symptoms; able to carry out all usual duties and activities'|\n" +
        "'EMSDataSet'|'eOutcome.17'|'Outcome at Hospital Discharge'|'4317005'|'Slight disability; unable to carry out all previous activities, but able to look after own affairs without assistance'|\n" +
        "'EMSDataSet'|'eOutcome.17'|'Outcome at Hospital Discharge'|'4317007'|'Moderate disability; requiring some help, but able to walk without assistance'|\n" +
        "'EMSDataSet'|'eOutcome.17'|'Outcome at Hospital Discharge'|'4317009'|'Moderately severe disability; unable to walk without assistance and unable to attend to own bodily needs without assistance'|\n" +
        "'EMSDataSet'|'eOutcome.17'|'Outcome at Hospital Discharge'|'4317011'|'Severe disability; bedridden, incontinent and requiring constant nursing care and attention'|\n" +
        "'EMSDataSet'|'eOutcome.17'|'Outcome at Hospital Discharge'|'4317013'|'Dead'|\n" +
        "'EMSDataSet'|'eOther.01'|'Review Requested'|'9923001'|'No'|\n" +
        "'EMSDataSet'|'eOther.01'|'Review Requested'|'9923003'|'Yes'|\n" +
        "'EMSDataSet'|'eOther.02'|'Potential System of Care/Specialty/Registry Patient'|'4502001'|'Airway'|\n" +
        "'EMSDataSet'|'eOther.02'|'Potential System of Care/Specialty/Registry Patient'|'4502003'|'Burn'|\n" +
        "'EMSDataSet'|'eOther.02'|'Potential System of Care/Specialty/Registry Patient'|'4502005'|'Cardiac/MI'|\n" +
        "'EMSDataSet'|'eOther.02'|'Potential System of Care/Specialty/Registry Patient'|'4502007'|'CVA/Stroke'|\n" +
        "'EMSDataSet'|'eOther.02'|'Potential System of Care/Specialty/Registry Patient'|'4502009'|'Drowning'|\n" +
        "'EMSDataSet'|'eOther.02'|'Potential System of Care/Specialty/Registry Patient'|'4502011'|'Other'|\n" +
        "'EMSDataSet'|'eOther.02'|'Potential System of Care/Specialty/Registry Patient'|'4502013'|'Spinal Cord Injury'|\n" +
        "'EMSDataSet'|'eOther.02'|'Potential System of Care/Specialty/Registry Patient'|'4502015'|'STEMI/Acute Cardiac'|\n" +
        "'EMSDataSet'|'eOther.02'|'Potential System of Care/Specialty/Registry Patient'|'4502017'|'Trauma'|\n" +
        "'EMSDataSet'|'eOther.02'|'Potential System of Care/Specialty/Registry Patient'|'4502019'|'Traumatic Brain Injury'|\n" +
        "'EMSDataSet'|'eOther.03'|'Personal Protective Equipment Used'|'4503001'|'Eye Protection'|\n" +
        "'EMSDataSet'|'eOther.03'|'Personal Protective Equipment Used'|'4503003'|'Gloves'|\n" +
        "'EMSDataSet'|'eOther.03'|'Personal Protective Equipment Used'|'4503005'|'Helmet'|\n" +
        "'EMSDataSet'|'eOther.03'|'Personal Protective Equipment Used'|'4503007'|'Level A Suit'|\n" +
        "'EMSDataSet'|'eOther.03'|'Personal Protective Equipment Used'|'4503009'|'Level B Suit'|\n" +
        "'EMSDataSet'|'eOther.03'|'Personal Protective Equipment Used'|'4503011'|'Level C Suit'|\n" +
        "'EMSDataSet'|'eOther.03'|'Personal Protective Equipment Used'|'4503013'|'Level D Suit (Turn out gear)'|\n" +
        "'EMSDataSet'|'eOther.03'|'Personal Protective Equipment Used'|'4503015'|'Mask-N95'|\n" +
        "'EMSDataSet'|'eOther.03'|'Personal Protective Equipment Used'|'4503017'|'Mask-Surgical (Non-Fitted)'|\n" +
        "'EMSDataSet'|'eOther.03'|'Personal Protective Equipment Used'|'4503019'|'Other'|\n" +
        "'EMSDataSet'|'eOther.03'|'Personal Protective Equipment Used'|'4503021'|'PAPR'|\n" +
        "'EMSDataSet'|'eOther.03'|'Personal Protective Equipment Used'|'4503023'|'Reflective Vest'|\n" +
        "'EMSDataSet'|'eOther.05'|'Suspected EMS Work Related Exposure, Injury, or Death'|'9923001'|'No'|\n" +
        "'EMSDataSet'|'eOther.05'|'Suspected EMS Work Related Exposure, Injury, or Death'|'9923003'|'Yes'|\n" +
        "'EMSDataSet'|'eOther.06'|'The Type of Work-Related Injury, Death or Suspected Exposure'|'4506001'|'Death-Cardiac Arrest'|\n" +
        "'EMSDataSet'|'eOther.06'|'The Type of Work-Related Injury, Death or Suspected Exposure'|'4506003'|'Death-Injury Related'|\n" +
        "'EMSDataSet'|'eOther.06'|'The Type of Work-Related Injury, Death or Suspected Exposure'|'4506005'|'Death-Other'|\n" +
        "'EMSDataSet'|'eOther.06'|'The Type of Work-Related Injury, Death or Suspected Exposure'|'4506007'|'Exposure-Airborne Respiratory/Biological/Aerosolized Secretions'|\n" +
        "'EMSDataSet'|'eOther.06'|'The Type of Work-Related Injury, Death or Suspected Exposure'|'4506009'|'Exposure-Body Fluid Contact to Broken Skin'|\n" +
        "'EMSDataSet'|'eOther.06'|'The Type of Work-Related Injury, Death or Suspected Exposure'|'4506011'|'Exposure-Body Fluid Contact with Eye'|\n" +
        "'EMSDataSet'|'eOther.06'|'The Type of Work-Related Injury, Death or Suspected Exposure'|'4506013'|'Exposure-Body Fluid Contact with Intact Skin'|\n" +
        "'EMSDataSet'|'eOther.06'|'The Type of Work-Related Injury, Death or Suspected Exposure'|'4506015'|'Exposure-Body Fluid Contact with Mucosal Surface'|\n" +
        "'EMSDataSet'|'eOther.06'|'The Type of Work-Related Injury, Death or Suspected Exposure'|'4506017'|'Exposure-Needle Stick with Body Fluid Injection'|\n" +
        "'EMSDataSet'|'eOther.06'|'The Type of Work-Related Injury, Death or Suspected Exposure'|'4506019'|'Exposure-Needle Stick without Body Fluid Injection'|\n" +
        "'EMSDataSet'|'eOther.06'|'The Type of Work-Related Injury, Death or Suspected Exposure'|'4506021'|'Exposure-Toxin/Chemical/Hazmat'|\n" +
        "'EMSDataSet'|'eOther.06'|'The Type of Work-Related Injury, Death or Suspected Exposure'|'4506023'|'Injury-Lifting/Back/Musculoskeletal'|\n" +
        "'EMSDataSet'|'eOther.06'|'The Type of Work-Related Injury, Death or Suspected Exposure'|'4506025'|'Injury-Other'|\n" +
        "'EMSDataSet'|'eOther.06'|'The Type of Work-Related Injury, Death or Suspected Exposure'|'4506027'|'None'|\n" +
        "'EMSDataSet'|'eOther.06'|'The Type of Work-Related Injury, Death or Suspected Exposure'|'4506029'|'Other'|\n" +
        "'EMSDataSet'|'eOther.07'|'Natural, Suspected, Intentional, or Unintentional Disaster'|'4507001'|'Biologic Agent'|\n" +
        "'EMSDataSet'|'eOther.07'|'Natural, Suspected, Intentional, or Unintentional Disaster'|'4507003'|'Building Failure'|\n" +
        "'EMSDataSet'|'eOther.07'|'Natural, Suspected, Intentional, or Unintentional Disaster'|'4507005'|'Chemical Agent'|\n" +
        "'EMSDataSet'|'eOther.07'|'Natural, Suspected, Intentional, or Unintentional Disaster'|'4507007'|'Explosive Device'|\n" +
        "'EMSDataSet'|'eOther.07'|'Natural, Suspected, Intentional, or Unintentional Disaster'|'4507009'|'Fire'|\n" +
        "'EMSDataSet'|'eOther.07'|'Natural, Suspected, Intentional, or Unintentional Disaster'|'4507011'|'Hostage Event'|\n" +
        "'EMSDataSet'|'eOther.07'|'Natural, Suspected, Intentional, or Unintentional Disaster'|'4507013'|'Mass Gathering'|\n" +
        "'EMSDataSet'|'eOther.07'|'Natural, Suspected, Intentional, or Unintentional Disaster'|'4507015'|'Mass Illness'|\n" +
        "'EMSDataSet'|'eOther.07'|'Natural, Suspected, Intentional, or Unintentional Disaster'|'4507017'|'Nuclear Agent'|\n" +
        "'EMSDataSet'|'eOther.07'|'Natural, Suspected, Intentional, or Unintentional Disaster'|'4507019'|'Radioactive Device'|\n" +
        "'EMSDataSet'|'eOther.07'|'Natural, Suspected, Intentional, or Unintentional Disaster'|'4507021'|'Secondary Destructive Device'|\n" +
        "'EMSDataSet'|'eOther.07'|'Natural, Suspected, Intentional, or Unintentional Disaster'|'4507023'|'Shooting/Sniper'|\n" +
        "'EMSDataSet'|'eOther.07'|'Natural, Suspected, Intentional, or Unintentional Disaster'|'4507025'|'Vehicular'|\n" +
        "'EMSDataSet'|'eOther.07'|'Natural, Suspected, Intentional, or Unintentional Disaster'|'4507027'|'Weather'|\n" +
        "'EMSDataSet'|'eOther.09'|'External Electronic Document Type'|'4509001'|'Other Audio Recording'|\n" +
        "'EMSDataSet'|'eOther.09'|'External Electronic Document Type'|'4509003'|'Billing Information'|\n" +
        "'EMSDataSet'|'eOther.09'|'External Electronic Document Type'|'4509005'|'Diagnostic Image (CT, X-ray, US, etc.)'|\n" +
        "'EMSDataSet'|'eOther.09'|'External Electronic Document Type'|'4509007'|'DNR/Living Will'|\n" +
        "'EMSDataSet'|'eOther.09'|'External Electronic Document Type'|'4509009'|'ECG/Lab Results'|\n" +
        "'EMSDataSet'|'eOther.09'|'External Electronic Document Type'|'4509011'|'Guardianship/Power of Attorney'|\n" +
        "'EMSDataSet'|'eOther.09'|'External Electronic Document Type'|'4509013'|'Other Healthcare Record'|\n" +
        "'EMSDataSet'|'eOther.09'|'External Electronic Document Type'|'4509015'|'Other'|\n" +
        "'EMSDataSet'|'eOther.09'|'External Electronic Document Type'|'4509017'|'Patient Identification'|\n" +
        "'EMSDataSet'|'eOther.09'|'External Electronic Document Type'|'4509019'|'Patient Refusal Sheet'|\n" +
        "'EMSDataSet'|'eOther.09'|'External Electronic Document Type'|'4509021'|'Other Picture/Graphic'|\n" +
        "'EMSDataSet'|'eOther.09'|'External Electronic Document Type'|'4509025'|'Other Video/Movie'|\n" +
        "'EMSDataSet'|'eOther.12'|'Type of Person Signing'|'4512001'|'EMS Crew Member (Other)'|\n" +
        "'EMSDataSet'|'eOther.12'|'Type of Person Signing'|'4512003'|'EMS Primary Care Provider (for this event)'|\n" +
        "'EMSDataSet'|'eOther.12'|'Type of Person Signing'|'4512005'|'Healthcare Provider'|\n" +
        "'EMSDataSet'|'eOther.12'|'Type of Person Signing'|'4512007'|'Medical Director'|\n" +
        "'EMSDataSet'|'eOther.12'|'Type of Person Signing'|'4512009'|'Non-Healthcare Provider'|\n" +
        "'EMSDataSet'|'eOther.12'|'Type of Person Signing'|'4512011'|'Online Medical Control Healthcare Practitioner'|\n" +
        "'EMSDataSet'|'eOther.12'|'Type of Person Signing'|'4512013'|'Other'|\n" +
        "'EMSDataSet'|'eOther.12'|'Type of Person Signing'|'4512015'|'Patient'|\n" +
        "'EMSDataSet'|'eOther.12'|'Type of Person Signing'|'4512017'|'Patient Representative'|\n" +
        "'EMSDataSet'|'eOther.12'|'Type of Person Signing'|'4512019'|'Witness'|\n" +
        "'EMSDataSet'|'eOther.13'|'Signature Reason'|'4513001'|'HIPAA acknowledgement/Release'|\n" +
        "'EMSDataSet'|'eOther.13'|'Signature Reason'|'4513003'|'Permission to Treat'|\n" +
        "'EMSDataSet'|'eOther.13'|'Signature Reason'|'4513005'|'Release for Billing'|\n" +
        "'EMSDataSet'|'eOther.13'|'Signature Reason'|'4513007'|'Transfer of Patient Care'|\n" +
        "'EMSDataSet'|'eOther.13'|'Signature Reason'|'4513009'|'Refusal of Care'|\n" +
        "'EMSDataSet'|'eOther.13'|'Signature Reason'|'4513011'|'Controlled Substance, Administration'|\n" +
        "'EMSDataSet'|'eOther.13'|'Signature Reason'|'4513013'|'Controlled Substance, Waste'|\n" +
        "'EMSDataSet'|'eOther.13'|'Signature Reason'|'4513015'|'Airway Verification'|\n" +
        "'EMSDataSet'|'eOther.13'|'Signature Reason'|'4513017'|'Patient Belongings (Receipt)'|\n" +
        "'EMSDataSet'|'eOther.13'|'Signature Reason'|'4513019'|'Permission to Transport'|\n" +
        "'EMSDataSet'|'eOther.13'|'Signature Reason'|'4513021'|'Refusal of Transport'|\n" +
        "'EMSDataSet'|'eOther.13'|'Signature Reason'|'4513023'|'Other'|\n" +
        "'EMSDataSet'|'eOther.14'|'Type Of Patient Representative'|'4514001'|'Aunt'|\n" +
        "'EMSDataSet'|'eOther.14'|'Type Of Patient Representative'|'4514003'|'Brother'|\n" +
        "'EMSDataSet'|'eOther.14'|'Type Of Patient Representative'|'4514005'|'Daughter'|\n" +
        "'EMSDataSet'|'eOther.14'|'Type Of Patient Representative'|'4514007'|'Discharge Planner'|\n" +
        "'EMSDataSet'|'eOther.14'|'Type Of Patient Representative'|'4514009'|'Domestic Partner'|\n" +
        "'EMSDataSet'|'eOther.14'|'Type Of Patient Representative'|'4514011'|'Father'|\n" +
        "'EMSDataSet'|'eOther.14'|'Type Of Patient Representative'|'4514013'|'Friend'|\n" +
        "'EMSDataSet'|'eOther.14'|'Type Of Patient Representative'|'4514015'|'Grandfather'|\n" +
        "'EMSDataSet'|'eOther.14'|'Type Of Patient Representative'|'4514017'|'Grandmother'|\n" +
        "'EMSDataSet'|'eOther.14'|'Type Of Patient Representative'|'4514019'|'Guardian'|\n" +
        "'EMSDataSet'|'eOther.14'|'Type Of Patient Representative'|'4514021'|'Husband'|\n" +
        "'EMSDataSet'|'eOther.14'|'Type Of Patient Representative'|'4514023'|'Law Enforcement'|\n" +
        "'EMSDataSet'|'eOther.14'|'Type Of Patient Representative'|'4514025'|'MD/DO'|\n" +
        "'EMSDataSet'|'eOther.14'|'Type Of Patient Representative'|'4514027'|'Mother'|\n" +
        "'EMSDataSet'|'eOther.14'|'Type Of Patient Representative'|'4514029'|'Nurse (RN)'|\n" +
        "'EMSDataSet'|'eOther.14'|'Type Of Patient Representative'|'4514031'|'Nurse Practitioner (NP)'|\n" +
        "'EMSDataSet'|'eOther.14'|'Type Of Patient Representative'|'4514033'|'Other Care Provider (Home health, hospice, etc.)'|\n" +
        "'EMSDataSet'|'eOther.14'|'Type Of Patient Representative'|'4514035'|'Other'|\n" +
        "'EMSDataSet'|'eOther.14'|'Type Of Patient Representative'|'4514037'|'Physician's Assistant (PA)'|\n" +
        "'EMSDataSet'|'eOther.14'|'Type Of Patient Representative'|'4514039'|'Power of Attorney'|\n" +
        "'EMSDataSet'|'eOther.14'|'Type Of Patient Representative'|'4514041'|'Other Relative'|\n" +
        "'EMSDataSet'|'eOther.14'|'Type Of Patient Representative'|'4514043'|'Self'|\n" +
        "'EMSDataSet'|'eOther.14'|'Type Of Patient Representative'|'4514045'|'Sister'|\n" +
        "'EMSDataSet'|'eOther.14'|'Type Of Patient Representative'|'4514047'|'Son'|\n" +
        "'EMSDataSet'|'eOther.14'|'Type Of Patient Representative'|'4514049'|'Uncle'|\n" +
        "'EMSDataSet'|'eOther.14'|'Type Of Patient Representative'|'4514051'|'Wife'|\n" +
        "'EMSDataSet'|'eOther.15'|'Signature Status'|'4515001'|'Not Signed - Crew Called out to another call'|\n" +
        "'EMSDataSet'|'eOther.15'|'Signature Status'|'4515003'|'Not Signed - Deceased'|\n" +
        "'EMSDataSet'|'eOther.15'|'Signature Status'|'4515005'|'Not Signed - Due to Distress Level'|\n" +
        "'EMSDataSet'|'eOther.15'|'Signature Status'|'4515007'|'Not Signed - Equipment Failure'|\n" +
        "'EMSDataSet'|'eOther.15'|'Signature Status'|'4515009'|'Not Signed - In Law Enforcement Custody'|\n" +
        "'EMSDataSet'|'eOther.15'|'Signature Status'|'4515011'|'Not Signed - Language Barrier'|\n" +
        "'EMSDataSet'|'eOther.15'|'Signature Status'|'4515013'|'Not Signed - Mental Status/Impaired'|\n" +
        "'EMSDataSet'|'eOther.15'|'Signature Status'|'4515015'|'Not Signed - Minor/Child'|\n" +
        "'EMSDataSet'|'eOther.15'|'Signature Status'|'4515017'|'Not Signed - Physical Impairment of Extremities'|\n" +
        "'EMSDataSet'|'eOther.15'|'Signature Status'|'4515019'|'Not Signed - Refused'|\n" +
        "'EMSDataSet'|'eOther.15'|'Signature Status'|'4515021'|'Not Signed - Transferred Care/No Access to Obtain Signature'|\n" +
        "'EMSDataSet'|'eOther.15'|'Signature Status'|'4515023'|'Not Signed - Unconscious'|\n" +
        "'EMSDataSet'|'eOther.15'|'Signature Status'|'4515025'|'Not Signed -Visually Impaired'|\n" +
        "'EMSDataSet'|'eOther.15'|'Signature Status'|'4515027'|'Physical Signature/Paper Copy Obtained'|\n" +
        "'EMSDataSet'|'eOther.15'|'Signature Status'|'4515029'|'Refused'|\n" +
        "'EMSDataSet'|'eOther.15'|'Signature Status'|'4515031'|'Signed'|\n" +
        "'EMSDataSet'|'eOther.15'|'Signature Status'|'4515033'|'Signed-Not Patient'|";
}
function getAttributes() {
    return "'DEMDataSet'|'element'|'dState.01'|'State Required Element'|'TIMESTAMP'|\n" +
        "'DEMDataSet'|'group'|'dCustomConfiguration.CustomGroup'|''|'CustomElementID'|\n" +
        "'DEMDataSet'|'element'|'dCustomConfiguration.01'|'Custom Data Element Title'|'nemsisElement'|\n" +
        "'DEMDataSet'|'element'|'dCustomConfiguration.06'|'Custom Data Element Potential Values'|'nemsisCode'|\n" +
        "'DEMDataSet'|'element'|'dCustomConfiguration.06'|'Custom Data Element Potential Values'|'customValueDescription'|\n" +
        "'DEMDataSet'|'group'|'DemographicReport'|''|'timeStamp'|\n" +
        "'DEMDataSet'|'element'|'dAgency.03'|'EMS Agency Name'|'NV'|\n" +
        "'DEMDataSet'|'group'|'dAgency.AgencyServiceGroup'|''|'CorrelationID'|\n" +
        "'DEMDataSet'|'element'|'dAgency.06'|'EMS Agency Service Area County(ies)'|'CorrelationID'|\n" +
        "'DEMDataSet'|'element'|'dAgency.07'|'EMS Agency Census Tracts'|'NV'|\n" +
        "'DEMDataSet'|'element'|'dAgency.07'|'EMS Agency Census Tracts'|'CorrelationID'|\n" +
        "'DEMDataSet'|'element'|'dAgency.08'|'EMS Agency Service Area ZIP Codes'|'CorrelationID'|\n" +
        "'DEMDataSet'|'element'|'dAgency.08'|'EMS Agency Service Area ZIP Codes'|'NV'|\n" +
        "'DEMDataSet'|'element'|'dAgency.10'|'Other Types of Service'|'CorrelationID'|\n" +
        "'DEMDataSet'|'element'|'dAgency.10'|'Other Types of Service'|'NV'|\n" +
        "'DEMDataSet'|'group'|'dAgency.AgencyYearGroup'|''|'CorrelationID'|\n" +
        "'DEMDataSet'|'element'|'dAgency.16'|'Total Primary Service Area Size'|'NV'|\n" +
        "'DEMDataSet'|'element'|'dAgency.17'|'Total Service Area Population'|'NV'|\n" +
        "'DEMDataSet'|'element'|'dAgency.18'|'911 EMS Call Center Volume per Year'|'NV'|\n" +
        "'DEMDataSet'|'element'|'dAgency.19'|'EMS Dispatch Volume per Year'|'NV'|\n" +
        "'DEMDataSet'|'element'|'dAgency.20'|'EMS Patient Transport Volume per Year'|'NV'|\n" +
        "'DEMDataSet'|'element'|'dAgency.21'|'EMS Patient Contact Volume per Year'|'NV'|\n" +
        "'DEMDataSet'|'element'|'dAgency.22'|'EMS Billable Calls per Year'|'NV'|\n" +
        "'DEMDataSet'|'element'|'dAgency.25'|'National Provider Identifier'|'NV'|\n" +
        "'DEMDataSet'|'element'|'dAgency.25'|'National Provider Identifier'|'CorrelationID'|\n" +
        "'DEMDataSet'|'element'|'dAgency.26'|'Fire Department ID Number'|'NV'|\n" +
        "'DEMDataSet'|'element'|'dAgency.26'|'Fire Department ID Number'|'CorrelationID'|\n" +
        "'DEMDataSet'|'group'|'dContact.ContactInfoGroup'|''|'CorrelationID'|\n" +
        "'DEMDataSet'|'element'|'dContact.01'|'Agency Contact Type'|'NV'|\n" +
        "'DEMDataSet'|'element'|'dContact.02'|'Agency Contact Last Name'|'NV'|\n" +
        "'DEMDataSet'|'element'|'dContact.03'|'Agency Contact First Name'|'NV'|\n" +
        "'DEMDataSet'|'element'|'dContact.05'|'Agency Contact Address'|'NV'|\n" +
        "'DEMDataSet'|'element'|'dContact.05'|'Agency Contact Address'|'StreetAddress2'|\n" +
        "'DEMDataSet'|'element'|'dContact.06'|'Agency Contact City'|'NV'|\n" +
        "'DEMDataSet'|'element'|'dContact.07'|'Agency Contact State'|'NV'|\n" +
        "'DEMDataSet'|'element'|'dContact.08'|'Agency Contact ZIP Code'|'NV'|\n" +
        "'DEMDataSet'|'element'|'dContact.10'|'Agency Contact Phone Number'|'PhoneNumberType'|\n" +
        "'DEMDataSet'|'element'|'dContact.10'|'Agency Contact Phone Number'|'CorrelationID'|\n" +
        "'DEMDataSet'|'element'|'dContact.10'|'Agency Contact Phone Number'|'NV'|\n" +
        "'DEMDataSet'|'element'|'dContact.11'|'Agency Contact Email Address'|'NV'|\n" +
        "'DEMDataSet'|'element'|'dContact.11'|'Agency Contact Email Address'|'EmailAddressType'|\n" +
        "'DEMDataSet'|'element'|'dContact.11'|'Agency Contact Email Address'|'CorrelationID'|\n" +
        "'DEMDataSet'|'element'|'dContact.12'|'EMS Agency Contact Web Address'|'NV'|\n" +
        "'DEMDataSet'|'element'|'dContact.13'|'Agency Medical Director Degree'|'NV'|\n" +
        "'DEMDataSet'|'element'|'dContact.14'|'Agency Medical Director Board Certification Type'|'NV'|\n" +
        "'DEMDataSet'|'element'|'dContact.14'|'Agency Medical Director Board Certification Type'|'CorrelationID'|\n" +
        "'DEMDataSet'|'group'|'dConfiguration.ConfigurationGroup'|''|'CorrelationID'|\n" +
        "'DEMDataSet'|'element'|'dConfiguration.02'|'State Certification/Licensure Levels'|'CorrelationID'|\n" +
        "'DEMDataSet'|'element'|'dConfiguration.03'|'Procedures Permitted by the State'|'NV'|\n" +
        "'DEMDataSet'|'element'|'dConfiguration.03'|'Procedures Permitted by the State'|'CorrelationID'|\n" +
        "'DEMDataSet'|'element'|'dConfiguration.04'|'Medications Permitted by the State'|'NV'|\n" +
        "'DEMDataSet'|'element'|'dConfiguration.04'|'Medications Permitted by the State'|'CorrelationID'|\n" +
        "'DEMDataSet'|'element'|'dConfiguration.05'|'Protocols Permitted by the State'|'NV'|\n" +
        "'DEMDataSet'|'element'|'dConfiguration.05'|'Protocols Permitted by the State'|'CorrelationID'|\n" +
        "'DEMDataSet'|'group'|'dConfiguration.ProcedureGroup'|''|'CorrelationID'|\n" +
        "'DEMDataSet'|'element'|'dConfiguration.07'|'EMS Agency Procedures'|'CorrelationID'|\n" +
        "'DEMDataSet'|'group'|'dConfiguration.MedicationGroup'|''|'CorrelationID'|\n" +
        "'DEMDataSet'|'element'|'dConfiguration.09'|'EMS Agency Medications'|'CorrelationID'|\n" +
        "'DEMDataSet'|'element'|'dConfiguration.10'|'EMS Agency Protocols'|'CorrelationID'|\n" +
        "'DEMDataSet'|'element'|'dConfiguration.11'|'EMS Agency Specialty Service Capability'|'CorrelationID'|\n" +
        "'DEMDataSet'|'element'|'dConfiguration.14'|'EMD Vendor'|'NV'|\n" +
        "'DEMDataSet'|'element'|'dConfiguration.14'|'EMD Vendor'|'CorrelationID'|\n" +
        "'DEMDataSet'|'element'|'dConfiguration.15'|'Patient Monitoring Capability(ies)'|'CorrelationID'|\n" +
        "'DEMDataSet'|'element'|'dConfiguration.16'|'Crew Call Sign'|'CorrelationID'|\n" +
        "'DEMDataSet'|'element'|'dConfiguration.17'|'Dispatch Center (CAD) Name or ID'|'CorrelationID'|\n" +
        "'DEMDataSet'|'group'|'dLocation.LocationGroup'|''|'CorrelationID'|\n" +
        "'DEMDataSet'|'element'|'dLocation.06'|'EMS Location Address'|'StreetAddress2'|\n" +
        "'DEMDataSet'|'element'|'dLocation.12'|'EMS Location Phone Number'|'PhoneNumberType'|\n" +
        "'DEMDataSet'|'element'|'dLocation.12'|'EMS Location Phone Number'|'CorrelationID'|\n" +
        "'DEMDataSet'|'group'|'dVehicle.VehicleGroup'|''|'CorrelationID'|\n" +
        "'DEMDataSet'|'element'|'dVehicle.01'|'Unit/Vehicle Number'|'NV'|\n" +
        "'DEMDataSet'|'element'|'dVehicle.04'|'Vehicle Type'|'NV'|\n" +
        "'DEMDataSet'|'group'|'dVehicle.VehicleCertificationLevelsGroup'|''|'CorrelationID'|\n" +
        "'DEMDataSet'|'element'|'dVehicle.10'|'Vehicle Model Year'|'NV'|\n" +
        "'DEMDataSet'|'group'|'dVehicle.YearGroup'|''|'CorrelationID'|\n" +
        "'DEMDataSet'|'element'|'dVehicle.13'|'Annual Vehicle Miles/Kilometers'|'DistanceUnit'|\n" +
        "'DEMDataSet'|'group'|'dPersonnel.PersonnelGroup'|''|'CorrelationID'|\n" +
        "'DEMDataSet'|'element'|'dPersonnel.01'|'EMS Personnel's Last Name'|'NV'|\n" +
        "'DEMDataSet'|'element'|'dPersonnel.02'|'EMS Personnel's First Name'|'NV'|\n" +
        "'DEMDataSet'|'element'|'dPersonnel.03'|'EMS Personnel's Middle Name/Initial'|'NV'|\n" +
        "'DEMDataSet'|'element'|'dPersonnel.04'|'EMS Personnel's Mailing Address'|'StreetAddress2'|\n" +
        "'DEMDataSet'|'element'|'dPersonnel.09'|'EMS Personnel's Phone Number'|'PhoneNumberType'|\n" +
        "'DEMDataSet'|'element'|'dPersonnel.09'|'EMS Personnel's Phone Number'|'CorrelationID'|\n" +
        "'DEMDataSet'|'element'|'dPersonnel.10'|'EMS Personnel's Email Address'|'EmailAddressType'|\n" +
        "'DEMDataSet'|'element'|'dPersonnel.10'|'EMS Personnel's Email Address'|'CorrelationID'|\n" +
        "'DEMDataSet'|'element'|'dPersonnel.11'|'EMS Personnel's Date of Birth'|'NV'|\n" +
        "'DEMDataSet'|'element'|'dPersonnel.12'|'EMS Personnel's Gender'|'NV'|\n" +
        "'DEMDataSet'|'element'|'dPersonnel.13'|'EMS Personnel's Race'|'NV'|\n" +
        "'DEMDataSet'|'element'|'dPersonnel.13'|'EMS Personnel's Race'|'CorrelationID'|\n" +
        "'DEMDataSet'|'element'|'dPersonnel.16'|'EMS Personnel's Degree Subject/Field of Study'|'CorrelationID'|\n" +
        "'DEMDataSet'|'element'|'dPersonnel.17'|'EMS Personnel's Motor Vehicle License Type'|'CorrelationID'|\n" +
        "'DEMDataSet'|'group'|'dPersonnel.ImmunizationsGroup'|''|'CorrelationID'|\n" +
        "'DEMDataSet'|'element'|'dPersonnel.20'|'EMS Personnel's Foreign Language Ability'|'CorrelationID'|\n" +
        "'DEMDataSet'|'group'|'dPersonnel.LicensureGroup'|''|'CorrelationID'|\n" +
        "'DEMDataSet'|'element'|'dPersonnel.22'|'EMS Personnel's State of Licensure'|'NV'|\n" +
        "'DEMDataSet'|'element'|'dPersonnel.23'|'EMS Personnel's State's Licensure ID Number'|'NV'|\n" +
        "'DEMDataSet'|'element'|'dPersonnel.24'|'EMS Personnel's State EMS Certification Licensure Level'|'NV'|\n" +
        "'DEMDataSet'|'element'|'dPersonnel.31'|'EMS Personnel's Employment Status'|'NV'|\n" +
        "'DEMDataSet'|'element'|'dPersonnel.32'|'EMS Personnel's Employment Status Date'|'NV'|\n" +
        "'DEMDataSet'|'element'|'dPersonnel.34'|'EMS Personnel's Primary EMS Job Role'|'NV'|\n" +
        "'DEMDataSet'|'element'|'dPersonnel.35'|'EMS Personnel's Other Job Responsibilities'|'NV'|\n" +
        "'DEMDataSet'|'element'|'dPersonnel.35'|'EMS Personnel's Other Job Responsibilities'|'CorrelationID'|\n" +
        "'DEMDataSet'|'group'|'dPersonnel.CertificationLevelGroup'|''|'CorrelationID'|\n" +
        "'DEMDataSet'|'group'|'dDevice.DeviceGroup'|''|'CorrelationID'|\n" +
        "'DEMDataSet'|'element'|'dDevice.03'|'Medical Device Type'|'CorrelationID'|\n" +
        "'DEMDataSet'|'group'|'dFacilityGroup'|''|'CorrelationID'|\n" +
        "'DEMDataSet'|'group'|'dFacility.FacilityGroup'|''|'CorrelationID'|\n" +
        "'DEMDataSet'|'element'|'dFacility.04'|'Hospital Designations'|'CorrelationID'|\n" +
        "'DEMDataSet'|'element'|'dFacility.07'|'Facility Street Address'|'StreetAddress2'|\n" +
        "'DEMDataSet'|'element'|'dFacility.15'|'Facility Phone Number'|'PhoneNumberType'|\n" +
        "'DEMDataSet'|'element'|'dFacility.15'|'Facility Phone Number'|'CorrelationID'|\n" +
        "'DEMDataSet'|'group'|'dCustomResults.ResultsGroup'|''|'CorrelationID'|\n" +
        "'DEMDataSet'|'element'|'dCustomResults.01'|'Custom Data Element Result'|'NV'|\n" +
        "'DEMDataSet'|'element'|'dCustomResults.01'|'Custom Data Element Result'|'PN'|\n" +
        "'EMSDataSet'|'element'|'eState.01'|'State Required Element'|'TIMESTAMP'|\n" +
        "'EMSDataSet'|'group'|'eCustomConfiguration.CustomGroup'|''|'CustomElementID'|\n" +
        "'EMSDataSet'|'element'|'eCustomConfiguration.01'|'Custom Data Element Title'|'nemsisElement'|\n" +
        "'EMSDataSet'|'element'|'eCustomConfiguration.06'|'Custom Data Element Potential Values'|'nemsisCode'|\n" +
        "'EMSDataSet'|'element'|'eCustomConfiguration.06'|'Custom Data Element Potential Values'|'customValueDescription'|\n" +
        "'EMSDataSet'|'element'|'eResponse.02'|'EMS Agency Name'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eResponse.03'|'Incident Number'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eResponse.04'|'EMS Response Number'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eResponse.08'|'Type of Dispatch Delay'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eResponse.08'|'Type of Dispatch Delay'|'CorrelationID'|\n" +
        "'EMSDataSet'|'element'|'eResponse.09'|'Type of Response Delay'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eResponse.09'|'Type of Response Delay'|'CorrelationID'|\n" +
        "'EMSDataSet'|'element'|'eResponse.10'|'Type of Scene Delay'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eResponse.10'|'Type of Scene Delay'|'CorrelationID'|\n" +
        "'EMSDataSet'|'element'|'eResponse.11'|'Type of Transport Delay'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eResponse.11'|'Type of Transport Delay'|'CorrelationID'|\n" +
        "'EMSDataSet'|'element'|'eResponse.12'|'Type of Turn-Around Delay'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eResponse.12'|'Type of Turn-Around Delay'|'CorrelationID'|\n" +
        "'EMSDataSet'|'element'|'eResponse.24'|'Additional Response Mode Descriptors'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eResponse.24'|'Additional Response Mode Descriptors'|'CorrelationID'|\n" +
        "'EMSDataSet'|'element'|'eDispatch.02'|'EMD Performed'|'NV'|\n" +
        "'EMSDataSet'|'group'|'eCrew.CrewGroup'|''|'CorrelationID'|\n" +
        "'EMSDataSet'|'element'|'eCrew.01'|'Crew Member ID'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eCrew.02'|'Crew Member Level'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eCrew.03'|'Crew Member Response Role'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eCrew.03'|'Crew Member Response Role'|'CorrelationID'|\n" +
        "'EMSDataSet'|'element'|'eTimes.01'|'PSAP Call Date/Time'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eTimes.05'|'Unit En Route Date/Time'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eTimes.06'|'Unit Arrived on Scene Date/Time'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eTimes.07'|'Arrived at Patient Date/Time'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eTimes.08'|'Transfer of EMS Patient Care Date/Time'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eTimes.09'|'Unit Left Scene Date/Time'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eTimes.11'|'Patient Arrived at Destination Date/Time'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eTimes.12'|'Destination Patient Transfer of Care Date/Time'|'NV'|\n" +
        "'EMSDataSet'|'element'|'ePatient.02'|'Last Name'|'NV'|\n" +
        "'EMSDataSet'|'element'|'ePatient.02'|'Last Name'|'PN'|\n" +
        "'EMSDataSet'|'element'|'ePatient.03'|'First Name'|'NV'|\n" +
        "'EMSDataSet'|'element'|'ePatient.03'|'First Name'|'PN'|\n" +
        "'EMSDataSet'|'element'|'ePatient.05'|'Patient's Home Address'|'StreetAddress2'|\n" +
        "'EMSDataSet'|'element'|'ePatient.07'|'Patient's Home County'|'NV'|\n" +
        "'EMSDataSet'|'element'|'ePatient.08'|'Patient's Home State'|'NV'|\n" +
        "'EMSDataSet'|'element'|'ePatient.09'|'Patient's Home ZIP Code'|'NV'|\n" +
        "'EMSDataSet'|'element'|'ePatient.13'|'Gender'|'NV'|\n" +
        "'EMSDataSet'|'element'|'ePatient.14'|'Race'|'NV'|\n" +
        "'EMSDataSet'|'element'|'ePatient.14'|'Race'|'CorrelationID'|\n" +
        "'EMSDataSet'|'element'|'ePatient.15'|'Age'|'NV'|\n" +
        "'EMSDataSet'|'element'|'ePatient.16'|'Age Units'|'NV'|\n" +
        "'EMSDataSet'|'element'|'ePatient.17'|'Date of Birth'|'NV'|\n" +
        "'EMSDataSet'|'element'|'ePatient.17'|'Date of Birth'|'PN'|\n" +
        "'EMSDataSet'|'element'|'ePatient.18'|'Patient's Phone Number'|'PhoneNumberType'|\n" +
        "'EMSDataSet'|'element'|'ePatient.18'|'Patient's Phone Number'|'CorrelationID'|\n" +
        "'EMSDataSet'|'element'|'ePatient.19'|'Patient's Email Address'|'EmailAddressType'|\n" +
        "'EMSDataSet'|'element'|'ePatient.19'|'Patient's Email Address'|'CorrelationID'|\n" +
        "'EMSDataSet'|'element'|'ePayment.01'|'Primary Method of Payment'|'NV'|\n" +
        "'EMSDataSet'|'element'|'ePayment.04'|'Reason for Physician Certification Statement'|'CorrelationID'|\n" +
        "'EMSDataSet'|'group'|'ePayment.InsuranceGroup'|''|'CorrelationID'|\n" +
        "'EMSDataSet'|'element'|'ePayment.12'|'Insurance Company Address'|'StreetAddress2'|\n" +
        "'EMSDataSet'|'element'|'ePayment.26'|'Closest Relative/ Guardian Street Address'|'StreetAddress2'|\n" +
        "'EMSDataSet'|'element'|'ePayment.31'|'Closest Relative/ Guardian Phone Number'|'PhoneNumberType'|\n" +
        "'EMSDataSet'|'element'|'ePayment.31'|'Closest Relative/ Guardian Phone Number'|'CorrelationID'|\n" +
        "'EMSDataSet'|'element'|'ePayment.34'|'Patient's Employer's Address'|'StreetAddress2'|\n" +
        "'EMSDataSet'|'element'|'ePayment.39'|'Patient's Employer's Primary Phone Number'|'PhoneNumberType'|\n" +
        "'EMSDataSet'|'element'|'ePayment.41'|'Patient Transport Assessment'|'CorrelationID'|\n" +
        "'EMSDataSet'|'element'|'ePayment.42'|'Specialty Care Transport Care Provider'|'CorrelationID'|\n" +
        "'EMSDataSet'|'element'|'ePayment.44'|'Ambulance Transport Reason Code'|'CorrelationID'|\n" +
        "'EMSDataSet'|'element'|'ePayment.47'|'Ambulance Conditions Indicator'|'CorrelationID'|\n" +
        "'EMSDataSet'|'element'|'ePayment.50'|'CMS Service Level'|'NV'|\n" +
        "'EMSDataSet'|'element'|'ePayment.51'|'EMS Condition Code'|'CorrelationID'|\n" +
        "'EMSDataSet'|'element'|'ePayment.52'|'CMS Transportation Indicator'|'CorrelationID'|\n" +
        "'EMSDataSet'|'group'|'ePayment.SupplyItemGroup'|''|'CorrelationID'|\n" +
        "'EMSDataSet'|'element'|'eScene.01'|'First EMS Unit on Scene'|'NV'|\n" +
        "'EMSDataSet'|'group'|'eScene.ResponderGroup'|''|'CorrelationID'|\n" +
        "'EMSDataSet'|'element'|'eScene.06'|'Number of Patients at Scene'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eScene.07'|'Mass Casualty Incident'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eScene.08'|'Triage Classification for MCI Patient'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eScene.09'|'Incident Location Type'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eScene.10'|'Incident Facility Code'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eScene.14'|'Mile Post or Major Roadway'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eScene.15'|'Incident Street Address'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eScene.15'|'Incident Street Address'|'StreetAddress2'|\n" +
        "'EMSDataSet'|'element'|'eScene.16'|'Incident Apartment, Suite, or Room'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eScene.17'|'Incident City'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eScene.18'|'Incident State'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eScene.19'|'Incident ZIP Code'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eScene.20'|'Scene Cross Street or Directions'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eScene.21'|'Incident County'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eSituation.01'|'Date/Time of Symptom Onset'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eSituation.02'|'Possible Injury'|'NV'|\n" +
        "'EMSDataSet'|'group'|'eSituation.PatientComplaintGroup'|''|'CorrelationID'|\n" +
        "'EMSDataSet'|'element'|'eSituation.03'|'Complaint Type'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eSituation.04'|'Complaint'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eSituation.05'|'Duration of Complaint'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eSituation.06'|'Time Units of Duration of Complaint'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eSituation.07'|'Chief Complaint Anatomic Location'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eSituation.08'|'Chief Complaint Organ System'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eSituation.09'|'Primary Symptom'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eSituation.10'|'Other Associated Symptoms'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eSituation.10'|'Other Associated Symptoms'|'CorrelationID'|\n" +
        "'EMSDataSet'|'element'|'eSituation.11'|'Provider's Primary Impression'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eSituation.12'|'Provider's Secondary Impressions'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eSituation.12'|'Provider's Secondary Impressions'|'CorrelationID'|\n" +
        "'EMSDataSet'|'element'|'eSituation.13'|'Initial Patient Acuity'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eSituation.14'|'Work-Related Illness/Injury'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eSituation.17'|'Patient Activity'|'CorrelationID'|\n" +
        "'EMSDataSet'|'element'|'eSituation.17'|'Patient Activity'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eInjury.01'|'Cause of Injury'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eInjury.01'|'Cause of Injury'|'CorrelationID'|\n" +
        "'EMSDataSet'|'element'|'eInjury.02'|'Mechanism of Injury'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eInjury.02'|'Mechanism of Injury'|'CorrelationID'|\n" +
        "'EMSDataSet'|'element'|'eInjury.03'|'Trauma Center Criteria'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eInjury.03'|'Trauma Center Criteria'|'CorrelationID'|\n" +
        "'EMSDataSet'|'element'|'eInjury.04'|'Vehicular, Pedestrian, or Other Injury Risk Factor'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eInjury.04'|'Vehicular, Pedestrian, or Other Injury Risk Factor'|'CorrelationID'|\n" +
        "'EMSDataSet'|'element'|'eInjury.07'|'Use of Occupant Safety Equipment'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eInjury.07'|'Use of Occupant Safety Equipment'|'CorrelationID'|\n" +
        "'EMSDataSet'|'element'|'eInjury.08'|'Airbag Deployment'|'CorrelationID'|\n" +
        "'EMSDataSet'|'element'|'eInjury.10'|'OSHA Personal Protective Equipment Used'|'CorrelationID'|\n" +
        "'EMSDataSet'|'element'|'eInjury.13'|'ACN Call Back Phone Number'|'PhoneNumberType'|\n" +
        "'EMSDataSet'|'element'|'eInjury.13'|'ACN Call Back Phone Number'|'CorrelationID'|\n" +
        "'EMSDataSet'|'element'|'eInjury.22'|'ACN Incident Delta Velocity'|'DeltaVelocityOrdinal'|\n" +
        "'EMSDataSet'|'element'|'eInjury.22'|'ACN Incident Delta Velocity'|'VelocityUnit'|\n" +
        "'EMSDataSet'|'element'|'eInjury.22'|'ACN Incident Delta Velocity'|'CorrelationID'|\n" +
        "'EMSDataSet'|'group'|'eInjury.SeatGroup'|''|'CorrelationID'|\n" +
        "'EMSDataSet'|'element'|'eArrest.01'|'Cardiac Arrest'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eArrest.02'|'Cardiac Arrest Etiology'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eArrest.03'|'Resuscitation Attempted By EMS'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eArrest.03'|'Resuscitation Attempted By EMS'|'CorrelationID'|\n" +
        "'EMSDataSet'|'element'|'eArrest.04'|'Arrest Witnessed By'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eArrest.04'|'Arrest Witnessed By'|'CorrelationID'|\n" +
        "'EMSDataSet'|'element'|'eArrest.05'|'CPR Care Provided Prior to EMS Arrival'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eArrest.06'|'Who Provided CPR Prior to EMS Arrival'|'CorrelationID'|\n" +
        "'EMSDataSet'|'element'|'eArrest.07'|'AED Use Prior to EMS Arrival'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eArrest.08'|'Who Used AED Prior to EMS Arrival'|'CorrelationID'|\n" +
        "'EMSDataSet'|'element'|'eArrest.09'|'Type of CPR Provided'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eArrest.09'|'Type of CPR Provided'|'CorrelationID'|\n" +
        "'EMSDataSet'|'element'|'eArrest.11'|'First Monitored Arrest Rhythm of the Patient'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eArrest.12'|'Any Return of Spontaneous Circulation'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eArrest.12'|'Any Return of Spontaneous Circulation'|'CorrelationID'|\n" +
        "'EMSDataSet'|'element'|'eArrest.14'|'Date/Time of Cardiac Arrest'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eArrest.15'|'Date/Time Resuscitation Discontinued'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eArrest.16'|'Reason CPR/Resuscitation Discontinued'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eArrest.17'|'Cardiac Rhythm on Arrival at Destination'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eArrest.17'|'Cardiac Rhythm on Arrival at Destination'|'CorrelationID'|\n" +
        "'EMSDataSet'|'element'|'eArrest.18'|'End of EMS Cardiac Arrest Event'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eHistory.01'|'Barriers to Patient Care'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eHistory.01'|'Barriers to Patient Care'|'CorrelationID'|\n" +
        "'EMSDataSet'|'group'|'eHistory.PractitionerGroup'|''|'CorrelationID'|\n" +
        "'EMSDataSet'|'element'|'eHistory.05'|'Advance Directives'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eHistory.05'|'Advance Directives'|'CorrelationID'|\n" +
        "'EMSDataSet'|'element'|'eHistory.06'|'Medication Allergies'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eHistory.06'|'Medication Allergies'|'PN'|\n" +
        "'EMSDataSet'|'element'|'eHistory.06'|'Medication Allergies'|'CodeType'|\n" +
        "'EMSDataSet'|'element'|'eHistory.06'|'Medication Allergies'|'CorrelationID'|\n" +
        "'EMSDataSet'|'element'|'eHistory.07'|'Environmental/Food Allergies'|'CorrelationID'|\n" +
        "'EMSDataSet'|'element'|'eHistory.08'|'Medical/Surgical History'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eHistory.08'|'Medical/Surgical History'|'PN'|\n" +
        "'EMSDataSet'|'element'|'eHistory.08'|'Medical/Surgical History'|'CorrelationID'|\n" +
        "'EMSDataSet'|'element'|'eHistory.09'|'Medical History Obtained From'|'CorrelationID'|\n" +
        "'EMSDataSet'|'group'|'eHistory.ImmunizationsGroup'|''|'CorrelationID'|\n" +
        "'EMSDataSet'|'group'|'eHistory.CurrentMedsGroup'|''|'CorrelationID'|\n" +
        "'EMSDataSet'|'element'|'eHistory.12'|'Current Medications'|'PN'|\n" +
        "'EMSDataSet'|'element'|'eHistory.12'|'Current Medications'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eHistory.17'|'Alcohol/Drug Use Indicators'|'PN'|\n" +
        "'EMSDataSet'|'element'|'eHistory.17'|'Alcohol/Drug Use Indicators'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eHistory.17'|'Alcohol/Drug Use Indicators'|'CorrelationID'|\n" +
        "'EMSDataSet'|'element'|'eHistory.18'|'Pregnancy'|'PN'|\n" +
        "'EMSDataSet'|'element'|'eNarrative.01'|'Patient Care Report Narrative'|'NV'|\n" +
        "'EMSDataSet'|'group'|'eVitals.VitalGroup'|''|'CorrelationID'|\n" +
        "'EMSDataSet'|'element'|'eVitals.01'|'Date/Time Vital Signs Taken'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eVitals.02'|'Obtained Prior to this Unit's EMS Care'|'NV'|\n" +
        "'EMSDataSet'|'group'|'eVitals.CardiacRhythmGroup'|''|'CorrelationID'|\n" +
        "'EMSDataSet'|'element'|'eVitals.03'|'Cardiac Rhythm / Electrocardiography (ECG)'|'PN'|\n" +
        "'EMSDataSet'|'element'|'eVitals.03'|'Cardiac Rhythm / Electrocardiography (ECG)'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eVitals.03'|'Cardiac Rhythm / Electrocardiography (ECG)'|'CorrelationID'|\n" +
        "'EMSDataSet'|'element'|'eVitals.04'|'ECG Type'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eVitals.05'|'Method of ECG Interpretation'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eVitals.05'|'Method of ECG Interpretation'|'CorrelationID'|\n" +
        "'EMSDataSet'|'element'|'eVitals.06'|'SBP (Systolic Blood Pressure)'|'PN'|\n" +
        "'EMSDataSet'|'element'|'eVitals.06'|'SBP (Systolic Blood Pressure)'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eVitals.07'|'DBP (Diastolic Blood Pressure)'|'PN'|\n" +
        "'EMSDataSet'|'element'|'eVitals.07'|'DBP (Diastolic Blood Pressure)'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eVitals.08'|'Method of Blood Pressure Measurement'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eVitals.10'|'Heart Rate'|'PN'|\n" +
        "'EMSDataSet'|'element'|'eVitals.10'|'Heart Rate'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eVitals.12'|'Pulse Oximetry'|'PN'|\n" +
        "'EMSDataSet'|'element'|'eVitals.12'|'Pulse Oximetry'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eVitals.14'|'Respiratory Rate'|'PN'|\n" +
        "'EMSDataSet'|'element'|'eVitals.14'|'Respiratory Rate'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eVitals.16'|'End Tidal Carbon Dioxide (ETCO2)'|'PN'|\n" +
        "'EMSDataSet'|'element'|'eVitals.16'|'End Tidal Carbon Dioxide (ETCO2)'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eVitals.17'|'Carbon Monoxide (CO)'|'PN'|\n" +
        "'EMSDataSet'|'element'|'eVitals.17'|'Carbon Monoxide (CO)'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eVitals.18'|'Blood Glucose Level'|'PN'|\n" +
        "'EMSDataSet'|'element'|'eVitals.18'|'Blood Glucose Level'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eVitals.19'|'Glasgow Coma Score-Eye'|'PN'|\n" +
        "'EMSDataSet'|'element'|'eVitals.19'|'Glasgow Coma Score-Eye'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eVitals.20'|'Glasgow Coma Score-Verbal'|'PN'|\n" +
        "'EMSDataSet'|'element'|'eVitals.20'|'Glasgow Coma Score-Verbal'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eVitals.21'|'Glasgow Coma Score-Motor'|'PN'|\n" +
        "'EMSDataSet'|'element'|'eVitals.21'|'Glasgow Coma Score-Motor'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eVitals.22'|'Glasgow Coma Score-Qualifier'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eVitals.22'|'Glasgow Coma Score-Qualifier'|'CorrelationID'|\n" +
        "'EMSDataSet'|'element'|'eVitals.23'|'Total Glasgow Coma Score'|'PN'|\n" +
        "'EMSDataSet'|'element'|'eVitals.23'|'Total Glasgow Coma Score'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eVitals.24'|'Temperature'|'PN'|\n" +
        "'EMSDataSet'|'element'|'eVitals.24'|'Temperature'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eVitals.26'|'Level of Responsiveness (AVPU)'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eVitals.27'|'Pain Scale Score'|'PN'|\n" +
        "'EMSDataSet'|'element'|'eVitals.27'|'Pain Scale Score'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eVitals.28'|'Pain Scale Type'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eVitals.29'|'Stroke Scale Score'|'PN'|\n" +
        "'EMSDataSet'|'element'|'eVitals.29'|'Stroke Scale Score'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eVitals.30'|'Stroke Scale Type'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eVitals.31'|'Reperfusion Checklist'|'PN'|\n" +
        "'EMSDataSet'|'element'|'eVitals.31'|'Reperfusion Checklist'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eVitals.32'|'APGAR'|'PN'|\n" +
        "'EMSDataSet'|'element'|'eVitals.33'|'Revised Trauma Score'|'PN'|\n" +
        "'EMSDataSet'|'group'|'eLabs.LabGroup'|''|'CorrelationID'|\n" +
        "'EMSDataSet'|'group'|'eLabs.LabResultGroup'|''|'CorrelationID'|\n" +
        "'EMSDataSet'|'group'|'eLabs.LabImageGroup'|''|'CorrelationID'|\n" +
        "'EMSDataSet'|'group'|'eLabs.WaveformGraphicGroup'|''|'CorrelationID'|\n" +
        "'EMSDataSet'|'element'|'eExam.01'|'Estimated Body Weight in Kilograms'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eExam.01'|'Estimated Body Weight in Kilograms'|'PN'|\n" +
        "'EMSDataSet'|'element'|'eExam.02'|'Length Based Tape Measure'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eExam.02'|'Length Based Tape Measure'|'PN'|\n" +
        "'EMSDataSet'|'group'|'eExam.AssessmentGroup'|''|'CorrelationID'|\n" +
        "'EMSDataSet'|'element'|'eExam.04'|'Skin Assessment'|'CorrelationID'|\n" +
        "'EMSDataSet'|'element'|'eExam.04'|'Skin Assessment'|'PN'|\n" +
        "'EMSDataSet'|'element'|'eExam.05'|'Head Assessment'|'CorrelationID'|\n" +
        "'EMSDataSet'|'element'|'eExam.05'|'Head Assessment'|'PN'|\n" +
        "'EMSDataSet'|'element'|'eExam.06'|'Face Assessment'|'CorrelationID'|\n" +
        "'EMSDataSet'|'element'|'eExam.06'|'Face Assessment'|'PN'|\n" +
        "'EMSDataSet'|'element'|'eExam.07'|'Neck Assessment'|'CorrelationID'|\n" +
        "'EMSDataSet'|'element'|'eExam.07'|'Neck Assessment'|'PN'|\n" +
        "'EMSDataSet'|'element'|'eExam.08'|'Chest/Lungs Assessment'|'CorrelationID'|\n" +
        "'EMSDataSet'|'element'|'eExam.08'|'Chest/Lungs Assessment'|'PN'|\n" +
        "'EMSDataSet'|'element'|'eExam.09'|'Heart Assessment'|'CorrelationID'|\n" +
        "'EMSDataSet'|'element'|'eExam.09'|'Heart Assessment'|'PN'|\n" +
        "'EMSDataSet'|'group'|'eExam.AbdomenGroup'|''|'CorrelationID'|\n" +
        "'EMSDataSet'|'element'|'eExam.11'|'Abdomen Assessment'|'CorrelationID'|\n" +
        "'EMSDataSet'|'element'|'eExam.11'|'Abdomen Assessment'|'PN'|\n" +
        "'EMSDataSet'|'element'|'eExam.12'|'Pelvis/Genitourinary Assessment'|'CorrelationID'|\n" +
        "'EMSDataSet'|'element'|'eExam.12'|'Pelvis/Genitourinary Assessment'|'PN'|\n" +
        "'EMSDataSet'|'group'|'eExam.SpineGroup'|''|'CorrelationID'|\n" +
        "'EMSDataSet'|'element'|'eExam.14'|'Back and Spine Assessment'|'CorrelationID'|\n" +
        "'EMSDataSet'|'element'|'eExam.14'|'Back and Spine Assessment'|'PN'|\n" +
        "'EMSDataSet'|'group'|'eExam.ExtremityGroup'|''|'CorrelationID'|\n" +
        "'EMSDataSet'|'element'|'eExam.16'|'Extremities Assessment'|'CorrelationID'|\n" +
        "'EMSDataSet'|'element'|'eExam.16'|'Extremities Assessment'|'PN'|\n" +
        "'EMSDataSet'|'group'|'eExam.EyeGroup'|''|'CorrelationID'|\n" +
        "'EMSDataSet'|'element'|'eExam.18'|'Eye Assessment'|'CorrelationID'|\n" +
        "'EMSDataSet'|'element'|'eExam.18'|'Eye Assessment'|'PN'|\n" +
        "'EMSDataSet'|'element'|'eExam.19'|'Mental Status Assessment'|'CorrelationID'|\n" +
        "'EMSDataSet'|'element'|'eExam.19'|'Mental Status Assessment'|'PN'|\n" +
        "'EMSDataSet'|'element'|'eExam.20'|'Neurological Assessment'|'CorrelationID'|\n" +
        "'EMSDataSet'|'element'|'eExam.20'|'Neurological Assessment'|'PN'|\n" +
        "'EMSDataSet'|'element'|'eExam.21'|'Stroke/CVA Symptoms Resolved'|'PN'|\n" +
        "'EMSDataSet'|'element'|'eExam.21'|'Stroke/CVA Symptoms Resolved'|'NV'|\n" +
        "'EMSDataSet'|'group'|'eProtocols.ProtocolGroup'|''|'CorrelationID'|\n" +
        "'EMSDataSet'|'element'|'eProtocols.01'|'Protocols Used'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eProtocols.02'|'Protocol Age Category'|'NV'|\n" +
        "'EMSDataSet'|'group'|'eMedications.MedicationGroup'|''|'CorrelationID'|\n" +
        "'EMSDataSet'|'element'|'eMedications.01'|'Date/Time Medication Administered'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eMedications.02'|'Medication Administered Prior to this Unit's EMS Care'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eMedications.03'|'Medication Given'|'PN'|\n" +
        "'EMSDataSet'|'element'|'eMedications.03'|'Medication Given'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eMedications.05'|'Medication Dosage'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eMedications.06'|'Medication Dosage Units'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eMedications.07'|'Response to Medication'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eMedications.08'|'Medication Complication'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eMedications.08'|'Medication Complication'|'CorrelationID'|\n" +
        "'EMSDataSet'|'element'|'eMedications.09'|'Medication Crew (Healthcare Professionals) ID'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eMedications.10'|'Role/Type of Person Administering Medication'|'NV'|\n" +
        "'EMSDataSet'|'group'|'eProcedures.ProcedureGroup'|''|'CorrelationID'|\n" +
        "'EMSDataSet'|'element'|'eProcedures.01'|'Date/Time Procedure Performed'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eProcedures.02'|'Procedure Performed Prior to this Unit's EMS Care'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eProcedures.03'|'Procedure'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eProcedures.03'|'Procedure'|'PN'|\n" +
        "'EMSDataSet'|'element'|'eProcedures.05'|'Number of Procedure Attempts'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eProcedures.06'|'Procedure Successful'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eProcedures.07'|'Procedure Complication'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eProcedures.07'|'Procedure Complication'|'CorrelationID'|\n" +
        "'EMSDataSet'|'element'|'eProcedures.08'|'Response to Procedure'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eProcedures.09'|'Procedure Crew Members ID'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eProcedures.10'|'Role/Type of Person Performing the Procedure'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eProcedures.13'|'Vascular Access Location'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eAirway.01'|'Indications for Invasive Airway'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eAirway.01'|'Indications for Invasive Airway'|'CorrelationID'|\n" +
        "'EMSDataSet'|'group'|'eAirway.ConfirmationGroup'|''|'CorrelationID'|\n" +
        "'EMSDataSet'|'group'|'eAirway.ConfirmationGroup'|''|'ProcedureGroupCorrelationID'|\n" +
        "'EMSDataSet'|'element'|'eAirway.02'|'Date/Time Airway Device Placement Confirmation'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eAirway.03'|'Airway Device Being Confirmed'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eAirway.04'|'Airway Device Placement Confirmed Method'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eAirway.06'|'Type of Individual Confirming Airway Device Placement'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eAirway.07'|'Crew Member ID'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eAirway.08'|'Airway Complications Encountered'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eAirway.08'|'Airway Complications Encountered'|'CorrelationID'|\n" +
        "'EMSDataSet'|'element'|'eAirway.09'|'Suspected Reasons for Failed Airway Management'|'CorrelationID'|\n" +
        "'EMSDataSet'|'group'|'eDevice.DeviceGroup'|''|'CorrelationID'|\n" +
        "'EMSDataSet'|'element'|'eDevice.03'|'Medical Device Event Type'|'CorrelationID'|\n" +
        "'EMSDataSet'|'element'|'eDevice.07'|'Medical Device ECG Lead'|'CorrelationID'|\n" +
        "'EMSDataSet'|'element'|'eDisposition.01'|'Destination/Transferred To, Name'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eDisposition.02'|'Destination/Transferred To, Code'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eDisposition.03'|'Destination Street Address'|'StreetAddress2'|\n" +
        "'EMSDataSet'|'element'|'eDisposition.05'|'Destination State'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eDisposition.06'|'Destination County'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eDisposition.07'|'Destination ZIP Code'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eDisposition.11'|'Number of Patients Transported in this EMS Unit'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eDisposition.13'|'How Patient Was Moved to Ambulance'|'CorrelationID'|\n" +
        "'EMSDataSet'|'element'|'eDisposition.14'|'Position of Patient During Transport'|'CorrelationID'|\n" +
        "'EMSDataSet'|'element'|'eDisposition.16'|'EMS Transport Method'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eDisposition.17'|'Transport Mode from Scene'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eDisposition.18'|'Additional Transport Mode Descriptors'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eDisposition.18'|'Additional Transport Mode Descriptors'|'CorrelationID'|\n" +
        "'EMSDataSet'|'element'|'eDisposition.19'|'Final Patient Acuity'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eDisposition.20'|'Reason for Choosing Destination'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eDisposition.20'|'Reason for Choosing Destination'|'CorrelationID'|\n" +
        "'EMSDataSet'|'element'|'eDisposition.21'|'Type of Destination'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eDisposition.22'|'Hospital In-Patient Destination'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eDisposition.23'|'Hospital Capability'|'NV'|\n" +
        "'EMSDataSet'|'group'|'eDisposition.HospitalTeamActivationGroup'|''|'CorrelationID'|\n" +
        "'EMSDataSet'|'element'|'eDisposition.24'|'Destination Team Pre-Arrival Alert or Activation'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eDisposition.25'|'Date/Time of Destination Prearrival Alert or Activation'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eDisposition.26'|'Disposition Instructions Provided'|'CorrelationID'|\n" +
        "'EMSDataSet'|'element'|'eOutcome.01'|'Emergency Department Disposition'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eOutcome.02'|'Hospital Disposition'|'NV'|\n" +
        "'EMSDataSet'|'group'|'eOutcome.ExternalDataGroup'|''|'CorrelationID'|\n" +
        "'EMSDataSet'|'element'|'eOutcome.09'|'Emergency Department Procedures'|'CorrelationID'|\n" +
        "'EMSDataSet'|'element'|'eOutcome.10'|'Emergency Department Diagnosis'|'CorrelationID'|\n" +
        "'EMSDataSet'|'element'|'eOutcome.12'|'Hospital Procedures'|'CorrelationID'|\n" +
        "'EMSDataSet'|'element'|'eOutcome.13'|'Hospital Diagnosis'|'CorrelationID'|\n" +
        "'EMSDataSet'|'group'|'eCustomResults.ResultsGroup'|''|'CorrelationID'|\n" +
        "'EMSDataSet'|'element'|'eCustomResults.01'|'Custom Data Element Result'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eCustomResults.01'|'Custom Data Element Result'|'PN'|\n" +
        "'EMSDataSet'|'element'|'eOther.02'|'Potential System of Care/Specialty/Registry Patient'|'CorrelationID'|\n" +
        "'EMSDataSet'|'group'|'eOther.EMSCrewMemberGroup'|''|'CorrelationID'|\n" +
        "'EMSDataSet'|'element'|'eOther.03'|'Personal Protective Equipment Used'|'CorrelationID'|\n" +
        "'EMSDataSet'|'element'|'eOther.05'|'Suspected EMS Work Related Exposure, Injury, or Death'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eOther.06'|'The Type of Work-Related Injury, Death or Suspected Exposure'|'NV'|\n" +
        "'EMSDataSet'|'element'|'eOther.06'|'The Type of Work-Related Injury, Death or Suspected Exposure'|'CorrelationID'|\n" +
        "'EMSDataSet'|'element'|'eOther.07'|'Natural, Suspected, Intentional, or Unintentional Disaster'|'CorrelationID'|\n" +
        "'EMSDataSet'|'element'|'eOther.08'|'Crew Member Completing this Report'|'NV'|\n" +
        "'EMSDataSet'|'group'|'eOther.FileGroup'|''|'CorrelationID'|\n" +
        "'EMSDataSet'|'group'|'eOther.SignatureGroup'|''|'CorrelationID'|";
}