% Test of num_deriv() with scalar input
function [result, headers] = test_errors_2 ()
    addpath ("~/Software/MATLAB/CO2SYS-MATLAB/src")
    
   % 2nd test : 6 records at increasing depth  with NO NUTRIENTS
   % ----------------------------------------

    r = 0; % correlation (R) between errors in PAR1 and errors in PAR2 
    ePAR1 = 2;    % Alk
    ePAR2 = 2;    % DIC
    eSAL = 0;
    eTEMP = 0;
    eSI = 4;
    ePO4 = 0.1;
 
    PAR1 = 2295;    % Alk
    PAR2 = 2154;    % DIC
    PAR1TYPE = 1;
    PAR2TYPE = 2;
    SAL = 35;
    TEMPIN = 2;
    TEMPOUT = 2; 
    PRESIN = [0:1000:5000];
    PRESOUT = PRESIN;
    SI = 0;
    PO4 = 0;
    pHSCALEIN = 1;   % total scale
    K1K2CONSTANTS = 10; % Lueker 2000
    KSO4CONSTANTS = 3;  % KSO4 of Dickson & TB of Lee 2010
    
    % Correlation between errors in PAR1 and errors in PAR2
    % Notes: 
    % (1) This should normally be set to zero
    % (2) This is NOT the correlation between PAR1 and PAR2;
    %     rather it is the correlation between their errors!

    % With no errors on dissociation K's and total boron
    epK=0;
    eBt=0;

    [errs, headers, units] = errors (PAR1,PAR2,PAR1TYPE,PAR2TYPE,SAL,TEMPIN,TEMPOUT,PRESIN,PRESOUT,SI,PO4,...
                     ePAR1,ePAR2,eSAL,eTEMP,eSI,ePO4,epK,eBt,r,pHSCALEIN,K1K2CONSTANTS,KSO4CONSTANTS);

    % With default errors on Ks
    epK = '';
    eBt = '';
    [errs, headers, units] = errors (PAR1,PAR2,PAR1TYPE,PAR2TYPE,SAL,TEMPIN,TEMPOUT,PRESIN,PRESOUT,SI,PO4,...
                     ePAR1,ePAR2,eSAL,eTEMP,eSI,ePO4,epK,eBt,r,pHSCALEIN,K1K2CONSTANTS,KSO4CONSTANTS);
    
    % Correct for measurements made at 25°C at surface pressure for
    % in situ samples collected at 1000 m where the in situ temperature was 10°C
    TEMPIN  = 25 ; PRESIN = 0;
    TEMPOUT = 10 ; PRESOUT = 1000;
    [errs, headers, units] = errors (PAR1,PAR2,PAR1TYPE,PAR2TYPE,SAL,TEMPIN,TEMPOUT,PRESIN,PRESOUT,SI,PO4,...
                     ePAR1,ePAR2,eSAL,eTEMP,eSI,ePO4,epK,eBt,r,pHSCALEIN,K1K2CONSTANTS,KSO4CONSTANTS);
    
end

