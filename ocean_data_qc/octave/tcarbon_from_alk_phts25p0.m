function ret = tcarbon_from_alk_phts25p0(data)
% get calculated carbon from talk and phsws25p0
ALKALI=data(:,1);
PH_TOT=data(:,2);
SAL=data(:,3);
SILCAT=data(:,4);
PHSPHT=data(:,5);
F=(~isnan(ALKALI) & ~isnan(PH_TOT) & ~isnan(SAL) & ~isnan(SILCAT) & ~isnan(PHSPHT));
ret = NaN*ALKALI;
co = CO2SYS(ALKALI(F), PH_TOT(F), 1, 3, SAL(F), 25, 25, 0, 0, SILCAT(F), PHSPHT(F), 1, 10, 1);
ret(F)=co(:,2);
end
