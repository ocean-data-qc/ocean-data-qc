% Test of derivnum() with scalar input
function test_derivnum_3()
    addpath ("~/Documents/CO2sys")
    
    WHICH_VAR = 1;  % w/ respect to Temperature
    PAR1 = 8.115941;    % pH
    PAR2 = 2300;    % Alk
    PAR1TYPE = 3;     % pH
    PAR2TYPE = 1;     % Alk
    SAL = 35;
    TEMPIN = 20;
    TEMPOUT = TEMPIN;
    PRESIN = 0;
    PRESOUT = PRESIN;
    SI = 0;
    PO4 = 0;
    pHSCALEIN = 1;   % total scale
    K1K2CONSTANTS = 10; % Lueker 2000
    KSO4CONSTANTS = 3;  % KSO4 of Dickson & TB of Lee 2010
    
    derivatives = derivnum(WHICH_VAR,PAR1,PAR2,PAR1TYPE,PAR2TYPE,SAL,TEMPIN,TEMPOUT,PRESIN,PRESOUT,SI,PO4,pHSCALEIN,K1K2CONSTANTS,KSO4CONSTANTS);
    
    % print title line
    "TCO2,    pCO2,    fCO2,    HCO3,    CO3,    CO2 ,    OmegaCa,    OmegaAr,    xCO2       (umol/kgSW, uatm)"
    % print derivatives
    derivatives
    
 end

