module.exports = () => {

  const path = require('path')
  const fileUpload = require('express-fileupload')
  const bodyParser = require('body-parser')

  //const writeJsonFile = require('write-json-file')
  //const N3 = require('n3')
  const fs = require('fs')
  const request = require('request')

  var rdfstore = require('rdfstore')

  const jsonParser = bodyParser.json()

  let query =
    "PREFIX nidm: <http://purl.org/nidash/nidm#> \
    PREFIX prov: <http://www.w3.org/ns/prov#> \
    prefix peak: <http://purl.org/nidash/nidm#NIDM_0000062> \
    prefix significant_cluster: <http://purl.org/nidash/nidm#NIDM_0000070> \
    prefix coordinate: <http://purl.org/nidash/nidm#NIDM_0000086> \
    prefix equivalent_zstatistic: <http://purl.org/nidash/nidm#NIDM_0000092> \
    prefix pvalue_fwer: <http://purl.org/nidash/nidm#NIDM_0000115> \
    prefix pvalue_uncorrected: <http://purl.org/nidash/nidm#NIDM_0000116> \
    prefix statistic_map: <http://purl.org/nidash/nidm#NIDM_0000076> \
    prefix statistic_type: <http://purl.org/nidash/nidm#NIDM_0000123> \
    prefix coordinateVector: <http://purl.org/nidash/nidm#NIDM_0000086> \
    SELECT DISTINCT ?cluster ?peak ?x ?equiv_z ?pval_fwer ?stat WHERE \
    { ?peak a peak: . \
    ?cluster a significant_cluster: . \
    ?peak prov:wasDerivedFrom ?cluster .\
    ?peak prov:atLocation ?coordinate . \
    ?coordinate coordinateVector: ?x . \
    ?peak equivalent_zstatistic: ?equiv_z .\
    ?peak pvalue_fwer: ?pval_fwer .\
    ?cluster prov:wasDerivedFrom/prov:wasGeneratedBy/prov:used ?statmap .\
    ?statmap a statistic_map: .\
    ?statmap statistic_type: ?stat .\
    }\
    ORDER BY ?cluster ?peak\
    "
  app.post('/query-by-file', function(req, res){
    if (!req.files)
      return res.status(400).send('No files were uploaded.');

    // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
    let sampleFile = req.files.sampleFile
    sampleFile.mv(path.join(__dirname,'/../../uploads/',req.files.sampleFile.name), function(err) {
      if (err)
        return res.status(500).send(err)
      var data = fs.createReadStream(path.join(__dirname,'/../../uploads/',req.files.sampleFile.name))
      new rdfstore.Store(function(err, store) {
        store.load("text/turtle",data, function(err, results){
          if(!err){
            console.log("no error")
            store.execute(query, function(success, results) {
              columns = []
              data = []
              //console.log(results);
              for(var i=0; i<results.length; i++) {
                if (columns.length == 0){
                  for (var key in results[i]) {
                    columns.push({id: key, name: key, field: key})
                  }
                }
                var datum = {}
                for (var key in results[i]) {
                  datum[key] = results[i][key]["value"].replace('http://iri.nidash.org/', '').replace('http://www.incf.org/ns/nidash/nidm#', '')
                }
                data.push(datum)
                //console.log(datum);
              }
              //console.log(columns)
              var resObj = {}
              resObj["columns"] = columns
              resObj["data"] = data
              console.log(resObj)
              res.json(resObj)
            })
          }
          else{
            console.log("failed")
          }
        })//load
        })//store
      })
  }) //get/tview

  app.post('/query-by-url', jsonParser, function(req, res){
    if (!req.body)
      return res.sendStatus(400)
    let url = req.body.url
    console.log(url)
    request(url, function(err,res1,data){
      new rdfstore.Store(function(err, store) {
        store.load("text/turtle",data, function(err, results){
          if(!err){
            console.log("no error")
            store.execute(query, function(success, results) {
              columns = []
              data = []
              //console.log(results);
              for(var i=0; i<results.length; i++) {
                if (columns.length == 0){
                  for (var key in results[i]) {
                    columns.push({id: key, name: key, field: key})
                  }
                }
                var datum = {}
                  for (var key in results[i]) {
                    datum[key] = results[i][key]["value"].replace('http://iri.nidash.org/', '').replace('http://www.incf.org/ns/nidash/nidm#', '')
                  }
                  data.push(datum)
                  //console.log(datum);
                }
                //console.log(columns)
                var resObj = {}
                resObj["columns"] = columns
                resObj["data"] = data
                console.log(resObj)
                res.json(resObj)
            })//execute
          }
          else{
            console.log("failed")
          }
        })//load
        })//store
      })//request
  }) //get/tview

}
