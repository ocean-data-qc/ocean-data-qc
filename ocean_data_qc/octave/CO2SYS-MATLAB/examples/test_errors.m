% Test of num_deriv() with scalar input
function result = test_errors ()
    addpath ("~/Software/MATLAB/CO2SYS-MATLAB/src")
    
    PAR1 = 2300;    % Alk
    PAR2 = 2000;    % DIC
    PAR1TYPE = 1;
    PAR2TYPE = 2;
    SAL = 35;
    TEMPIN = 18;
    TEMPOUT = TEMPIN; 
    PRESIN = 0;
    PRESOUT = PRESIN;
    SI = 60;
    PO4 = 2;
    pHSCALEIN = 1;   % total scale
    K1K2CONSTANTS = 10; % Lueker 2000
    KSO4CONSTANTS = 3;  % KSO4 of Dickson & TB of Lee 2010

    ePAR1 = 2;    % Alk
    ePAR2 = 2;    % DIC
    eSAL = 0;
    eTEMP = 0;
    eSI = 4;
    ePO4 = 0.1;
 
    % Correlation between errors in PAR1 and errors in PAR2
    % Notes: 
    % (1) This should normally be set to zero
    % (2) This is NOT the correlation between PAR1 and PAR2;
    %     rather it is the correlation between their errors!
    r = 0; % correlation (R) between errors in PAR1 and errors in PAR2 
    
    % With no errors on equilibrium constants (epK) and total boron (eBt)
    epK=0;
    eBt=0;
    result = errors (PAR1,PAR2,PAR1TYPE,PAR2TYPE,SAL,TEMPIN,TEMPOUT,PRESIN,PRESOUT,SI,PO4,...
                     ePAR1,ePAR2,eSAL,eTEMP,eSI,ePO4,epK,eBt,r,pHSCALEIN,K1K2CONSTANTS,KSO4CONSTANTS);

    % With default errors on equil constants and total boron
    epK = '';
    eBt = '';
    [errs, headers, units] = errors (PAR1,PAR2,PAR1TYPE,PAR2TYPE,SAL,TEMPIN,TEMPOUT,PRESIN,PRESOUT,SI,PO4,...
                     ePAR1,ePAR2,eSAL,eTEMP,eSI,ePO4,epK,eBt,r,pHSCALEIN,K1K2CONSTANTS,KSO4CONSTANTS);

    % Same as just above but specify same errors (defaults) explicitly
    epK = [0.004, 0.015, 0.03, 0.01, 0.01, 0.02, 0.02]; % absolute errors [pK units]
    eBt = 0.01; % a 1% relative error
    [errs, headers, units]  = errors (PAR1,PAR2,PAR1TYPE,PAR2TYPE,SAL,TEMPIN,TEMPOUT,PRESIN,PRESOUT,SI,PO4,...
                     ePAR1,ePAR2,eSAL,eTEMP,eSI,ePO4,epK,eBt,r,pHSCALEIN,K1K2CONSTANTS,KSO4CONSTANTS);

    % Change default errors
    epK = [0.002, 0.010, 0.02, 0.01, 0.01, 0.02, 0.02]; % absolute errors [pK units]
    eBt = 0.02; % a 2% relative error
    [errs, headers, units] = errors (PAR1,PAR2,PAR1TYPE,PAR2TYPE,SAL,TEMPIN,TEMPOUT,PRESIN,PRESOUT,SI,PO4,...
                     ePAR1,ePAR2,eSAL,eTEMP,eSI,ePO4,epK,eBt,r,pHSCALEIN,K1K2CONSTANTS,KSO4CONSTANTS);
end

