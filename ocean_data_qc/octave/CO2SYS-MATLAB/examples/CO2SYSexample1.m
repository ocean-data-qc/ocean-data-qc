% This is an example of the use of CO2SYS. Have a look at the code

% Changes in v1.01:
% - fixed a silly bug that prevented the resulting figures to be drawn.
%
% Steven van Heuven. svheuven@gmail.com

clc
disp(' ')
disp('This is an example of the use of CO2SYS.m')
disp('that uses its ability to process vectors of data.')
disp(' ')
disp('We will generate a figure that shows the sensitivity of pH and pCO2')
disp(' to changes in DIC, while keeping everything else constant')
% disp(' ')
% disp('(Addional info: alk=2400, si=50, po4=2, dissociation constats: Mehrbach Refit)')
disp(' ')

par1type =    1; % The first parameter supplied is of type "1", which is "alkalinity"
par1     = 2400; % value of the first parameter
par2type =    2; % The first parameter supplied is of type "1", which is "DIC"
par2     = [2100:5:2300]; % value of the second parameter, which is a long vector of different DIC's!
sal      =   35; % Salinity of the sample
tempin   =   10; % Temperature at input conditions
presin   =    0; % Pressure    at input conditions
tempout  =    0; % Temperature at output conditions - doesn't matter in this example
presout  =    0; % Pressure    at output conditions - doesn't matter in this example
sil      =   50; % Concentration of silicate  in the sample (in umol/kg)
po4      =    2; % Concentration of phosphate in the sample (in umol/kg)
pHscale  =    1; % pH scale at which the input pH is reported ("1" means "Total Scale")  - doesn't matter in this example
k1k2c    =    4; % Choice of H2CO3 and HCO3- dissociation constants K1 and K2 ("4" means "Mehrbach refit")
kso4c    =    1; % Choice of HSO4- dissociation constants KSO4 ("1" means "Dickson")

% Do the calculation. See CO2SYS's help for syntax and output format
A=CO2SYS(par1,par2,par1type,par2type,sal,tempin,tempout,presin,presout,sil,po4,pHscale,k1k2c,kso4c);

figure; clf
subplot(1,2,1)
plot(par2,A(:,4),'r.-') % The calculated pCO2's are in the 4th column of the output A of CO2SYS
xlabel('DIC'); ylabel('pCO2 [uatm]')
subplot(1,2,2)
plot(par2,A(:,3),'r.-') % The calculated pH's are in the 3th column of the output A of CO2SYS
xlabel('DIC'); ylabel('pH')

disp('DONE!')
disp(' ')
disp('Type "edit CO2SYSexample1" to see what the syntax for this calculation was.')
disp(' ')