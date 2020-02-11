import api from 'dhis2api';
import XLSX from 'xlsx';

function outlierReport(param,
                       callback){
    
    const SQLVIEWPREFIX = "OUTLIER_REPORT_";
    var Q = query(param.selDate,
                  param.dsUIDs,
                  param.selectedOUUID,
                  param.selectedOULevel,
                  param.selectedReferencePeriod);
    Q = jsonize(Q);
    
    var sqlViewService = new api.sqlViewService();
    sqlViewService.dip(SQLVIEWPREFIX,Q, function(error,response,body){

        if(error){
            alert("An unexpected error occurred while making the request");
            callback();
            return;
        }
        
        if (!body.listGrid.rows[0][0]){
            //alert("No Outliers Found!")
            callback(true,"No Outliers Found!");
            return;
        }

        var outlierResults = JSON.parse(body.listGrid.rows[0][0].value);
        var sheet = XLSX.utils.json_to_sheet(outlierResults);
        var wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, sheet, "Sheet1");
        
        XLSX.writeFile(wb, param.reportName+'.csv');
        callback();
        
    },1000*60*5);
    
    function jsonize(q){
        return `select json_agg(main.*) from (
            ${q}
            
        )main`;
    }
    
    function query(selDate,dsUIDs,selectedOUUID,selectedOULevel,selectedReferencePeriod){
        return `with 
            oumaster as (
	        select ous.organisationunitid,
	        max(ou1.name) Country, max(ou1.organisationunitid) as Country_Uphmis_Id ,
	        max(ou2.name) state, max(ou2.organisationunitid) as State_Uphmis_Id ,
	        max(ou3.name) Division, max(ou3.organisationunitid) as Division_Uphmis_Id ,
	        max(ou4.name) District, max(ou4.code) as District_Hmis_Code, max(ou4.organisationunitid) as District_Uphmis_Id, 
	        max(ou5.name) Block, max(ou5.code) as Block_Hmis_Code, max(ou5.organisationunitid) as Block_Uphmis_Id,
	        max(ou6.name) Facility, max(SUBSTRING(ou6.comment FROM
             position(':' in ou6.comment) + 1 )) as F_Type,max(ou6.code) as Facility_Hmis_Code,max(ou6.organisationunitid) as Facility_Uphmis_Id
	        from _orgunitstructure ous
	        inner join organisationunit ou on ou.organisationunitid = ous.organisationunitid
	        left join organisationunit ou1 on ou1.organisationunitid = ous.idlevel1
	        left join organisationunit ou2 on ou2.organisationunitid = ous.idlevel2
	        left join organisationunit ou3 on ou3.organisationunitid = ous.idlevel3
	        left join organisationunit ou4 on ou4.organisationunitid = ous.idlevel4
	        left join organisationunit ou5 on ou5.organisationunitid = ous.idlevel5
	        left join organisationunit ou6 on ou6.organisationunitid = ous.idlevel6
	        group by ous.organisationunitid
	    )
        select 	Country, Country_Uphmis_Id ,
	state, State_Uphmis_Id ,
	Division, Division_Uphmis_Id ,
	District, District_Hmis_Code, District_Uphmis_Id, 
	Block, Block_Hmis_Code, Block_Uphmis_Id,
	Facility,F_Type, Facility_Hmis_Code,Facility_Uphmis_Id,
	max(ou.name) as outlierfacility,
	max(de.name) as dataelement,
	max(coc.name) as category,
	to_char(max(p.startdate)::date,'FMMonth-YYYY') period, 
	_dv.value,
	u upperbound,
	l lowerbound,
	mean, -- , sum,count, vals
	std
        from 
        (	
	    with stats as (
		select 	dv.sourceid,
		dv.dataelementid,
		dv.categoryoptioncomboid,
		dv.attributeoptioncomboid,
		array_agg(distinct dv.periodid) as periods,
		avg(dv.value::float) as mean,
        --       sum(dv.value::float) as sum,
	--	count(dv.value::float) as count,
	--	string_agg(dv.value,'-') as vals,
		stddev(dv.value::float) as std
		from datavalue dv		
		where dv.dataelementid in (
					select de.dataelementid 
					from dataelement de
					inner join datasetelement dsm on dsm.dataelementid = de.dataelementid
					inner join dataset ds on ds.datasetid = dsm.datasetid	
        				where ds.uid in (${dsUIDs}) and de.valueType in ('NUMBER','INTEGER')
					)  
                and dv.sourceid in (select organisationunitid 
                            from _orgunitstructure ous 		
                            where ous.uidlevel${selectedOULevel} = '${selectedOUUID}'
                            and organisationunitid in (select sourceid
		                                       from datasetsource dss
		                                         inner join dataset ds on ds.datasetid = dss.datasetid
		                                       inner join organisationunit oup on dss.sourceid=oup.organisationunitid
  				                       where ds.uid in (${dsUIDs}) and oup.comment like '%Public%'
                                                      )                  
                            )
		and dv.periodid in (
				select periodid from period pe
				inner join periodtype pt on pt.periodtypeid = pe.periodtypeid
		                where pe.startdate between date('${selDate}') - interval '${selectedReferencePeriod} months' and date('${selDate}') and pt.name='Monthly' 
				and pt.name='Monthly' 
				)                            
		and dv.attributeoptioncomboid = 15        
		group by dv.sourceid,dv.dataelementid,dv.categoryoptioncomboid,dv.attributeoptioncomboid
	    )
	    select dv.*,mean,std,mean+3*sqrt(abs(mean)) u,mean-3*sqrt(abs(mean)) l -- , sum,count, vals
	    from datavalue dv
	    inner join period pe on pe.periodid = dv.periodid
	    inner join periodtype pt on pt.periodtypeid = pe.periodtypeid	
	    inner join stats on 
	    stats.dataelementid = dv.dataelementid and 
	    stats.sourceid= dv.sourceid and 
	    stats.categoryoptioncomboid = dv.categoryoptioncomboid and 
	    stats.attributeoptioncomboid = dv.attributeoptioncomboid
	    where pe.startdate = '${selDate}' and pt.name='Monthly'
	    and (dv.value::float > mean+3*sqrt(abs(mean)) or dv.value::float < mean-3*sqrt(abs(mean)))
        ) _dv
        inner join dataelement de on _dv.dataelementid = de.dataelementid 
        inner join categoryoptioncombo coc on _dv.categoryoptioncomboid = coc.categoryoptioncomboid
        inner join oumaster oum on _dv.sourceid = oum.organisationunitid
        inner join organisationunit ou on ou.organisationunitid = oum.organisationunitid
        inner join period p on _dv.periodid = p.periodid
        inner join periodtype pt on p.periodtypeid = pt.periodtypeid
        group by oum.organisationunitid, Country, Country_Uphmis_Id ,
	state, State_Uphmis_Id ,
	Division, Division_Uphmis_Id ,
	District, District_Hmis_Code, District_Uphmis_Id, 
	Block, Block_Hmis_Code, Block_Uphmis_Id,
	Facility,F_Type, Facility_Hmis_Code,Facility_Uphmis_Id,
	_dv.dataelementid,_dv.sourceid,_dv.categoryoptioncomboid,_dv.attributeoptioncomboid,_dv.periodid,_dv.value,u,l,mean,std  -- , sum,count, vals
        order by country,state,division,district,block,facility,dataelement,category`

    }
}

module.exports = outlierReport;
