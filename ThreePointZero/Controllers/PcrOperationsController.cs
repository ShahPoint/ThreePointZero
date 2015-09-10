using System;
using System.Collections.Generic;
using System.IO;
using System.Web.Http;
using System.Xml;
using System.Xml.Linq;
using ThreePointZero.Classes;
using Newtonsoft.Json;

namespace ThreePointZero.Controllers
{
    public class PcrOperationsController : ApiController
    {
        private static string samplexml =
        #region xml
 @"<EMSDataSet xmlns:xsi=""http://www.w3.org/2001/XMLSchema-instance"" xsi:schemaLocation=""http://www.nemsis.org http://nemsis.org/media/nemsis_v3/release-3.4.0/XSDs/NEMSIS_XSDs/EMSDataSet_v3.xsd"" xmlns=""http://www.nemsis.org"">
    <eState>
        <eState.01></eState.01>
    </eState>
    <Header>
        <DemographicGroup>
            <dAgency.01></dAgency.01>
            <dAgency.02></dAgency.02>
            <dAgency.04></dAgency.04>
        </DemographicGroup>

        <eCustomConfiguration>
			      <eCustomConfiguration.CustomGroup>
				        <eCustomConfiguration.01></eCustomConfiguration.01>
				        <eCustomConfiguration.02></eCustomConfiguration.02>
				        <eCustomConfiguration.03></eCustomConfiguration.03>
				        <eCustomConfiguration.04></eCustomConfiguration.04>
				        <eCustomConfiguration.05></eCustomConfiguration.05>
				        <eCustomConfiguration.06></eCustomConfiguration.06>
				        <eCustomConfiguration.07></eCustomConfiguration.07>
				        <eCustomConfiguration.08></eCustomConfiguration.08>
				        <eCustomConfiguration.09></eCustomConfiguration.09>
			      </eCustomConfiguration.CustomGroup>
		    </eCustomConfiguration>

        <PatientCareReport>
            <eRecord>
                <eRecord.01></eRecord.01>
                <eRecord.SoftwareApplicationGroup>
                    <eRecord.02></eRecord.02>
                    <eRecord.03></eRecord.03>
                    <eRecord.04></eRecord.04>
                </eRecord.SoftwareApplicationGroup>
            </eRecord>
          
            <eResponse>
                <eResponse.AgencyGroup>
                    <eResponse.01></eResponse.01>
                    <eResponse.02></eResponse.02>
                </eResponse.AgencyGroup>
              
                <eResponse.03></eResponse.03>
                <eResponse.04></eResponse.04>
              
                <eResponse.ServiceGroup>
                    <eResponse.05></eResponse.05>
                    <eResponse.06></eResponse.06>
                </eResponse.ServiceGroup>
              
                <eResponse.07></eResponse.07>
                <eResponse.08></eResponse.08>
                <eResponse.09></eResponse.09>
                <eResponse.10></eResponse.10>
                <eResponse.11></eResponse.11>
                <eResponse.12></eResponse.12>
                <eResponse.13></eResponse.13>
                <eResponse.14></eResponse.14>
                <eResponse.15></eResponse.15>
                <eResponse.16></eResponse.16>
                <eResponse.17></eResponse.17>
                <eResponse.18></eResponse.18>
                <eResponse.19></eResponse.19>
                <eResponse.20></eResponse.20>
                <eResponse.21></eResponse.21>
                <eResponse.22></eResponse.22>
                <eResponse.23></eResponse.23>
                <eResponse.24></eResponse.24>
            </eResponse>
          
            <eDispatch>
                <eDispatch.01></eDispatch.01>
                <eDispatch.02></eDispatch.02>
                <eDispatch.03></eDispatch.03>
                <eDispatch.04></eDispatch.04>
                <eDispatch.05></eDispatch.05>
                <eDispatch.06></eDispatch.06>
            </eDispatch>
          
            <eCrew>
                <eCrew.CrewGroup>
                    <eCrew.01></eCrew.01>
                    <eCrew.02></eCrew.02>
                    <eCrew.03></eCrew.03>
                </eCrew.CrewGroup>
            </eCrew>
          
