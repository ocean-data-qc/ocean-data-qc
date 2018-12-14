% Test of derivnum() with scalar input
function test_derivnum ()
    addpath ("~/Documents/CO2sys")
    
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

    
    % print title line
    "H+,    pCO2,    CO2,    HCO3,    CO3,    OmegaAr            (umol/kgSW, uatm)"
    % print derivatives

    WHICH_VAR = 'Par1';  % w/ respect to Alk
    [deriv, headers, units] = derivnum(WHICH_VAR,PAR1,PAR2,PAR1TYPE,PAR2TYPE,SAL,TEMPIN,TEMPOUT,PRESIN,PRESOUT,SI,PO4,pHSCALEIN,K1K2CONSTANTS,KSO4CONSTANTS);
    printf ("%e  %e  %e  %e  %e  %e\n", deriv(1), deriv(2), deriv(6), deriv(4), deriv(5), deriv(8));

    WHICH_VAR = 'par2';  % w/ respect to DIC
    deriv = derivnum(WHICH_VAR,PAR1,PAR2,PAR1TYPE,PAR2TYPE,SAL,TEMPIN,TEMPOUT,PRESIN,PRESOUT,SI,PO4,pHSCALEIN,K1K2CONSTANTS,KSO4CONSTANTS);
    printf ("%e  %e  %e  %e  %e  %e\n", deriv(1), deriv(2), deriv(6), deriv(4), deriv(5), deriv(8));
    
    WHICH_VAR = 'Silicate';  % w/ respect to Silicate
    deriv = derivnum(WHICH_VAR,PAR1,PAR2,PAR1TYPE,PAR2TYPE,SAL,TEMPIN,TEMPOUT,PRESIN,PRESOUT,SI,PO4,pHSCALEIN,K1K2CONSTANTS,KSO4CONSTANTS);
    printf ("%e  %e  %e  %e  %e  %e\n", deriv(1), deriv(2), deriv(6), deriv(4), deriv(5), deriv(8));

    WHICH_VAR = 'phos';  % w/ respect to Phosphate
    deriv = derivnum(WHICH_VAR,PAR1,PAR2,PAR1TYPE,PAR2TYPE,SAL,TEMPIN,TEMPOUT,PRESIN,PRESOUT,SI,PO4,pHSCALEIN,K1K2CONSTANTS,KSO4CONSTANTS);
    printf ("%e  %e  %e  %e  %e  %e\n", deriv(1), deriv(2), deriv(6), deriv(4), deriv(5), deriv(8));
    
    WHICH_VAR = 'T';  % w/ respect to Temperature
    deriv = derivnum(WHICH_VAR,PAR1,PAR2,PAR1TYPE,PAR2TYPE,SAL,TEMPIN,TEMPOUT,PRESIN,PRESOUT,SI,PO4,pHSCALEIN,K1K2CONSTANTS,KSO4CONSTANTS);
    printf ("%e  %e  %e  %e  %e  %e\n", deriv(1), deriv(2), deriv(6), deriv(4), deriv(5), deriv(8));

    WHICH_VAR = 'S';  % w/ respect to Salinity
    deriv = derivnum(WHICH_VAR,PAR1,PAR2,PAR1TYPE,PAR2TYPE,SAL,TEMPIN,TEMPOUT,PRESIN,PRESOUT,SI,PO4,pHSCALEIN,K1K2CONSTANTS,KSO4CONSTANTS);
    printf ("%e  %e  %e  %e  %e  %e\n", deriv(1), deriv(2), deriv(6), deriv(4), deriv(5), deriv(8));

    WHICH_VAR = 'K1';  % w/ respect to K1 (1st dissociation for carbonic acid system)
    deriv = derivnum(WHICH_VAR,PAR1,PAR2,PAR1TYPE,PAR2TYPE,SAL,TEMPIN,TEMPOUT,PRESIN,PRESOUT,SI,PO4,pHSCALEIN,K1K2CONSTANTS,KSO4CONSTANTS);
    printf ("%e  %e  %e  %e  %e  %e\n", deriv(1), deriv(2), deriv(6), deriv(4), deriv(5), deriv(8));

    WHICH_VAR = 'K2';  % w/ respect to K2 (2nd dissociation for carbonic acid system)
    deriv = derivnum(WHICH_VAR,PAR1,PAR2,PAR1TYPE,PAR2TYPE,SAL,TEMPIN,TEMPOUT,PRESIN,PRESOUT,SI,PO4,pHSCALEIN,K1K2CONSTANTS,KSO4CONSTANTS);
    printf ("%e  %e  %e  %e  %e  %e\n", deriv(1), deriv(2), deriv(6), deriv(4), deriv(5), deriv(8));

    WHICH_VAR = 'Kb';  % w/ respect to Kb (dissociation constant for boric acid system) 
    deriv = derivnum(WHICH_VAR,PAR1,PAR2,PAR1TYPE,PAR2TYPE,SAL,TEMPIN,TEMPOUT,PRESIN,PRESOUT,SI,PO4,pHSCALEIN,K1K2CONSTANTS,KSO4CONSTANTS);
    printf ("%e  %e  %e  %e  %e  %e\n", deriv(1), deriv(2), deriv(6), deriv(4), deriv(5), deriv(8));

    WHICH_VAR = 'bor';  % w/ respect to total boron (TB)
    deriv = derivnum(WHICH_VAR,PAR1,PAR2,PAR1TYPE,PAR2TYPE,SAL,TEMPIN,TEMPOUT,PRESIN,PRESOUT,SI,PO4,pHSCALEIN,K1K2CONSTANTS,KSO4CONSTANTS);
    printf ("%e  %e  %e  %e  %e  %e\n", deriv(1), deriv(2), deriv(6), deriv(4), deriv(5), deriv(8));
end

