

function sqlQueryBuilder(mapping,selectedOU,selectedOUGroupUID,startDate,endDate,periodType,aggType){

    
    var children = selectedOU.children;
    var selectedOULevel = selectedOU.level;
    
    var selectedOUUID =  "'"+selectedOU.id+"'";
    var selectedOUName = "'"+selectedOU.name+"'";
    var selectedOUNameWithSuffix = "'"+selectedOU.name + "_ONLY'";
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

    function getOrgUnitDescendantsQuery(ouUID){
        var Q = `with recursive org_units as (
            select ou.organisationunitid
            from organisationunit ou 
            where ou.parentid in (select organisationunitid 
			          from organisationunit 
			          where uid = `+ouUID+`)
            
            union all
            
            select ch.organisationunitid
            from organisationunit ch 
            join org_units p on ch.parentid = p.organisationunitid                   
        )
        select organisationunitid from org_units`

        return Q;
        
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

            if (groupQ!=""){
                groupQ =  " union "+groupQ;
            }
            
            var Q = `select json_agg(main.*) from (`+nogroupQ +  groupQ +`)main`;
           
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
                group by ougroup `

                return Q;
            }
        }
        
        function getOUGroupAggDescendants(){
            
            var nogroupQ = `select 'nogroup' as ougroup,string_agg(ou.organisationunitid::text,',') as sourceids
            from organisationunit ou
            where ou.organisationunitid in (`+getOrgUnitDescendantsQuery(selectedOUUID)+`)
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

            if (groupQ!=""){
                groupQ =  " union "+groupQ;
            }
            
            var Q = `select json_agg(main.*) from (`+nogroupQ +  groupQ +`)main`;
            
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
                
                var Q =`select ` + "'" + ouGroupUIDKeySelect + "'" + ` as ougroup,string_agg(ou.organisationunitid::text,',') as sourceids
                from organisationunit ou
                where ou.organisationunitid in (`+getOrgUnitDescendantsQuery(selectedOUUID)+`)
                and ou.organisationunitid in (`+getouGroupMemberDescendantSourceIDs(selectedOUGroupUID)+`)
                and ou.organisationunitid in (select ougm.organisationunitid
                                               from orgunitgroupmembers ougm
                                               inner join orgunitgroup oug on oug.orgunitgroupid = ougm.orgunitgroupid
                                               where oug.uid in (`+ouGroupUIDs+`))`             

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

            if (groupQ!=""){
                groupQ =  " union "+groupQ;
            }
            
            var Q = `select json_agg(main.*) from (`+nogroupQ + groupQ +`)main`;
            
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

            if (groupQ!=""){
                groupQ =  " union "+groupQ;
            }
            
            var Q = `select json_agg(main.*) from (`+nogroupQ  + groupQ +`)main`;

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

            if (!obj.sourceids){
                map[obj.ougroup] = '0';
            
            }else{
                map[obj.ougroup] = obj.sourceids;
            
            }
            
            return map;
        },[])
        
        var subQuery = ""
        var suffixQ = ""
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
            
            suffixQ =   ` union select ou.uid as pivot,ou.name as pivotname,'null' as ougroup,'null' as decoc,0 as value 
	    from organisationunit ou
	    where parentid in (select organisationunitid 
			       from organisationunit 
			       where uid = `+selectedOUUID+`) union
            select ou.uid as pivot, `+selectedOUNameWithSuffix+` as pivotname,'null' as ougroup,'null' as decoc,0 as value 
	    from organisationunit ou
	where ou.uid in ( `+selectedOUUID+`)`

            

            subQuery = subQuery + suffixQ;
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

        suffixQ =   ` union select ou.uid as pivot,ou.name as pivotname,'null' as ougroup,'null' as decoc,0 as value 
            from orgunitgroupmembers ougm
            inner join orgunitgroup oug on oug.orgunitgroupid = ougm.orgunitgroupid
            inner join organisationunit ou on ou.organisationunitid = ougm.organisationunitid
            where oug.uid in (`+"'"+selectedOUGroupUID+"'"+`)
            and ougm.organisationunitid in (select ous.organisationunitid
					    from _orgunitstructure ous
					    where ous.uidlevel`+selectedOULevel+`  in( `+selectedOUUID+`)
                                           )`
            
            subQuery = subQuery + suffixQ;
            break;         
            
        }
        
   

        var query = `select json_agg(main.*) from (`
                                                   + subQuery
                                                   + ` )main group by pivot,pivotname order by pivotname!=`+selectedOUNameWithSuffix+` desc ,pivotname`

        console.log(query)
        
        return query;

        function getDefaultMiddleQuery(ouLevel,selectedOUUID,startDate,endDate,ouGroupID,decocStr,sourceids){
            var selectedOUChildrenLevel = ouLevel+1;
            
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
	    and dv.value ~'^-?[0-9]+\.?[0-9]*$' and dv.value !='0'
	    and dv.sourceid in ( ` + sourceids + ` )
            and dv.dataelementid in  (select dataelementid from dataelement where uid in (`+deListCommaSeparated+`))
            and concat(de.uid,'-',coc.uid) in (`+decocStr+`)
	    group by ous.uidlevel`+selectedOUChildrenLevel+`,de.uid,coc.uid `

            var selectedOUQ =  `select ou.uid as pivot,
                `+selectedOUNameWithSuffix+` as pivotname,
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
	    and dv.value ~ '^-?[0-9]+\.?[0-9]*$' and dv.value !='0'
	    and dv.sourceid in ( select organisationunitid from organisationunit where uid in (` + selectedOUUID + `) )
            and dv.dataelementid in  (select dataelementid from dataelement where uid in (`+deListCommaSeparated+`))
            and concat(de.uid,'-',coc.uid) in (`+decocStr+`)
	    group by ou.uid,de.uid,coc.uid `
            
            return query + " union " + selectedOUQ;
            
        }
        
        function getGroupMiddleQuery(ouLevel,startDate,endDate,ouGroupID,decocStr,sourceids,selOrgUnitGroupUID){
            var selectedOUChildrenLevel = ouLevel+1;

            var query = ` select groupmemq.pivot as pivot,max(groupmemq.pivotname) as pivotname,dataq.ougroup as ougroup,dataq.decoc,sum(dataq.value) as value from 
            (select dv.sourceid as sourceid,`+
             "'"+ouGroupID+"'"+`::text as ougroup,
            concat(de.uid,'-',coc.uid) as decoc ,
            sum(dv.value :: float) as value
	    from datavalue dv
	    inner join period as pe on pe.periodid = dv.periodid 
	    inner join periodtype as pt on pt.periodtypeid = pe.periodtypeid 
	     inner join dataelement as de on de.dataelementid = dv.dataelementid 
	    inner join categoryoptioncombo coc on coc.categoryoptioncomboid = dv.categoryoptioncomboid 
	     inner join organisationunit ou on ou.organisationunitid = dv.sourceid
	     where pe.startdate >= `+startDate+`
             and pe.startdate <= `+endDate+`
	     and dv.value ~ '^-?[0-9]+\.?[0-9]*$' and dv.value !='0'
             and dv.attributeoptioncomboid=15
	     and dv.sourceid in (`+sourceids+` )
	     group by dv.sourceid,de.uid,coc.uid ) dataq
             inner join 
             
             (with recursive org_units as (
                 select ougm.organisationunitid as ougmid,ou.uid as pivot,ou.name as pivotname
                 from orgunitgroupmembers ougm
                 join orgunitgroup oug on oug.orgunitgroupid = ougm.orgunitgroupid
		 join organisationunit ou on ou.organisationunitid = ougm.organisationunitid
                 where oug.uid in (`+"'"+selOrgUnitGroupUID+"'"+`)
                 
                 union all
                 
                 select ch.organisationunitid as ougmid,p.pivot as pivot,p.pivotname as pivotname
                 from organisationunit ch 
                 join org_units p on ch.parentid = p.ougmid
                 
             )
              select * from org_units)groupmemq
             on dataq.sourceid = groupmemq.ougmid
            group by groupmemq.pivot,dataq.decoc,dataq.ougroup`                     
            
            return query;

        }
    }
}

module.exports = sqlQueryBuilder;
