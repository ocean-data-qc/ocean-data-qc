function ret = tcarbn_from_alkali_phsws25p0(data)
% get calculated carbon from talk and phsws25p0
ALKALI=data(:,1);
PH_SWS=data(:,2);
SAL=data(:,3);
SILCAT=data(:,4);
PHSPHT=data(:,5);
F=(~isnan(ALKALI) & ~isnan(PH_SWS) & ~isnan(SAL) & ~isnan(SILCAT) & ~isnan(PHSPHT));
ret = NaN*ALKALI;
co = CO2SYS(ALKALI(F), PH_SWS(F), 1, 3, SAL(F), 25, 25, 0, 0, SILCAT(F), PHSPHT(F), 2, 10, 1);
ret(F)=co(:,2);
end
