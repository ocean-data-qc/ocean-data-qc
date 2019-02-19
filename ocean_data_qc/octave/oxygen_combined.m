function ret = oxygen_combined(data)
%myFun - Description
%
% Syntax: ret = oxygen_combined(data)
%
% Long description
CTDOXY=data(:,1);
CTDOXYF=data(:,2);
BOTOXY=data(:,3);
BOTOXYF=data(:,4);

ret=BOTOXY;
if(sum(~isnan(CTDOXY))==0)
    ret=BOTOXY;
elseif(sum(~isnan(BOTOXY))==0)
    ret=CTDOXY;
else
    dummy_ctdOXY=CTDOXY;
    dummy_ctdOXY(CTDOXYF>2)=NaN;
    dummy_botOXY=BOTOXY;
    dummy_botOXY(BOTOXYF>2)=NaN;
    ret=nanmean(dummy_ctdOXY, dummy_botOXY);
end