            <eTimes>
                <eTimes.01></eTimes.01>
                <eTimes.02></eTimes.02>
                <eTimes.03></eTimes.03>
                <eTimes.04></eTimes.04>
                <eTimes.05></eTimes.05>
                <eTimes.06></eTimes.06>
                <eTimes.07></eTimes.07>
                <eTimes.08></eTimes.08>
                <eTimes.09></eTimes.09>
                <eTimes.10></eTimes.10>
                <eTimes.11></eTimes.11>
                <eTimes.12></eTimes.12>
                <eTimes.13></eTimes.13>
                <eTimes.14></eTimes.14>
                <eTimes.15></eTimes.15>
                <eTimes.16></eTimes.16>
            </eTimes>
          
            <ePatient>
                <ePatient.01></ePatient.01>
                  
                <ePatient.PatientNameGroup>
                    <ePatient.02></ePatient.02>
                    <ePatient.03></ePatient.03>
                    <ePatient.04></ePatient.04>
                </ePatient.PatientNameGroup>
            
                <ePatient.05></ePatient.05>
                <ePatient.06></ePatient.06>
                <ePatient.07></ePatient.07>
                <ePatient.08></ePatient.08>
                <ePatient.09></ePatient.09>
                <ePatient.10></ePatient.10>
                <ePatient.11></ePatient.11>
                <ePatient.12></ePatient.12>
                <ePatient.13></ePatient.13>
                <ePatient.14></ePatient.14>
              
                <ePatient.AgeGroup>
                    <ePatient.15></ePatient.15>
                    <ePatient.16></ePatient.16>
                </ePatient.AgeGroup>
              
                <ePatient.17></ePatient.17>
                <ePatient.18></ePatient.18>
                <ePatient.19></ePatient.19>
                <ePatient.20></ePatient.20>
                <ePatient.21></ePatient.21>
            </ePatient>
          
            <ePayment>
                <ePayment.01></ePayment.01>
              
                <ePayment.CertificateGroup>
                    <ePayment.02></ePayment.02>
                    <ePayment.03></ePayment.03>
                    <ePayment.04></ePayment.04>
                    <ePayment.05></ePayment.05>
                    <ePayment.06></ePayment.06>
                    <ePayment.07></ePayment.07>
                </ePayment.CertificateGroup>
              
                <ePayment.08></ePayment.08>
                
                <ePayment.InsuranceGroup>
                    <ePayment.09></ePayment.09>
                    <ePayment.10></ePayment.10>
                    <ePayment.11></ePayment.11>
                    <ePayment.12></ePayment.12>
                    <ePayment.13></ePayment.13>
                    <ePayment.14></ePayment.14>
                    <ePayment.15></ePayment.15>
                    <ePayment.16></ePayment.16>
                    <ePayment.17></ePayment.17>
                    <ePayment.18></ePayment.18>
                    <ePayment.19></ePayment.19>
                    <ePayment.20></ePayment.20>
                    <ePayment.21></ePayment.21>
                    <ePayment.22></ePayment.22>
                    <ePayment.58></ePayment.58>
                </ePayment.InsuranceGroup>
              
                <ePayment.ClosestRelativeGroup>
                    <ePayment.23></ePayment.23>
                    <ePayment.24></ePayment.24>
                    <ePayment.25></ePayment.25>
                    <ePayment.26></ePayment.26>
                    <ePayment.27></ePayment.27>
                    <ePayment.28></ePayment.28>
                    <ePayment.29></ePayment.29>
                    <ePayment.30></ePayment.30>
                    <ePayment.31></ePayment.31>
                    <ePayment.32></ePayment.32>
                </ePayment.ClosestRelativeGroup>
              
                <ePayment.EmployerGroup>
                    <ePayment.33></ePayment.33>
                    <ePayment.34></ePayment.34>
                    <ePayment.35></ePayment.35>
                    <ePayment.36></ePayment.36>
                    <ePayment.37></ePayment.37>
                    <ePayment.38></ePayment.38>
                    <ePayment.39></ePayment.39>
                </ePayment.EmployerGroup>
              
