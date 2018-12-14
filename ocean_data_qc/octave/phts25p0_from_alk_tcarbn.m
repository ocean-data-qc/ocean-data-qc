function ret = phts25p0_from_alk_tcarbn(data)
% get calculated carbon from talk and phsws25p0
ALKALI=data(:,1);
TCARBN=data(:,2);
SAL=data(:,3);
SILCAT=data(:,4);
PHSPHT=data(:,5);
F=(~isnan(ALKALI) & ~isnan(TCARBN) & ~isnan(SAL) & ~isnan(SILCAT) & ~isnan(PHSPHT));
ret = NaN*ALKALI;
co = CO2SYS(ALKALI(F), TCARBN(F), 1, 2, SAL(F), 25, 25, 0, 0, SILCAT(F), PHSPHT(F), 2, 10, 1);
ret(F)=co(:,37);
end
