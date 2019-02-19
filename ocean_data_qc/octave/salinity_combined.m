function ret = salinity_combined(data)
%myFun - Description
%
% Syntax: ret = salinity_combined(data)
%
% Long description
CTDSAL=data(:,1);
CTDSALF=data(:,2);
BOTSAL=data(:,3);
BOTSALF=data(:,4);

ret=BOTSAL;
if(sum(~isnan(CTDSAL))==0)
    ret=BOTSAL;
elseif(sum(~isnan(BOTSAL))==0)
    ret=CTDSAL;
else
    dummy_ctdsal=CTDSAL;
    dummy_ctdsal(CTDSALF>2)=NaN;
    dummy_botsal=BOTSAL;
    dummy_botsal(BOTSALF>2)=NaN;
    ret=nanmean(dummy_ctdsal, dummy_botsal);
end