                <ePayment.40></ePayment.40>
                <ePayment.41></ePayment.41>
                <ePayment.42></ePayment.42>
                <ePayment.44></ePayment.44>
                <ePayment.45></ePayment.45>
                <ePayment.46></ePayment.46>
                <ePayment.47></ePayment.47>
                <ePayment.48></ePayment.48>
                <ePayment.49></ePayment.49>
                <ePayment.50></ePayment.50>
                <ePayment.51></ePayment.51>
                <ePayment.52></ePayment.52>
                <ePayment.53></ePayment.53>
                <ePayment.54></ePayment.54>
              
                <ePayment.SupplyItemGroup>
                    <ePayment.55></ePayment.55>
                    <ePayment.56></ePayment.56>
                </ePayment.SupplyItemGroup>
              
                <ePayment.57></ePayment.57>
            </ePayment>
          
            <eScene>
                <eScene.01></eScene.01>
              
                <eScene.ResponderGroup>
                    <eScene.02></eScene.02>
                    <eScene.03></eScene.03>
                    <eScene.04></eScene.04>
                </eScene.ResponderGroup>
              
                <eScene.05></eScene.05>
                <eScene.06></eScene.06>
                <eScene.07></eScene.07>
                <eScene.08></eScene.08>
                <eScene.09></eScene.09>
                <eScene.10></eScene.10>
                <eScene.11></eScene.11>
                <eScene.12></eScene.12>
                <eScene.13></eScene.13>
                <eScene.14></eScene.14>
                <eScene.15></eScene.15>
                <eScene.16></eScene.16>
                <eScene.17></eScene.17>
                <eScene.18></eScene.18>
                <eScene.19></eScene.19>
                <eScene.20></eScene.20>
                <eScene.21></eScene.21>
                <eScene.22></eScene.22>
                <eScene.23></eScene.23>
            </eScene>
          
            <eSituation>
                <eSituation.01></eSituation.01>
                <eSituation.02></eSituation.02>
              
                <eSituation.PatientComplaintGroup>
                    <eSituation.03></eSituation.03>
                    <eSituation.04></eSituation.04>
                    <eSituation.05></eSituation.05>
                    <eSituation.06></eSituation.06>
                </eSituation.PatientComplaintGroup>
              
                <eSituation.07></eSituation.07>
                <eSituation.08></eSituation.08>
                <eSituation.09></eSituation.09>
                <eSituation.10></eSituation.10>
                <eSituation.11></eSituation.11>
                <eSituation.12></eSituation.12>
                <eSituation.13></eSituation.13>
              
                <eSituation.WorkRelatedGroup>
                    <eSituation.14></eSituation.14>
                    <eSituation.15></eSituation.15>
                    <eSituation.16></eSituation.16>
                </eSituation.WorkRelatedGroup>
              
                <eSituation.17></eSituation.17>
                <eSituation.18></eSituation.18>
            </eSituation>
                  
            <eInjury>
                <eInjury.01></eInjury.01>
                <eInjury.02></eInjury.02>
                <eInjury.03></eInjury.03>
                <eInjury.04></eInjury.04>
                <eInjury.05></eInjury.05>
                <eInjury.06></eInjury.06>
                <eInjury.07></eInjury.07>
                <eInjury.08></eInjury.08>
                <eInjury.09></eInjury.09>
                <eInjury.10></eInjury.10>
              
                <eInjury.CollisionGroup>
                    <eInjury.11></eInjury.11>
                    <eInjury.12></eInjury.12>
                    <eInjury.13></eInjury.13>
                    <eInjury.14></eInjury.14>
                    <eInjury.15></eInjury.15>
                    <eInjury.16></eInjury.16>
                    <eInjury.17></eInjury.17>
                    <eInjury.18></eInjury.18>
                    <eInjury.19></eInjury.19>
                    <eInjury.20></eInjury.20>
                    <eInjury.21></eInjury.21>
                    <eInjury.22></eInjury.22>
                    <eInjury.23></eInjury.23>
                    <eInjury.24></eInjury.24>
                    <eInjury.25></eInjury.25>
                  
                    <eInjury.SeatGroup>
                        <eInjury.26></eInjury.26>
                        <eInjury.27></eInjury.27>
                        <eInjury.28></eInjury.28>
                        <eInjury.29></eInjury.29>
                    </eInjury.SeatGroup>
                </eInjury.CollisionGroup>
            </eInjury>
          
