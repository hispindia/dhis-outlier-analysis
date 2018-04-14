function report(params){

    this.getReport = function(state){

        var mapping = {

            startColumn : "",
            startRow :"",
            startDateCell : "",
            endDateCell : "",
            facility:"",
            facilityP:"",
            decoc : [
                {
                    de : "",
                    coc : "",
                    ouGroup : ""
                }
            ]
        }

        vargetSQLQuery(mapping);

        
        
        debugger

    }

    function getSQLQuery(mapping){

        var query = "select concat(de.uid,'-',coc.uid)  as decoc,ou.uid,max(ou.name),sum(dv.value :: integer)
from datavalue dv
inner join period as pe on pe.periodid = dv.periodid 
inner join periodtype as pt on pt.periodtypeid = pe.periodtypeid 
inner join dataelement as de on de.dataelementid = dv.dataelementid 
inner join categoryoptioncombo coc on coc.categoryoptioncomboid = dv.categoryoptioncomboid
inner join organisationunit ou on ou.organisationunitid = dv.sourceid
where pe.startdate >= '2016-01-01' and pe.startdate <='2018-04-01'
and concat(de.uid,'-',coc.uid) in ('EbzRCswFyij-DLr4VIEGNIo')
group by concat(de.uid,'-',coc.uid),ou.uid
"
        return query;
    }

}

module.exports = new report();
