
function Queries(){

    this.getOrgUnitIDsFromUIDs = function(uids){
        return `select organisationunitid
        from organisationunit
        where uid in (${uids})`
    }

    this.getOrgUnitDescendantsByUID = function(uid){

        
    }

    this.getPeriodSelectQ = function(){

        return `
        select to_char(pe.startdate , 'Mon yyyy')as pivot,
        concat(de.uid,'-',coc.uid) as decoc ,
        sum(dv.value :: float) as value
        from datavalue dv
        `
    }
    
    this.getInnerJoinPePtDeCoc = function(){
        return `
        inner join period as pe on pe.periodid = dv.periodid 
	inner join periodtype as pt on pt.periodtypeid = pe.periodtypeid 
	inner join dataelement as de on de.dataelementid = dv.dataelementid 
	inner join categoryoptioncombo coc on coc.categoryoptioncomboid = dv.categoryoptioncomboid `
    }

    this.getFiltersPePtDateDeCocAttrOptionValSource = function(startdate,
                                                               enddate,
                                                               ptype,
                                                               attroptioncombo,
                                                               sourceids,
                                                               deListCommaSeprated,
                                                               decocStr){

        return `
        where pe.startdate >= ${startdate}
        and pe.startdate <= ${enddate}
        and dv.attributeoptioncomboid=${attroptioncombo}
	and dv.value ~'^-?[0-9]+\.?[0-9]*$' and dv.value !='0'
	and dv.sourceid in ( ${sourceids } )
        and dv.dataelementid in  (select dataelementid from dataelement where uid in (${deListCommaSeparated}))
        and concat(de.uid,'-',coc.uid) in (${decocStr}) `
        
    }

    this.getPeriodGroupBy = function(){
        return `group by pe.startdate,de.uid,coc.uid`
    }
    
    this.getNoGroupSelectedOU = function(selectedOU){
        return `select 'nogroup' as ougroup,string_agg(ou.organisationunitid::text,',') as sourceids
        from organisationunit ou
        where ou.uid  in (${selectedOU})
        group by ougroup`;
    }
    
    this.getOUGroupMembersFilteredBySelectedOU = function(selectedOU,ouGroupKey,ouGroupUIDs){
        
        return `select ${ouGroupKey} as ougroup,string_agg(ougm.organisationunitid::text,',') as sourceids
        from orgunitgroupmembers ougm
        inner join orgunitgroup oug on oug.orgunitgroupid = ougm.orgunitgroupid
        where oug.uid in (${ouGroupUIDs})
        and ougm.organisationunitid in ((select ou.organisationunitid
                                         from organisationunit ou
                                         where ou.uid in( ${selectedOU})))
        group by ougroup`;
        
        
    }

    this.unionize = function(list){
        return list.reduce((str,q) => {
            if (str == ""){
                str = q;
            }else{
                str =` ${str}
                 union 
                ${q}`;
            }
            
            return str;
        },"");
    }
    
    this.jsonize = function(q){
        return `select json_agg(main.*) from (
            ${q}
        )main`;
    }
}

module.exports = new Queries();