            <eArrest>
                <eArrest.01></eArrest.01>
                <eArrest.02></eArrest.02>
                <eArrest.03></eArrest.03>
                <eArrest.04></eArrest.04>
                <eArrest.05></eArrest.05>
                <eArrest.06></eArrest.06>
                <eArrest.07></eArrest.07>
                <eArrest.08></eArrest.08>
                <eArrest.09></eArrest.09>
                <eArrest.11></eArrest.11>
                <eArrest.12></eArrest.12>
                <eArrest.13></eArrest.13>
                <eArrest.14></eArrest.14>
                <eArrest.15></eArrest.15>
                <eArrest.16></eArrest.16>
                <eArrest.17></eArrest.17>
                <eArrest.18></eArrest.18>
                <eArrest.19></eArrest.19>
            </eArrest>
          
            <eHistory>
                <eHistory.01></eHistory.01>
              
                <eHistory.PractitionerGroup>
                    <eHistory.02></eHistory.02>
                    <eHistory.03></eHistory.03>
                    <eHistory.04></eHistory.04>
                </eHistory.PractitionerGroup>
              
                <eHistory.05></eHistory.05>
                <eHistory.06></eHistory.06>
                <eHistory.07></eHistory.07>
                <eHistory.08></eHistory.08>
                <eHistory.09></eHistory.09>
              
                <eHistory.ImmunizationsGroup>
                    <eHistory.10></eHistory.10>
                    <eHistory.11></eHistory.11>
                </eHistory.ImmunizationsGroup>
                  
                <eHistory.CurrentMedsGroup>
                    <eHistory.12></eHistory.12>
                    <eHistory.13></eHistory.13>
                    <eHistory.14></eHistory.14>
                    <eHistory.15></eHistory.15>
                </eHistory.CurrentMedsGroup>
              
                <eHistory.16></eHistory.16>
                <eHistory.17></eHistory.17>
                <eHistory.18></eHistory.18>
                <eHistory.19></eHistory.19>
            </eHistory>
          
            <eNarrative>
                <eNarrative.01></eNarrative.01>
            </eNarrative>
          
            <eVitals>
                <eVitals.VitalGroup>
                    <eVitals.01></eVitals.01>
                    <eVitals.02></eVitals.02>
                  
                    <eVitals.CardiacRhythmGroup>
                        <eVitals.03></eVitals.03>
                        <eVitals.04></eVitals.04>
                        <eVitals.05></eVitals.05>
                    </eVitals.CardiacRhythmGroup>
                  
                    <eVitals.BloodPressureGroup>
                        <eVitals.06></eVitals.06>
                        <eVitals.07></eVitals.07>
                        <eVitals.08></eVitals.08>
                        <eVitals.09></eVitals.09>
                    </eVitals.BloodPressureGroup>
                  
                    <eVitals.HeartRateGroup>
                        <eVitals.10></eVitals.10>
                        <eVitals.11></eVitals.11>
                    </eVitals.HeartRateGroup>
                  
                    <eVitals.12></eVitals.12>
                    <eVitals.13></eVitals.13>
                    <eVitals.14></eVitals.14>
                    <eVitals.15></eVitals.15>
                    <eVitals.16></eVitals.16>
                    <eVitals.17></eVitals.17>
                    <eVitals.18></eVitals.18>
                  
                    <eVitals.GlasgowScoreGroup>
                        <eVitals.19></eVitals.19>
                        <eVitals.20></eVitals.20>
                        <eVitals.21></eVitals.21>
                        <eVitals.22></eVitals.22>
                        <eVitals.23></eVitals.23>
                    </eVitals.GlasgowScoreGroup>
                  
                    <eVitals.TemperatureGroup>
                        <eVitals.24></eVitals.24>
                        <eVitals.25></eVitals.25>
                    </eVitals.TemperatureGroup>
                  
                    <eVitals.26></eVitals.26>
                  
                    <eVitals.PainScaleGroup>
                        <eVitals.27></eVitals.27>
                        <eVitals.28></eVitals.28>
                    </eVitals.PainScaleGroup>
                  
                    <eVitals.StrokeScaleGroup>
                        <eVitals.29></eVitals.29>
                        <eVitals.30></eVitals.30>
                    </eVitals.StrokeScaleGroup>
                  
