function test_derivnum_4()
    addpath ("~/Documents/CO2sys")
    
    PAR1 = [2300; 2300; 8.115941];    % two Alk and one pH
    PAR2 = [2000; 2000; 328.6927];    % two DIC and one pCO2
    PAR1TYPE = [1; 1; 3];
    PAR2TYPE = [2; 2; 4];
    SAL = 35;
    TEMPIN = 20;
    TEMPOUT = 2; % TEMPIN;
    PRESIN = 0;
    PRESOUT = PRESIN;
    SI = 0;
    PO4 = 0;
    pHSCALEIN = 1;   % total scale
    K1K2CONSTANTS = 10; % Lueker 2000
    KSO4CONSTANTS = 3;  % KSO4 of Dickson & TB of Lee 2010

    WHICH_VAR = 'K0';
    [derivatives, headers, units] = derivnum(WHICH_VAR,PAR1,PAR2,PAR1TYPE,PAR2TYPE,SAL,TEMPIN,TEMPOUT,PRESIN,PRESOUT,SI,PO4,pHSCALEIN,K1K2CONSTANTS,KSO4CONSTANTS)
end
