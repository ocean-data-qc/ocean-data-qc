% Test of derivnum() with scalar input
function test_derivnum_2()
    addpath ("~/Documents/CO2sys")
    
    PAR1 = 2300;    % Alk
    PAR2 = 2000;    % DIC
    PAR1TYPE = 1;     % Alk
    PAR2TYPE = 2;     % DIC
    SAL = 35;
    TEMPIN = 20;
    TEMPOUT = TEMPIN;
    PRESIN = 0;
    PRESOUT = PRESIN;
    SI = 60;
    PO4 = 2;
    pHSCALEIN = 1;   % total scale
    K1K2CONSTANTS = 10; % Lueker 2000
    KSO4CONSTANTS = 3;  % KSO4 of Dickson & TB of Lee 2010

    WHICH_VAR = 'par1';
    [deriv, header, units] = derivnum(WHICH_VAR,PAR1,PAR2,PAR1TYPE,PAR2TYPE,SAL,TEMPIN,TEMPOUT,PRESIN,PRESOUT,SI,PO4,pHSCALEIN,K1K2CONSTANTS,KSO4CONSTANTS);

    WHICH_VAR = 'K1';
    [deriv, header] = derivnum(WHICH_VAR,PAR1,PAR2,PAR1TYPE,PAR2TYPE,SAL,TEMPIN,TEMPOUT,PRESIN,PRESOUT,SI,PO4,pHSCALEIN,K1K2CONSTANTS,KSO4CONSTANTS)
    
    WHICH_VAR = 'Kspa';
    deriv = derivnum(WHICH_VAR,PAR1,PAR2,PAR1TYPE,PAR2TYPE,SAL,TEMPIN,TEMPOUT,PRESIN,PRESOUT,SI,PO4,pHSCALEIN,K1K2CONSTANTS,KSO4CONSTANTS)
end