                    <eVitals.31></eVitals.31>
                    <eVitals.32></eVitals.32>
                    <eVitals.33></eVitals.33>
                </eVitals.VitalGroup>
            </eVitals>
          
            <eLabs>
                <eLabs.LabGroup>
                    <eLabs.01></eLabs.01>
                    <eLabs.02></eLabs.02>
                  
                    <eLabs.LabResultGroup>
                        <eLabs.03></eLabs.03>
                        <eLabs.04></eLabs.04>
                    </eLabs.LabResultGroup>
                      
                    <eLabs.LabImageGroup>
                        <eLabs.05></eLabs.05>
                        <eLabs.06></eLabs.06>
                      
                        <eLabs.WaveformGraphicGroup>
                            <eLabs.07></eLabs.07>
                            <eLabs.08></eLabs.08>
                        </eLabs.WaveformGraphicGroup>
                    </eLabs.LabImageGroup>
                </eLabs.LabGroup>
            </eLabs>
          
            <eExam>
                <eExam.01></eExam.01>
                <eExam.02></eExam.02>
              
                <eExam.AssessmentGroup>
                    <eExam.03></eExam.03>
                    <eExam.04></eExam.04>
                    <eExam.05></eExam.05>
                    <eExam.06></eExam.06>
                    <eExam.07></eExam.07>
                    <eExam.08></eExam.08>
                    <eExam.09></eExam.09>
                  
                    <eExam.AbdomenGroup>
                        <eExam.10></eExam.10>
                        <eExam.11></eExam.11>
                    </eExam.AbdomenGroup>
                  
                    <eExam.12></eExam.12>
                  
                    <eExam.SpineGroup>
                        <eExam.13></eExam.13>
                        <eExam.14></eExam.14>
                    </eExam.SpineGroup>
                  
                    <eExam.ExtremityGroup>
                        <eExam.15></eExam.15>
                        <eExam.16></eExam.16>
                    </eExam.ExtremityGroup>
                  
                    <eExam.EyeGroup>
                        <eExam.17></eExam.17>
                        <eExam.18></eExam.18>
                    </eExam.EyeGroup>
                  
                    <eExam.19></eExam.19>
                    <eExam.20></eExam.20>
                </eExam.AssessmentGroup>
              
                <eExam.21></eExam.21>
            </eExam>
          
            <eProtocols>
                <eProtocols.ProtocolGroup>
                    <eProtocols.01></eProtocols.01>
                    <eProtocols.02></eProtocols.02>
                </eProtocols.ProtocolGroup>
            </eProtocols>
          
            <eMedications>
                <eMedications.MedicationGroup>
                    <eMedications.01></eMedications.01>
                    <eMedications.02></eMedications.02>
                    <eMedications.03></eMedications.03>
                    <eMedications.04></eMedications.04>
                  
                    <eMedications.DosageGroup>
                        <eMedications.05></eMedications.05>
                        <eMedications.06></eMedications.06>
                    </eMedications.DosageGroup>
                  
                    <eMedications.07></eMedications.07>
                    <eMedications.08></eMedications.08>
                    <eMedications.09></eMedications.09>
                    <eMedications.10></eMedications.10>
                    <eMedications.11></eMedications.11>
                    <eMedications.12></eMedications.12>
                </eMedications.MedicationGroup>
            </eMedications>
          
            <eProcedures>
                <eProcedures.ProcedureGroup>
                    <eProcedures.01></eProcedures.01>
                    <eProcedures.02></eProcedures.02>
                    <eProcedures.03></eProcedures.03>
                    <eProcedures.04></eProcedures.04>
                    <eProcedures.05></eProcedures.05>
                    <eProcedures.06></eProcedures.06>
                    <eProcedures.07></eProcedures.07>
                    <eProcedures.08></eProcedures.08>
                    <eProcedures.09></eProcedures.09>
                    <eProcedures.10></eProcedures.10>
                    <eProcedures.11></eProcedures.11>
                    <eProcedures.12></eProcedures.12>
                    <eProcedures.13></eProcedures.13>
                </eProcedures.ProcedureGroup>
            </eProcedures>
          
            <eAirway>
                <eAirway.AirwayGroup>
                    <eAirway.01></eAirway.01>
                  
