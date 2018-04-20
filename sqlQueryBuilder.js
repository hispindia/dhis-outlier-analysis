

function sqlQueryBuilder(mapping,selectedOU,selectedOUGroupUID,startDate,endDate,periodType,aggType){

    
    var children = selectedOU.children;
    var selectedOULevel = selectedOU.level;
    
    var selectedOUUID =  "'"+selectedOU.id+"'";
    
    startDate = getDate(periodType,startDate)
    endDate = getDate(periodType,endDate)
    var ouGroupWiseDecocStringMap = mapping.decoc.reduce((map,obj) => {
        
        var str = map[obj.ougroup];
        if (!str) {
            map[obj.ougroup] = "'"+obj.de+"-"+obj.coc+"'"
        }else{
            map[obj.ougroup] = str + ",'"+obj.de+"-"+obj.coc +"'";
            
        }
        
        
        return map;
    },[])
    
    
    function getDate(type,dateStr){

        switch(type){
        case 'monthly' : 
            return "'"+dateStr.substring(0,4)+"-"+dateStr.substring(4,6)+"-01'"
        }
        
    }

    this.getSourceIDSQLQuery = function(){


        switch(selectedOUGroupUID){

        case "-1" : // no group
            if (aggType == "use_captured"){
                return getUseCaptured()
            }
            else if (aggType == "agg_descendants"){
                return getAggDescendants();
            }
            break
            
        default : // group case
            if (aggType == "use_captured"){
                return getOUGroupUseCaptured()
            }
            else if (aggType == "agg_descendants"){
                return getOUGroupAggDescendants();
            }
        }
        
        
        function getOUGroupUseCaptured(){
            var nogroupQ = `select 'nogroup' as ougroup,string_agg(ougm.organisationunitid::text,',') as sourceids
            from orgunitgroupmembers ougm
            inner join orgunitgroup oug on oug.orgunitgroupid = ougm.orgunitgroupid
            where oug.uid in (`+"'"+selectedOUGroupUID+"'"+`)
            and ougm.organisationunitid  in (select ous.organisationunitid
                                             from _orgunitstructure ous
                                             where ous.uidlevel`+selectedOULevel+`  in( `+selectedOUUID+`))
            
            group by ougroup`
            
            var groupQ = "";
            for (var key in ouGroupWiseDecocStringMap){
                
                if (key == 'nogroup'){continue}
                
                if (groupQ == ""){
                    groupQ = getGroupQ(key,selectedOUUID,selectedOULevel,selectedOUGroupUID);
                }else{
                    groupQ = groupQ + " union "+getGroupQ(key,selectedOUUID,selectedOULevel,selectedOUGroupUID);
                    
                }
            }
            
            var Q = `select json_agg(main.*) from (`+nogroupQ + ` union ` + groupQ +`)main`;
            
            return Q;

            function getGroupQ(ouGroupUIDKeySelect,selectedOUUID,selectedOUGroupUID){
                
                var ouGroupUIDs = "'"+ouGroupUIDKeySelect.replace("-","','") + "'";
                
                var Q =`select `+"'"+ouGroupUIDKeySelect+"'"+` as ougroup,string_agg(ougm.organisationunitid::text,',') as sourceids
                from orgunitgroupmembers ougm
                inner join orgunitgroup oug on oug.orgunitgroupid = ougm.orgunitgroupid
                where oug.uid in (`+ouGroupUIDs+`)
                and ougm.organisationunitid in (select ougm.organisationunitid
                                                from orgunitgroupmembers ougm
                                                inner join orgunitgroup oug on oug.orgunitgroupid = ougm.orgunitgroupid
                                                where oug.uid in (`+"'"+selectedOUGroupUID+"'"+`))
                and ougm.organisationunitid in ((select ous.organisationunitid
                                             from _orgunitstructure ous
                                                 where ous.uidlevel`+selectedOULevel+`  in( `+selectedOUUID+`)))
                group by ougroup`

                return Q;
            }
        }
        
        function getOUGroupAggDescendants(){
            
            var nogroupQ = `select 'nogroup' as ougroup,string_agg(ous.organisationunitid::text,',') as sourceids
            from _orgunitstructure ous
            inner join organisationunit ou on ou.organisationunitid = ous.organisationunitid
            where ous.uidlevel`+selectedOULevel+ `  in( `+ selectedOUUID +`)
            and ou.organisationunitid in (`+getouGroupMemberDescendantSourceIDs(selectedOUGroupUID)+`)
            group by ougroup`
            
            var groupQ = "";
            for (var key in ouGroupWiseDecocStringMap){
                
                if (key == 'nogroup'){continue}
                
                if (groupQ == ""){
                    groupQ = getGroupQ(key,selectedOUUID,selectedOULevel,selectedOUGroupUID);
                }else{
                    groupQ = groupQ + " union "+getGroupQ(key,selectedOUUID,selectedOULevel,selectedOUGroupUID);
                    
                }
            }
            
            var Q = `select json_agg(main.*) from (`+nogroupQ + ` union ` + groupQ +`)main`;
            
            return Q;
            
            
            function getouGroupMemberDescendantSourceIDs(ouGroupUID){
               var Q = `with recursive org_units as (
                   select ou.organisationunitid
                   from orgunitgroupmembers ougm
                   join organisationunit ou on ou.organisationunitid =  ougm.organisationunitid
                   join orgunitgroup oug on oug.orgunitgroupid = ougm.orgunitgroupid
                   where oug.uid in (`+"'"+ouGroupUID+"'"+`)
                   
                   union all
                   
                   select ch.organisationunitid
                   from organisationunit ch 
                   join org_units p on ch.parentid = p.organisationunitid
                   
               )
                select organisationunitid from org_units` 
                
                return Q;
            }
            
            function getGroupQ(ouGroupUIDKeySelect,selectedOUUID,selectedOULevel,selectedOUGroupUID){
                
                var ouGroupUIDs = "'"+ouGroupUIDKeySelect.replace("-","','") + "'";
                
                var Q =`select ` + "'" + ouGroupUIDKeySelect + "'" + ` as ougroup,string_agg(ous.organisationunitid::text,',') as sourceids
                from _orgunitstructure ous
                inner join organisationunit ou on ou.organisationunitid = ous.organisationunitid
                where ous.uidlevel`+selectedOULevel+ `  in( `+ selectedOUUID +`)
                and ou.organisationunitid in (`+getouGroupMemberDescendantSourceIDs(selectedOUGroupUID)+`)
                and ou.organisationunitid in (select ougm.organisationunitid
                                               from orgunitgroupmembers ougm
                                               inner join orgunitgroup oug on oug.orgunitgroupid = ougm.orgunitgroupid
                                               where oug.uid in (`+"'"+ouGroupUIDKeySelect+"'"+`))`             

                return Q;
            }
        }

        
        function getUseCaptured(){
            
            var nogroupQ = `select 'nogroup' as ougroup,string_agg(ou.organisationunitid::text,',') as sourceids
            from organisationunit ou
            where ou.parentid  in (select organisationunitid from organisationunit where uid = `+selectedOUUID+`)
            group by ougroup`
            
            var groupQ = "";
            for (var key in ouGroupWiseDecocStringMap){
                
                if (key == 'nogroup'){continue}
                
                if (groupQ == ""){
                    groupQ = getGroupQ(key,selectedOUUID,selectedOULevel);
                }else{
                    groupQ = groupQ + " union "+getGroupQ(key,selectedOUUID,selectedOULevel);
                    
                }
            }
            
            var Q = `select json_agg(main.*) from (`+nogroupQ + ` union ` + groupQ +`)main`;
            
            return Q;

            function getGroupQ(ouGroupUIDKeySelect,selectedOUUID,selectedOULevel){
                
                var ouGroupUIDs = "'"+ouGroupUIDKeySelect.replace("-","','") + "'";
                var Q =`select `+"'"+ouGroupUIDKeySelect+"'"+` as ougroup,string_agg(ougm.organisationunitid::text,',') as sourceids
                from orgunitgroupmembers ougm
                inner join orgunitgroup oug on oug.orgunitgroupid = ougm.orgunitgroupid
                where oug.uid in (`+ouGroupUIDs+`)
                and ougm.organisationunitid in (select ou.organisationunitid
					        from organisationunit ou
                                                where ou.parentid  in (select organisationunitid from organisationunit where uid = `+selectedOUUID+`)
                                               )`
                return Q;
                
            }
        }

        function getAggDescendants(){

            var nogroupQ = `select 'nogroup' as ougroup,string_agg(ous.organisationunitid::text,',') as sourceids
            from _orgunitstructure ous
            where ous.uidlevel`+selectedOULevel+`  in( `+selectedOUUID+`)
            group by ougroup`

            var groupQ = "";
            for (var key in ouGroupWiseDecocStringMap){

                if (key == 'nogroup'){continue}
                
                if (groupQ == ""){
                    groupQ = getGroupQ(key,selectedOUUID,selectedOULevel);
                }else{
                    groupQ = groupQ + " union "+getGroupQ(key,selectedOUUID,selectedOULevel);

                }
            }


            var Q = `select json_agg(main.*) from (`+nogroupQ + ` union ` + groupQ +`)main`;

            return Q;

            
            function getGroupQ(ouGroupUIDKeySelect,selectedOUUID,selectedOULevel){
                
                var ouGroupUIDs = "'"+ouGroupUIDKeySelect.replace("-","','") + "'";
                var Q =`select `+"'"+ouGroupUIDKeySelect+"'"+` as ougroup,string_agg(ougm.organisationunitid::text,',') as sourceids
                from orgunitgroupmembers ougm
                inner join orgunitgroup oug on oug.orgunitgroupid = ougm.orgunitgroupid
                where oug.uid in (`+ouGroupUIDs+`)
                and ougm.organisationunitid in (select ous.organisationunitid
					        from _orgunitstructure ous
					        where ous.uidlevel`+selectedOULevel+`  in( `+selectedOUUID+`)
                                               )`
                return Q;
                
            }
        }
        
    }
    
    this.getSQLQuery = function(ouGroupWiseSourceIDs){


        var decocListCommaSeparated = mapping.decoc.reduce((str,obj) => {
            if (str==""){
                str = obj.de+"-"+obj.coc +"'"
            }else{
                str = str+ ",'"+obj.de+"-"+obj.coc +"'" ;
                
            }
            return str;
        },"")

        var deListCommaSeparated = mapping.decoc.reduce((str,obj) => {
            if (str==""){
                str = "'"+obj.de+"'"
            }else{
                str = str+ ",'"+obj.de+"'" ;
                
            }
            return str;
        },"")


        var ouGroupIDWiseSourceIDs = ouGroupWiseSourceIDs.reduce((map,obj)=>{

            map[obj.ougroup] = obj.sourceids;
            return map;
        },[])
        
        var subQuery = ""

        switch(selectedOUGroupUID){
        case "-1": // no group - default case

            for (var ouGroupID in ouGroupWiseDecocStringMap){
                
                if (subQuery == ""){
                    subQuery =  getDefaultMiddleQuery(selectedOULevel,selectedOUUID,startDate,endDate,ouGroupID,ouGroupWiseDecocStringMap[ouGroupID],ouGroupIDWiseSourceIDs[ouGroupID]);
                }
                else
                {
                    subQuery = subQuery + `
                    union
                    ` +  getDefaultMiddleQuery(selectedOULevel,selectedOUUID,startDate,endDate,ouGroupID,ouGroupWiseDecocStringMap[ouGroupID],ouGroupIDWiseSourceIDs[ouGroupID]);
                }
            }
            break;         

        default : //group case
            
            for (var ouGroupID in ouGroupWiseDecocStringMap){

                var sourceids = ouGroupIDWiseSourceIDs[ouGroupID];

                if (!sourceids) {continue}
                
                if (subQuery == ""){
                    subQuery =  getGroupMiddleQuery(selectedOULevel,startDate,endDate,ouGroupID,ouGroupWiseDecocStringMap[ouGroupID],sourceids,selectedOUGroupUID);
                }
                else
                {
                    subQuery = subQuery + `
                    union
                    ` +  getGroupMiddleQuery(selectedOULevel,startDate,endDate,ouGroupID,ouGroupWiseDecocStringMap[ouGroupID],sourceids,selectedOUGroupUID);
                }
            }
            break;         
            
        }
        
        
        var query = `select json_agg(main.*) from (`
                                                   + subQuery
                                                   + ` )main group by pivot,pivotname order by pivotname`

    //    console.log(query)
        
        return query;

        function getDefaultMiddleQuery(ouLevel,selectedOUUID,startDate,endDate,ouGroupID,decocStr,sourceids){
            var selectedOUChildrenLevel = ouLevel+1;
            
            var suffixQ =   ` select ou.uid as pivot,ou.name as pivotname,'null' as ougroup,'null' as decoc,0 as value 
	    from organisationunit ou
	    where parentid in (select organisationunitid 
			       from organisationunit 
			       where uid = `+selectedOUUID+`) `;

            
            
            
            var query = `select ous.uidlevel`+selectedOUChildrenLevel+` as pivot,
                max(ou.name) as pivotname,
                `+
                "'"+ouGroupID+"'"+` as ougroup,
            concat(de.uid,'-',coc.uid) as decoc ,
            sum(dv.value :: float) as value
	    from datavalue dv
	    inner join period as pe on pe.periodid = dv.periodid 
	    inner join periodtype as pt on pt.periodtypeid = pe.periodtypeid 
	    inner join dataelement as de on de.dataelementid = dv.dataelementid 
	    inner join categoryoptioncombo coc on coc.categoryoptioncomboid = dv.categoryoptioncomboid 
	    inner join _orgunitstructure ous on ous.organisationunitid = dv.sourceid 
	    inner join organisationunit ou on ou.organisationunitid = ous.idlevel`+selectedOUChildrenLevel+`
	    where pe.startdate >= `+startDate+`
            and pe.startdate <= `+endDate+`
            and dv.attributeoptioncomboid=15
	    and dv.sourceid in ( ` + sourceids + ` )
            and dv.dataelementid in  (select dataelementid from dataelement where uid in (`+deListCommaSeparated+`))
            and concat(de.uid,'-',coc.uid) in (`+decocStr+`)
	    group by ous.uidlevel`+selectedOUChildrenLevel+`,de.uid,coc.uid
            union all `+ suffixQ;
            
            return query;
            
        }
        
        function getGroupMiddleQuery(ouLevel,startDate,endDate,ouGroupID,decocStr,sourceids,selOrgUnitGroupUID){
            var selectedOUChildrenLevel = ouLevel+1;
            
            var suffixQ =   ` select ou.uid as pivot,ou.name as pivotname,'null' as ougroup,'null' as decoc,0 as value 
	    from organisationunit ou
            inner join orgunitgroupmembers ougm on ou.organisationunitid = ougm.organisationunitid
            inner join orgunitgroup oug on oug.orgunitgroupid = ougm.orgunitgroupid
	    where oug.uid in (`+"'"+selOrgUnitGroupUID+"'"+`)`

            
            
            
            var query = `select ou.uid as pivot,
                max(ou.name) as pivotname,
                `+
                "'"+ouGroupID+"'"+` as ougroup,
            concat(de.uid,'-',coc.uid) as decoc ,
            sum(dv.value :: float) as value
	    from datavalue dv
	    inner join period as pe on pe.periodid = dv.periodid 
	    inner join periodtype as pt on pt.periodtypeid = pe.periodtypeid 
	    inner join dataelement as de on de.dataelementid = dv.dataelementid 
	    inner join categoryoptioncombo coc on coc.categoryoptioncomboid = dv.categoryoptioncomboid 
	    inner join orgunitgroupmembers ougm on ougm.organisationunitid = dv.sourceid
            inner join orgunitgroup oug on oug.orgunitgroupid = ougm.orgunitgroupid
	    inner join organisationunit ou on ou.organisationunitid = ougm.organisationunitid
	    where pe.startdate >= `+startDate+`
            and pe.startdate <= `+endDate+`
            and dv.attributeoptioncomboid=15
	    and dv.sourceid in ( ` + sourceids + ` )
            and dv.dataelementid in  (select dataelementid from dataelement where uid in (`+deListCommaSeparated+`))
            and concat(de.uid,'-',coc.uid) in (`+decocStr+`)
            and oug.uid in (`+"'"+selOrgUnitGroupUID+"'"+`)
	    group by ou.uid,de.uid,coc.uid
            union all `+ suffixQ;
            
            return query;

        }
    }
}

module.exports = sqlQueryBuilder;
