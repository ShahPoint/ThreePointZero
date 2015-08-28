using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using Newtonsoft.Json;
using System.Xml;
using System.Xml.Linq;
namespace ThreePointZero.Controllers
{
    public class HtmlRenderController : Controller
    {

        public class Form
        {
            public List<Tabs> Tabs {get; set;}
        }

        public class Tabs
        {
            public string title { get; set; }
            public List<Widgets> Widgets { get; set; }                                                                                                                                                 
        }

        public class Widgets
        {
            public string title { get; set; }
            public List<string> Teddys { get; set; }
        }



        // GET: HtmlRender/PcrForm
        public ActionResult PcrForm()
        
        {

            var json = @"{
    ""Tabs"": [
      { 
        ""title"": ""Incident"",
        ""Widgets"": [
          {
            ""title"": ""Disposition"",
            ""Teddys"": [""pcr.incidentNumber"", ""pcr.typeOfLocation"" ]
          }, 
          {
          	""title"": ""Crew"",
            ""Teddys"": [""pcr.primaryCrewMember"", ""pcr.secondaryCrewMember""]
          }
        ]       	        
      },
      {
       
        ""title"": ""Patient"",
        ""Widgets"": [
          {
            ""title"": ""Patient Information"",
            ""Teddys"": [ ""pcr.firstName"",  ""pcr.lastName""]
          }, 
          {
          	""title"": ""Medical History"",
            ""Teddys"": [""pcr.allergies"",  ""pcr.medicalHistory""]
          }
        ] 
      }    
    ]
}";

          Form html  = JsonConvert.DeserializeObject<Form>(json);
          XElement div = new XElement("div");

          foreach(Tabs tab in html.Tabs) {
              XElement Cloudtab = new XElement("CloudTab");
              Cloudtab.SetAttributeValue("Name", tab.title);
              foreach(Widgets widget in tab.Widgets){
                  XElement Cloudwidget = new XElement("CloudWidget");
                  Cloudwidget.SetAttributeValue("Name", widget.title);
                  foreach (string teddy in widget.Teddys)
                  {
                      XElement Cloudteddy = new XElement("TeddyInput");
                      Cloudteddy.SetAttributeValue("Name", teddy);
                      Cloudwidget.Add(Cloudteddy);
                  }
                  Cloudtab.Add(Cloudwidget);
              }
              div.Add(Cloudtab);
          }
            



          //foreach (stuff){

          //}
            return Content(div.ToString(), "text/html");
        }

        // GET: PcrFormRender/Create
        public ActionResult Create()
        {
            return View();
        }

        // POST: PcrFormRender/Create
        [HttpPost]
        public ActionResult Create(FormCollection collection)
        {
            try
            {
                // TODO: Add insert logic here

                return RedirectToAction("Index");
            }
            catch
            {
                return View();
            }
        }

        // GET: PcrFormRender/Edit/5
        public ActionResult Edit(int id)
        {
            return View();
        }

        // POST: PcrFormRender/Edit/5
        [HttpPost]
        public ActionResult Edit(int id, FormCollection collection)
        {
            try
            {
                // TODO: Add update logic here

                return RedirectToAction("Index");
            }
            catch
            {
                return View();
            }
        }

        // GET: PcrFormRender/Delete/5
        public ActionResult Delete(int id)
        {
            return View();
        }

        // POST: PcrFormRender/Delete/5
        [HttpPost]
        public ActionResult Delete(int id, FormCollection collection)
        {
            try
            {
                // TODO: Add delete logic here

                return RedirectToAction("Index");
            }
            catch
            {
                return View();
            }
        }
    }
}