                    <eAirway.ConfirmationGroup>
                        <eAirway.02></eAirway.02>
                        <eAirway.03></eAirway.03>
                        <eAirway.04></eAirway.04>
                        <eAirway.05></eAirway.05>
                        <eAirway.06></eAirway.06>
                        <eAirway.07></eAirway.07>
                    </eAirway.ConfirmationGroup>
                  
                    <eAirway.08></eAirway.08>
                    <eAirway.09></eAirway.09>
                    <eAirway.10></eAirway.10>
                    <eAirway.11></eAirway.11>
                </eAirway.AirwayGroup>
            </eAirway>
          
            <eDevice>
                <eDevice.DeviceGroup>
                    <eDevice.01></eDevice.01>
                    <eDevice.02></eDevice.02>
                    <eDevice.03></eDevice.03>
                  
                    <eDevice.WaveformGroup>
                        <eDevice.04></eDevice.04>
                        <eDevice.05></eDevice.05>
                        <eDevice.06></eDevice.06>
                    </eDevice.WaveformGroup>
                  
                    <eDevice.07></eDevice.07>
                    <eDevice.08></eDevice.08>
                      
                    <eDevice.ShockGroup>
                        <eDevice.09></eDevice.09>
                        <eDevice.10></eDevice.10>
                        <eDevice.11></eDevice.11>
                        <eDevice.12></eDevice.12>
                    </eDevice.ShockGroup>
                </eDevice.DeviceGroup>
            </eDevice>
          
            <eDisposition>
                <eDisposition.DestinationGroup>
                    <eDisposition.01></eDisposition.01>
                    <eDisposition.02></eDisposition.02>
                    <eDisposition.03></eDisposition.03>
                    <eDisposition.04></eDisposition.04>
                    <eDisposition.05></eDisposition.05>
                    <eDisposition.06></eDisposition.06>
                    <eDisposition.07></eDisposition.07>
                    <eDisposition.08></eDisposition.08>
                    <eDisposition.09></eDisposition.09>
                    <eDisposition.10></eDisposition.10>
                </eDisposition.DestinationGroup>
              
                <eDisposition.11></eDisposition.11>
                <eDisposition.12></eDisposition.12>
                <eDisposition.13></eDisposition.13>
                <eDisposition.14></eDisposition.14>
                <eDisposition.15></eDisposition.15>
                <eDisposition.16></eDisposition.16>
                <eDisposition.17></eDisposition.17>
                <eDisposition.18></eDisposition.18>
                <eDisposition.19></eDisposition.19>
                <eDisposition.20></eDisposition.20>
                <eDisposition.21></eDisposition.21>
                <eDisposition.22></eDisposition.22>
                <eDisposition.23></eDisposition.23>
                  
                <eDisposition.HospitalTeamActivationGroup>
                    <eDisposition.24></eDisposition.24>
                    <eDisposition.25></eDisposition.25>
                </eDisposition.HospitalTeamActivationGroup>
              
                <eDisposition.26></eDisposition.26>
            </eDisposition>
          
            <eOutcome>
                <eOutcome.01></eOutcome.01>
                <eOutcome.02></eOutcome.02>
              
                <eOutcome.ExternalDataGroup>
                    <eOutcome.03></eOutcome.03>
                    <eOutcome.04></eOutcome.04>
                    <eOutcome.05></eOutcome.05>
                </eOutcome.ExternalDataGroup>
              
                <eOutcome.06></eOutcome.06>
                <eOutcome.07></eOutcome.07>
                <eOutcome.08></eOutcome.08>
                <eOutcome.09></eOutcome.09>
                <eOutcome.10></eOutcome.10>
                <eOutcome.11></eOutcome.11>
                <eOutcome.12></eOutcome.12>
                <eOutcome.13></eOutcome.13>
                <eOutcome.14></eOutcome.14>
                <eOutcome.15></eOutcome.15>
                <eOutcome.16></eOutcome.16>
                <eOutcome.17></eOutcome.17>
            </eOutcome>
          
            <eCustomResults>
				<eCustomResults.ResultsGroup>
					 <eCustomResults.01></eCustomResults.01>
					 <eCustomResults.02></eCustomResults.02>
					 <eCustomResults.03></eCustomResults.03>
			    </eCustomResults.ResultsGroup>
			</eCustomResults>
          
