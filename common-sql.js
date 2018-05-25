
function Queries(){

    this.getOrgUnitIDsFromUIDs = function(uids){
        return `select organisationunitid
        from organisationunit
        where uid in (${uids})`
    }

    this.getOrgUnitDescendantsByUID = function(uid){

        
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
