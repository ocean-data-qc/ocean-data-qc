function NITRAT = nitrate_combined(data)
%myFun - Description
%
% Syntax: ret = nitrate_combines(data)
%
% Long description
NITRAT=data(:,1);
NITRIT=data(:,2);
NO2_NO3=data(:,3);

if(sum(~isnan(NITRAT))==0 && sum(~isnan(NO2_NO3))>0)
    NITRAT=NO2_NO3;
    FF=~isnan(NITRIT);
    if(sum(FF))
        NITRAT(FF)=NITRAT(FF)-NITRIT(FF);
    end
end
   
end