            <eOther>
                <eOther.01></eOther.01>
                <eOther.02></eOther.02>
              
                <eOther.EMSCrewMemberGroup>
                    <eOther.03></eOther.03>
                    <eOther.04></eOther.04>
                    <eOther.05></eOther.05>
                    <eOther.06></eOther.06>
                </eOther.EMSCrewMemberGroup>
              
                <eOther.07></eOther.07>
                <eOther.08></eOther.08>
              
                <eOther.FileGroup>
                    <eOther.09></eOther.09>
                    <eOther.10></eOther.10>
                    <eOther.11></eOther.11>
                </eOther.FileGroup>
                  
                <eOther.SignatureGroup>
                    <eOther.12></eOther.12>
                    <eOther.13></eOther.13>
                    <eOther.14></eOther.14>
                    <eOther.15></eOther.15>
                    <eOther.16></eOther.16>
                    <eOther.17></eOther.17>
                    <eOther.18></eOther.18>
                    <eOther.19></eOther.19>
                    <eOther.20></eOther.20>
                    <eOther.21></eOther.21>
                </eOther.SignatureGroup>
            </eOther>
        </PatientCareReport>
    </Header>
</EMSDataSet>";
        #endregion
        

        [HttpPost]
        [Route("api/PcrOperations/Pcr")]
        public IHttpActionResult PostPcr(dynamic ob)
        {
            return Ok(DateTime.Now.ToString("yyyy-mm-ddThh:mm:sszzz"));
        }

        [HttpPost]
        [Route("api/PcrOperations/Export")]
        public IHttpActionResult ExportPcr([FromBody] dynamic ob) // change to GET, change to ID and retrieve from database
        {

            var def = NemsisDefinitionObject.ElementLookup;
            return Ok(Export(ob));
        }

        [HttpGet]
        [Route("api/PcrOperations/xmlData")]
        public IHttpActionResult xmlData()
        {
            var info = new Dictionary<string, string>();

            var def = NemsisDefinitionObject.ElementLookup;

            XElement xml = XDocument.Parse(samplexml).Root;

            foreach (string key in def)
            {
                XElement elem = null;
                var descendants = xml.Descendants(xml.Name.Namespace + def[key].NemsisNumber);
                foreach (XElement node in descendants)
                {
                    elem = node;
                    break;
                }

                var path = "";
                if (elem != null)
                {
                    while (elem.Name.LocalName != "EMSDataSet")
                    {
                        elem = elem.Parent;
                        path = elem.Name.LocalName + (path.Length > 0 ? "/" + path : "");
                    }
                }
                info.Add(key, path);
            }

            return Ok(info);
        }

        public string Export(DateTime minDate, DateTime maxDate)
        {
            return "";
        }

        public string Export(dynamic ob) // replace ob with hard-typed PCR
        {
            var data = JsonConvert.DeserializeXmlNode(JsonConvert.SerializeObject(ob), "EMSDataSet");
            XDocument doc = XDocument.Parse(data.InnerXml);
            return doc.ToString();
            //var root = getNemsisElement("EMSDataSet", true);

            // 

            var def = NemsisDefinitionObject.ElementLookup;

            foreach (string key in def)
            {

            }

            return "";
        }

        private void constructPath(string path, ref XNode xml)
        {
            var nodeNames = path.Split('/');
        }

        private XNode buildNode(dynamic ob)
        {

            return XDocument.Parse("").Root;
        }

        private XElement getNemsisElement(string name)
        {
            XDocument sampleDoc = XDocument.Parse(samplexml);//XDocument.Load(XmlReader.Create(new StringReader(samplexml)), LoadOptions.PreserveWhitespace | LoadOptions.SetLineInfo | LoadOptions.SetBaseUri);
            XNamespace nameSpace = sampleDoc.Root.Name.Namespace;
            foreach (XNode node in sampleDoc.Root.Descendants(nameSpace + name))
                return XDocument.Parse(node.ToString()).Root;
            return null;
        }

        private XElement getNemsisElement(string name, bool empty)
        {
            var node = getNemsisElement(name);
            if (node == null)
                return null;
            if (empty)
                node.RemoveAll();
            return node;
        }

    }
}