function out = nitrat_nncanyonb_bit18(data)
%myFun - Description
%
% Syntax: output = myFun(data)
%
% Long description

year_=data(:,1);
lat=data(:,2);
lon=data(:,3);
pres=data(:,4);
temp=data(:,5);
psal=data(:,6);
doxy=data(:,7);

out=CANYONB(year_,lat,lon,pres,temp,psal,doxy,'NO3');
out=out.NO3;
    
end