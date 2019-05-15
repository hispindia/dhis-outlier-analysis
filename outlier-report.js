import api from 'dhis2api';
import XLSX from 'xlsx';

function outlierReport(param,
                       callback){
    
    const SQLVIEWPREFIX = "OUTLIER_REPORT_";
    var Q = query(param.selDate,
                    param.dsUIDs,
                    param.selectedOUUID,
                    param.selectedOULevel);
    Q = jsonize(Q);
    
    var sqlViewService = new api.sqlViewService();
    sqlViewService.dip(SQLVIEWPREFIX,Q, function(error,response,body){

        if(error){
            alert("An unexpected error occurred while making the request");
            callback();
            return;
        }
        
        if (!body.listGrid.rows[0][0]){
            alert("No Outliers Found!")
            callback();
            return;
        }

        var outlierResults = JSON.parse(body.listGrid.rows[0][0].value);
        var sheet = XLSX.utils.json_to_sheet(outlierResults);
        var wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, sheet, "Sheet1");
        XLSX.writeFile(wb, 'outlier.xlsx');
        callback();
        
    },1000*60*1);
    
    function jsonize(q){
        return `select json_agg(main.*) from (
            ${q}
            
        )main`;
    }
    
    function query(selDate,dsUIDs,selectedOUUID,selectedOULevel){
        return `select 	datasets,
	max(ou1.name) Country, ou1.organisationunitid as Country_Uphmis_Id ,
	max(ou2.name) state, ou2.organisationunitid as State_Uphmis_Id ,
	max(ou3.name) Division, ou3.organisationunitid as Division_Uphmis_Id ,
	max(ou4.name) District, max(ou4.code) as District_Hmis_Code, ou4.organisationunitid as District_Uphmis_Id, 
	max(ou5.name) Block, max(ou5.code) as Block_Hmis_Code, ou5.organisationunitid as Block_Uphmis_Id,
	max(ou6.name) Facility, max(ou6.code) as Facility_Hmis_Code,ou6.organisationunitid as Facility_Uphmis_Id,
	max(ou.name) as outlierfacility,
	max(de.name) as dataelement,
	max(coc.name) as category,
	concat(max(p.startdate),':',max(p.enddate)) as period,
	max(pt.name) as frequency,	
	_dv.value,
	u upperbound,
	l lowerbound,
	mean,
	std
from 
(
	with stats as (
		select 	dv.sourceid,
			dv.dataelementid,
			dv.categoryoptioncomboid,
			dv.attributeoptioncomboid,
			array_agg(distinct dv.periodid) as periods,
			array_agg(distinct ds.name) as datasets,			
			avg(dv.value::float) as mean, 
			stddev(dv.value::float) as std
		from datavalue dv
		inner join datasetmembers dsm on dsm.dataelementid = dv.dataelementid
		inner join dataelement de on de.dataelementid = dsm.dataelementid
		inner join dataset ds on ds.datasetid = dsm.datasetid	
		inner join period pe on pe.periodid = dv.periodid
		inner join periodtype pt on pt.periodtypeid = pe.periodtypeid
		inner join categoryoptioncombo coc on dv.categoryoptioncomboid = coc.categoryoptioncomboid
		inner join _orgunitstructure ous on ous.organisationunitid = dv.sourceid
		where pe.startdate between date('${selDate}') - interval '6 months' and date('${selDate}') and pt.name='Monthly' 
		and de.valueType in ('NUMBER','INTEGER')
                and dv.sourceid in (select organisationunitid 
                                    from _orgunitstructure ous 
                                    where ous.uidlevel${selectedOULevel} = '${selectedOUUID}')
		and ds.uid in (${dsUIDs})
		group by dv.sourceid,dv.dataelementid,dv.categoryoptioncomboid,dv.attributeoptioncomboid
	)
	select dv.*,datasets,mean,std,mean+3*sqrt(mean) u,mean-3*sqrt(mean) l
	from datavalue dv
	inner join period pe on pe.periodid = dv.periodid
	inner join periodtype pt on pt.periodtypeid = pe.periodtypeid	
	inner join stats on 
		stats.dataelementid = dv.dataelementid and 
		stats.sourceid= dv.sourceid and 
		stats.categoryoptioncomboid = dv.categoryoptioncomboid and 
		stats.attributeoptioncomboid = dv.attributeoptioncomboid
	where dv.periodid = any(periods)
	and (dv.value::float > mean+3*sqrt(mean) or dv.value::float < mean-3*sqrt(mean))
) _dv
inner join dataelement de on _dv.dataelementid = de.dataelementid 
inner join categoryoptioncombo coc on _dv.categoryoptioncomboid = coc.categoryoptioncomboid
inner join _orgunitstructure ous on _dv.sourceid = ous.organisationunitid
inner join organisationunit ou on ou.organisationunitid = ous.organisationunitid
left join organisationunit ou1 on ou1.organisationunitid = ous.idlevel1
left join organisationunit ou2 on ou2.organisationunitid = ous.idlevel2
left join organisationunit ou3 on ou3.organisationunitid = ous.idlevel3
left join organisationunit ou4 on ou4.organisationunitid = ous.idlevel4
left join organisationunit ou5 on ou5.organisationunitid = ous.idlevel5
left join organisationunit ou6 on ou6.organisationunitid = ous.idlevel6
inner join period p on _dv.periodid = p.periodid
inner join periodtype pt on p.periodtypeid = pt.periodtypeid
group by ou1.organisationunitid,
ou2.organisationunitid,
ou3.organisationunitid,
ou4.organisationunitid,
ou5.organisationunitid,
ou6.organisationunitid,
_dv.dataelementid,_dv.sourceid,_dv.categoryoptioncomboid,_dv.attributeoptioncomboid,_dv.periodid,_dv.value,u,l,mean,std,datasets
order by country,state,division,district,block,facility,dataelement,category`

    }
}

module.exports = outlierReport;
